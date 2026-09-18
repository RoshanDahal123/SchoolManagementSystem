import { TEACHER_NAV_ITEMS } from "@/config/nav-item"
import { PATHS } from "@/routes/paths"
import { PortalLayout } from "./portal-layout"

export function TeacherLayout() {
  return <PortalLayout navItems={TEACHER_NAV_ITEMS} portalTitle="Teacher Portal" homePath={PATHS.teacherDashboard} />
}