
import React, { useState } from 'react';
import { Curriculum, Subject, PrimaryGradeData, JuniorHighGradeData } from '../types';
import { EditIcon, TrashIcon, PlusIcon, SaveIcon } from './icons';

interface AdminPageProps {
    curriculum: Curriculum;
    setCurriculum: React.Dispatch<React.SetStateAction<Curriculum>>;
    onPromoteStudents: () => void;
    academicYear: string;
}

const gradeLevels = [
  { value: 'p1', label: 'ประถมศึกษาปีที่ 1' }, { value: 'p2', label: 'ประถมศึกษาปีที่ 2' },
  { value: 'p3', label: 'ประถมศึกษาปีที่ 3' }, { value: 'p4', label: 'ประถมศึกษาปีที่ 4' },
  { value: 'p5', label: 'ประถมศึกษาปีที่ 5' }, { value: 'p6', label: 'ประถมศึกษาปีที่ 6' },
  { value: 'm1', label: 'มัธยมศึกษาปีที่ 1' }, { value: 'm2', label: 'มัธยมศึกษาปีที่ 2' },
  { value: 'm3', label: 'มัธยมศึกษาปีที่ 3' },
];

type SubjectCategory = 'coreSubjects' | 'additionalSubjects' | 'developmentActivities';

export const AdminPage: React.FC<AdminPageProps> = ({ curriculum, setCurriculum, onPromoteStudents, academicYear }) => {
    const [selectedGrade, setSelectedGrade] = useState('p1');
    const [selectedSemester, setSelectedSemester] = useState<'semester1' | 'semester2'>('semester1');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<{ subject: Partial<Subject>; category: SubjectCategory; index: number | null } | null>(null);

    const handlePromoteClick = () => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะเลื่อนชั้นนักเรียนทั้งหมด? \n\n- นักเรียนจะถูกเลื่อนชั้นตามปกติ (ป.1 -> ป.2, ...)\n- นักเรียน ป.6 ที่ไม่ได้ทำเครื่องหมาย 'ย้ายสถานศึกษา' จะถูกเลื่อนชั้นไป ม.1\n- นักเรียน ป.6 ที่ถูกทำเครื่องหมาย 'ย้ายสถานศึกษา' จะถือว่าสำเร็จการศึกษา\n- นักเรียน ม.3 จะถูกเปลี่ยนสถานะเป็น 'สำเร็จการศึกษา' และนำออกจากรายชื่อ\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            onPromoteStudents();
            alert('ดำเนินการเลื่อนชั้นเรียนสำเร็จ!');
        }
    };

    const handleEditSubject = (subject: Subject, category: SubjectCategory, index: number) => {
        setEditingSubject({ subject, category, index });
        setIsModalOpen(true);
    };

    const handleAddSubject = (category: SubjectCategory) => {
        setEditingSubject({ subject: { code: '', name: '', hours: '' }, category, index: null });
        setIsModalOpen(true);
    };

    const handleDeleteSubject = (category: SubjectCategory, index: number) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายวิชานี้?')) {
            setCurriculum(prev => {
                const newCurriculum = JSON.parse(JSON.stringify(prev));
                const gradeData = newCurriculum[selectedGrade];
                const isPrimary = 'coreSubjects' in gradeData;

                if (isPrimary) {
                    (gradeData as PrimaryGradeData)[category].splice(index, 1);
                } else {
                    (gradeData as JuniorHighGradeData).semesters[selectedSemester][category].splice(index, 1);
                }
                return newCurriculum;
            });
        }
    };

    const handleSaveSubject = () => {
        if (!editingSubject) return;
        const { subject, category, index } = editingSubject;

        // Basic validation
        if (!subject.name || !subject.hours) {
            alert("กรุณากรอกชื่อวิชาและหน่วยกิต/ชั่วโมง");
            return;
        }

        setCurriculum(prev => {
            const newCurriculum = JSON.parse(JSON.stringify(prev));
            const gradeData = newCurriculum[selectedGrade];
            const isPrimary = 'coreSubjects' in gradeData;
            
            const targetArray = isPrimary 
                ? (gradeData as PrimaryGradeData)[category]
                : (gradeData as JuniorHighGradeData).semesters[selectedSemester][category];

            if (index !== null) { // Editing existing
                targetArray[index] = subject as Subject;
            } else { // Adding new
                targetArray.push(subject as Subject);
            }
            return newCurriculum;
        });
        setIsModalOpen(false);
        setEditingSubject(null);
    };

    const renderSubjectTable = (title: string, subjects: Subject[], category: SubjectCategory) => (
        <div className="mb-8">
            <h4 className="text-lg font-medium text-slate-800 mb-3">{title}</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-base">
                    <thead className="bg-slate-100 text-sm">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium text-slate-500">รหัสวิชา</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500">ชื่อวิชา</th>
                            <th className="px-6 py-3 text-left font-medium text-slate-500">หน่วยกิต/ชั่วโมง</th>
                            <th className="px-6 py-3 text-center font-medium text-slate-500">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {subjects.map((s, i) => (
                            <tr key={i} className="border-t border-slate-200">
                                <td className="px-6 py-4 font-mono text-slate-700">{s.code || '-'}</td>
                                <td className="px-6 py-4 text-slate-800">{s.name}</td>
                                <td className="px-6 py-4 text-slate-800">{s.hours}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => handleEditSubject(s, category, i)} className="p-2 text-primary-600 hover:bg-slate-100 rounded-full transition-colors"><EditIcon className="h-5 w-5" /></button>
                                    <button onClick={() => handleDeleteSubject(category, i)} className="p-2 text-red-500 hover:bg-slate-100 rounded-full ml-2 transition-colors"><TrashIcon className="h-5 w-5" /></button>
                                </td>
                            </tr>
                        ))}
                         {subjects.length === 0 && (
                            <tr className="border-t border-slate-200">
                                <td colSpan={4} className="text-center py-6 text-slate-500">ไม่มีรายวิชาในหมวดนี้</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-3">
                 <button onClick={() => handleAddSubject(category)} className="inline-flex items-center gap-2 text-base font-semibold text-green-600 hover:text-green-700 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100">
                    <PlusIcon className="h-5 w-5" /> เพิ่มรายวิชา
                </button>
            </div>
        </div>
    );
    
    const gradeData = curriculum[selectedGrade];
    const isPrimary = 'coreSubjects' in gradeData;
    const formInputStyle = "w-56 text-base px-4 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 transition";


    return (
        <div className="space-y-10 animate-fade-in">
            {/* End of Year Processing */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900 tracking-wide mb-4">ประมวลผลสิ้นปีการศึกษา</h2>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="max-w-prose">
                        <h3 className="font-semibold text-lg text-slate-800">ดำเนินการเลื่อนชั้นเรียนและสำเร็จการศึกษา</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            คลิกปุ่มนี้เมื่อสิ้นสุดปีการศึกษาเพื่อเลื่อนระดับชั้นของนักเรียนทั้งหมดไปยังชั้นปีถัดไป ระบบจะจัดการสถานะซ้ำชั้น, ย้ายออก และสำเร็จการศึกษาโดยอัตโนมัติ
                        </p>
                    </div>
                    <button
                        onClick={handlePromoteClick}
                        className="px-6 py-2.5 font-semibold text-slate-900 bg-primary-500 rounded-md shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-50 transition-colors"
                    >
                        ดำเนินการสิ้นปี {academicYear}
                    </button>
                </div>
            </div>

            {/* Curriculum Management */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900 tracking-wide mb-6">จัดการโครงสร้างหลักสูตร</h2>
                <div className="flex flex-wrap gap-4 mb-8">
                    <div>
                        <label htmlFor="grade-select" className="block text-sm font-light text-slate-500 mb-2">ระดับชั้น</label>
                        <select id="grade-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className={formInputStyle}>
                            {gradeLevels.map(g => <option key={g.value} value={g.value} className="bg-white">{g.label}</option>)}
                        </select>
                    </div>
                    {!isPrimary && (
                        <div>
                            <label htmlFor="semester-select" className="block text-sm font-light text-slate-500 mb-2">ภาคเรียน</label>
                            <select id="semester-select" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value as any)} className={formInputStyle}>
                                <option value="semester1" className="bg-white">ภาคเรียนที่ 1</option>
                                <option value="semester2" className="bg-white">ภาคเรียนที่ 2</option>
                            </select>
                        </div>
                    )}
                </div>
                {isPrimary ? (
                    <>
                        {renderSubjectTable('รายวิชาพื้นฐาน', (gradeData as PrimaryGradeData).coreSubjects, 'coreSubjects')}
                        {renderSubjectTable('รายวิชาเพิ่มเติม', (gradeData as PrimaryGradeData).additionalSubjects, 'additionalSubjects')}
                        {renderSubjectTable('กิจกรรมพัฒนาผู้เรียน', (gradeData as PrimaryGradeData).developmentActivities, 'developmentActivities')}
                    </>
                ) : (
                    <>
                        {renderSubjectTable('รายวิชาพื้นฐาน', (gradeData as JuniorHighGradeData).semesters[selectedSemester].coreSubjects, 'coreSubjects')}
                        {renderSubjectTable('รายวิชาเพิ่มเติม', (gradeData as JuniorHighGradeData).semesters[selectedSemester].additionalSubjects, 'additionalSubjects')}
                        {renderSubjectTable('กิจกรรมพัฒนาผู้เรียน', (gradeData as JuniorHighGradeData).semesters[selectedSemester].developmentActivities, 'developmentActivities')}
                    </>
                )}
            </div>

            {/* Edit/Add Modal */}
            {isModalOpen && editingSubject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md animate-fade-in">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-slate-900">{editingSubject.index !== null ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h3>
                             <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">รหัสวิชา</label>
                                    <input type="text" value={editingSubject.subject.code || ''} onChange={e => setEditingSubject(prev => prev ? { ...prev, subject: { ...prev.subject, code: e.target.value } } : null)} placeholder="เช่น ท21101" className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">ชื่อวิชา/กิจกรรม</label>
                                    <input type="text" value={editingSubject.subject.name || ''} onChange={e => setEditingSubject(prev => prev ? { ...prev, subject: { ...prev.subject, name: e.target.value } } : null)} required placeholder="เช่น ภาษาไทย" className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">หน่วยกิต/ชั่วโมง</label>
                                    <input type="text" value={editingSubject.subject.hours || ''} onChange={e => setEditingSubject(prev => prev ? { ...prev, subject: { ...prev.subject, hours: e.target.value } } : null)} required placeholder="เช่น 1.5 (60) หรือ 40" className="block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500" />
                                </div>
                             </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-100">ยกเลิก</button>
                            <button onClick={handleSaveSubject} className="px-4 py-2 text-sm font-medium text-slate-900 bg-primary-500 rounded-md hover:bg-primary-600 flex items-center gap-2"><SaveIcon className="h-4 w-4" /> บันทึก</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};