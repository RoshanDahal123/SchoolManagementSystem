

export interface TeacherSubjectSummary {
  subjectId: string
  subjectName: string
  subjectCode: string
}

export interface TeacherResponse {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  phoneNumber?: string | null
  createdAtUtc: string
  isActive: boolean
  userId?: string | null
  hasPortalAccount?: boolean
  isPortalActive?: boolean | null
  email?: string | null
  specializations: TeacherSubjectSummary[]
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateTeacherRequest {
  firstName: string
  lastName: string
  employeeId: string
  phoneNumber?: string
  subjectIds: string[]
}

export interface UpdateTeacherRequest {
  firstName: string
  lastName: string
  employeeId: string
  phoneNumber?: string
  subjectIds: string[]
}

export interface InviteTeacherRequest {
  id: string
  email: string
}

export interface PaginatedTeachers {
  items: TeacherResponse[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}