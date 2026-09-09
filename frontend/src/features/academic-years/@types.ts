export interface AcademicYearResponse {
  id: string
  name: string
  startDate: string  // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD"
  isActive: boolean
  createdAtUtc: string
}

export interface CreateAcademicYearRequest {
  name: string
  startDate: string  // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD"
}

export interface UpdateAcademicYearRequest {
  name: string
  startDate: string  // "YYYY-MM-DD"
  endDate: string    // "YYYY-MM-DD"
}
