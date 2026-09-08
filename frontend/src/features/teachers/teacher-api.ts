import { baseApi } from "../../app/base-api"
import type {
  CreateTeacherRequest,
  InviteTeacherRequest,
  PaginatedTeachers,
  TeacherResponse,
  UpdateTeacherRequest,
} from "./@types"

export const teachersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query<PaginatedTeachers, { page: number; search?: string }>({
      query: ({ page, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "10",
        })
        if (search?.trim()) {
          params.set("search", search.trim())
        }
        return {
          url: `/teachers?${params.toString()}`,
          method: "GET",
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Teacher" as const, id })),
              { type: "Teacher", id: "LIST" },
            ]
          : [{ type: "Teacher", id: "LIST" }],
    }),

    getTeacherById: builder.query<TeacherResponse, string>({
      query: (id) => ({ url: `/teachers/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Teacher", id }],
    }),

    createTeacher: builder.mutation<TeacherResponse, CreateTeacherRequest>({
      query: (body) => ({ url: "/teachers", method: "POST", data: body }),
      invalidatesTags: [{ type: "Teacher", id: "LIST" }],
    }),

    updateTeacher: builder.mutation<TeacherResponse, { id: string; data: UpdateTeacherRequest }>({
      query: ({ id, data }) => ({
        url: `/teachers/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    deactivateTeacher: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teachers/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    reactivateTeacher: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teachers/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    inviteTeacher: builder.mutation<TeacherResponse, InviteTeacherRequest>({
      query: ({ id, email }) => ({
        url: `/teachers/${id}/invite`,
        method: "POST",
        data: { email },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "LIST" },
      ],
    }),

    resendTeacherInvite: builder.mutation<void, string>({
      query: (id) => ({
        url: `/teachers/${id}/resend-invite`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Teacher", id },
        { type: "Teacher", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeactivateTeacherMutation,
  useReactivateTeacherMutation,
  useInviteTeacherMutation,
  useResendTeacherInviteMutation,
} = teachersApi
