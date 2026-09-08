import { baseApi } from "../../app/base-api";
import type {
  CreateStudentRequest,
  InviteStudentRequest,
  PaginatedStudents,
  StudentResponse,
  UpdateStudentRequest,
} from "./@types";

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<PaginatedStudents, { page: number; search?: string }>({
      query: ({ page, search }) => {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "10",
        });
        if (search?.trim()) {
          params.set("search", search.trim());
        }
        return {
          url: `/students?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Student" as const, id })),
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

    updateStudent: builder.mutation<StudentResponse, { id: string; data: UpdateStudentRequest }>({
      query: ({ id, data }) => ({
        url: `/students/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),

    deactivateStudent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/students/${id}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
    }),

    reactivateStudent: builder.mutation<void, string>({
      query: (id) => ({
        url: `/students/${id}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Student", id },
        { type: "Student", id: "LIST" },
      ],
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
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeactivateStudentMutation,
  useReactivateStudentMutation,
  useInviteStudentMutation,
  useResendInviteMutation,
} = studentsApi;
