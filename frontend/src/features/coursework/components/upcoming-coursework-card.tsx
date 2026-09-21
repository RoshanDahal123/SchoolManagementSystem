import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { formatDateTime } from "@/helpers/date"
import { PATHS } from "@/routes/paths"
import { ArrowRightIcon, CircleCheckIcon } from "lucide-react"
import { Link } from "react-router"
import { useGetMyCourseworkQuery } from "../coursework-api"
import { CourseworkStatusBadge } from "./coursework-status-badge"

/**
 * The dashboard's "what do I owe" card. Deliberately shows only outstanding work, capped at
 * five — the full list, filters and submission flow live on the coursework page.
 */
export function UpcomingCourseworkCard() {
  const { data, isLoading } = useGetMyCourseworkQuery()

  const outstanding = (data ?? [])
    .filter((item) => item.status === "Pending" || item.status === "Overdue")
    .sort((a, b) => new Date(a.coursework.dueAtUtc).getTime() - new Date(b.coursework.dueAtUtc).getTime())

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>Due assignments</CardTitle>
        {outstanding.length > 0 && <Badge variant="destructive">{outstanding.length}</Badge>}
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!isLoading && outstanding.length === 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheckIcon className="size-4 text-green-600" />
            You're all caught up — nothing is waiting to be handed in.
          </p>
        )}

        {outstanding.slice(0, 5).map((item) => (
          <div
            key={item.coursework.id}
            className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.coursework.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.coursework.subjectName} · due {formatDateTime(item.coursework.dueAtUtc)}
              </p>
            </div>
            <CourseworkStatusBadge status={item.status} className="shrink-0" />
          </div>
        ))}

        <Button variant="outline" size="sm" className="w-full" render={<Link to={PATHS.studentCoursework} />}>
          View all coursework
          <ArrowRightIcon className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
