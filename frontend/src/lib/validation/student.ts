import { z } from "zod";

export const createStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  dateOfBirth: z.string().refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    return dob < today;
  }, "Date of birth must be in the past"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Please select a gender" }),
  }),
  enrollmentNumber: z
    .string()
    .min(1, "Enrollment number is required")
    .max(50, "Enrollment number is too long"),
});

export type CreateStudentFormData = z.infer<typeof createStudentSchema>;

export const inviteStudentSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type InviteStudentFormData = z.infer<typeof inviteStudentSchema>;
