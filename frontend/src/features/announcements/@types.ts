export type AnnouncementTargetRole = "All" | "Teachers" | "Students"

export interface AnnouncementResponse {
  id: string
  title: string
  body: string
  targetRole: AnnouncementTargetRole
  createdByUserId: string
  createdAtUtc: string
  updatedAtUtc?: string | null
}

export interface CreateAnnouncementRequest {
  title: string
  body: string
  targetRole: AnnouncementTargetRole
}

export type UpdateAnnouncementRequest = CreateAnnouncementRequest