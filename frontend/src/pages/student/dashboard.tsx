import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { AnnouncementFeedCard } from "@/features/announcements/components/announcement-feed-card"
import { useGetStudentAttendanceSummaryQuery } from "@/features/attendance/attendance-api"
import { useAuth } from "@/hooks/use-auth"

export default function StudentDashboardPage() {
  const { email, studentId } = useAuth()
  const { data: summary, isLoading } = useGetStudentAttendanceSummaryQuery(
    { studentId: studentId ?? "" },
    { skip: !studentId }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground">{email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-16 w-full" />}

            {summary && (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {summary.attendancePercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of {summary.totalMarkedDays} marked days
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <p className="font-medium text-green-600">{summary.presentCount}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">{summary.absentCount}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-600">{summary.lateCount}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                  <div>
                    <p className="font-medium text-blue-600">{summary.excusedCount}</p>
                    <p className="text-xs text-muted-foreground">Excused</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AnnouncementFeedCard />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Due Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon — once Coursework is wired up, your pending assignments will show here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}