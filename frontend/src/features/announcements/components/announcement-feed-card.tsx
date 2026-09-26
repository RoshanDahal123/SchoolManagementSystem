import { Badge } from "@/components/atoms/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { InboxIcon, MegaphoneIcon, UsersIcon, GraduationCapIcon, SchoolIcon } from "lucide-react"
import { useGetAnnouncementFeedQuery } from "../announcement-api"

const TARGET_LABEL: Record<string, string> = {
  All: "Everyone",
  Teachers: "Teachers",
  Students: "Students",
}

const TARGET_STYLE: Record<string, string> = {
  All: "border-chart-4/40 bg-chart-4/10 text-chart-4",
  Teachers: "border-chart-2/40 bg-chart-2/10 text-chart-2",
  Students: "border-chart-3/40 bg-chart-3/10 text-chart-3",
}

const TARGET_ICON: Record<string, typeof UsersIcon> = {
  All: SchoolIcon,
  Teachers: UsersIcon,
  Students: GraduationCapIcon,
}

export function AnnouncementFeedCard() {
  const { data, isLoading, isError } = useGetAnnouncementFeedQuery()

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <MegaphoneIcon className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base">Announcements</CardTitle>
            <CardDescription className="mt-0.5">
              Recent updates from your school
            </CardDescription>
          </div>
          {!isLoading && data && data.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto shrink-0 tabular-nums"
            >
              {data.length}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-0 pt-0">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <MegaphoneIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Couldn't load announcements right now.
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && data?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <InboxIcon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No announcements yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                School updates and notices will appear here.
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        {!isLoading && data && data.length > 0 && (
          <div className="space-y-2">
            {data.slice(0, 5).map((item: any) => {
              const AudienceIcon = TARGET_ICON[item.targetRole] ?? SchoolIcon
              const audienceStyle = TARGET_STYLE[item.targetRole] ?? TARGET_STYLE.All

              return (
                <div
                  key={item.id}
                  className="group flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                >
                  {/* Icon */}
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <MegaphoneIcon className="size-3.5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground truncate">
                        {item.title}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 gap-1 text-[10px] px-1.5 py-0.5",
                          audienceStyle
                        )}
                      >
                        <AudienceIcon className="size-2.5" />
                        {TARGET_LABEL[item.targetRole] ?? item.targetRole}
                      </Badge>
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {item.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAtUtc), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}