export type CourseworkStatus = "Pending" | "Submitted" | "Graded" | "Overdue"

export type SubmissionStatus = "Submitted" | "Graded"

export interface Attachment{
id: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  uploadedAtUtc: string
  /** Server-relative, e.g. "/api/coursework/attachments/{id}/download". */
  downloadUrl: string
}

export interface CourseworkResponse{
 id: string
  classSubjectId: string
  gradeLevelId: string
  gradeLevelName: string
  subjectId: string
  subjectName: string
  subjectCode: string
  academicYearId: string
  academicYearName: string
  teacherId: string
  teacherName: string
  title: string
  instructions: string | null
  dueAtUtc: string
  maxMarks: number
  allowLateSubmission: boolean
  isPastDue: boolean
  createdAtUtc: string
  updatedAtUtc: string | null
  totalStudents: number
  submittedCount: number
  gradedCount: number
  attachments: Attachment[]
}

export interface SubmissionResponse{
id: string
  courseworkId: string
  studentId: string
  studentName: string
  enrollmentNumber: string
  note: string | null
  submittedAtUtc: string
  isLate: boolean
  status: SubmissionStatus
  marks: number | null
  maxMarks: number
  feedback: string | null
  gradedAtUtc: string | null
  attachments: Attachment[]
}

export interface SubmissionBoardEntry{
 studentId: string
  studentName: string
  enrollmentNumber: string
  sectionId: string
  sectionName: string
  status: CourseworkStatus
  submission: SubmissionResponse | null
}

export interface SubmissionBoardResponse{
    coursework:CourseworkResponse
    entries:SubmissionBoardEntry[]
}

export interface StudentCoursework{
    coursework:CourseworkResponse
    status:CourseworkStatus
    canSubmit:boolean
    mySubmissin?: SubmissionResponse | null
}
export interface SubjectProgressSummary {
  subjectId: string
  subjectName: string
  subjectCode: string
  gradedCount: number
  obtainedMarks: number
  totalMarks: number
  percentage: number
}
export interface ProgressReportItem {
  courseworkId: string
  title: string
  subjectId: string
  subjectName: string
  teacherName: string
  dueAtUtc: string
  submittedAtUtc: string | null
  status: CourseworkStatus
  marks: number | null
  maxMarks: number
  feedback: string | null
}
export interface ProgressReport {
  studentId: string
  studentName: string
  enrollmentNumber: string
  academicYearId: string | null
  academicYearName: string | null
  totalCoursework: number
  submittedCount: number
  gradedCount: number
  pendingCount: number
  overdueCount: number
  obtainedMarks: number
  totalMarks: number
  overallPercentage: number
  subjects: SubjectProgressSummary[]
  items: ProgressReportItem[]
}

// ─── Requests ──
export interface CreateCourseworkInput {
  classSubjectId: string
  title: string
  instructions?: string
  /** ISO string. The form collects local date+time and converts before sending. */
  dueAtUtc: string
  maxMarks: number
  allowLateSubmission: boolean
  files: File[]
}

export interface UpdateCourseworkInput {
  title: string
  instructions?: string
  dueAtUtc: string
  maxMarks: number
  allowLateSubmission: boolean
}

export interface SubmitCourseworkInput {
  courseworkId: string
  note?: string
  files: File[]
}

export interface GradeSubmissionInput {
  submissionId: string
  courseworkId: string
  marks: number
  feedback?: string
}
