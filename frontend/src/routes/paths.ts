export const PATHS = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard", // Keep for backward compatibility, will redirect to admin
  admin: "/admin",
  adminDashboard: "/admin/dashboard",
  adminStudents: "/admin/students",
  activate:"activate",
  adminStudentDetails: (id: string) => `/admin/students/${id}`,
  adminTeachers: "/admin/teachers",
  adminTeacherDetails: (id: string) => `/admin/teachers/${id}`,
  adminAcademic: "/admin/academic",
  adminAssignments: "/admin/assignments",
  adminAttendance: "/admin/attendance",
} as const;