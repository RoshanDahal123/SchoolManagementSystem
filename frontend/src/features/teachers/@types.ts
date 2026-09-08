// ─── Response ─────────────────────────────────────────────────────────────────

export interface TeacherResponse {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  subjectSpecialization?: string | null
  phoneNumber?: string | null
  createdAtUtc: string
  isActive: boolean
  userId?: string | null
  hasPortalAccount?: boolean
  isPortalActive?: boolean | null
  email?: string | null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateTeacherRequest {
  firstName: string
  lastName: string
  employeeId: string
  subjectSpecialization?: string
  phoneNumber?: string
}

export interface UpdateTeacherRequest {
  firstName: string
  lastName: string
  employeeId: string
  subjectSpecialization?: string
  phoneNumber?: string
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
