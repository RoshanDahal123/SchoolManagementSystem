export type AttendanceStatus="Present" |"Absent"|"Late"|"Excused"

export interface RosterAttendanceEntry{
  enrollmentId:string,
  studentId:string,
  studentName:string
  status:AttendanceStatus,
  enrollmentNumber:string,
  attendanceId:string|null,
  remarks:string|null,
  markedAtUtc:string|null
}
export interface AttendanceEntryRequest {
  enrollmentId: string
  status: AttendanceStatus
  remarks?: string | null
}

export interface MarkAttendanceRequest {
  date: string // "YYYY-MM-DD"
  entries: AttendanceEntryRequest[]
}

export interface StudentAttendanceRecord {
  id: string
  enrollmentId: string
  date: string
  status: AttendanceStatus
  remarks: string | null
  markedAtUtc: string
  updatedAtUtc: string | null
}


export interface AttendanceSummary {
  studentId: string
  totalMarkedDays: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendancePercentage: number
}


export interface StudentRegisterRow {
  enrollmentId: string
  studentId: string
  studentName: string
  enrollmentNumber: string
  statusByDate: Record<string, AttendanceStatus>
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  totalMarkedDays: number
  attendancePercentage: number
}

export interface SectionAttendanceRegister {
  sectionId: string
  sectionName: string
  gradeLevelId: string
  gradeLevelName: string
  from: string
  to: string
  dates: string[]
  students: StudentRegisterRow[]
}