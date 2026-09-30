import { baseApi } from "../../app/base-api";
import type {
  AcademicYearResponse,
  CreateAcademicYearRequest,
  UpdateAcademicYearRequest,
} from "./@types";

export const academicYearsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAcademicYears: builder.query<AcademicYearResponse[], void>({
      query: () => ({ url: "/academic-years", method: "GET" }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "AcademicYear" as const,
                id,
              })),
              { type: "AcademicYear", id: "LIST" },
            ]
          : [{ type: "AcademicYear", id: "LIST" }],
    }),

    getActiveAcademicYear: builder.query<AcademicYearResponse, void>({
      query: () => ({ url: "/academic-years/active", method: "GET" }),
      providesTags: [{ type: "AcademicYear", id: "ACTIVE" }],
    }),

    getAcademicYearById: builder.query<AcademicYearResponse, string>({
      query: (id) => ({ url: `/academic-years/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "AcademicYear", id }],
    }),

    createAcademicYear: builder.mutation<
      AcademicYearResponse,
      CreateAcademicYearRequest
    >({
      query: (body) => ({ url: "/academic-years", method: "POST", data: body }),
      invalidatesTags: [
        { type: "AcademicYear", id: "LIST" },
        { type: "AcademicYear", id: "ACTIVE" },

        { type: "Coursework", id: "MINE" },
        { type: "Coursework", id: "TEACHING" },

        "Dashboard",
      ],
    }),

    updateAcademicYear: builder.mutation<
      AcademicYearResponse,
      { id: string; data: UpdateAcademicYearRequest }
    >({
      query: ({ id, data }) => ({
        url: `/academic-years/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: [
        { type: "AcademicYear", id: "LIST" },
        { type: "AcademicYear", id: "ACTIVE" },

        { type: "Coursework", id: "MINE" },
        { type: "Coursework", id: "TEACHING" },

        "Dashboard",
      ],
    }),

    activateAcademicYear: builder.mutation<AcademicYearResponse, string>({
      query: (id) => ({
        url: `/academic-years/${id}/activate`,
        method: "POST",
      }),
      // Invalidate everything — the previously-active year changes too
      invalidatesTags: [
        { type: "AcademicYear", id: "LIST" },
        { type: "AcademicYear", id: "ACTIVE" },

        { type: "Coursework", id: "MINE" },
        { type: "Coursework", id: "TEACHING" },

        "Dashboard",
      ],
    }),

    deleteAcademicYear: builder.mutation<void, string>({
      query: (id) => ({ url: `/academic-years/${id}`, method: "DELETE" }),
      invalidatesTags: [
        { type: "AcademicYear", id: "LIST" },
        { type: "AcademicYear", id: "ACTIVE" },

        { type: "Coursework", id: "MINE" },
        { type: "Coursework", id: "TEACHING" },

        "Dashboard",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAcademicYearsQuery,
  useGetActiveAcademicYearQuery,
  useGetAcademicYearByIdQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
  useActivateAcademicYearMutation,
  useDeleteAcademicYearMutation,
} = academicYearsApi;
