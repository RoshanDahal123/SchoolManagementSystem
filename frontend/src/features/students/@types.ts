export interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  enrollmentNumber: string;
  createdAtUtc: string;
  isActive: boolean;
  userId?: string | null;
  hasPortalAccount?: boolean;
  isPortalActive?: boolean;
  email?: string | null;
}

export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD" format
  gender: "Male" | "Female" | "Other";
  enrollmentNumber: string;
}

export interface UpdateStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string; // "YYYY-MM-DD" format
  gender: "Male" | "Female" | "Other";
  enrollmentNumber: string;
}

export interface InviteStudentRequest {
  id: string;
  email: string;
}

export interface PaginatedStudents {
  items: StudentResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
