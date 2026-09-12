import { z } from "zod"

export const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Employee ID is too long"),
  phoneNumber: z.string().max(30, "Phone number is too long").optional(),
  subjectIds: z.array(z.string()).min(1, "Select at least one subject"),
})

export type CreateTeacherFormData = z.infer<typeof createTeacherSchema>

export const inviteTeacherSchema = z.object({
  email: z.string().email("Invalid email address"),
})

//backend ValidateAndResolveSubjectsAsync guard 

export type InviteTeacherFormData = z.infer<typeof inviteTeacherSchema>