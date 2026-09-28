import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { baseApi } from "@/app/base-api"
import { store } from "@/app/store"
import { createNotificationConnection } from "../notification-signalr"
import type { NotificationDto } from "../notification-api"

interface UseNotificationSignalROptions {
  onNotification: (notification: NotificationDto) => void
}

export function useNotificationSignalR({
  onNotification,
}: UseNotificationSignalROptions) {
  const { isAuthenticated } = useAuth()
  const callbackRef = useRef(onNotification)

  callbackRef.current = onNotification

  useEffect(() => {
    if (!isAuthenticated) return

    const connection = createNotificationConnection(
      (notification: NotificationDto) => {
        callbackRef.current(notification)

        store.dispatch(
          baseApi.util.invalidateTags(["Notification"]),
        )
      },
    )

    connection
      .start()
      .catch((error) => {
        console.error(
          "Failed to connect to notification hub:",
          error,
        )
      })

    return () => {
      connection.stop()
    }
  }, [isAuthenticated])
}