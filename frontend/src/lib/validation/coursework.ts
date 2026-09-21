
import {z} from "zod";

export const courseworkSchema = z.object({
  classSubjectId: z.string().min(1, "Choose which class this is for"),
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  instructions: z.string().max(4000, "Instructions are too long").optional(),
  // datetime-local gives "2026-04-12T15:30" — converted to an ISO string before sending.
  dueAt: z.string().min(1, "A submission deadline is required"),
  // Registered with { valueAsNumber: true }, so this receives a real number, not a string.
  maxMarks: z
    .number({ invalid_type_error: "Enter a number" })
    .positive("Total marks must be greater than zero")
    .max(1000, "Total marks must be 1000 or fewer"),
  allowLateSubmission: z.boolean(),
})

export type CourseworkFormData = z.infer<typeof courseworkSchema>

export const gradeSchema = z.object({
  marks: z
    .number({ invalid_type_error: "Enter a number" })
    .min(0, "Marks cannot be negative"),
  feedback: z.string().max(2000, "Feedback is too long").optional(),
})

export type GradeFormData = z.infer<typeof gradeSchema>