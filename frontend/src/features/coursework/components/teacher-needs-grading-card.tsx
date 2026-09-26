import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { useGetTeachingCourseworkQuery } from "@/features/coursework/coursework-api"
import { formatDateTime } from "@/helpers/date"
import { cn } from "@/lib/utils"
import { PATHS } from "@/routes/paths"
import {
  ArrowRightIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  ClockIcon,
  InboxIcon,
} from "lucide-react"
import { Link } from "react-router"

/**
 * Teacher-side analog of the student dashboard's "Due assignments" card. Deliberately
 * separate from UpcomingCourseworkCard — that one is wired to /coursework/mine (a
 * student's own submissions) and can't answer "what does this teacher need to grade."
 */
export function TeacherNeedsGradingCard() {
  const { data, isLoading } = useGetTeachingCourseworkQuery()

  const needsAttention = (data ?? [])
    .filter(
      (c) =>
        c.submittedCount > c.gradedCount ||
        (c.isPastDue && c.submittedCount < c.totalStudents)
    )
    .sort((a, b) => new Date(a.dueAtUtc).getTime() - new Date(b.dueAtUtc).getTime())

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClipboardListIcon className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Needs Grading</CardTitle>
              <CardDescription className="mt-0.5">
                Submissions awaiting your review
              </CardDescription>
            </div>
          </div>
          {!isLoading && needsAttention.length > 0 && (
            <Badge
              variant="destructive"
              className="shrink-0 tabular-nums"
            >
              {needsAttention.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* All caught up */}
        {!isLoading && needsAttention.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-chart-1/10">
              <CircleCheckIcon className="size-5 text-chart-1" />
            </div>
            <div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No submissions are waiting for your review.
              </p>
            </div>
          </div>
        )}

        {/* Items list */}
        {!isLoading && needsAttention.length > 0 && (
          <div className="flex-1 space-y-2">
            {needsAttention.slice(0, 5).map((item) => {
              const ungraded = item.submittedCount - item.gradedCount
              const isUngraded = ungraded > 0

              return (
                <Link
                  key={item.id}
                  to={PATHS.teacherCourseworkDetails(item.id)}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg border p-3",
                    "transition-colors hover:bg-muted/50",
                    isUngraded
                      ? "border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                      : "border-destructive/20 bg-destructive/5 dark:bg-destructive/10"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">
                        {item.subjectName} · {item.gradeLevelName}
                      </span>
                      <span className="shrink-0">·</span>
                      <ClockIcon className="size-3 shrink-0" />
                      <span className="shrink-0 whitespace-nowrap">
                        {formatDateTime(item.dueAtUtc)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 whitespace-nowrap text-xs",
                      isUngraded
                        ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-400"
                        : "border-destructive/40 bg-destructive/5 text-destructive dark:bg-destructive/10"
                    )}
                  >
                    {isUngraded ? `${ungraded} to grade` : "awaiting submissions"}
                  </Badge>
                </Link>
              )
            })}

            {needsAttention.length > 5 && (
              <div className="flex items-center gap-1.5 px-1 py-0.5">
                <InboxIcon className="size-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  +{needsAttention.length - 5} more item
                  {needsAttention.length - 5 !== 1 ? "s" : ""} not shown
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="mt-auto w-full gap-1.5"
          render={<Link to={PATHS.teacherCoursework} />}
        >
          View all coursework
          <ArrowRightIcon className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}