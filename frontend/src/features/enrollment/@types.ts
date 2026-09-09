export interface StudentEnrollmentResponse {
  id: string
  studentId: string
  studentName: string
  enrollmentNumber: string
  academicYearId: string
  academicYearName: string
  sectionId: string
  sectionName: string
  gradeLevelId: string
  gradeLevelName: string
  status: "Active" | "Completed" | "Withdrawn"
  enrolledOn: string // "YYYY-MM-DD"
  createdAtUtc: string
  updatedAtUtc?: string | null
}

export interface EnrollStudentRequest {
  academicYearId: string
  sectionId: string
  enrolledOn: string // "YYYY-MM-DD"
}

export interface TransferStudentRequest {
  newSectionId: string
}

export interface ChangeEnrollmentStatusRequest {
  status: "Active" | "Completed" | "Withdrawn"
}