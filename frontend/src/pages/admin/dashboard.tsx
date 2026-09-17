import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/atoms/card"
import { useGetDashboardSummaryQuery } from "@/features/dashboard/dashboard-api"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import {
  BookOpenIcon, CalendarCheckIcon, GraduationCapIcon, InboxIcon, UsersIcon,
} from "lucide-react"

export default function AdminDashboardPage() {
  const { email } = useAuth()
  const { data, isLoading } = useGetDashboardSummaryQuery()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const STATS = [
    { label: "Total Students", icon: UsersIcon, value: data?.totalStudents },
    { label: "Total Teachers", icon: GraduationCapIcon, value: data?.totalTeachers },
    { label: "Total Classes", icon: BookOpenIcon, value: data?.totalClasses },
    {
      label: "Today's Attendance",
      icon: CalendarCheckIcon,
      value: data ? `${data.todayAttendancePercentage}%` : undefined,
    },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {today} · Signed in as {email ?? "admin"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, icon: Icon, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {isLoading || value === undefined ? "—" : value}
                </p>
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
          <CardDescription>Latest announcements published to the school.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !data?.recentActivity.length ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
              <InboxIcon className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">Nothing to show yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Published announcements will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.recentActivity.map((item) => {
  
  return (
    <li
      key={item.id}
      className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
    >
      <div>
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.body}</p>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(item.timeStamp), {
          addSuffix: true,
        })}
      </span>
    </li>
  )
})}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}