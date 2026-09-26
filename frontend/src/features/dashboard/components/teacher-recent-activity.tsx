import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import type { TeacherActivityItem, TeacherActivityType } from "@/features/dashboard/@types"
import { cn } from "@/lib/utils"
import { PATHS } from "@/routes/paths"
import { formatDistanceToNow } from "date-fns"
import {
  BellIcon,
  CalendarCheckIcon,
  FilePlus2Icon,
  InboxIcon,
  MegaphoneIcon,
  SendIcon,
} from "lucide-react"
import { Link } from "react-router"

interface TeacherRecentActivityProps {
  items?: TeacherActivityItem[]
  isLoading?: boolean
}

const ICON_BY_TYPE: Record<TeacherActivityType, typeof BellIcon> = {
  CourseworkCreated: FilePlus2Icon,
  SubmissionReceived: SendIcon,
  AttendanceMarked: CalendarCheckIcon,
  Announcement: MegaphoneIcon,
}

const COLOR_BY_TYPE: Record<TeacherActivityType, string> = {
  CourseworkCreated: "bg-primary/10 text-primary",
  SubmissionReceived: "bg-chart-3/10 text-chart-3",
  AttendanceMarked: "bg-chart-1/10 text-chart-1",
  Announcement: "bg-muted text-muted-foreground",
}

// Only these two types have a real destination — an activity item is only ever
// clickable when it can actually take the teacher somewhere.
function linkFor(item: TeacherActivityItem): string | null {
  if (!item.referenceId) return null
  if (item.type === "CourseworkCreated" || item.type === "SubmissionReceived") {
    return PATHS.teacherCourseworkDetails(item.referenceId)
  }
  return null
}

export default function TeacherRecentActivity({ items, isLoading }: TeacherRecentActivityProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellIcon className="size-4 text-primary" />
          Recent Activity
        </CardTitle>
        <CardDescription>Coursework, submissions, attendance, and announcements</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <InboxIcon className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Coursework, submissions, attendance, and announcements will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => {
              const Icon = ICON_BY_TYPE[item.type] ?? BellIcon
              const color = COLOR_BY_TYPE[item.type] ?? "bg-muted text-muted-foreground"
              const to = linkFor(item)
              const body = (
                <>
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      color
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(item.timeStamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </>
              )

              return to ? (
                <Link
                  key={index}
                  to={to}
                  className="flex items-start gap-3 -mx-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted/60"
                >
                  {body}
                </Link>
              ) : (
                <div key={index} className="flex items-start gap-3 px-2 py-1">
                  {body}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export { TeacherRecentActivity }