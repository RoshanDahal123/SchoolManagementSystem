import { Badge } from "@/components/atoms/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
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
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-muted-foreground">Couldn't load announcements right now.</p>
        )}

        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        )}

        {data?.slice(0, 5).map((item:any) => (
          <div key={item.id} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.title}</p>
              <Badge variant="outline">{TARGET_LABEL[item.targetRole] ?? item.targetRole}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(item.createdAtUtc).toLocaleDateString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}