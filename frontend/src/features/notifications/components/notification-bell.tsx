
import { Button } from "@/components/atoms/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import {
  useGetUnreadNotificationsQuery,
  useMarkAllReadMutation,
  useMarkReadMutation,
  type NotificationDto,
} from "@/features/notifications/notification-api"
import { BellIcon } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import NotificationItem from "./notification-item"
import { useNotificationSignalR } from "../hooks/use-notification-signalr"

export function NotificationBell() {
  const { isAuthenticated } = useAuth()

  const {
    data: serverNotifications = [],
  } = useGetUnreadNotificationsQuery(undefined, {
    skip: !isAuthenticated,
  })

  const [liveNotifications, setLiveNotifications] =
    useState<NotificationDto[]>([])

  const [markRead] = useMarkReadMutation()
  const [markAllRead] = useMarkAllReadMutation()

  // Receive notifications from SignalR
  useNotificationSignalR({
    onNotification: (notification) => {
      setLiveNotifications((prev) => [
        notification,
        ...prev.filter((n) => n.id !== notification.id),
      ])
    },
  })

  // Merge live notifications with notifications
  // already stored on the server.
  const allNotifications = [
    ...liveNotifications.filter(
      (live) =>
        !serverNotifications.some(
          (server) => server.id === live.id,
        ),
    ),
    ...serverNotifications,
  ]

  const count = allNotifications.length

  const handleClick = async (
    notification: NotificationDto,
  ) => {
    await markRead(notification.id)

    setLiveNotifications((prev) =>
      prev.filter((n) => n.id !== notification.id),
    )
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setLiveNotifications([])
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <BellIcon className="size-5" />

            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}

            <span className="sr-only">
              Notifications
            </span>
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">
            Notifications
          </h3>

          {count > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {allNotifications.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up!
            </p>
          ) : (
            allNotifications.map(
              (notification: NotificationDto) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() =>
                    handleClick(notification)
                  }
                />
              ),
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

