import { Button } from "@/components/atoms/button"
import { Checkbox } from "@/components/atoms/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import { Textarea } from "@/components/atoms/textarea"
import { FileDropZone } from "@/components/molecules/file-drop-zone"
import { UploadProgressBar } from "@/components/molecules/upload-progress-bar"
import type { TeacherAssignmentResponse } from "@/features/teachers/@types"
import { getErrorMessage } from "@/lib/error-message"
import { courseworkSchema, type CourseworkFormData } from "@/lib/validation/coursework"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { CourseworkResponse } from "../@types"
import {
  UPLOAD_IDS,
  useCreateCourseworkMutation,
  useUpdateCourseworkMutation,
} from "../coursework-api"
import { useUploadProgress } from "../hooks/use-upload-progress"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null when creating. Editing never touches files — attachments are managed on the detail page. */
  editing: CourseworkResponse | null
  assignments: TeacherAssignmentResponse[]
}

/**
 * A datetime-local input wants "YYYY-MM-DDTHH:mm" in the browser's own timezone, while the API
 * speaks ISO/UTC. These two helpers are the only place that conversion happens.
 */
function toLocalInputValue(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function defaultDueDate(): string {
  const oneWeekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  oneWeekOut.setHours(23, 59, 0, 0)
  return toLocalInputValue(oneWeekOut.toISOString())
}

export function CourseworkFormDialog({ open, onOpenChange, editing, assignments }: Props) {
  const [files, setFiles] = useState<File[]>([])

  const [createCoursework, { isLoading: isCreating }] = useCreateCourseworkMutation()
  const [updateCoursework, { isLoading: isUpdating }] = useUpdateCourseworkMutation()

  const progress = useUploadProgress(UPLOAD_IDS.createCoursework)
  const isSaving = isCreating || isUpdating

  const form = useForm<CourseworkFormData>({
    resolver: zodResolver(courseworkSchema),
    defaultValues: {
      classSubjectId: "",
      title: "",
      instructions: "",
      dueAt: defaultDueDate(),
      maxMarks: 100,
      allowLateSubmission: true,
    },
  })

  useEffect(() => {
    if (!open) return

    setFiles([])
    progress.reset()

    form.reset(
      editing
        ? {
            classSubjectId: editing.classSubjectId,
            title: editing.title,
            instructions: editing.instructions ?? "",
            dueAt: toLocalInputValue(editing.dueAtUtc),
            maxMarks: editing.maxMarks,
            allowLateSubmission: editing.allowLateSubmission,
          }
        : {
            // Pre-select when there's only one class to choose from — a teacher with a single
            // assignment shouldn't have to open a dropdown with one option in it.
            classSubjectId: assignments.length === 1 ? assignments[0].classSubjectId : "",
            title: "",
            instructions: "",
            dueAt: defaultDueDate(),
            maxMarks: 100,
            allowLateSubmission: true,
          },
    )
    // progress.reset is stable per uploadId; re-running on every render would clear the bar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, assignments])

  const selectedClassSubjectId = form.watch("classSubjectId")
  const allowLate = form.watch("allowLateSubmission")
  const selected = assignments.find((a) => a.classSubjectId === selectedClassSubjectId)

  async function onSubmit(data: CourseworkFormData) {
    // The server needs text or a file — worth catching here so the user isn't told off
    // only after the upload round trip.
    if (!editing && !data.instructions?.trim() && files.length === 0) {
      form.setError("instructions", {
        message: "Write the assignment here, or attach at least one file.",
      })
      return
    }

    const dueAtUtc = new Date(data.dueAt).toISOString()

    try {
      if (editing) {
        await updateCoursework({
          id: editing.id,
          data: {
            title: data.title,
            instructions: data.instructions?.trim() || undefined,
            dueAtUtc,
            maxMarks: data.maxMarks,
            allowLateSubmission: data.allowLateSubmission,
          },
        }).unwrap()
        toast.success("Coursework updated")
      } else {
        await createCoursework({
          classSubjectId: data.classSubjectId,
          title: data.title,
          instructions: data.instructions?.trim() || undefined,
          dueAtUtc,
          maxMarks: data.maxMarks,
          allowLateSubmission: data.allowLateSubmission,
          files,
        }).unwrap()
        toast.success("Coursework posted to your class")
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save coursework"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit coursework" : "New coursework"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes are visible to students straight away."
                : "Set work for a class. Students see it in their portal as soon as you post it."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Field>
              <FieldLabel>Class &amp; subject</FieldLabel>
              <Select
                value={selectedClassSubjectId}
                onValueChange={(value) => value && form.setValue("classSubjectId", value, { shouldValidate: true })}
                // The target class is what decides who receives the work, so it is fixed
                // once posted — moving it would orphan any submissions already made.
                disabled={!!editing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class">
                    {selected && `${selected.gradeLevelName} — ${selected.subjectName}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.classSubjectId} value={assignment.classSubjectId}>
                      {assignment.gradeLevelName} — {assignment.subjectName} ({assignment.academicYearName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.classSubjectId && (
                <FieldError>{form.formState.errors.classSubjectId.message}</FieldError>
              )}
              {assignments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  You have no classes assigned yet — ask your administrator to assign you to a subject.
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input {...form.register("title")} placeholder="Chapter 4 — Quadratic equations" />
              {form.formState.errors.title && <FieldError>{form.formState.errors.title.message}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Instructions</FieldLabel>
              <Textarea
                {...form.register("instructions")}
                rows={4}
                placeholder="Answer questions 1–12. Show your working for each."
              />
              {form.formState.errors.instructions && (
                <FieldError>{form.formState.errors.instructions.message}</FieldError>
              )}
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Submission deadline</FieldLabel>
                <Input type="datetime-local" {...form.register("dueAt")} />
                {form.formState.errors.dueAt && <FieldError>{form.formState.errors.dueAt.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Total marks</FieldLabel>
                <Input type="number" min={1} max={1000} step="0.5" {...form.register("maxMarks", { valueAsNumber: true })} />
                {form.formState.errors.maxMarks && (
                  <FieldError>{form.formState.errors.maxMarks.message}</FieldError>
                )}
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={allowLate}
                onCheckedChange={(checked) => form.setValue("allowLateSubmission", checked === true)}
              />
              <span>
                Accept late submissions
                <span className="block text-xs text-muted-foreground">
                  Work handed in after the deadline is flagged as late rather than blocked.
                </span>
              </span>
            </label>

            {!editing && (
              <Field>
                <FieldLabel>Attachments</FieldLabel>
                <FileDropZone files={files} onChange={setFiles} disabled={isSaving} />
              </Field>
            )}

            {!editing && <UploadProgressBar progress={progress} />}

            {editing && (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                To add or remove files, open this coursework and manage its attachments there.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || (!editing && assignments.length === 0)}>
              {isSaving ? "Saving…" : editing ? "Save changes" : "Post coursework"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
