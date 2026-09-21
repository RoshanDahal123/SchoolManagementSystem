import { baseApi } from "@/app/base-api";
import type {
  CourseworkResponse,
  CreateCourseworkInput,
  GradeSubmissionInput,
  ProgressReport,
  StudentCoursework,
  SubmissionBoardResponse,
  SubmissionResponse,
  SubmitCourseworkInput,
  UpdateCourseworkInput,
} from "./@types"

/**
 * Stable ids for the two uploads in this feature. Passing them as `uploadId` is what switches
 * on the progress interceptor in lib/axios.ts; the dialogs read the same id back through
 * useUploadProgress. Submissions are keyed per coursework so two open dialogs can't share a bar.
 */

export const UPLOAD_IDS = {
  createCoursework: "coursework:create",
  addAttachments: (courseworkId: string) => `coursework:attachments:${courseworkId}`,
  submitCoursework: (courseworkId: string) => `coursework:submit:${courseworkId}`,
} as const

function toCourseWorkFormData(input:CreateCourseworkInput ): FormData 
    {
        const formData= new FormData();
        formData.append("ClassSubjectId", input.classSubjectId)
  formData.append("Title", input.title)
  if (input.instructions) formData.append("Instructions", input.instructions)
  formData.append("DueAtUtc", input.dueAtUtc)
  formData.append("MaxMarks", String(input.maxMarks))
  formData.append("AllowLateSubmission", String(input.allowLateSubmission))

  // Repeating the same key is how ASP.NET Core binds List<IFormFile>.
  input.files.forEach((file) => formData.append("Files", file))
  return formData
    }

 export const courseworkApi = baseApi.injectEndpoints({
      endpoints:(builder)=>({

    //techer endpoints
    getTeachingCoursework: builder.query<
      CourseworkResponse[],
      { classSubjectId?: string; gradeLevelId?: string; academicYearId?: string } | void
    >({
      query: (filters) => ({
        url: "/coursework/teaching",
        method: "GET",
        params: filters ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Coursework" as const, id })),
              { type: "Coursework", id: "TEACHING" },
            ]
          : [{ type: "Coursework", id: "TEACHING" }],
    }),
    getCourseworkById: builder.query<CourseworkResponse, string>({
      query: (id) => ({ url: `/coursework/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Coursework", id }],
    }),
    createCoursework:builder.mutation<CourseworkResponse,CreateCourseworkInput>({
      query:(input)=>({
        url:"/coursework",
        method:"POST",
        body:toCourseWorkFormData(input),
        uploadId:UPLOAD_IDS.createCoursework,
      }),
      invalidatesTags: [
        { type: "Coursework", id: "TEACHING" },
        { type: "Coursework", id: "MINE" },
      ],
    }),
    updateCoursework: builder.mutation<
      CourseworkResponse,
      { id: string; data: UpdateCourseworkInput }
    >({
      query: ({ id, data }) => ({ url: `/coursework/${id}`, method: "PUT", data }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Coursework", id },
        { type: "Coursework", id: "TEACHING" },
        { type: "Coursework", id: "MINE" },
      ],
    }),

    deleteCoursework: builder.mutation<void, string>({
      query: (id) => ({ url: `/coursework/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Coursework", id },
        { type: "Coursework", id: "TEACHING" },
        { type: "Coursework", id: "MINE" },
      ],
    }),
 addCourseworkAttachments: builder.mutation<unknown, { courseworkId: string; files: File[] }>({
      query: ({ courseworkId, files }) => {
        const formData = new FormData()
        files.forEach((file) => formData.append("Files", file))
        return {
          url: `/coursework/${courseworkId}/attachments`,
          method: "POST",
          data: formData,
          uploadId: UPLOAD_IDS.addAttachments(courseworkId),
        }
      },
      invalidatesTags: (_r, _e, { courseworkId }) => [
        { type: "Coursework", id: courseworkId },
        { type: "Coursework", id: "TEACHING" },
      ],
    }),

    removeCourseworkAttachment:builder.mutation<void,{
      courseworkId:string
      attachmentId:string
    }>({
      query:({courseworkId,attachmentId})=>({
        url:`/coursework/${courseworkId}/attachments/${attachmentId}`,
        method:"DELETE"
      }),
      invalidatesTags:(_r,_e,{courseworkId})=>[
        {type:"Coursework",id:courseworkId},
        {type:"Coursework",id:"TEACHING"}
      ]
    }),
    getSubmissionBoard: builder.query<SubmissionBoardResponse, string>({
      query: (courseworkId) => ({
        url: `/coursework/${courseworkId}/submissions`,
        method: "GET",
      }),
      providesTags: (_r, _e, courseworkId) => [
        { type: "CourseworkSubmission", id: courseworkId },
      ],
    }),
gradeSubmission: builder.mutation<SubmissionResponse, GradeSubmissionInput>({
      query: ({ submissionId, marks, feedback }) => ({
        url: `/coursework/submissions/${submissionId}/grade`,
        method: "POST",
        data: { marks, feedback },
      }),
      // courseworkId isn't in the URL — it's carried in the argument purely so the right
      // marking board and the student's progress report both refresh afterwards.
      invalidatesTags: (_r, _e, { courseworkId }) => [
        { type: "CourseworkSubmission", id: courseworkId },
        { type: "Coursework", id: courseworkId },
        { type: "Coursework", id: "TEACHING" },
        { type: "ProgressReport", id: "LIST" },
      ],
    }),

    //student endpoints
    getMyCoursework: builder.query<StudentCoursework[], { academicYearId?: string } | void>({
      query: (filters) => ({
        url: "/coursework/mine",
        method: "GET",
        params: filters ?? undefined,
      }),
      providesTags: [{ type: "Coursework", id: "MINE" }],
    }),

    submitCoursework: builder.mutation<SubmissionResponse, SubmitCourseworkInput>({
      query: ({ courseworkId, note, files }) => {
        const formData = new FormData()
        if (note) formData.append("Note", note)
        files.forEach((file) => formData.append("Files", file))

        return {
          url: `/coursework/${courseworkId}/submissions`,
          method: "POST",
          data: formData,
          uploadId: UPLOAD_IDS.submitCoursework(courseworkId),
        }
      },
      invalidatesTags: (_r, _e, { courseworkId }) => [
        { type: "Coursework", id: "MINE" },
        { type: "CourseworkSubmission", id: courseworkId },
        { type: "ProgressReport", id: "LIST" },
      ],
    }),
    getProgressReport: builder.query<
      ProgressReport,
      { studentId: string; academicYearId?: string }
    >({
      query: ({ studentId, academicYearId }) => ({
        url: `/coursework/progress-report/${studentId}`,
        method: "GET",
        params: academicYearId ? { academicYearId } : undefined,
      }),
      providesTags: (_r, _e, { studentId }) => [
        { type: "ProgressReport", id: studentId },
        { type: "ProgressReport", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
})


export const {
useGetTeachingCourseworkQuery,
  useGetCourseworkByIdQuery,
  useCreateCourseworkMutation,
  useUpdateCourseworkMutation,
  useDeleteCourseworkMutation,
  useAddCourseworkAttachmentsMutation,
  useRemoveCourseworkAttachmentMutation,
  useGetSubmissionBoardQuery,
  useGradeSubmissionMutation,
  useGetMyCourseworkQuery,
  useSubmitCourseworkMutation,
  useGetProgressReportQuery,
}= courseworkApi;