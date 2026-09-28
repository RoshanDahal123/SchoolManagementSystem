import type { NotificationDto } from "@/features/notifications/notification-api"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface NotificationItemProps {
  notification: NotificationDto
  onClick: () => void
}


export default function NotificationItem({ notification, onClick }: NotificationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full border-b px-4 py-3 text-left text-sm transition-colors last:border-0",
        "hover:bg-muted/50",
        !notification.isRead && "bg-muted/20"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Unread dot */}
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            !notification.isRead ? "bg-primary" : "bg-transparent"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight truncate">{notification.title}</p>
          <p className="mt-0.5 text-muted-foreground text-xs leading-snug line-clamp-2">
            {notification.message}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">
            {formatDistanceToNow(new Date(notification.createdAtUtc), { addSuffix: true })}
          </p>
        </div>
      </div>
    </button>
  )
}