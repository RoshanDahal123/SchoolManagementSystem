import { baseApi } from "../../app/base-api";
import type { CreateStudentRequest, InviteStudentRequest, StudentResponse } from "./@types";

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllStudents: builder.query<StudentResponse[], void>({
      query: () => ({ url: "/students", method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Student" as const, id })),
              { type: "Student", id: "LIST" },
            ]
          : [{ type: "Student", id: "LIST" }],
    }),

    getStudentById: builder.query<StudentResponse, string>({
      query: (id) => ({ url: `/students/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Student", id }],
    }),

    createStudent: builder.mutation<StudentResponse, CreateStudentRequest>({
      query: (body) => ({ url: "/students", method: "POST", data: body }),
      invalidatesTags: [{ type: "Student", id: "LIST" }],
    }),

    inviteStudent: builder.mutation<StudentResponse, InviteStudentRequest>({
      query: ({ id, email }) => ({
        url: `/students/${id}/invite`,
        method: "POST",
        data: { email },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),

    // New endpoint
    resendInvite: builder.mutation<void, string>({
      query: (id) => ({
        url: `/students/${id}/resend-invite`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useInviteStudentMutation,
  useResendInviteMutation,
} = studentsApi;