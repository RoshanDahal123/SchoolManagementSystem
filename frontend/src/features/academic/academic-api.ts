import { baseApi } from "../../app/base-api"
import type {
  AssignSubjectRequest,
  AssignTeacherRequest,
  ClassSubjectResponse,
  CreateGradeLevelRequest,
  CreateSectionRequest,
  CreateSubjectRequest,
  GradeLevelResponse,
  SectionResponse,
  SubjectResponse,
  UpdateGradeLevelRequest,
  UpdateSectionRequest,
  UpdateSubjectRequest,
} from "./@types"

export const academicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Grade Levels ───────────────────────────────────────────────────────────
    getGradeLevels: builder.query<GradeLevelResponse[], void>({
      query: () => ({ url: "/grade-levels", method: "GET" }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "GradeLevel" as const, id })), { type: "GradeLevel", id: "LIST" }]
          : [{ type: "GradeLevel", id: "LIST" }],
    }),

    getGradeLevelById: builder.query<GradeLevelResponse, string>({
      query: (id) => ({ url: `/grade-levels/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "GradeLevel", id }],
    }),

    createGradeLevel: builder.mutation<GradeLevelResponse, CreateGradeLevelRequest>({
      query: (body) => ({ url: "/grade-levels", method: "POST", data: body }),
      invalidatesTags: [{ type: "GradeLevel", id: "LIST" }],
    }),

    updateGradeLevel: builder.mutation<GradeLevelResponse, { id: string; data: UpdateGradeLevelRequest }>({
      query: ({ id, data }) => ({ url: `/grade-levels/${id}`, method: "PUT", data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "GradeLevel", id }, { type: "GradeLevel", id: "LIST" }],
    }),

    deleteGradeLevel: builder.mutation<void, string>({
      query: (id) => ({ url: `/grade-levels/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [{ type: "GradeLevel", id }, { type: "GradeLevel", id: "LIST" }],
    }),

    // ── Sections ───────────────────────────────────────────────────────────────
    getSections: builder.query<SectionResponse[], string>({
      query: (gradeLevelId) => ({ url: `/grade-levels/${gradeLevelId}/sections`, method: "GET" }),
      providesTags: (_r, _e, gradeLevelId) => [{ type: "Section", id: gradeLevelId }],
    }),

    createSection: builder.mutation<SectionResponse, { gradeLevelId: string; data: CreateSectionRequest }>({
      query: ({ gradeLevelId, data }) => ({ url: `/grade-levels/${gradeLevelId}/sections`, method: "POST", data }),
      invalidatesTags: (_r, _e, { gradeLevelId }) => [
        { type: "Section", id: gradeLevelId },
        { type: "GradeLevel", id: gradeLevelId },
        { type: "GradeLevel", id: "LIST" },
      ],
    }),

    updateSection: builder.mutation<SectionResponse, { gradeLevelId: string; sectionId: string; data: UpdateSectionRequest }>({
      query: ({ gradeLevelId, sectionId, data }) => ({
        url: `/grade-levels/${gradeLevelId}/sections/${sectionId}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: (_r, _e, { gradeLevelId }) => [
        { type: "Section", id: gradeLevelId },
        { type: "GradeLevel", id: gradeLevelId },
        { type: "GradeLevel", id: "LIST" },
      ],
    }),

    deleteSection: builder.mutation<void, { gradeLevelId: string; sectionId: string }>({
      query: ({ gradeLevelId, sectionId }) => ({
        url: `/grade-levels/${gradeLevelId}/sections/${sectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { gradeLevelId }) => [
        { type: "Section", id: gradeLevelId },
        { type: "GradeLevel", id: gradeLevelId },
        { type: "GradeLevel", id: "LIST" },
      ],
    }),

    // ── Subjects ───────────────────────────────────────────────────────────────
    getSubjects: builder.query<SubjectResponse[], void>({
      query: () => ({ url: "/subjects", method: "GET" }),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: "Subject" as const, id })), { type: "Subject", id: "LIST" }]
          : [{ type: "Subject", id: "LIST" }],
    }),

    createSubject: builder.mutation<SubjectResponse, CreateSubjectRequest>({
      query: (body) => ({ url: "/subjects", method: "POST", data: body }),
      invalidatesTags: [{ type: "Subject", id: "LIST" }],
    }),

    updateSubject: builder.mutation<SubjectResponse, { id: string; data: UpdateSubjectRequest }>({
      query: ({ id, data }) => ({ url: `/subjects/${id}`, method: "PUT", data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Subject", id }, { type: "Subject", id: "LIST" }],
    }),

    deactivateSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}/deactivate`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Subject", id }, { type: "Subject", id: "LIST" }],
    }),

    reactivateSubject: builder.mutation<void, string>({
      query: (id) => ({ url: `/subjects/${id}/reactivate`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => [{ type: "Subject", id }, { type: "Subject", id: "LIST" }],
    }),

    // ── Class Subjects (curriculum) ────────────────────────────────────────────
    getClassSubjects: builder.query<ClassSubjectResponse[], { gradeLevelId: string; yearId: string }>({
      query: ({ gradeLevelId, yearId }) => ({
        url: `/grade-levels/${gradeLevelId}/academic-years/${yearId}/subjects`,
        method: "GET",
      }),
      providesTags: (_r, _e, { gradeLevelId, yearId }) => [
        { type: "ClassSubject", id: `${gradeLevelId}-${yearId}` },
      ],
    }),

    assignSubject: builder.mutation<ClassSubjectResponse, { gradeLevelId: string; yearId: string; data: AssignSubjectRequest }>({
      query: ({ gradeLevelId, yearId, data }) => ({
        url: `/grade-levels/${gradeLevelId}/academic-years/${yearId}/subjects`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_r, _e, { gradeLevelId, yearId }) => [
        { type: "ClassSubject", id: `${gradeLevelId}-${yearId}` },
      ],
    }),

    removeClassSubject: builder.mutation<void, { classSubjectId: string; gradeLevelId: string; yearId: string }>({
      query: ({ classSubjectId }) => ({ url: `/class-subjects/${classSubjectId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { gradeLevelId, yearId }) => [
        { type: "ClassSubject", id: `${gradeLevelId}-${yearId}` },
      ],
    }),

    assignTeacher: builder.mutation<ClassSubjectResponse, { classSubjectId: string; gradeLevelId: string; yearId: string; data: AssignTeacherRequest }>({
      query: ({ classSubjectId, data }) => ({
        url: `/class-subjects/${classSubjectId}/teacher`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_r, _e, { gradeLevelId, yearId }) => [
        { type: "ClassSubject", id: `${gradeLevelId}-${yearId}` },
      ],
    }),

    removeTeacher: builder.mutation<void, { classSubjectId: string; gradeLevelId: string; yearId: string }>({
      query: ({ classSubjectId }) => ({ url: `/class-subjects/${classSubjectId}/teacher`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { gradeLevelId, yearId }) => [
        { type: "ClassSubject", id: `${gradeLevelId}-${yearId}` },
      ],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetGradeLevelsQuery,
  useGetGradeLevelByIdQuery,
  useCreateGradeLevelMutation,
  useUpdateGradeLevelMutation,
  useDeleteGradeLevelMutation,
  useGetSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useGetSubjectsQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeactivateSubjectMutation,
  useReactivateSubjectMutation,
  useGetClassSubjectsQuery,
  useAssignSubjectMutation,
  useRemoveClassSubjectMutation,
  useAssignTeacherMutation,
  useRemoveTeacherMutation,
} = academicApi
