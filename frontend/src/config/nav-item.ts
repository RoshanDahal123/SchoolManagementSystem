import { PATHS } from "@/routes/paths"
import {
  BookOpenIcon,
  CalendarCheckIcon,
  ChartNoAxesColumnIncreasingIcon,
  ClipboardListIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  UsersIcon,
  type LucideIcon
} from "lucide-react"

export interface NavSubItem {
  title: string
  path: string
}

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
  items?: NavSubItem[]
}

// Single source of truth for the admin nav — sidebar and breadcrumb both read from this.
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: PATHS.adminDashboard, icon: LayoutDashboardIcon },
  { title: "Students", path: PATHS.adminStudents, icon: UsersIcon },
  { title: "Teachers", path: PATHS.adminTeachers, icon: GraduationCapIcon },
  {
    title: "Academic",
    path: PATHS.adminAcademic,
    icon: BookOpenIcon,
    items: [
      { title: "Academic Years", path: PATHS.adminAcademicYears },
      { title: "Grades & Sections", path: PATHS.adminAcademicGrades },
      { title: "Subjects", path: PATHS.adminAcademicSubjects },
      { title: "Curriculum", path: PATHS.adminAcademicCurriculum },
      {title: "Roster", path: PATHS.adminAcademicRoster}
    ],
  },
  { title: "Attendance", path: PATHS.adminAttendance, icon: CalendarCheckIcon },
  {title:"Announcements", path:PATHS.adminAnnouncements,icon:MegaphoneIcon}
]

export const TEACHER_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: PATHS.teacherDashboard, icon: LayoutDashboardIcon },
  { title: "Coursework", path: PATHS.teacherCoursework, icon: ClipboardListIcon },
]

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: PATHS.studentDashboard, icon: LayoutDashboardIcon },
  { title: "Coursework", path: PATHS.studentCoursework, icon: ClipboardListIcon },
  { title: "Progress Report", path: PATHS.studentProgressReport, icon: ChartNoAxesColumnIncreasingIcon },
]
