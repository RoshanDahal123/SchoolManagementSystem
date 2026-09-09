import { PATHS } from "@/routes/paths"
import {
    BookOpenIcon,
    CalendarCheckIcon,
    ClipboardListIcon,
    GraduationCapIcon,
    LayoutDashboardIcon,
    UsersIcon,
    type LucideIcon,
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
export const NAV_ITEMS: NavItem[] = [
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
    ],
  },
  { title: "Assignments", path: PATHS.adminAssignments, icon: ClipboardListIcon },
  { title: "Attendance", path: PATHS.adminAttendance, icon: CalendarCheckIcon },
]