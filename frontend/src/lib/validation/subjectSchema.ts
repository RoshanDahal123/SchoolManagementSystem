import z from "zod";

export const SubjectSchema =  z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20),
  creditHours: z.coerce.number().min(0),
})