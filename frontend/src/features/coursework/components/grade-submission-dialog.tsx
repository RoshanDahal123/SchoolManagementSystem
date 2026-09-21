import { Button } from "@/components/atoms/button"
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
import { Textarea } from "@/components/atoms/textarea"
import { formatDateTime } from "@/helpers/date"
import { getErrorMessage } from "@/lib/error-message"
import { gradeSchema, type GradeFormData } from "@/lib/validation/coursework"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { SubmissionResponse } from "../@types"
import { useGradeSubmissionMutation } from "../coursework-api"
import { AttachmentList } from "./attachment-list"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: SubmissionResponse | null
  courseworkId: string
  maxMarks: number
}

/**
 * Marking one student's work. The submitted files sit alongside the marks field so the teacher
 * can open the PDF and type the score without leaving the dialog.
 */
export function GradeSubmissionDialog({ open, onOpenChange, submission, courseworkId, maxMarks }: Props) {
  const [gradeSubmission, { isLoading }] = useGradeSubmissionMutation()

  const form = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { marks: 0, feedback: "" },
  })

  useEffect(() => {
    if (!open || !submission) return
    form.reset({
      marks: submission.marks ?? 0,
      feedback: submission.feedback ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submission])

  async function onSubmit(data: GradeFormData) {
    if (!submission) return

    // Checked here as well as on the server so the teacher sees it as they type rather than
    // after a round trip. The domain rule is the authority; this is a convenience.
    if (data.marks > maxMarks) {
      form.setError("marks", { message: `This coursework is out of ${maxMarks} marks.` })
      return
    }

    try {
      await gradeSubmission({
        submissionId: submission.id,
        courseworkId,
        marks: data.marks,
        feedback: data.feedback?.trim() || undefined,
      }).unwrap()

      toast.success(`Marks saved for ${submission.studentName}`)
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save these marks"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Mark submission</DialogTitle>
            <DialogDescription>
              {submission
                ? `${submission.studentName} · ${submission.enrollmentNumber}`
                : "Select a submission to mark."}
            </DialogDescription>
          </DialogHeader>

          {submission && (
            <div className="grid gap-4 py-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDateTime(submission.submittedAtUtc)}
                  {submission.isLate && <span className="ml-1 font-medium text-amber-600">· late</span>}
                </p>
                {submission.note && <p className="mt-2 whitespace-pre-wrap">{submission.note}</p>}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Submitted work</p>
                <AttachmentList
                  attachments={submission.attachments}
                  emptyText="No files — the student submitted a written note only."
                />
              </div>

              <Field>
                <FieldLabel>Marks (out of {maxMarks})</FieldLabel>
                <Input type="number" min={0} max={maxMarks} step="0.5" {...form.register("marks", { valueAsNumber: true })} />
                {form.formState.errors.marks && <FieldError>{form.formState.errors.marks.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Feedback</FieldLabel>
                <Textarea
                  rows={4}
                  placeholder="What went well, and what to work on next time."
                  {...form.register("feedback")}
                />
                {form.formState.errors.feedback && (
                  <FieldError>{form.formState.errors.feedback.message}</FieldError>
                )}
              </Field>

              <p className="text-xs text-muted-foreground">
                Once marked, the student can no longer replace this submission, and the score appears
                in their progress report.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !submission}>
              {isLoading ? "Saving…" : "Save marks"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
