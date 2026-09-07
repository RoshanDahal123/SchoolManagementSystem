import { baseApi } from "../../app/base-api"
import type { CreateTeacherRequest, InviteTeacherRequest, TeacherResponse } from "./@types"

export const teachersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTeachers: builder.query<TeacherResponse[], void>({
      query: () => ({ url: "/teachers", method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Teacher" as const, id })),
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

    inviteTeacher: builder.mutation<void, InviteTeacherRequest>({
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
  useGetAllTeachersQuery,
  useGetTeacherByIdQuery,
  useCreateTeacherMutation,
  useInviteTeacherMutation,
  useResendTeacherInviteMutation,
} = teachersApi
