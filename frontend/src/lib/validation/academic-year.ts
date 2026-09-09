import { z } from "zod"

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(20, "Name must be 20 characters or fewer")
      .regex(/^\d{4}-\d{2}$/, 'Format must be "YYYY-YY" e.g. "2025-26"'),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "Start date must be before end date",
    path: ["endDate"],
  })

export type AcademicYearFormData = z.infer<typeof academicYearSchema>
