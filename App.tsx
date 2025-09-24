
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SearchForm } from './components/SearchForm';
import { GradeReport } from './components/GradeReport';
import { GradeEntryForm } from './components/GradeEntryForm';
import { AdminPage } from './components/AdminPage';
import { curriculumData as initialCurriculumData } from './data/curriculumData';
import { studentDataByGrade as initialStudentData, Student } from './data/studentData';
import type { GradeLevelData, Curriculum } from './types';
import { BookOpenIcon, EditIcon, LogoIcon, ViewIcon, AdminIcon } from './components/icons';

type ActiveTab = 'view' | 'edit' | 'admin';
type Semester = 'semester1' | 'semester2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('view');
  
  // Initialize state from localStorage or fall back to initial data
  const [studentsData, setStudentsData] = useState(() => {
    try {
      const saved = localStorage.getItem('studentsData');
      return saved ? JSON.parse(saved) : initialStudentData;
    } catch (error) {
      console.error("Error loading studentsData from localStorage", error);
      return initialStudentData;
    }
  });

  const [curriculum, setCurriculum] = useState<Curriculum>(() => {
    try {
      const saved = localStorage.getItem('curriculumData');
      return saved ? JSON.parse(saved) : initialCurriculumData;
    } catch (error) {
      console.error("Error loading curriculumData from localStorage", error);
      return initialCurriculumData;
    }
  });

  const [allGrades, setAllGrades] = useState(() => {
     try {
      const saved = localStorage.getItem('allGrades');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error("Error loading allGrades from localStorage", error);
      return {};
    }
  });

  const [searchResult, setSearchResult] = useState<{ studentId: string; studentName: string; studentNumber: number; data: GradeLevelData; room: string } | null>(null);
  const [classToEdit, setClassToEdit] = useState<{ gradeLevel: string; room: string; students: Student[]; data: GradeLevelData; semester: Semester | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const getCurrentAcademicYear = () => (new Date().getFullYear() + 543).toString();
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear());

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('studentsData', JSON.stringify(studentsData));
  }, [studentsData]);

  useEffect(() => {
    localStorage.setItem('curriculumData', JSON.stringify(curriculum));
  }, [curriculum]);

  useEffect(() => {
    localStorage.setItem('allGrades', JSON.stringify(allGrades));
  }, [allGrades]);

  const academicYearOptions = useMemo(() => {
    const currentYear = parseInt(getCurrentAcademicYear(), 10);
    const years = [];
    for (let i = 0; i < 5; i++) {
        years.push((currentYear - i).toString());
    }
    return years;
  }, []);

  const findStudentById = useCallback((studentId: string): { student: Student; gradeLevel: string; room: string } | null => {
    for (const gradeLevel in studentsData) {
      const rooms = studentsData[gradeLevel];
      for (const room in rooms) {
        const student = rooms[room].find(s => s.id === studentId);
        if (student) {
          return { student, gradeLevel, room };
        }
      }
    }
    return null;
  }, [studentsData]);

  const handleSearch = useCallback((studentId: string, gradeLevel: string, room: string, semester?: Semester) => {
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setClassToEdit(null);
    setShowWelcome(false);

    setTimeout(() => {
      if (activeTab === 'view') {
        if (!/^\d{4}$/.test(studentId)) {
          setError("โปรดป้อนเลขประจำตัวนักเรียน 4 หลัก");
          setIsLoading(false);
          return;
        }
        
        const foundStudentData = findStudentById(studentId);
        
        if (!foundStudentData) {
          setError(`ไม่พบข้อมูลนักเรียนสำหรับรหัสประจำตัว: ${studentId}`);
          setIsLoading(false);
          return;
        }
        
        const { student, gradeLevel: foundGradeLevel, room: foundRoom } = foundStudentData;
        const curriculumForGrade = curriculum[foundGradeLevel];

        if (curriculumForGrade) {
          setSearchResult({ studentId, studentName: student.name, studentNumber: student.number, data: curriculumForGrade, room: foundRoom });
        } else {
          setError(`ไม่พบข้อมูลหลักสูตรสำหรับชั้น ${foundGradeLevel}`);
        }
      } else { // activeTab === 'edit'
        const gradeData = studentsData[gradeLevel];
        const studentsInRoom = gradeData ? gradeData[room] || [] : [];
        const curriculumForGrade = curriculum[gradeLevel];
        
        if (curriculumForGrade) {
          setClassToEdit({ gradeLevel, room, students: studentsInRoom, data: curriculumForGrade, semester: semester || null });
        } else {
          setError(`ไม่พบข้อมูลหลักสูตรสำหรับชั้น ${gradeLevel} ห้อง ${room}`);
        }
      }
      setIsLoading(false);
    }, 500);
  }, [activeTab, findStudentById, studentsData, curriculum]);
  
  const handleSaveGrades = (gradesForClass: { [studentId: string]: { [subjectCode: string]: string | number } }) => {
    setAllGrades(prev => ({
      ...prev,
      [academicYear]: {
        ...(prev[academicYear] || {}),
        ...gradesForClass,
      }
    }));
  };
  
  const handleAddStudent = (gradeLevel: string, room: string, newStudent: Student) => {
    setError(null);
    if (findStudentById(newStudent.id)) {
        setError(`เลขประจำตัวนักเรียน ${newStudent.id} มีอยู่แล้วในระบบ`);
        return false;
    }

    const studentsInClass = studentsData[gradeLevel]?.[room] || [];
    if (studentsInClass.some(s => s.number === newStudent.number)) {
        setError(`เลขที่ ${newStudent.number} มีอยู่แล้วในห้องนี้`);
        return false;
    }

    setStudentsData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        if (!newData[gradeLevel]) newData[gradeLevel] = {};
        if (!newData[gradeLevel][room]) newData[gradeLevel][room] = [];
        
        newData[gradeLevel][room].push(newStudent);
        newData[gradeLevel][room].sort((a: Student, b: Student) => a.number - b.number);
        
        if (classToEdit && classToEdit.gradeLevel === gradeLevel && classToEdit.room === room) {
            setClassToEdit(prev => prev ? ({ ...prev, students: newData[gradeLevel][room] }) : null);
        }

        return newData;
    });
    return true;
  };

  const handleRemoveStudent = (gradeLevel: string, room: string, studentIdToRemove: string) => {
      setStudentsData(prevData => {
          const newData = JSON.parse(JSON.stringify(prevData));
          if (newData[gradeLevel] && newData[gradeLevel][room]) {
              newData[gradeLevel][room] = newData[gradeLevel][room].filter((s: Student) => s.id !== studentIdToRemove);
              if (classToEdit && classToEdit.gradeLevel === gradeLevel && classToEdit.room === room) {
                  setClassToEdit(prev => prev ? ({ ...prev, students: newData[gradeLevel][room] }) : null);
              }
          }
          return newData;
      });

      setAllGrades(prevGrades => {
          const newGrades = {...prevGrades};
          if (newGrades[academicYear]) {
            delete newGrades[academicYear][studentIdToRemove];
          }
          return newGrades;
      });
  };

  const handleToggleStudentRetention = (studentId: string, retained: boolean) => {
    setStudentsData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        for (const grade in newData) {
            for (const room in newData[grade]) {
                const student = newData[grade][room].find((s: Student) => s.id === studentId);
                if (student) {
                    student.retained = retained;
                    
                    if (classToEdit && classToEdit.gradeLevel === grade && classToEdit.room === room) {
                       setClassToEdit(prev => {
                           if (!prev) return null;
                           const updatedStudents = prev.students.map(s => s.id === studentId ? { ...s, retained } : s);
                           return { ...prev, students: updatedStudents };
                       });
                    }
                    return newData;
                }
            }
        }
        return newData;
    });
  };
  
  const handleToggleStudentTransfer = (studentId: string, transferringOut: boolean) => {
    setStudentsData(prevData => {
        const newData = JSON.parse(JSON.stringify(prevData));
        const studentLocation = findStudentById(studentId);
        if (studentLocation) {
            const { gradeLevel, room } = studentLocation;
            const student = newData[gradeLevel][room].find((s: Student) => s.id === studentId);
            if(student) {
                student.transferringOut = transferringOut;
            }

            if (classToEdit && classToEdit.gradeLevel === gradeLevel && classToEdit.room === room) {
                setClassToEdit(prev => {
                    if (!prev) return null;
                    const updatedStudents = prev.students.map(s => s.id === studentId ? { ...s, transferringOut } : s);
                    return { ...prev, students: updatedStudents };
                });
            }
        }
        return newData;
    });
};


  const handlePromoteStudents = () => {
    setStudentsData(prevData => {
        const nextGradeMap: { [key: string]: string | null } = {
            p1: 'p2', p2: 'p3', p3: 'p4', p4: 'p5', p5: 'p6',
            p6: 'm1', m1: 'm2', m2: 'm3', m3: null, // m3 graduates
        };

        const newStudentsData: { [gradeLevel: string]: { [room: string]: Student[] } } = {};
        Object.keys(prevData).forEach(grade => {
            newStudentsData[grade] = {};
        });

        for (const grade in prevData) {
            for (const room in prevData[grade]) {
                for (const student of prevData[grade][room]) {
                    if (student.retained) {
                        const retainedStudent = { ...student, retained: false }; 
                        if (!newStudentsData[grade]) newStudentsData[grade] = {};
                        if (!newStudentsData[grade][room]) newStudentsData[grade][room] = [];
                        newStudentsData[grade][room].push(retainedStudent);
                    } else if (grade === 'p6' && student.transferringOut) {
                        // P6 student is transferring out, treat as graduated. Do nothing.
                    }
                    else {
                        const nextGrade = nextGradeMap[grade];
                        if (nextGrade) {
                            if (!newStudentsData[nextGrade]) newStudentsData[nextGrade] = {};
                            if (!newStudentsData[nextGrade][room]) newStudentsData[nextGrade][room] = [];
                            const { retained, transferringOut, ...promotedStudent } = student;
                            newStudentsData[nextGrade][room].push(promotedStudent);
                        }
                    }
                }
            }
        }

        for (const grade in newStudentsData) {
            for (const room in newStudentsData[grade]) {
                newStudentsData[grade][room].sort((a, b) => a.number - b.number);
            }
        }

        return newStudentsData;
    });
};

  
  const handleTabChange = (tabName: ActiveTab) => {
    setActiveTab(tabName);
    setSearchResult(null);
    setClassToEdit(null);
    setShowWelcome(true);
    setError(null);
  };

  const TabButton: React.FC<{ tabName: ActiveTab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => handleTabChange(tabName)}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-base font-medium rounded-md transition-colors duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary-500 ${
        activeTab === tabName
          ? 'text-primary-600 border-b-2 border-primary-500'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      }`}
      aria-current={activeTab === tabName}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <LogoIcon className="h-10 w-10 text-primary-500" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-wide">ระบบจัดการผลการเรียน</h1>
              <p className="text-sm text-slate-500 mt-1">โรงเรียนบ้านลำดวน สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบุรีรัมย์ เขต 2</p>
            </div>
          </div>
          <div>
            <label htmlFor="academicYear" className="block text-xs font-medium text-slate-600 mb-1">
              ปีการศึกษา
            </label>
            <select
              id="academicYear"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-36 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 sm:text-base"
            >
              {academicYearOptions.map(year => (
                  <option key={year} value={year} className="text-slate-900 bg-white">{year}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="mt-10">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center sm:justify-start mb-6">
                <div className="flex space-x-2">
                    <TabButton tabName="view" label="ดูผลการเรียน" icon={<ViewIcon className="h-5 w-5"/>} />
                    <TabButton tabName="edit" label="กรอกผลการเรียน" icon={<EditIcon className="h-5 w-5"/>} />
                    <TabButton tabName="admin" label="ผู้ดูแลระบบ" icon={<AdminIcon className="h-5 w-5"/>} />
                </div>
            </div>
            {activeTab !== 'admin' && <SearchForm onSearch={handleSearch} isLoading={isLoading} mode={activeTab} key={activeTab} studentData={studentsData}/>}
          </div>

          <div className="mt-10">
            {isLoading && (
              <div className="flex justify-center items-center p-10">
                <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-4 text-lg font-medium text-slate-700">กำลังโหลดข้อมูล...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-5 rounded-lg" role="alert">
                <p className="font-semibold text-red-900">เกิดข้อผิดพลาด</p>
                <p className="mt-1">{error}</p>
              </div>
            )}
            {showWelcome && !searchResult && !classToEdit && activeTab !== 'admin' && (
                 <div className="text-center p-12 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <BookOpenIcon className="mx-auto h-16 w-16 text-primary-500" />
                    <h2 className="mt-6 text-2xl font-semibold text-slate-900 tracking-wide">
                        {activeTab === 'view' ? 'ยินดีต้อนรับ' : 'เริ่มกรอกผลการเรียน'}
                    </h2>
                    <p className="mt-3 text-base text-slate-600 max-w-md mx-auto">
                      {activeTab === 'view'
                        ? 'โปรดป้อนเลขประจำตัวนักเรียน 4 หลักในช่องด้านบนเพื่อดูผลการเรียน'
                        : 'โปรดเลือกชั้นเรียนและห้อง เพื่อแสดงรายชื่อนักเรียนและเริ่มกรอกผลการเรียน'
                      }
                    </p>
                </div>
            )}
            {activeTab === 'admin' && (
              <AdminPage 
                curriculum={curriculum}
                setCurriculum={setCurriculum}
                onPromoteStudents={handlePromoteStudents}
                academicYear={academicYear}
              />
            )}
            {searchResult && activeTab === 'view' && (
              <GradeReport 
                studentId={searchResult.studentId} 
                studentName={searchResult.studentName}
                studentNumber={searchResult.studentNumber}
                data={searchResult.data}
                grades={allGrades[academicYear]?.[searchResult.studentId] || {}}
                room={searchResult.room}
                academicYear={academicYear}
              />
            )}
             {classToEdit && activeTab === 'edit' && (
              <GradeEntryForm
                classData={{...classToEdit, data: curriculum[classToEdit.gradeLevel]}}
                initialGrades={allGrades[academicYear] || {}}
                onSave={handleSaveGrades}
                onAddStudent={handleAddStudent}
                onRemoveStudent={handleRemoveStudent}
                onToggleStudentRetention={handleToggleStudentRetention}
                onToggleStudentTransfer={handleToggleStudentTransfer}
              />
            )}
          </div>
        </main>
        <footer className="mt-16 py-8 border-t border-slate-200 text-center text-sm text-slate-500">
            <p>พัฒนาโดย นายศิริชัย จันทะขาล</p>
            <p>ตำแหน่ง รองผู้อำนวยการสถานศึกษา โรงเรียนบ้านลำดวน สพป.บุรีรัมย์ เขต 2</p>
        </footer>
      </div>
    </div>
  );
};

export default App;