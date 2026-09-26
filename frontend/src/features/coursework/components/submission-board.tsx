import { Avatar, AvatarFallback } from "@/components/atoms/avatar"
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
import { FileDropZone } from "@/components/molecules/file-drop-zone"
import { UploadProgressBar } from "@/components/molecules/upload-progress-bar"
import { formatDateTime } from "@/helpers/date"
import { getErrorMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileTextIcon,
  PaperclipIcon,
  UploadIcon,
  UsersIcon,
} from "lucide-react"
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
import { CourseworkLifecycleBadge } from "./coursework-lifecycle-badge"
import { CourseworkStatusBadge } from "./coursework-status-badge"
import { GradeSubmissionDialog } from "./grade-submission-dialog"

const ALL = "all"

const STATUS_TABS: {
  key: CourseworkStatus | typeof ALL
  label: string
}[] = [
  { key: ALL, label: "All students" },
  { key: "Submitted", label: "Awaiting marks" },
  { key: "Graded", label: "Marked" },
  { key: "Pending", label: "Not submitted" },
  { key: "Overdue", label: "Overdue" },
]

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

interface Props {
  courseworkId: string
  backTo: string
}

export function SubmissionBoard({ courseworkId, backTo }: Props) {
  const { data, isLoading } = useGetSubmissionBoardQuery(courseworkId)

  const [sectionFilter, setSectionFilter] = useState(ALL)
  const [statusFilter, setStatusFilter] =
    useState<CourseworkStatus | typeof ALL>(ALL)

  const [grading, setGrading] = useState<SubmissionBoardEntry | null>(null)

  const [newFiles, setNewFiles] = useState<File[]>([])

  const [addAttachments, { isLoading: isUploading }] =
    useAddCourseworkAttachmentsMutation()

  const [removeAttachment] = useRemoveCourseworkAttachmentMutation()

  const uploadProgress = useUploadProgress(
    UPLOAD_IDS.addAttachments(courseworkId),
  )

  const coursework = data?.coursework

  const entries = useMemo(() => data?.entries ?? [], [data])

  const sections = useMemo(() => {
    const seen = new Map<string, string>()

    entries.forEach((entry) => {
      seen.set(entry.sectionId, entry.sectionName)
    })

    return [...seen.entries()].map(([id, name]) => ({
      id,
      name,
    }))
  }, [entries])

  const statusCounts = useMemo(() => {
    return {
      all: entries.length,
      Submitted: entries.filter((entry) => entry.status === "Submitted")
        .length,
      Graded: entries.filter((entry) => entry.status === "Graded").length,
      Pending: entries.filter((entry) => entry.status === "Pending").length,
      Overdue: entries.filter((entry) => entry.status === "Overdue").length,
    }
  }, [entries])

  const visible = useMemo(() => {
    return entries.filter(
      (entry) =>
        (sectionFilter === ALL || entry.sectionId === sectionFilter) &&
        (statusFilter === ALL || entry.status === statusFilter),
    )
  }, [entries, sectionFilter, statusFilter])

  async function handleUpload() {
    if (newFiles.length === 0) return

    try {
      await addAttachments({
        courseworkId,
        files: newFiles,
      }).unwrap()

      toast.success("Files added")
      setNewFiles([])
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't add those files"))
    }
  }

  async function handleRemoveAttachment(attachmentId: string) {
    try {
      await removeAttachment({
        courseworkId,
        attachmentId,
      }).unwrap()

      toast.success("File removed")
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't remove that file"))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>

            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!coursework) {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center p-12 text-center text-sm text-muted-foreground">
          This coursework no longer exists, or you don't have access to it.
        </CardContent>
      </Card>
    )
  }

  const submissionPercent =
    coursework.totalStudents === 0
      ? 0
      : Math.round(
          (coursework.submittedCount / coursework.totalStudents) * 100,
        )

  const markingPercent =
    coursework.submittedCount === 0
      ? 0
      : Math.round(
          (coursework.gradedCount / coursework.submittedCount) * 100,
        )

  const remaining =
    coursework.totalStudents - coursework.submittedCount

  const awaitingMarks =
    coursework.submittedCount - coursework.gradedCount

  return (
    <div className="space-y-5">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
        render={<Link to={backTo} />}
      >
        <ArrowLeftIcon className="size-4" />
        Back to coursework
      </Button>

      {/* Coursework overview */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">
                  {coursework.title}
                </CardTitle>

                <Badge variant="secondary">
                  {coursework.subjectCode}
                </Badge>

                <Badge variant="outline">
                  {coursework.gradeLevelName}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Due {formatDateTime(coursework.dueAtUtc)}
                </span>

                <span>
                  {coursework.maxMarks} marks
                </span>

                <span className="flex items-center gap-1.5">
                  <UsersIcon className="size-3.5" />
                  {coursework.totalStudents} students
                </span>
              </div>
            </div>

            <CourseworkLifecycleBadge
              coursework={coursework}
              className="shrink-0"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-5">
          {/* Instructions */}
          {coursework.instructions && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileTextIcon className="size-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  Instructions
                </p>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {coursework.instructions}
              </p>
            </div>
          )}

          {/* Key metrics */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Submissions
                </p>

                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FileTextIcon className="size-4" />
                </div>
              </div>

              <p className="text-2xl font-semibold tabular-nums">
                {coursework.submittedCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{coursework.totalStudents}
                </span>
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {remaining} still remaining
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Marked
                </p>

                <div className="flex size-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                  <CheckCircle2Icon className="size-4" />
                </div>
              </div>

              <p className="text-2xl font-semibold tabular-nums">
                {coursework.gradedCount}
                <span className="text-sm font-normal text-muted-foreground">
                  /{coursework.submittedCount}
                </span>
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {awaitingMarks > 0
                  ? `${awaitingMarks} awaiting marks`
                  : "Everything submitted is marked"}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Submission rate
                </p>

                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Clock3Icon className="size-4" />
                </div>
              </div>

              <p className="text-2xl font-semibold tabular-nums">
                {submissionPercent}%
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Class submission progress
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="grid gap-5 border-t pt-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Submission progress
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {coursework.submittedCount} of{" "}
                    {coursework.totalStudents} students submitted
                  </p>
                </div>

                <span className="text-sm font-semibold tabular-nums">
                  {submissionPercent}%
                </span>
              </div>

              <Progress value={submissionPercent} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    Marking progress
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {coursework.gradedCount} of{" "}
                    {coursework.submittedCount} submissions marked
                  </p>
                </div>

                <span className="text-sm font-semibold tabular-nums">
                  {markingPercent}%
                </span>
              </div>

              <Progress value={markingPercent} />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3 border-t pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">
                    Coursework files
                  </p>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Files shared with students
                </p>
              </div>

              {coursework.attachments.length > 0 && (
                <Badge variant="secondary">
                  {coursework.attachments.length}{" "}
                  {coursework.attachments.length === 1
                    ? "file"
                    : "files"}
                </Badge>
              )}
            </div>

            <AttachmentList
              attachments={coursework.attachments}
              onRemove={handleRemoveAttachment}
              emptyText="No files attached — this is a written assignment."
            />
          </div>

          {/* Add files */}
          <div className="rounded-xl border border-dashed bg-muted/10 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold">
                Add more files
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload additional resources for this coursework.
              </p>
            </div>

            <FileDropZone
              files={newFiles}
              onChange={setNewFiles}
              disabled={isUploading}
              maxFiles={5}
            />

            <UploadProgressBar progress={uploadProgress} />

            {newFiles.length > 0 && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  <UploadIcon className="size-4" />

                  {isUploading
                    ? "Uploading…"
                    : `Upload ${newFiles.length} file${
                        newFiles.length > 1 ? "s" : ""
                      }`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission review */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">
                Student submissions
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Review submissions and assign marks to each student.
              </p>
            </div>

            <Badge variant="secondary">
              {visible.length} of {entries.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col gap-4 border-b bg-muted/10 p-4 lg:flex-row lg:items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Section
              </label>

              <Select
                value={sectionFilter}
                onValueChange={(value) =>
                  value && setSectionFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue>
                    {sectionFilter === ALL
                      ? "All sections"
                      : sections.find(
                          (section) =>
                            section.id === sectionFilter,
                        )?.name}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  alignItemWithTrigger={false}
                >
                  <SelectItem value={ALL}>
                    All sections
                  </SelectItem>

                  {sections.map((section) => (
                    <SelectItem
                      key={section.id}
                      value={section.id}
                    >
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                Submission status
              </p>

              <div
                className="flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Submission status"
              >
                {STATUS_TABS.map((tab) => {
                  const count =
                    tab.key === ALL
                      ? statusCounts.all
                      : statusCounts[tab.key]

                  const active = statusFilter === tab.key

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(tab.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {tab.label}

                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                          active
                            ? "bg-primary-foreground/15 text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="shrink-0 text-xs text-muted-foreground lg:pb-2">
              Showing{" "}
              <span className="font-medium text-foreground">
                {visible.length}
              </span>{" "}
              students
            </p>
          </div>

          {/* Student list */}
          <div className="divide-y">
            {visible.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                  <UsersIcon className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  No students found
                </p>

                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  No students match the selected section and
                  submission status filters.
                </p>
              </div>
            )}

            {visible.map((entry) => {
              const hasSubmission = Boolean(entry.submission)
              const isGraded = entry.status === "Graded"
              const needsMarking =
                hasSubmission && !isGraded

              return (
                <div
                  key={entry.studentId}
                  className={cn(
                    "group flex flex-col gap-4 p-4 transition-colors hover:bg-muted/20",
                    needsMarking && "bg-blue-500/[0.02]",
                  )}
                >
                  {/* Student */}
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {initials(entry.studentName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate font-medium">
                          {entry.studentName}
                        </p>

                        <span className="text-xs text-muted-foreground">
                          {entry.enrollmentNumber}
                        </span>

                        <Badge
                          variant="outline"
                          className="text-[11px]"
                        >
                          {entry.sectionName}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {entry.submission ? (
                          <>
                            <span>
                              Submitted{" "}
                              {formatDateTime(
                                entry.submission
                                  .submittedAtUtc,
                              )}
                            </span>

                            {entry.submission.isLate && (
                              <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                                <AlertCircleIcon className="size-3.5" />
                                Late submission
                              </span>
                            )}

                            {entry.submission.attachments.length >
                              0 && (
                              <span className="flex items-center gap-1">
                                <PaperclipIcon className="size-3" />
                                {
                                  entry.submission.attachments
                                    .length
                                }{" "}
                                file
                                {entry.submission.attachments
                                  .length > 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            No submission yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission details + action */}
                  <div className="flex flex-wrap items-center gap-3 pl-13">
                    <CourseworkStatusBadge
                      status={entry.status}
                      className="shrink-0"
                    />

                    <div className="mr-auto flex min-w-20 items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Marks
                      </span>

                      {entry.submission?.marks != null ? (
                        <p className="font-semibold tabular-nums">
                          {entry.submission.marks}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{coursework.maxMarks}
                          </span>
                        </p>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          —
                        </span>
                      )}
                    </div>

                    {entry.submission ? (
                      <Button
                        size="sm"
                        variant={needsMarking ? "default" : "outline"}
                        onClick={() => setGrading(entry)}
                      >
                        {isGraded ? "Change marks" : "Grade submission"}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3Icon className="size-3.5" />
                        Awaiting submission
                      </div>
                    )}
                  </div>
                </div>
              )
})
          }
          </div>
        </CardContent>
      </Card>

      {/* Grade dialog */}
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