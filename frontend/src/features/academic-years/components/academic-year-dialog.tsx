import { Button } from "@/components/atoms/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { academicYearSchema } from "@/lib/validation/academic-year"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { AcademicYearResponse } from "../@types"

export type AcademicYearFormData = z.infer<typeof academicYearSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: AcademicYearResponse | null
  isSaving: boolean
  onSubmit: (data: AcademicYearFormData) => void
}

export function AcademicYearDialog({ open, onOpenChange, editing, isSaving, onSubmit }: Props) {
  const form = useForm<AcademicYearFormData>({ resolver: zodResolver(academicYearSchema), defaultValues: { name: "", startDate: "", endDate: "" } })

  useEffect(() => {
    if (open) {
      form.reset(editing
        ? { name: editing.name, startDate: editing.startDate.slice(0, 10), endDate: editing.endDate.slice(0, 10) }
        : { name: "", startDate: "", endDate: "" })
    }
  }, [open, editing, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Academic Year" : "Add Academic Year"}</DialogTitle>
            <DialogDescription>e.g. "2082/83" running from the start to the end of the school year.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...form.register("name")} placeholder="2082/83" />
              {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Start date</FieldLabel>
                <Input {...form.register("startDate")} type="date" />
                {form.formState.errors.startDate && <FieldError>{form.formState.errors.startDate.message}</FieldError>}
              </Field>
              <Field>
                <FieldLabel>End date</FieldLabel>
                <Input {...form.register("endDate")} type="date" />
                {form.formState.errors.endDate && <FieldError>{form.formState.errors.endDate.message}</FieldError>}
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving…" : editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}