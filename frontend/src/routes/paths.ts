export const PATHS = {
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  admin: "/admin",
  adminDashboard: "/admin/dashboard",
  adminStudents: "/admin/students",
  activate: "activate",
  adminStudentDetails: (id: string) => `/admin/students/${id}`,
  adminTeachers: "/admin/teachers",
  adminTeacherDetails: (id: string) => `/admin/teachers/${id}`,
  adminAcademic: "/admin/academic",
  adminAcademicYears: "/admin/academic?tab=years",
  adminAcademicGrades: "/admin/academic?tab=grades",
  adminAcademicSubjects: "/admin/academic?tab=subjects",
  adminAcademicCurriculum: "/admin/academic?tab=curriculum",
  adminAcademicRoster: "/admin/academic?tab=roster",
  adminAssignments: "/admin/assignments",
  adminAttendance: "/admin/attendance",
  adminAnnouncements:"/admin/announcements",

  teacher: "/teacher",
  teacherDashboard: "/teacher/dashboard",
   teacherCoursework: "/teacher/coursework",
  teacherCourseworkDetails: (id: string) => `/teacher/coursework/${id}`,
  student: "/student",
  studentDashboard: "/student/dashboard",
  studentCoursework: "/student/coursework",
  studentProgressReport: "/student/progress-report",
  
} as const


import type { UserRole } from "@/features/auth/@types"

export function dashboardPathForRole(role: UserRole | null): string {
  switch (role) {
    case "Teacher": return PATHS.teacherDashboard;
    case "Student": return PATHS.studentDashboard;
    case "Admin":
    default: return PATHS.adminDashboard;
  }
}