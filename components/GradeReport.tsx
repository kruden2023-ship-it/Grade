
import React from 'react';
import type { GradeLevelData, JuniorHighGradeData, PrimaryGradeData, Subject, SemesterData } from '../types';

interface GradeReportProps {
  studentId: string;
  studentName: string;
  studentNumber: number;
  data: GradeLevelData;
  grades: { [subjectCode: string]: string | number };
  room: string;
  academicYear: string;
}

const calculateGPA = (subjects: Subject[], grades: { [subjectCode: string]: string | number }, isPrimary: boolean): string => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    subjects.forEach(subject => {
        const gradeValue = parseFloat(String(grades[subject.code]));
        if (isNaN(gradeValue)) return; // Skip non-numeric grades

        let credits = 0;
        if (isPrimary) {
            // Standard conversion for primary: 80 hours per year = 1 credit.
            const hours = typeof subject.hours === 'number' ? subject.hours : 0;
            if (hours > 0) {
                credits = hours / 80;
            }
        } else { // Junior High
            // Extract credit value from strings like "1.5 (60)"
            const creditMatch = String(subject.hours).match(/^(\d+(\.\d+)?)\s*\(/);
            if (creditMatch) {
                credits = parseFloat(creditMatch[1]);
            }
        }

        if (credits > 0) {
            totalCredits += credits;
            totalGradePoints += gradeValue * credits;
        }
    });

    if (totalCredits === 0) {
        return 'N/A';
    }

    const gpa = totalGradePoints / totalCredits;
    return gpa.toFixed(2);
};


