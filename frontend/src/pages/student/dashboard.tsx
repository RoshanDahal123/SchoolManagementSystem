import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Progress } from "@/components/atoms/progress"
import { Skeleton } from "@/components/atoms/skeleton"
import { AnnouncementFeedCard } from "@/features/announcements/components/announcement-feed-card"
import { useGetStudentAttendanceSummaryQuery } from "@/features/attendance/attendance-api"
import { UpcomingCourseworkCard } from "@/features/coursework/components/upcoming-coursework-card"
import { useAuth } from "@/hooks/use-auth"
import { BookOpenIcon, CalendarCheckIcon, CircleCheckIcon, ClockIcon } from "lucide-react"

export default function StudentDashboardPage() {
  const { firstName, lastName, email, studentId } = useAuth()
  const { data: summary, isLoading } = useGetStudentAttendanceSummaryQuery(
    { studentId: studentId ?? "" },
    { skip: !studentId }
  )

  const displayName = firstName ? `${firstName}${lastName ? " " + lastName : ""}` : email ?? "Student"

  const statCards = [
    {
      label: "Present",
      value: summary?.presentCount ?? 0,
      icon: CircleCheckIcon,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Absent",
      value: summary?.absentCount ?? 0,
      icon: CalendarCheckIcon,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Late",
      value: summary?.lateCount ?? 0,
      icon: ClockIcon,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Excused",
      value: summary?.excusedCount ?? 0,
      icon: BookOpenIcon,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="rounded-xl bg-gradient-to-br from-primary/15 via-primary/8 to-transparent p-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {firstName ?? "Student"} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">{email}</p>
      </div>

      {/* Attendance overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : summary ? (
            <>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums">
                  {summary.attendancePercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  attendance rate · {summary.totalMarkedDays} days recorded
                </span>
              </div>
              <Progress
                value={summary.attendancePercentage}
                className="h-2"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map((stat) => (
                  <div key={stat.label} className={`rounded-lg p-3 ${stat.bg}`}>
                    <div className={`flex items-center gap-2 ${stat.color}`}>
                      <stat.icon className="size-4" />
                      <span className="text-xs font-medium">{stat.label}</span>
                    </div>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No attendance records yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Two-column: upcoming work + announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingCourseworkCard />
        <AnnouncementFeedCard />
      </div>
    </div>
  )
}
