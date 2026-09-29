import { baseApi } from "@/app/base-api";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtUtc: string;
}

const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUnreadNotifications: builder.query<NotificationDto[], void>({
      query: () => ({ url: "/notifications/unread" }),
      providesTags: ["Notification"],
    }),

    markRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "POST" }),
      invalidatesTags: ["Notification"],
    }),

    markAllRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "POST" }),
      invalidatesTags: ["Notification"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUnreadNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} = notificationApi;
