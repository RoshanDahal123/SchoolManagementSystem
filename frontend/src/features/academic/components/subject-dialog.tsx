import { Button } from "@/components/atoms/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { SubjectSchema } from "@/lib/validation/subjectSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { SubjectResponse } from "../@types"


export type SubjectFormData = z.infer<typeof SubjectSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: SubjectResponse | null
  isSaving: boolean
  onSubmit: (data: SubjectFormData) => void
}

export function SubjectDialog({ open, onOpenChange, editing, isSaving, onSubmit }: Props) {
  const form = useForm<SubjectFormData>({ resolver: zodResolver(SubjectSchema), defaultValues: { name: "", code: "", creditHours: 0 } })

  useEffect(() => {
    if (open) form.reset(editing ? { name: editing.name, code: editing.code, creditHours: editing.creditHours } : { name: "", code: "", creditHours: 0 })
  }, [open, editing, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...form.register("name")} placeholder="Mathematics" />
              {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input {...form.register("code")} placeholder="MATH101" />
              {form.formState.errors.code && <FieldError>{form.formState.errors.code.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Credit hours</FieldLabel>
              <Input {...form.register("creditHours")} type="number" min={0} placeholder="0" />
            </Field>
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