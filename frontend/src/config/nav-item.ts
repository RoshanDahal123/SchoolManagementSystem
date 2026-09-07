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

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
}

// Single source of truth for the admin nav — both the sidebar and the
// breadcrumb in Navbar read from this, so they can't drift out of sync.
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", path: PATHS.adminDashboard, icon: LayoutDashboardIcon },
  { title: "Students", path: PATHS.adminStudents, icon: UsersIcon },
  { title: "Teachers", path: PATHS.adminTeachers, icon: GraduationCapIcon },
  { title: "Academic", path: PATHS.adminAcademic, icon: BookOpenIcon },
  { title: "Assignments", path: PATHS.adminAssignments, icon: ClipboardListIcon },
  { title: "Attendance", path: PATHS.adminAttendance, icon: CalendarCheckIcon },
]