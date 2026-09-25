import { Button } from "@/components/atoms/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import type { TeacherResponse } from "@/features/teachers/@types"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { GradeLevelResponse, SectionResponse } from "../@types"
import { useGetHomeroomTeacherQuery } from "../academic-api"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  capacity: z.coerce.number().min(0),
  teacherId: z.string().optional(),
})
export type SectionFormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade: GradeLevelResponse | null
  editing: SectionResponse | null
  academicYearId: string
  teachers: TeacherResponse[]
  isSaving: boolean
  onSubmit: (data: SectionFormData, originalTeacherId: string) => void
}

export function SectionDialog({
  open, onOpenChange, grade, editing, academicYearId, teachers, isSaving, onSubmit,
}: Props) {
  const form = useForm<SectionFormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", capacity: 0, teacherId: "" },
  })

  // Only relevant when editing an existing section — a brand-new section can't
  // have a homeroom teacher yet.
  const { data: currentHomeroom } = useGetHomeroomTeacherQuery(
    { sectionId: editing?.id ?? "", yearId: academicYearId },
    { skip: !open || !editing?.id || !academicYearId }
  )

  useEffect(() => {
    if (!open) return
    form.reset({
      name: editing?.name ?? "",
      capacity: editing?.capacity ?? 0,
      teacherId: currentHomeroom?.teacherId ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, currentHomeroom])

  const teacherId = form.watch("teacherId")
  const selectedTeacher = teachers.find((t) => t.id === teacherId)
  const originalTeacherId = currentHomeroom?.teacherId ?? ""

  const handleSubmit = (data: SectionFormData) => onSubmit(data, originalTeacherId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Section" : `Add Section to ${grade?.name}`}</DialogTitle>
            <DialogDescription>Sections group students within a grade level, e.g. "A" or "B".</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Section name</FieldLabel>
              <Input {...form.register("name")} placeholder="A" />
              {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Capacity (0 = unlimited)</FieldLabel>
              <Input {...form.register("capacity")} type="number" min={0} />
            </Field>

            <Field>
              <FieldLabel>Homeroom teacher</FieldLabel>
              {!academicYearId ? (
                <p className="text-xs text-muted-foreground">
                  Set an active academic year to assign a homeroom teacher.
                </p>
              ) : (
                <Select
                  value={teacherId || "none"}
                  onValueChange={(value) => form.setValue("teacherId", value === "none" ? "" : (value ?? ""))}
                >
                  <SelectTrigger className="h-9 w-full">
                    {selectedTeacher ? (
                      <span className="text-sm">{selectedTeacher.firstName} {selectedTeacher.lastName}</span>
                    ) : (
                      <SelectValue placeholder="No homeroom teacher" />
                    )}
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No homeroom teacher</span>
                    </SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="font-medium">{t.firstName} {t.lastName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : editing ? "Save" : "Add section"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}