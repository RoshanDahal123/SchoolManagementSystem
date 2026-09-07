import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { useAuth } from "@/hooks/use-auth"
import {
  BookOpenIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  InboxIcon,
  UsersIcon,
} from "lucide-react"

const STATS = [
  { label: "Total Students", icon: UsersIcon },
  { label: "Total Teachers", icon: GraduationCapIcon },
  { label: "Total Classes", icon: BookOpenIcon },
  { label: "Today's Attendance", icon: CalendarCheckIcon },
] as const

export default function AdminDashboardPage() {
  const { email } = useAuth()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {today} · Signed in as {email ?? "admin"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold tabular-nums">—</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Enrollments, invites, and attendance updates will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
            <InboxIcon className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing to show yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              This connects to the dashboard summary endpoint once it ships.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}