const SubjectTable: React.FC<{ title: string; subjects: Subject[]; total?: number | string; totalLabel?: string, unitLabel: string, grades: { [subjectCode: string]: string | number } }> = ({ title, subjects, total, totalLabel = "รวม", unitLabel, grades }) => (
    <div className="mb-8">
        <h3 className="text-xl font-medium text-slate-800 p-4 bg-slate-100 rounded-t-lg">{title}</h3>
        <div className="overflow-x-auto">
            <table className="w-full text-base text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 w-[25%] font-semibold tracking-wider">รหัสวิชา</th>
                        <th scope="col" className="px-6 py-3 w-[45%] font-semibold tracking-wider">รายวิชา/กิจกรรม</th>
                        <th scope="col" className="px-6 py-3 w-[15%] text-right font-semibold tracking-wider">{unitLabel}</th>
                        <th scope="col" className="px-6 py-3 w-[15%] text-center font-semibold tracking-wider">ผลการเรียน</th>
                    </tr>
                </thead>
                <tbody>
                    {subjects.map((subject, index) => (
                        <tr key={index} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-6 py-4 font-mono text-slate-700">{subject.code || '-'}</td>
                            <td className="px-6 py-4 text-slate-800">{subject.name}</td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-slate-800">{subject.hours}</span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-lg text-primary-600">
                                {grades[subject.code] || '-'}
                            </td>
                        </tr>
                    ))}
                    {total !== undefined && (
                        <tr className="font-semibold bg-slate-100 text-slate-800">
                            <td colSpan={2} className="px-6 py-4 text-right">{totalLabel}</td>
                            <td className="px-6 py-4 text-right">{total}</td>
                            <td></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const GpaStatCard: React.FC<{ label: string; gpa: string; }> = ({ label, gpa }) => (
    <div className="mt-10 text-center p-8 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="font-medium text-xl text-primary-600 tracking-wide">{label}</p>
        <p className="font-bold text-8xl text-slate-900 tracking-wider mt-2">{gpa}</p>
    </div>
);

const PrimaryReport: React.FC<{ data: PrimaryGradeData, grades: { [subjectCode: string]: string | number } }> = ({ data, grades }) => {
    const subjectsForGpa = [...data.coreSubjects, ...data.additionalSubjects];
    const gpa = calculateGPA(subjectsForGpa, grades, true);

    return (
        <div>
            <SubjectTable title="รายวิชาพื้นฐาน" subjects={data.coreSubjects} total={data.totals.core} unitLabel="ชม./ปี" grades={grades} />
            <SubjectTable title="รายวิชาเพิ่มเติม" subjects={data.additionalSubjects} total={data.totals.additional} unitLabel="ชม./ปี" grades={grades} />
            <SubjectTable title="กิจกรรมพัฒนาผู้เรียน" subjects={data.developmentActivities} total={data.totals.development} unitLabel="ชม./ปี" grades={grades} />
            <div className="text-right p-4 bg-slate-100 rounded-lg">
                <span className="font-semibold text-base text-slate-700">รวมเวลาเรียนทั้งหมด: {data.totals.total} ชั่วโมง/ปี</span>
            </div>
            <GpaStatCard label="เกรดเฉลี่ยรวม (GPA)" gpa={gpa} />
        </div>
    );
};

const SemesterColumn: React.FC<{ title: string; data: SemesterData, grades: { [subjectCode: string]: string | number } }> = ({ title, data, grades }) => {
    const subjectsForGpa = [...data.coreSubjects, ...data.additionalSubjects];
    const semesterGpa = calculateGPA(subjectsForGpa, grades, false);

    // Generate stable codes for development activities that are missing them, matching the logic in GradeEntryForm
    const semesterNumber = title.includes('1') ? 1 : 2;
    const developmentActivitiesWithCodes = data.developmentActivities.map(activity => ({
        ...activity,
        code: activity.code || `${activity.name.replace(/\s/g, '')}-${semesterNumber}`,
    }));
    
    return (
        <div className="flex-1 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-semibold text-center mb-6 text-slate-900">{title}</h3>
            <SubjectTable title="รายวิชาพื้นฐาน" subjects={data.coreSubjects} unitLabel="หน่วยกิต (ชม.)" grades={grades} />
            <SubjectTable title="รายวิชาเพิ่มเติม" subjects={data.additionalSubjects} unitLabel="หน่วยกิต (ชม.)" grades={grades}/>
            <SubjectTable title="กิจกรรมพัฒนาผู้เรียน" subjects={developmentActivitiesWithCodes} total={data.totalHours} totalLabel="รวมเวลาเรียน" unitLabel="ชั่วโมง" grades={grades} />
             <div className="mt-4 text-right p-4 bg-slate-50 rounded-lg">
                <span className="font-medium text-base text-slate-600">เกรดเฉลี่ยภาคเรียน (GPA): </span>
                <span className="font-bold text-2xl text-primary-600 ml-2">{semesterGpa}</span>
            </div>
        </div>
    );
};


const JuniorHighReport: React.FC<{ data: JuniorHighGradeData, grades: { [subjectCode: string]: string | number } }> = ({ data, grades }) => {
    const allSubjectsForGpa = [
        ...data.semesters.semester1.coreSubjects,
        ...data.semesters.semester1.additionalSubjects,
        ...data.semesters.semester2.coreSubjects,
        ...data.semesters.semester2.additionalSubjects,
    ];
    const overallGpa = calculateGPA(allSubjectsForGpa, grades, false);

    return (
        <div>
            <div className="flex flex-col md:flex-row gap-8">
                <SemesterColumn title="ภาคเรียนที่ 1" data={data.semesters.semester1} grades={grades} />
                <SemesterColumn title="ภาคเรียนที่ 2" data={data.semesters.semester2} grades={grades} />
            </div>
            <GpaStatCard label="เกรดเฉลี่ยรวมตลอดปีการศึกษา (GPAX)" gpa={overallGpa} />
        </div>
    );
};


export const GradeReport: React.FC<GradeReportProps> = ({ studentId, studentName, studentNumber, data, grades, room, academicYear }) => {
    const isPrimary = 'coreSubjects' in data;

    return (
        <div className="animate-fade-in bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-8 pb-6 border-b border-slate-200">
                <h2 className="text-4xl font-bold text-slate-900 tracking-wide">{studentName}</h2>
                <p className="mt-2 text-xl font-medium text-primary-600">{data.level} / ห้อง {room}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-x-8 gap-y-2 mt-4 text-base text-slate-600">
                    <div><span className="font-medium text-slate-800">เลขที่:</span> {studentNumber}</div>
                    <div><span className="font-medium text-slate-800">เลขประจำตัว:</span> {studentId}</div>
                    <div className="col-span-2 sm:col-span-1"><span className="font-medium text-slate-800">ปีการศึกษา:</span> {academicYear}</div>
                </div>
            </div>
            {isPrimary 
                ? <PrimaryReport data={data as PrimaryGradeData} grades={grades} /> 
                : <JuniorHighReport data={data as JuniorHighGradeData} grades={grades} />}
        </div>
    );
};

// Add this to your index.html or a global CSS file if you have one
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);