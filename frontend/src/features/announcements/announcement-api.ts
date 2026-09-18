import { baseApi } from "../../app/base-api";
import type {
  AnnouncementResponse,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "./@types";

export const announcementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<AnnouncementResponse[], void>({
      query: () => ({ url: "/announcements", method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Announcement" as const, id })),
              { type: "Announcement", id: "LIST" },
            ]
          : [{ type: "Announcement", id: "LIST" }],
    }),

    createAnnouncement: builder.mutation<AnnouncementResponse, CreateAnnouncementRequest>({
      query: (body) => ({ url: "/announcements", method: "POST", data: body }),
      invalidatesTags: [{ type: "Announcement", id: "LIST" }, "Dashboard"],
    }),

    updateAnnouncement: builder.mutation<AnnouncementResponse, { id: string; data: UpdateAnnouncementRequest }>({
      query: ({ id, data }) => ({ url: `/announcements/${id}`, method: "PUT", data }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Announcement", id },
        { type: "Announcement", id: "LIST" },
        "Dashboard",
      ],
    }),

    deleteAnnouncement: builder.mutation<void, string>({
      query: (id) => ({ url: `/announcements/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Announcement", id },
        { type: "Announcement", id: "LIST" },
        "Dashboard",
      ],
    }),

    getAnnouncementFeed:builder.query<AnnouncementResponse[],void>({
      query:()=>({
        url:"/announcements/feed", method:"GET"
      }),
      providesTags:[{type:"Announcement",id:"FEED"}]
    })
  }),
  overrideExisting: false,
});

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementFeedQuery
} = announcementsApi;