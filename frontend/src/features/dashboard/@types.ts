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
