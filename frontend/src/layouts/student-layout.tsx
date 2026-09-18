import { STUDENT_NAV_ITEMS } from "@/config/nav-item"
import { PATHS } from "@/routes/paths"
import { PortalLayout } from "./portal-layout"

export function StudentLayout() {
  return <PortalLayout navItems={STUDENT_NAV_ITEMS} portalTitle="Student Portal" homePath={PATHS.studentDashboard} />
}