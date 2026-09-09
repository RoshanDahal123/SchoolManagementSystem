import { baseApi } from "@/app/base-api";
import type { ChangeEnrollmentStatusRequest, EnrollStudentRequest, StudentEnrollmentResponse, TransferStudentRequest } from "./@types";



export const enrollmentApi= baseApi.injectEndpoints({
    endpoints:(builder)=>({
        getEnrollmentHistory: builder.query<StudentEnrollmentResponse[], string>({
      query: (studentId) => ({ url: `/students/${studentId}/enrollments`, method: "GET" }),
      providesTags: (_r, _e, studentId) => [{ type: "StudentEnrollment", id: studentId }],
    }),
     enrollStudent: builder.mutation<
      StudentEnrollmentResponse,
      { studentId: string; data: EnrollStudentRequest }
    >({
      query: ({ studentId, data }) => ({
        url: `/students/${studentId}/enrollments`,
        method: "POST",
        data,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [{ type: "StudentEnrollment", id: studentId }],
    }),

        transferStudent: builder.mutation<
      StudentEnrollmentResponse,
      { enrollmentId: string; studentId: string; data: TransferStudentRequest }
    >({
      query: ({ enrollmentId, data }) => ({
        url: `/enrollments/${enrollmentId}/transfer`,
        method: "POST",
        data,
      }),
      // studentId isn't used in the URL — it's only here so we know which
      // student's cached history to invalidate after the transfer.
      invalidatesTags: (_r, _e, { studentId }) => [{ type: "StudentEnrollment", id: studentId }],
    }),
changeEnrollmentStatus: builder.mutation
      <StudentEnrollmentResponse,
      { enrollmentId: string; studentId: string; data: ChangeEnrollmentStatusRequest }
    >({
      query: ({ enrollmentId, data }) => ({
        url: `/enrollments/${enrollmentId}/status`,
        method: "PATCH",
        data,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [{ type: "StudentEnrollment", id: studentId }],
    }),
 getSectionRoster: builder.query<StudentEnrollmentResponse[],{sectionId:string,academicYearId:string}>({
      query: ({sectionId,academicYearId}) => ({
        url: `/sections/${sectionId}/academic-years/${academicYearId}/enrollments`,
        method: "GET",

    }),
    providesTags:(_r,_e,{sectionId,academicYearId}) => [{ type: "StudentEnrollment", id: `${sectionId}-${academicYearId}` }]
}),
    }),
    overrideExisting: false,
});

export const {
    useGetEnrollmentHistoryQuery,
    useEnrollStudentMutation,
    useTransferStudentMutation,
    useChangeEnrollmentStatusMutation,
    useGetSectionRosterQuery
}= enrollmentApi;