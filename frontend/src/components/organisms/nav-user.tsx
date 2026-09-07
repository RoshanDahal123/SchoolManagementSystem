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
import { getInitials } from "@/helpers/format"
import { useAuth } from "@/hooks/use-auth"
import { PATHS } from "@/routes/paths"
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"
import { useNavigate } from "react-router"

export function NavUser() {
  const { email, role } = useAuth()
  const { isMobile } = useSidebar()
  const navigate = useNavigate()
  const [logout, { isLoading }] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      // Navigate regardless of API outcome — the user's intent was to leave.
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
                    {getInitials(email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {email ?? "Not signed in"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {role ?? "—"}
                  </span>
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
            {getInitials(email)}
          </AvatarFallback>
        </Avatar>
        <div className="grid flex-1 text-left leading-tight">
          <span className="truncate font-medium">
            {email ?? "Not signed in"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Signed in as {role ?? "—"}
          </span>
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