import { Collapsible, CollapsibleContent } from "@/components/atoms/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/atoms/sidebar"
import { NavUser } from "@/components/organisms/nav-user"
import { Navbar } from "@/components/organisms/navbar"
import { NAV_ITEMS } from "@/config/nav-item"
import { cn } from "@/lib/utils"
import { ChevronRightIcon, GraduationCapIcon } from "lucide-react"
import { useState } from "react"
import { Link, Outlet, useLocation } from "react-router"

export function AdminLayout() {
  const { pathname, search } = useLocation()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const isActiveRoute = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  const isSubActive = (path: string) => {
    const [subPath, query] = path.split("?")
    return pathname === subPath && (!query || search.includes(query))
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCapIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">School MS</span>
              <span className="truncate text-xs text-muted-foreground">
                Admin Console
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const activeParent = isActiveRoute(item.path)

                  if (item.items?.length) {
                    const isOpen = openGroups[item.path] ?? activeParent
                    return (
                      <Collapsible
                        key={item.path}
                        open={isOpen}
                        onOpenChange={(open) =>
                          setOpenGroups((prev) => ({ ...prev, [item.path]: open }))
                        }
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            isActive={activeParent}
                            tooltip={item.title}
                            onClick={() =>
                              setOpenGroups((prev) => ({ ...prev, [item.path]: !isOpen }))
                            }
                          >
                            <Icon />
                            <span>{item.title}</span>
                            <ChevronRightIcon
                              className={cn(
                                "ml-auto size-4 transition-transform duration-200",
                                isOpen && "rotate-90"
                              )}
                            />
                          </SidebarMenuButton>

                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.items.map((sub) => (
                                <SidebarMenuSubItem key={sub.path}>
                                  <SidebarMenuSubButton
                                    isActive={isSubActive(sub.path)}
                                    render={<Link to={sub.path} />}
                                  >
                                    <span>{sub.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    )
                  }

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={activeParent}
                        tooltip={item.title}
                        render={<Link to={item.path} />}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <Navbar />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}