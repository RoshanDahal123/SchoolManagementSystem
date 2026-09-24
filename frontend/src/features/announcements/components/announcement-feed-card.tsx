import { Badge } from "@/components/atoms/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { formatDistanceToNow } from "date-fns"
import { InboxIcon, MegaphoneIcon } from "lucide-react"
import { useGetAnnouncementFeedQuery } from "../announcement-api"

const TARGET_LABEL: Record<string, string> = {
  All: "Everyone",
  Teachers: "Teachers",
  Students: "Students",
}

export function AnnouncementFeedCard() {
  const { data, isLoading, isError } = useGetAnnouncementFeedQuery()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Recent updates from your school.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">Couldn't load announcements right now.</p>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <InboxIcon className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        )}

        {data?.slice(0, 5).map((item: any) => (
          <div key={item.id} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MegaphoneIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                <Badge variant="outline" className="shrink-0">
                  {TARGET_LABEL[item.targetRole] ?? item.targetRole}
                </Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{item.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.createdAtUtc), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}