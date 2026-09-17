import { z } from "zod"

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title is too long"),
  body: z.string().min(1, "Body is required").max(2000, "Body is too long"),
  targetRole: z.enum(["All", "Teachers", "Students"], {
    errorMap: () => ({ message: "Please select an audience" }),
  }),
})

export type AnnouncementFormData = z.infer<typeof announcementSchema>