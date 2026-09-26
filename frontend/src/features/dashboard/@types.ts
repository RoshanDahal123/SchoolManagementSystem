export interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendancePercentage: number;
  recentActivity: RecentActivityItem[];
  studentsByGrade: GradeStudentCount[];
}

export interface RecentActivityItem {
  id: string;
  title: string;
  body: string;
  timeStamp: string;
}

export interface GradeStudentCount{
  gradeLevelId: string;
  gradeLevelName: string;
  studentCount: number;
}

export interface TeacherDashboardSummary {
  assignedGradeCount: number;
  assignedSectionCount: number;
  assignedSubjectCount: number;
  totalStudents: number;
  homeroomSectionCount: number;
  hasHomeroom: boolean;
  todayAttendanceMarkedSections: number;
  todayAttendancePercentage: number;
  pendingGradingCount: number;
  recentActivity: TeacherActivityItem[];
}

export type TeacherActivityType =
  | "CourseworkCreated"
  | "SubmissionReceived"
  | "AttendanceMarked"
  | "Announcement";

export interface TeacherActivityItem {
  type: TeacherActivityType;
  title: string;
  description: string;
  timeStamp: string;
  referenceId: string | null;
}
