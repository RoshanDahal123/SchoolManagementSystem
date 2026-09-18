import { PortalLayout } from "./portal-layout"
import { ADMIN_NAV_ITEMS } from "@/config/nav-item"
import { PATHS } from "@/routes/paths"

export function AdminLayout() {
  return <PortalLayout navItems={ADMIN_NAV_ITEMS} portalTitle="Admin Console" homePath={PATHS.adminDashboard} />
}