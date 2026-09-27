import {
    Avatar,
    AvatarFallback,
} from "@/components/atoms/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/atoms/sidebar"
import { useLogoutMutation } from "@/features/auth/auth-api"
import { useAuth } from "@/hooks/use-auth"
import { PATHS } from "@/routes/paths"
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router"

function getNameInitials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
  if (firstName) return firstName.slice(0, 2).toUpperCase()
  if (email) {
    const [local] = email.split("@")
    const parts = local.split(/[._-]/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return local.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function NavUser() {
  const { email, role, firstName, lastName } = useAuth()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`
    : firstName ?? email ?? "Not signed in"

  const initials = getNameInitials(firstName, lastName, email)

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      navigate(PATHS.login, { replace: true })
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground"
              >
                <Avatar className="rounded-lg">
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{email ?? ""}</span>
                </div>
                <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1.5 py-1.5 text-sm">
                  <Avatar className="rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">{email ?? ""}</span>
                    <span className="truncate text-xs text-muted-foreground/70">{role ?? ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOutIcon />
              {isLoading ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
