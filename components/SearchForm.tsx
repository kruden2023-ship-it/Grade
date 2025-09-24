
import React, { useState, FormEvent, useEffect } from 'react';
import { SearchIcon } from './icons';
import { Student } from '../data/studentData';

type Semester = 'semester1' | 'semester2';

interface SearchFormProps {
  onSearch: (studentId: string, gradeLevel: string, room: string, semester?: Semester) => void;
  isLoading: boolean;
  mode: 'view' | 'edit';
  studentData: { [gradeLevel: string]: { [room: string]: Student[] } };
}

const gradeLevels = [
  { value: 'p1', label: 'ประถมศึกษาปีที่ 1' },
  { value: 'p2', label: 'ประถมศึกษาปีที่ 2' },
  { value: 'p3', label: 'ประถมศึกษาปีที่ 3' },
  { value: 'p4', label: 'ประถมศึกษาปีที่ 4' },
  { value: 'p5', label: 'ประถมศึกษาปีที่ 5' },
  { value: 'p6', label: 'ประถมศึกษาปีที่ 6' },
  { value: 'm1', label: 'มัธยมศึกษาปีที่ 1' },
  { value: 'm2', label: 'มัธยมศึกษาปีที่ 2' },
  { value: 'm3', label: 'มัธยมศึกษาปีที่ 3' },
];

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading, mode, studentData }) => {
  const [studentId, setStudentId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('p1');
  const [room, setRoom] = useState('1');
  const [semester, setSemester] = useState<Semester>('semester1');
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  
  const isJuniorHigh = ['m1', 'm2', 'm3'].includes(gradeLevel);

  useEffect(() => {
    const roomsForGrade = Object.keys(studentData[gradeLevel] || {});
    setAvailableRooms(roomsForGrade);
    if (roomsForGrade.length > 0) {
      // Keep existing room if it's still available, otherwise default to the first
      setRoom(prevRoom => roomsForGrade.includes(prevRoom) ? prevRoom : roomsForGrade[0]);
    } else {
      setRoom('');
    }
  }, [gradeLevel, studentData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'view') {
        onSearch(studentId, '', ''); // Grade/room not needed for student ID search
    } else {
        onSearch('', gradeLevel, room, isJuniorHigh ? semester : undefined);
    }
  };

  const formLayout = mode === 'view' ? 'md:grid-cols-2' : (isJuniorHigh ? 'md:grid-cols-4' : 'md:grid-cols-3');
  const formInputStyle = "block w-full text-base px-4 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-slate-900";

  return (
    <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${formLayout} gap-4 items-end`}>
      {mode === 'view' && (
        <div className="md:col-span-1">
          <label htmlFor="studentId" className="block text-sm font-light text-slate-500 mb-2">
            เลขประจำตัวนักเรียน (4 หลัก)
          </label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            maxLength={4}
            pattern="\d{4}"
            placeholder="เช่น 1234"
            required={mode === 'view'}
            className={formInputStyle}
          />
        </div>
      )}
      {mode === 'edit' && (
        <>
          <div>
            <label htmlFor="gradeLevel" className="block text-sm font-light text-slate-500 mb-2">
              ชั้นเรียน
            </label>
            <select
              id="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className={formInputStyle}
            >
              {gradeLevels.map((grade) => (
                <option key={grade.value} value={grade.value} className="bg-white">
                  {grade.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="room" className="block text-sm font-light text-slate-500 mb-2">
              ห้อง
            </label>
            <select
              id="room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              disabled={availableRooms.length === 0}
              className={`${formInputStyle} disabled:bg-slate-100 disabled:cursor-not-allowed`}
            >
              {availableRooms.length > 0 ? (
                availableRooms.map((r) => (
                  <option key={r} value={r} className="bg-white">
                    ห้อง {r}
                  </option>
                ))
              ) : (
                <option className="bg-white">ไม่มีข้อมูล</option>
              )}
            </select>
          </div>
          {isJuniorHigh && (
             <div>
                <label htmlFor="semester" className="block text-sm font-light text-slate-500 mb-2">
                  ภาคเรียน
                </label>
                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value as Semester)}
                  className={formInputStyle}
                >
                  <option value="semester1" className="bg-white">ภาคเรียนที่ 1</option>
                  <option value="semester2" className="bg-white">ภาคเรียนที่ 2</option>
                </select>
              </div>
          )}
        </>
      )}
      <button
        type="submit"
        disabled={isLoading || (mode === 'edit' && availableRooms.length === 0)}
        className="w-full justify-self-stretch md:w-auto md:justify-self-start inline-flex justify-center items-center px-8 py-2.5 border border-transparent text-base font-semibold rounded-md shadow-sm text-slate-900 bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      >
        {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังโหลด...
            </>
        ) : (
            <>
            <SearchIcon className="h-5 w-5 mr-2" />
            {mode === 'view' ? 'ค้นหา' : 'แสดงข้อมูล'}
            </>
        )}
      </button>
    </form>
  );
};