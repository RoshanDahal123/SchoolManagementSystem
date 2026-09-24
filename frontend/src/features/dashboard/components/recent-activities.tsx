import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import type { RecentActivityItem } from "@/features/dashboard/@types"
import { formatDistanceToNow } from "date-fns"
import { Bell, InboxIcon, Megaphone } from "lucide-react"

interface RecentActivitiesProps {
  items?: RecentActivityItem[]
  isLoading?: boolean
}

export default function RecentActivities({ items, isLoading }: RecentActivitiesProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Real-time notices and administrative actions
            </CardDescription>
          </div>
          {items && items.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {items.length} {items.length === 1 ? "notice" : "notices"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="relative flex items-start gap-3">
                <Skeleton className="absolute -left-6 top-0.5 size-4 rounded-full ring-4 ring-background" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <InboxIcon className="size-7 text-muted-foreground" />
            <p className="text-sm font-medium">No recent activities</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Published announcements and school actions will appear in this timeline.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {items.map((item) => (
              <div key={item.id} className="relative flex items-start gap-3 group">
                <div className="absolute -left-6 top-0.5 flex size-4 items-center justify-center rounded-full bg-background ring-4 ring-background text-primary">
                  <span className="size-2 rounded-full bg-primary" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      <span className="font-semibold text-foreground">Admin</span>
                      <span className="text-muted-foreground font-normal mx-1">announced</span>
                      <span className="text-primary font-medium hover:underline cursor-pointer">
                        {item.title}
                      </span>
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.timeStamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
export { RecentActivities }
