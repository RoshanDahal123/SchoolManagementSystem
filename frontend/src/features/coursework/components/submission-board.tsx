import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Progress } from "@/components/atoms/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import { Skeleton } from "@/components/atoms/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table"
import { FileDropZone } from "@/components/molecules/file-drop-zone"
import { UploadProgressBar } from "@/components/molecules/upload-progress-bar"
import { formatDateTime } from "@/helpers/date"
import { getErrorMessage } from "@/lib/error-message"
import { ArrowLeftIcon, PaperclipIcon, UploadIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import type { CourseworkStatus, SubmissionBoardEntry } from "../@types"
import {
  UPLOAD_IDS,
  useAddCourseworkAttachmentsMutation,
  useGetSubmissionBoardQuery,
  useRemoveCourseworkAttachmentMutation,
} from "../coursework-api"
import { useUploadProgress } from "../hooks/use-upload-progress"
import { AttachmentList } from "./attachment-list"
import { CourseworkStatusBadge } from "./coursework-status-badge"
import { GradeSubmissionDialog } from "./grade-submission-dialog"

const ALL = "all"

interface Props {
  courseworkId: string
  backTo: string
}

export function SubmissionBoard({ courseworkId, backTo }: Props) {
  const { data, isLoading } = useGetSubmissionBoardQuery(courseworkId)

  const [sectionFilter, setSectionFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState<CourseworkStatus | typeof ALL>(ALL)
  const [grading, setGrading] = useState<SubmissionBoardEntry | null>(null)

  const [newFiles, setNewFiles] = useState<File[]>([])
  const [addAttachments, { isLoading: isUploading }] = useAddCourseworkAttachmentsMutation()
  const [removeAttachment] = useRemoveCourseworkAttachmentMutation()
  const uploadProgress = useUploadProgress(UPLOAD_IDS.addAttachments(courseworkId))

  const coursework = data?.coursework
  const entries = useMemo(() => data?.entries ?? [], [data])

  // Sections come from the data rather than a separate query — the board already lists every
  // enrolled student, so it knows exactly which sections are represented.
  const sections = useMemo(() => {
    const seen = new Map<string, string>()
    entries.forEach((entry) => seen.set(entry.sectionId, entry.sectionName))
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [entries])

  const visible = entries.filter(
    (entry) =>
      (sectionFilter === ALL || entry.sectionId === sectionFilter) &&
      (statusFilter === ALL || entry.status === statusFilter),
  )

  async function handleUpload() {
    if (newFiles.length === 0) return
    try {
      await addAttachments({ courseworkId, files: newFiles }).unwrap()
      toast.success("Files added")
      setNewFiles([])
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't add those files"))
    }
  }

  async function handleRemoveAttachment(attachmentId: string) {
    try {
      await removeAttachment({ courseworkId, attachmentId }).unwrap()
      toast.success("File removed")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't remove that file"))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!coursework) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        This coursework no longer exists, or you don't have access to it.
      </Card>
    )
  }

  const markedPercent =
    coursework.submittedCount === 0
      ? 0
      : Math.round((coursework.gradedCount / coursework.submittedCount) * 100)

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" render={<Link to={backTo} />}>
        <ArrowLeftIcon className="size-4" />
        Back to coursework
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{coursework.title}</CardTitle>
            <Badge variant="secondary">{coursework.subjectCode}</Badge>
            <Badge variant="outline">{coursework.gradeLevelName}</Badge>
            {coursework.isPastDue && <Badge variant="destructive">Deadline passed</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Due {formatDateTime(coursework.dueAtUtc)} · out of {coursework.maxMarks} marks ·{" "}
            {coursework.allowLateSubmission ? "late submissions accepted" : "closes at the deadline"}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {coursework.instructions && (
            <p className="whitespace-pre-wrap text-sm">{coursework.instructions}</p>
          )}

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <PaperclipIcon className="size-4" />
              Files you shared with the class
            </p>
            <AttachmentList
              attachments={coursework.attachments}
              onRemove={handleRemoveAttachment}
              emptyText="No files attached — this is a written assignment."
            />
          </div>

          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium">Add more files</p>
            <FileDropZone files={newFiles} onChange={setNewFiles} disabled={isUploading} maxFiles={5} />
            <UploadProgressBar progress={uploadProgress} />
            {newFiles.length > 0 && (
              <Button size="sm" onClick={handleUpload} disabled={isUploading}>
                <UploadIcon className="size-4" />
                {isUploading ? "Uploading…" : `Upload ${newFiles.length} file${newFiles.length > 1 ? "s" : ""}`}
              </Button>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold tabular-nums">{coursework.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Students in this class</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold tabular-nums">{coursework.submittedCount}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold tabular-nums">{coursework.gradedCount}</p>
              <p className="text-xs text-muted-foreground">Marked</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Marking progress</span>
              <span className="tabular-nums">{markedPercent}%</span>
            </div>
            <Progress value={markedPercent} />
          </div>
        </CardContent>
      </Card>

      <Card className="flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Section</label>
          <Select value={sectionFilter} onValueChange={(value) => value && setSectionFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {sectionFilter === ALL
                  ? "All sections"
                  : sections.find((s) => s.id === sectionFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All sections</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={statusFilter}
            onValueChange={(value) => value && setStatusFilter(value as CourseworkStatus | typeof ALL)}
          >
            <SelectTrigger className="w-44">
              <SelectValue>{statusFilter === ALL ? "All students" : statusFilter}</SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All students</SelectItem>
              <SelectItem value="Submitted">Awaiting marks</SelectItem>
              <SelectItem value="Graded">Marked</SelectItem>
              <SelectItem value="Pending">Not submitted</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="ml-auto text-sm text-muted-foreground">
          Showing {visible.length} of {entries.length}
        </p>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead className="w-24">Section</TableHead>
              <TableHead className="w-36">Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-24">Marks</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No students match these filters.
                </TableCell>
              </TableRow>
            )}

            {visible.map((entry) => (
              <TableRow key={entry.studentId}>
                <TableCell>
                  <p className="font-medium">{entry.studentName}</p>
                  <p className="text-xs text-muted-foreground">{entry.enrollmentNumber}</p>
                </TableCell>
                <TableCell>{entry.sectionName}</TableCell>
                <TableCell>
                  <CourseworkStatusBadge status={entry.status} />
                </TableCell>
                <TableCell className="text-sm">
                  {entry.submission ? (
                    <>
                      <span>{formatDateTime(entry.submission.submittedAtUtc)}</span>
                      {entry.submission.isLate && (
                        <span className="ml-1 text-xs font-medium text-amber-600">late</span>
                      )}
                      {entry.submission.attachments.length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {entry.submission.attachments.length} file
                          {entry.submission.attachments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {entry.submission?.marks != null ? (
                    <span className="font-medium">
                      {entry.submission.marks} / {coursework.maxMarks}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {entry.submission && (
                    <Button variant="outline" size="sm" onClick={() => setGrading(entry)}>
                      {entry.status === "Graded" ? "Change marks" : "Mark"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <GradeSubmissionDialog
        open={!!grading}
        onOpenChange={(open) => !open && setGrading(null)}
        submission={grading?.submission ?? null}
        courseworkId={courseworkId}
        maxMarks={coursework.maxMarks}
      />
    </div>
  )
}
