
export interface Subject {
  code: string;
  name: string;
  hours: number | string;
}

export interface SemesterData {
  coreSubjects: Subject[];
  additionalSubjects: Subject[];
  developmentActivities: Subject[];
  totalHours: number;
}

export interface PrimaryGradeData {
  title: string;
  level: string;
  coreSubjects: Subject[];
  additionalSubjects: Subject[];
  developmentActivities: Subject[];
  totals: {
    core: number;
    additional: number;
    development: number;
    total: number;
  };
}

export interface JuniorHighGradeData {
  title: string;
  level: string;
  semesters: {
    semester1: SemesterData;
    semester2: SemesterData;
  };
}

export type GradeLevelData = PrimaryGradeData | JuniorHighGradeData;

export interface Curriculum {
  [key: string]: GradeLevelData;
}
