export interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendancePercentage: number;
  recentActivity: RecentActivityItem[];
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
}
