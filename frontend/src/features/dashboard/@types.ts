export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
}
