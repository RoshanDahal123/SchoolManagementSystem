import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/atoms/breadcrumb"
import { Separator } from "@/components/atoms/separator"
import { SidebarTrigger } from "@/components/atoms/sidebar"
import { ModeToggle } from "@/components/molecules/mode-toggle"
import type { NavItem } from "@/config/nav-item"
import { Link, useLocation } from "react-router"

interface NavbarProps {
  navItems: NavItem[]
  homePath: string
}

export function Navbar({ navItems, homePath }: NavbarProps) {
  const { pathname } = useLocation()
  const current = navItems.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  )

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink render={<Link to={homePath} />}>School MS</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{current?.title ?? "Dashboard"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
      </div>
    </header>
  )
}