
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
import type { GradeLevelData } from '../types';
import type { Student } from '../data/studentData';
import { SaveIcon, PlusIcon, TrashIcon } from './icons';

type Semester = 'semester1' | 'semester2';

interface GradeEntryFormProps {
  classData: {
    gradeLevel: string;
    room: string;
    students: Student[];
    data: GradeLevelData;
    semester: Semester | null;
  };
  initialGrades: { [studentId: string]: { [subjectCode: string]: string | number } };
  onSave: (gradesForClass: { [studentId: string]: { [subjectCode: string]: string | number } }) => void;
  onAddStudent: (gradeLevel: string, room: string, newStudent: Student) => boolean;
  onRemoveStudent: (gradeLevel: string, room: string, studentId: string) => void;
  onToggleStudentRetention: (studentId: string, retained: boolean) => void;
  onToggleStudentTransfer: (studentId: string, transferringOut: boolean) => void;
}

const gradeOptions = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'];
const activityGradeOptions = ['ผ่าน', 'ไม่ผ่าน'];

const getSubjectsForEntry = (curriculum: GradeLevelData, semester: 'semester1' | 'semester2' | null) => {
    let subjects: any[] = [];
    let boundaries: number[] = [];

    // Primary school
    if ('coreSubjects' in curriculum) { 
        const core = curriculum.coreSubjects.map(s => ({...s, isActivity: false}));
        const additional = curriculum.additionalSubjects.map(s => ({...s, isActivity: false}));
        const development = curriculum.developmentActivities.map(s => ({...s, isActivity: true}));
        
        subjects = [...core, ...additional, ...development];
        boundaries = [core.length, core.length + additional.length].filter(b => b > 0 && b < subjects.length);
    } 
    // Junior High
    else if (semester) {
        const semesterData = curriculum.semesters[semester];
        const semesterNumber = semester === 'semester1' ? 1 : 2;

        const core = semesterData.coreSubjects.map(s => ({...s, isActivity: false}));
        const additional = semesterData.additionalSubjects.map(s => ({...s, isActivity: false}));
        // Generate a unique, stable code for activities which don't have one
        const development = semesterData.developmentActivities.map(s => ({...s, code: s.code || `${s.name.replace(/\s/g, '')}-${semesterNumber}`, isActivity: true}));
        
        subjects = [...core, ...additional, ...development];
        boundaries = [core.length, core.length + additional.length].filter(b => b > 0 && b < subjects.length);
    }
    
    return { subjects, boundaries };
};

