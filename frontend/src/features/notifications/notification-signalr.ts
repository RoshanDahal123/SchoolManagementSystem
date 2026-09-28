import * as signalR from "@microsoft/signalr"
import type { NotificationDto } from "./notification-api"

const getHubUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string

  return `${baseUrl.replace(/\/api$/, "")}/hubs/notifications`
}

export function createNotificationConnection(
  onNotification: (notification: NotificationDto) => void,
) {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(), {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build()

  connection.on("ReceiveNotification", onNotification)

  return connection
}