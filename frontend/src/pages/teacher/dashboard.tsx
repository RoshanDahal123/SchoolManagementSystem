import { Badge } from "@/components/atoms/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { AnnouncementFeedCard } from "@/features/announcements/components/announcement-feed-card"
import { useGetTeacherAssignmentsQuery } from "@/features/teachers/teacher-api"
import { useAuth } from "@/hooks/use-auth"

export default function TeacherDashboardPage() {
  const { email, teacherId } = useAuth()
  const { data: assignments, isLoading } = useGetTeacherAssignmentsQuery(teacherId ?? "", {
    skip: !teacherId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-muted-foreground">{email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            )}

            {!isLoading && assignments?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No classes assigned yet — contact your administrator.
              </p>
            )}

            {assignments?.map((a) => (
              <div
                key={a.classSubjectId}
                className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {a.gradeLevelName} — {a.subjectName}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.academicYearName}</p>
                </div>
                <Badge variant="secondary">{a.subjectCode}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <AnnouncementFeedCard />
      </div>
    </div>
  )
}