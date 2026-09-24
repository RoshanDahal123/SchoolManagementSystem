import { useEffect, useState } from "react"
import { Button } from "@/components/atoms/button"
import { Card, CardContent } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { useGetDashboardSummaryQuery } from "@/features/dashboard/dashboard-api"
import RecentActivities from "@/features/dashboard/components/recent-activities"
import StatisticsCard from "@/features/dashboard/components/statistics-card"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"
import {
  BookOpenIcon,
  CalendarCheckIcon,
  GraduationCapIcon,
  RotateCw,
  UsersIcon,
} from "lucide-react"

export default function AdminDashboardPage() {
  const { email } = useAuth()
  const { data, isLoading, isFetching, refetch, fulfilledTimeStamp } =
    useGetDashboardSummaryQuery()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    if (fulfilledTimeStamp) {
      setLastUpdated(new Date(fulfilledTimeStamp))
    }
  }, [fulfilledTimeStamp])

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const attendanceRate = data?.todayAttendancePercentage ?? 0
  const attendanceStatusColor =
    attendanceRate >= 90
      ? "text-green-600 dark:text-green-400"
      : attendanceRate >= 75
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"

  const STATS = [
    {
      label: "Total Students",
      sublabel: "Active enrolled students",
      icon: UsersIcon,
      value: data?.totalStudents,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      label: "Total Teachers",
      sublabel: "Active faculty members",
      icon: GraduationCapIcon,
      value: data?.totalTeachers,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      label: "Total Classes",
      sublabel: "Active academic courses",
      icon: BookOpenIcon,
      value: data?.totalClasses,
      colorClass: "bg-primary/10 text-primary",
    },
    {
      label: "Today's Attendance",
      sublabel: "Overall daily rate",
      icon: CalendarCheckIcon,
      value:
        data !== undefined
          ? `${data.todayAttendancePercentage.toFixed(1)}%`
          : undefined,
      valueClass: attendanceStatusColor,
      colorClass: "bg-primary/10 text-primary",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Page Header + Last Updated / Refresh Affordance ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            {today} · Signed in as{" "}
            <span className="font-medium text-foreground">
              {email ?? "admin"}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-xs text-muted-foreground">
            Last updated:{" "}
            <span className="font-medium text-foreground">
              {format(lastUpdated, "h:mm:ss a")}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs font-medium cursor-pointer"
          >
            <RotateCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stat-card row (4 cols → 2 → 1 responsively) with Skeletons ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="size-11 rounded-lg shrink-0" />
                </CardContent>
              </Card>
            ))
          : STATS.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-1">
                    <p
                      className={`text-2xl font-bold tabular-nums tracking-tight ${
                        stat.valueClass ?? "text-foreground"
                      }`}
                    >
                      {stat.value ?? "—"}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.sublabel}
                    </p>
                  </div>
                  <div
                    className={`flex size-11 items-center justify-center rounded-lg shrink-0 ${stat.colorClass}`}
                  >
                    <stat.icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Two-column Section Below: Left Timeline & Right Statistics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentActivities
          items={data?.recentActivity}
          isLoading={isLoading}
        />
        <StatisticsCard
          data={data?.studentsByGrade}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}