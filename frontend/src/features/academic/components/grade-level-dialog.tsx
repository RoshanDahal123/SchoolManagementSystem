import { Button } from "@/components/atoms/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { GradeLevelResponse } from "../@types"

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sortOrder: z.coerce.number().min(0, "Must be 0 or greater"),
})
export type GradeLevelFormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: GradeLevelResponse | null
  nextSortOrder: number
  isSaving: boolean
  onSubmit: (data: GradeLevelFormData) => void
}

export function GradeLevelDialog({ open, onOpenChange, editing, nextSortOrder, isSaving, onSubmit }: Props) {
  const form = useForm<GradeLevelFormData>({ resolver: zodResolver(schema), defaultValues: { name: "", sortOrder: 0 } })

  useEffect(() => {
    if (open) form.reset(editing ? { name: editing.name, sortOrder: editing.sortOrder } : { name: "", sortOrder: nextSortOrder })
  }, [open, editing, nextSortOrder, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Grade Level" : "Add Grade Level"}</DialogTitle>
            <DialogDescription>e.g. "Grade 10" with a sort order controlling its position in lists.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input {...form.register("name")} placeholder="Grade 10" />
              {form.formState.errors.name && <FieldError>{form.formState.errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Sort order</FieldLabel>
              <Input {...form.register("sortOrder")} type="number" min={0} />
              {form.formState.errors.sortOrder && <FieldError>{form.formState.errors.sortOrder.message}</FieldError>}
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