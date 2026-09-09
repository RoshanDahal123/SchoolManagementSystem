import { Button } from "@/components/atoms/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { GradeLevelResponse, SectionResponse } from "../@types"

const schema = z.object({ name: z.string().min(1, "Name is required").max(50), capacity: z.coerce.number().min(0) })
export type SectionFormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  grade: GradeLevelResponse | null
  editing: SectionResponse | null
  isSaving: boolean
  onSubmit: (data: SectionFormData) => void
}

export function SectionDialog({ open, onOpenChange, grade, editing, isSaving, onSubmit }: Props) {
  const form = useForm<SectionFormData>({ resolver: zodResolver(schema), defaultValues: { name: "", capacity: 0 } })

  useEffect(() => {
    if (open) form.reset(editing ? { name: editing.name, capacity: editing.capacity } : { name: "", capacity: 0 })
  }, [open, editing, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
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