// ─── Response ─────────────────────────────────────────────────────────────────

export interface TeacherResponse {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phoneNumber?: string | null
  /** e.g. "Mathematics", "Science" */
  subjectSpecialization?: string | null
  employeeId: string
  createdAtUtc: string
  userId?: string | null
  hasPortalAccount?: boolean
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export interface CreateTeacherRequest {
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
