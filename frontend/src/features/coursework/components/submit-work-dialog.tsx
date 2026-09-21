import { Button } from "@/components/atoms/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldLabel } from "@/components/atoms/field"
import { Textarea } from "@/components/atoms/textarea"
import { FileDropZone } from "@/components/molecules/file-drop-zone"
import { UploadProgressBar } from "@/components/molecules/upload-progress-bar"
import { formatDateTime } from "@/helpers/date"
import { getErrorMessage } from "@/lib/error-message"
import { TriangleAlertIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { StudentCoursework } from "../@types"
import { UPLOAD_IDS, useSubmitCourseworkMutation } from "../coursework-api"
import { useUploadProgress } from "../hooks/use-upload-progress"
import { AttachmentList } from "./attachment-list"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: StudentCoursework | null
}

export function SubmitWorkDialog({ open, onOpenChange, item }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [submitCoursework, { isLoading }] = useSubmitCourseworkMutation()

  // Keyed per coursework so two dialogs opened in sequence never inherit each other's bar.
  const progress = useUploadProgress(UPLOAD_IDS.submitCoursework(item?.coursework.id ?? "none"))

  useEffect(() => {
    if (!open) return
    setFiles([])
    setNote(item?.mySubmission?.note ?? "")
    setError(null)
    progress.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const isReplacing = !!item?.mySubmission

  async function handleSubmit() {
    if (!item) return

    if (files.length === 0 && !note.trim()) {
      setError("Attach at least one file, or write a note, before submitting.")
      return
    }

    // Replacing an earlier attempt wipes the old files on the server, so submitting with an
    // empty picker would silently delete the student's work. Better to stop them.
    if (isReplacing && files.length === 0) {
      setError("Re-submitting replaces your previous files, so you need to attach them again.")
      return
    }

    setError(null)

    try {
      await submitCoursework({
        courseworkId: item.coursework.id,
        note: note.trim() || undefined,
        files,
      }).unwrap()

      toast.success(isReplacing ? "Your work has been replaced" : "Your work has been submitted")
      onOpenChange(false)
    } catch (err) {
      const message = getErrorMessage(err, "Couldn't submit your work")
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !isLoading && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isReplacing ? "Replace your submission" : "Submit your work"}</DialogTitle>
          <DialogDescription>
            {item
              ? `${item.coursework.title} · due ${formatDateTime(item.coursework.dueAtUtc)}`
              : "Choose an assignment to submit."}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="grid gap-4 py-4">
            {item.coursework.isPastDue && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <p>
                  The deadline has passed. Your teacher still accepts submissions, but this one will
                  be marked as late.
                </p>
              </div>
            )}

            {isReplacing && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                <p className="text-sm font-medium">
                  Submitted {formatDateTime(item.mySubmission!.submittedAtUtc)}
                </p>
                <AttachmentList attachments={item.mySubmission!.attachments} />
                <p className="text-xs text-muted-foreground">
                  Uploading again replaces these files entirely.
                </p>
              </div>
            )}

            <Field>
              <FieldLabel>Your files</FieldLabel>
              <FileDropZone files={files} onChange={setFiles} disabled={isLoading} maxFiles={5} />
            </Field>

            <Field>
              <FieldLabel>Note for your teacher (optional)</FieldLabel>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isLoading}
                placeholder="Anything you'd like your teacher to know about this submission."
              />
            </Field>

            <UploadProgressBar progress={progress} />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !item}>
            {isLoading ? "Uploading…" : isReplacing ? "Replace submission" : "Submit work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
