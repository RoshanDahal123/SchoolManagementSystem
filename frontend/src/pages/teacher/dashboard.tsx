import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { AnnouncementFeedCard } from "@/features/announcements/components/announcement-feed-card"
import { TeacherNeedsGradingCard } from "@/features/coursework/components/teacher-needs-grading-card"
import TeacherRecentActivity from "@/features/dashboard/components/teacher-recent-activity"
import { useGetTeacherDashboardSummaryQuery } from "@/features/dashboard/dashboard-api"
import { useGetTeacherAssignmentsQuery } from "@/features/teachers/teacher-api"
import { useAuth } from "@/hooks/use-auth"
import { PATHS } from "@/routes/paths"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  PlusIcon,
  RotateCw,
  UsersIcon,
} from "lucide-react"
import { Link } from "react-router"

// ── Per-stat contextual colours ──────────────────────────────────────────────
// Each card gets its own colour so a glance differentiates class count, student
// count, attendance status, and grading backlog — not just one primary tint.
const STAT_COLORS = {
  classes:    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  students:   "bg-chart-4/10 text-chart-4",
  attendance: {
    default:  "bg-chart-2/10 text-chart-2",
    good:     "bg-chart-1/10 text-chart-1",
    warn:     "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    bad:      "bg-destructive/10 text-destructive",
  },
  grading: {
    default:  "bg-chart-1/10 text-chart-1",
    pending:  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
} as const

export default function TeacherDashboardPage() {
  const { email, teacherId } = useAuth()
  const { data, isLoading, isFetching, refetch, fulfilledTimeStamp } =
    useGetTeacherDashboardSummaryQuery()
  const { data: assignments, isLoading: isLoadingAssignments } =
    useGetTeacherAssignmentsQuery(teacherId ?? "", { skip: !teacherId })

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  useEffect(() => {
    if (fulfilledTimeStamp) setLastUpdated(new Date(fulfilledTimeStamp))
  }, [fulfilledTimeStamp])

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  // ── Attendance display values ──────────────────────────────────────────────
  const attendanceValue = !data
    ? undefined
    : !data.hasHomeroom
    ? "—"
    : data.todayAttendanceMarkedSections === 0
    ? "Not marked"
    : `${data.todayAttendancePercentage.toFixed(0)}%`

  const attendanceSublabel = !data
    ? ""
    : !data.hasHomeroom
    ? "No homeroom section assigned"
    : `${data.todayAttendanceMarkedSections}/${data.homeroomSectionCount} section(s) marked today`

  // Derive attendance icon colour dynamically based on the percentage
  const attendanceIconColor = !data?.hasHomeroom
    ? STAT_COLORS.attendance.default
    : data.todayAttendanceMarkedSections === 0
    ? STAT_COLORS.attendance.default
    : data.todayAttendancePercentage >= 90
    ? STAT_COLORS.attendance.good
    : data.todayAttendancePercentage >= 75
    ? STAT_COLORS.attendance.warn
    : STAT_COLORS.attendance.bad

  // ── Stat card definitions ──────────────────────────────────────────────────
  const STATS = [
    {
      label: "My Classes",
      sublabel: data
        ? `${data.assignedGradeCount} grade(s) · ${data.assignedSubjectCount} subject(s)`
        : "",
      icon: BookOpenIcon,
      value: data?.assignedSectionCount,
      iconColor: STAT_COLORS.classes,
    },
    {
      label: "Total Students",
      sublabel: "Across your assigned classes",
      icon: UsersIcon,
      value: data?.totalStudents,
      iconColor: STAT_COLORS.students,
    },
    {
      label: "Today's Attendance",
      sublabel: attendanceSublabel,
      icon: CalendarCheckIcon,
      value: attendanceValue,
      valueClass:
        data?.hasHomeroom && data.todayAttendanceMarkedSections > 0
          ? data.todayAttendancePercentage >= 90
            ? "text-chart-1"
            : data.todayAttendancePercentage >= 75
            ? "text-amber-600 dark:text-amber-400"
            : "text-destructive"
          : "text-muted-foreground",
      iconColor: attendanceIconColor,
    },
    {
      label: "Pending Grading",
      sublabel: "Submissions awaiting review",
      icon: ClipboardCheckIcon,
      value: data?.pendingGradingCount,
      valueClass:
        data && data.pendingGradingCount > 0
          ? "text-amber-600 dark:text-amber-400"
          : undefined,
      iconColor:
        data && data.pendingGradingCount > 0
          ? STAT_COLORS.grading.pending
          : STAT_COLORS.grading.default,
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            {today} · Signed in as{" "}
            <span className="font-medium text-foreground">{email}</span>
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
            <RotateCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
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
                      className={`text-2xl font-bold tabular-nums tracking-tight ${stat.valueClass ?? "text-foreground"}`}
                    >
                      {stat.value ?? "—"}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {stat.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
                  </div>
                  <div
                    className={`flex size-11 items-center justify-center rounded-lg shrink-0 ${stat.iconColor}`}
                  >
                    <stat.icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* ── Quick Actions + My Classes — side-by-side grid ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ClipboardCheckIcon className="size-4" />
              </div>
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              size="sm"
              className="gap-2 justify-start"
              render={<Link to={PATHS.teacherCoursework} />}
            >
              <PlusIcon className="size-4 shrink-0" />
              New Coursework
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 justify-start"
              render={<Link to={PATHS.teacherCoursework} />}
            >
              <ClipboardCheckIcon className="size-4 shrink-0" />
              Review Submissions
            </Button>
          </CardContent>
        </Card>

        {/* My Classes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                <GraduationCapIcon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle>My Classes</CardTitle>
              </div>
              {!isLoadingAssignments && assignments && assignments.length > 0 && (
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {assignments.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingAssignments && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-36 rounded-full" />
                ))}
              </div>
            )}
            {!isLoadingAssignments && assignments?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No classes assigned yet — contact your administrator.
              </p>
            )}
            {!isLoadingAssignments && assignments && assignments.length > 0 && (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
                {assignments.map((a) => (
                  <Link
                    key={a.classSubjectId}
                    to={PATHS.teacherCoursework}
                    className="group flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span className="font-medium text-foreground">
                      {a.gradeLevelName}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{a.subjectName}</span>
                    <Badge variant="secondary">{a.subjectCode}</Badge>
                    <ArrowUpRightIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Announcements — full-width standalone row ─────────────────────── */}
      <AnnouncementFeedCard />

      {/* ── Recent Activity + Needs Grading ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TeacherRecentActivity items={data?.recentActivity} isLoading={isLoading} />
        <TeacherNeedsGradingCard />
      </div>
    </div>
  )
}
