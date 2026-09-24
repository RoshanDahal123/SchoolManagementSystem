import { Badge } from "@/components/atoms/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { AnnouncementFeedCard } from "@/features/announcements/components/announcement-feed-card"
import { TeacherNeedsGradingCard } from "@/features/coursework/components/teacher-needs-grading-card"
import { useGetTeacherAssignmentsQuery } from "@/features/teachers/teacher-api"
import { useAuth } from "@/hooks/use-auth"
import { PATHS } from "@/routes/paths"
import { ArrowUpRightIcon } from "lucide-react"
import { Link } from "react-router"

export default function TeacherDashboardPage() {
  const { email, teacherId } = useAuth()
  const { data: assignments, isLoading } = useGetTeacherAssignmentsQuery(teacherId ?? "", {
    skip: !teacherId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">{email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-36 rounded-full" />
              ))}
            </div>
          )}

          {!isLoading && assignments?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No classes assigned yet — contact your administrator.
            </p>
          )}

          {!isLoading && assignments && assignments.length > 0 && (
            <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto pr-1">
              {assignments.map((a) => (
                <Link
                  key={a.classSubjectId}
                  to={PATHS.teacherCoursework}
                  className="group flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <span className="font-medium text-foreground">{a.gradeLevelName}</span>
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

      <div className="grid gap-4 md:grid-cols-2">
        <TeacherNeedsGradingCard />
        <AnnouncementFeedCard />
      </div>
    </div>
  )
}