export const GradeEntryForm: React.FC<GradeEntryFormProps> = ({ classData, initialGrades, onSave, onAddStudent, onRemoveStudent, onToggleStudentRetention, onToggleStudentTransfer }) => {
    const { students, data, room, semester } = classData;
    const [grades, setGrades] = useState(initialGrades);
    const [isSaved, setIsSaved] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ id: '', name: '', number: '' });
    const [modalError, setModalError] = useState('');

    const subjectInfo = useMemo(() => getSubjectsForEntry(data, semester), [data, semester]);

    useEffect(() => {
        setGrades(initialGrades);
    }, [initialGrades, classData]);

    const handleGradeChange = (studentId: string, subjectCode: string, grade: string) => {
        setGrades(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectCode]: grade,
            },
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSave(grades);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const handleAddStudentSubmit = (e: FormEvent) => {
        e.preventDefault();
        setModalError('');
        if (!/^\d{4}$/.test(newStudent.id)) {
            setModalError('เลขประจำตัวต้องเป็นตัวเลข 4 หลัก');
            return;
        }
        if (!newStudent.name.trim()) {
            setModalError('โปรดกรอกชื่อ-สกุล');
            return;
        }
        if (!/^\d+$/.test(newStudent.number) || parseInt(newStudent.number) <= 0) {
            setModalError('เลขที่ต้องเป็นตัวเลขจำนวนเต็มบวก');
            return;
        }
        
        const success = onAddStudent(classData.gradeLevel, classData.room, { ...newStudent, number: parseInt(newStudent.number, 10) });

        if (success) {
            setIsModalOpen(false);
            setNewStudent({ id: '', name: '', number: '' });
        } else {
             setModalError('ข้อมูลซ้ำซ้อน โปรดตรวจสอบเลขประจำตัวและเลขที่');
        }
    };
    
    const handleRemoveStudentClick = (studentId: string, studentName: string) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการย้ายนักเรียน "${studentName}" ออก? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            onRemoveStudent(classData.gradeLevel, classData.room, studentId);
        }
    }

    const getColumnBgClass = (index: number, isHeader: boolean) => {
        const { boundaries } = subjectInfo;
        const coreEnd = boundaries[0] ?? Infinity;
        const additionalEnd = boundaries[1] ?? Infinity;

        if (isHeader) {
            return 'bg-slate-200';
        }

        if (index < coreEnd) {
            return 'bg-white';
        } else if (index < additionalEnd) {
            return 'bg-sky-50';
        } else {
            return 'bg-amber-50';
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="animate-fade-in bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900 tracking-wide">
                            กรอกผลการเรียน
                        </h2>
                        <p className="mt-1 text-base text-slate-600">
                            {data.level} / ห้อง {room} {semester && `- ภาคเรียนที่ ${semester === 'semester1' ? '1' : '2'}`} (พบ {students.length} คน)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-green-500 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        เพิ่มนักเรียน
                    </button>
                </div>
                
                <div className="overflow-auto relative border border-slate-200 sm:rounded-lg max-h-[75vh]">
                    <table className="w-full text-sm text-left text-slate-600 table-fixed">
                        <thead className="text-xs text-slate-500 uppercase sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-6 py-3 sticky left-0 bg-slate-200 w-64 min-w-[16rem] z-20 text-sm font-semibold tracking-wider border-r border-slate-300">
                                    เลขที่ / ชื่อนักเรียน
                                </th>
                                {subjectInfo.subjects.map((subject, index) => {
                                    return (
                                        <th key={subject.code || index} scope="col" className={`px-1 py-2 align-middle w-14 min-w-[3.5rem] transition-colors ${getColumnBgClass(index, true)}`}>
                                            <div className="[writing-mode:vertical-rl] transform rotate-180 text-center h-40 mx-auto flex items-center justify-center">
                                                <div>
                                                    <span className="font-mono text-xs block">{subject.code}</span>
                                                    <span className="mt-1 text-xs font-medium">{subject.name}</span>
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th scope="col" className="px-4 py-3 sticky right-0 bg-slate-200 w-48 min-w-[12rem] text-center z-20 text-sm font-semibold tracking-wider border-l border-slate-300">สถานะ / จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={subjectInfo.subjects.length + 2} className="text-center py-12 text-slate-500 bg-white text-base">
                                        ไม่มีข้อมูลนักเรียนในห้องนี้ <br />
                                        โปรดคลิก "เพิ่มนักเรียน" เพื่อเริ่มต้น
                                    </td>
                                </tr>
                            ) : students.map(student => (
                                <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-slate-900 sticky left-0 bg-white hover:bg-slate-50 w-64 min-w-[16rem] z-10 border-r border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-lg w-8 text-center">{student.number}</span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-base">{student.name}</div>
                                                <div className="font-mono text-xs text-slate-500">{student.id}</div>
                                            </div>
                                        </div>
                                    </th>
                                    {subjectInfo.subjects.map((subject, index) => {
                                        return (
                                            <td key={subject.code || index} className={`px-1.5 py-1 w-14 min-w-[3.5rem] transition-colors ${getColumnBgClass(index, false)}`}>
                                                {subject.code && (
                                                    <select
                                                        value={grades[student.id]?.[subject.code] || ''}
                                                        onChange={(e) => handleGradeChange(student.id, subject.code, e.target.value)}
                                                        className="block w-full px-1 py-2 text-sm bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                                    >
                                                        <option value="">-</option>
                                                        {(subject.isActivity ? activityGradeOptions : gradeOptions).map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-1 sticky right-0 bg-white hover:bg-slate-50 w-48 min-w-[12rem] z-10 border-l border-slate-200">
                                        <div className="flex items-center justify-center h-full gap-4">
                                            <div className="flex flex-col items-start">
                                                <label className="flex items-center cursor-pointer text-sm mb-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!student.retained}
                                                        onChange={(e) => onToggleStudentRetention(student.id, e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-400 bg-slate-100 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="ml-2 text-slate-700">ซ้ำชั้น</span>
                                                </label>
                                                 {classData.gradeLevel === 'p6' && (
                                                    <label className="flex items-center cursor-pointer text-sm mb-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!student.transferringOut}
                                                            onChange={(e) => onToggleStudentTransfer(student.id, e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-400 bg-slate-100 text-yellow-600 focus:ring-yellow-500"
                                                        />
                                                        <span className="ml-2 text-slate-700">ย้ายสถานศึกษา</span>
                                                    </label>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStudentClick(student.id, student.name)}
                                                className="p-2.5 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                                                aria-label={`ย้ายนักเรียน ${student.name} ออก`}
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 flex justify-end items-center gap-4">
                    {isSaved && (
                        <p className="text-green-600 animate-fade-in font-semibold">
                            บันทึกผลการเรียนเรียบร้อยแล้ว!
                        </p>
                    )}
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-md shadow-sm text-slate-900 bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary-500 transition-colors"
                    >
                        <SaveIcon className="h-5 w-5 mr-2" />
                        บันทึกผลการเรียน
                    </button>
                </div>
            </form>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
                        <form onSubmit={handleAddStudentSubmit}>
                            <div className="p-6">
                                <h3 className="text-xl font-semibold text-slate-900">เพิ่มนักเรียนใหม่</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    กรอกข้อมูลนักเรียนใหม่ในชั้น {data.level} / ห้อง {room}
                                </p>
                                <div className="mt-6 space-y-4">
                                    <div>
                                        <label htmlFor="newStudentId" className="block text-sm font-medium text-slate-600 mb-1">เลขประจำตัว (4 หลัก)</label>
                                        <input type="text" id="newStudentId" value={newStudent.id} onChange={e => setNewStudent({...newStudent, id: e.target.value})} maxLength={4} pattern="\d{4}" required className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="newStudentName" className="block text-sm font-medium text-slate-600 mb-1">ชื่อ - สกุล</label>
                                        <input type="text" id="newStudentName" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="newStudentNumber" className="block text-sm font-medium text-slate-600 mb-1">เลขที่</label>
                                        <input type="number" id="newStudentNumber" value={newStudent.number} onChange={e => setNewStudent({...newStudent, number: e.target.value})} required className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500" />
                                    </div>
                                </div>
                                {modalError && <p className="text-sm text-red-600 mt-4">{modalError}</p>}
                            </div>
                            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-slate-400">
                                    ยกเลิก
                                </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-slate-900 bg-primary-500 border border-transparent rounded-md shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 focus:ring-primary-500">
                                    บันทึก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};