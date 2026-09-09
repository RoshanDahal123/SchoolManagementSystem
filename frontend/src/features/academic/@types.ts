// ─── GradeLevel ────────────────────────────────────────────────────────────────
export interface SectionResponse {
  id: string
  gradeLevelId: string
  gradeLevelName: string
  name: string
  capacity: number
  createdAtUtc: string
}

export interface GradeLevelResponse {
  id: string
  name: string
  sortOrder: number
  createdAtUtc: string
  sections: SectionResponse[]
}

export interface CreateGradeLevelRequest { name: string; sortOrder: number }
export interface UpdateGradeLevelRequest { name: string; sortOrder: number }

// ─── Section ──────────────────────────────────────────────────────────────────
export interface CreateSectionRequest { name: string; capacity: number }
export interface UpdateSectionRequest { name: string; capacity: number }

// ─── Subject ──────────────────────────────────────────────────────────────────
export interface SubjectResponse {
  id: string
  name: string
  code: string
  creditHours: number
  isActive: boolean
  createdAtUtc: string
}

export interface CreateSubjectRequest { name: string; code: string; creditHours: number }
export interface UpdateSubjectRequest { name: string; code: string; creditHours: number }

// ─── ClassSubject (curriculum) ────────────────────────────────────────────────
export interface ClassSubjectResponse {
  id: string
  gradeLevelId: string
  gradeLevelName: string
  subjectId: string
  subjectName: string
  subjectCode: string
  academicYearId: string
  academicYearName: string
  createdAtUtc: string
  assignedTeacherId?: string | null
  assignedTeacherName?: string | null
}

export interface AssignSubjectRequest { subjectId: string }
export interface AssignTeacherRequest { teacherId: string }
