import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { useGetTeachingCourseworkQuery } from "@/features/coursework/coursework-api"
import { formatDateTime } from "@/helpers/date"
import { cn } from "@/lib/utils"
import { PATHS } from "@/routes/paths"
import { ArrowRightIcon, CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"

/**
 * Teacher-side analog of the student dashboard's "Due assignments" card. Deliberately
 * separate from UpcomingCourseworkCard — that one is wired to /coursework/mine (a
 * student's own submissions) and can't answer "what does this teacher need to grade."
 */
export function TeacherNeedsGradingCard() {
  const { data, isLoading } = useGetTeachingCourseworkQuery()

  const needsAttention = (data ?? [])
    .filter((c) => c.submittedCount > c.gradedCount || (c.isPastDue && c.submittedCount < c.totalStudents))
    .sort((a, b) => new Date(a.dueAtUtc).getTime() - new Date(b.dueAtUtc).getTime())

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>Needs grading</CardTitle>
        {needsAttention.length > 0 && <Badge variant="destructive">{needsAttention.length}</Badge>}
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!isLoading && needsAttention.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheckIcon className="size-4 text-chart-1" />
            Nothing waiting on you right now.
          </p>
        )}

        {needsAttention.slice(0, 5).map((item) => {
          const ungraded = item.submittedCount - item.gradedCount
          return (
            <Link
              key={item.id}
              to={PATHS.teacherCourseworkDetails(item.id)}
              className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0 hover:opacity-80"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.subjectName} · {item.gradeLevelName} · due {formatDateTime(item.dueAtUtc)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0",
                  ungraded > 0 ? "border-chart-3/40 text-chart-3" : "border-destructive/40 text-destructive"
                )}
              >
                {ungraded > 0 ? `${ungraded} to grade` : "awaiting submissions"}
              </Badge>
            </Link>
          )
        })}

        <Button variant="outline" size="sm" className="w-full" render={<Link to={PATHS.teacherCoursework} />}>
          View all coursework
          <ArrowRightIcon className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}