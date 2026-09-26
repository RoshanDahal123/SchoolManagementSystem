import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent } from "@/components/atoms/card"
import { Progress } from "@/components/atoms/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import { Skeleton } from "@/components/atoms/skeleton"
import { ConfirmDialog } from "@/components/molecules/confirm-dialog"
import { EmptyState } from "@/components/molecules/empty-state"
import { useGetTeacherAssignmentsQuery } from "@/features/teachers/teacher-api"
import { formatDate, formatDateTime } from "@/helpers/date"
import { useAuth } from "@/hooks/use-auth"
import { getErrorMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"
import { PATHS } from "@/routes/paths"
import {
  BookOpenCheckIcon,
  CalendarClockIcon,
  CalendarPlusIcon,
  CheckCircle2Icon,
  Clock3Icon,
  EllipsisIcon,
  PaperclipIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import type { CourseworkResponse } from "../@types"
import {
  useDeleteCourseworkMutation,
  useGetTeachingCourseworkQuery,
} from "../coursework-api"
import { matchesFilter, type CourseworkFilter } from "../status"
import { CourseworkFormDialog } from "./coursework-form-dialog"
import { CourseworkLifecycleBadge } from "./coursework-lifecycle-badge"
import { CourseworkSummaryCards } from "./coursework-summary-card"

const ALL = "all"

export function TeacherCourseworkPanel() {
  const { teacherId } = useAuth()

  const [classSubjectId, setClassSubjectId] = useState<string>(ALL)
  const [filter, setFilter] = useState<CourseworkFilter>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseworkResponse | null>(null)
  const [pendingDelete, setPendingDelete] =
    useState<CourseworkResponse | null>(null)

  const { data: assignments = [], isLoading: isLoadingAssignments } =
    useGetTeacherAssignmentsQuery(teacherId ?? "", {
      skip: !teacherId,
    })

  const {
    data: coursework = [],
    isLoading: isLoadingCoursework,
  } = useGetTeachingCourseworkQuery(
    classSubjectId === ALL ? undefined : { classSubjectId },
  )

  const [deleteCoursework, { isLoading: isDeleting }] =
    useDeleteCourseworkMutation()

  const isLoading = isLoadingAssignments || isLoadingCoursework

  const selectedAssignment = assignments.find(
    (assignment) => assignment.classSubjectId === classSubjectId,
  )

  const visible = coursework.filter((item) =>
    matchesFilter(item, filter),
  )

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: CourseworkResponse) {
    setEditing(item)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteCoursework(pendingDelete.id).unwrap()

      toast.success("Coursework removed")
      setPendingDelete(null)
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Couldn't remove this coursework"),
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page controls */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Coursework</p>
            <p className="text-xs text-muted-foreground">
              Manage assignments, submissions, and grading for your classes.
            </p>

            <div className="pt-2">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Class
              </label>

              <Select
                value={classSubjectId}
                onValueChange={(value) => {
                  if (value) {
                    setClassSubjectId(value)
                    setFilter("all")
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue>
                    {classSubjectId === ALL
                      ? "All my classes"
                      : selectedAssignment
                        ? `${selectedAssignment.gradeLevelName} — ${selectedAssignment.subjectName}`
                        : "Select class"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  alignItemWithTrigger={false}
                >
                  <SelectItem value={ALL}>
                    All my classes
                  </SelectItem>

                  {assignments.map((assignment) => (
                    <SelectItem
                      key={assignment.classSubjectId}
                      value={assignment.classSubjectId}
                    >
                      {assignment.gradeLevelName} —{" "}
                      {assignment.subjectName}{" "}
                      ({assignment.academicYearName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={openCreate}
            disabled={assignments.length === 0}
          >
            <PlusIcon className="size-4" />
            New coursework
          </Button>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>

          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && coursework.length === 0 && (
        <EmptyState
          icon={BookOpenCheckIcon}
          title="No coursework yet"
          description={
            assignments.length === 0
              ? "Once an administrator assigns you to a subject, you can set coursework for that class here."
              : "Create your first coursework and it will appear in your students' portal."
          }
          action={
            assignments.length > 0 ? (
              <Button onClick={openCreate}>
                <PlusIcon className="size-4" />
                New coursework
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Coursework content */}
      {!isLoading && coursework.length > 0 && (
        <>
          {/* Summary */}
          <CourseworkSummaryCards
            coursework={coursework}
            active={filter}
            onSelect={setFilter}
          />

          {/* List header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">
                {filter === "all"
                  ? "All Coursework"
                  : filter === "awaitingMarks"
                    ? "Awaiting Marks"
                    : filter === "marked"
                      ? "Marked Coursework"
                      : filter === "notSubmitted"
                        ? "Not Submitted"
                        : "Overdue Coursework"}
              </h2>

              <p className="text-xs text-muted-foreground">
                {visible.length}{" "}
                {visible.length === 1 ? "coursework" : "courseworks"}
              </p>
            </div>
          </div>

          {/* No filtered results */}
          {visible.length === 0 && (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/20 px-6 text-center">
              <div>
                <p className="text-sm font-medium">
                  No coursework matches this filter
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try selecting another coursework status.
                </p>
              </div>
            </div>
          )}

          {/* Coursework list */}
          <div className="grid gap-4">
            {visible.map((item) => {
              const remaining = Math.max(
                0,
                item.totalStudents - item.submittedCount,
              )

              const submissionPercent =
                item.totalStudents === 0
                  ? 0
                  : Math.round(
                      (item.submittedCount / item.totalStudents) * 100,
                    )

              const awaitingMarks =
                Math.max(
                  0,
                  item.submittedCount - item.gradedCount,
                )

              const allSubmitted =
                item.totalStudents > 0 &&
                item.submittedCount === item.totalStudents

              const allMarked =
                item.submittedCount > 0 &&
                item.gradedCount === item.submittedCount

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden transition-shadow hover:shadow-sm"
                >
                  <CardContent className="space-y-5 p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={PATHS.teacherCourseworkDetails(item.id)}
                            className="truncate text-base font-semibold hover:text-primary hover:underline"
                          >
                            {item.title}
                          </Link>

                          <Badge variant="secondary">
                            {item.subjectCode}
                          </Badge>

                          <Badge variant="outline">
                            {item.gradeLevelName}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {item.subjectName}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <CourseworkLifecycleBadge coursework={item} />

                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`More actions for ${item.title}`}
                            onClick={(event) => {
                              const target =
                                event.currentTarget.nextElementSibling

                              if (target instanceof HTMLElement) {
                                target.classList.toggle("hidden")
                              }
                            }}
                          >
                            <EllipsisIcon className="size-4" />
                          </Button>

                          <div className="absolute right-0 top-full z-20 mt-1 hidden w-40 rounded-lg border bg-popover p-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              Edit coursework
                            </button>

                            <button
                              type="button"
                              onClick={() => setPendingDelete(item)}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                            >
                              <Trash2Icon className="size-4" />
                              Delete coursework
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarPlusIcon className="size-3.5" />
                        Assigned {formatDate(item.createdAtUtc)}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <CalendarClockIcon className="size-3.5" />
                        Due {formatDateTime(item.dueAtUtc)}
                      </span>

                      <span>
                        Max marks:{" "}
                        <span className="font-medium text-foreground">
                          {item.maxMarks}
                        </span>
                      </span>

                      {item.attachments.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <PaperclipIcon className="size-3.5" />
                          {item.attachments.length}{" "}
                          {item.attachments.length === 1
                            ? "attachment"
                            : "attachments"}
                        </span>
                      )}
                    </div>

                    {/* Submission progress */}
                    <div className="space-y-2">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <UsersIcon className="size-4 text-muted-foreground" />
                            Submission progress
                          </div>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.submittedCount} of{" "}
                            {item.totalStudents} submitted
                            {" · "}
                            {remaining} remaining
                          </p>
                        </div>

                        <span className="text-sm font-semibold tabular-nums">
                          {submissionPercent}%
                        </span>
                      </div>

                      <Progress
                        value={submissionPercent}
                        className="h-2"
                      />
                    </div>

                    {/* Status + action */}
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        {awaitingMarks > 0 ? (
                          <Badge className="gap-1 border-transparent bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
                            <Clock3Icon className="size-3" />
                            {awaitingMarks}{" "}
                            {awaitingMarks === 1
                              ? "submission"
                              : "submissions"}{" "}
                            awaiting marks
                          </Badge>
                        ) : allMarked ? (
                          <Badge className="gap-1 border-transparent bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300">
                            <CheckCircle2Icon className="size-3" />
                            All submissions marked
                          </Badge>
                        ) : allSubmitted ? (
                          <Badge variant="secondary">
                            All students submitted
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            No submissions yet
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        render={
                          <Link
                            to={PATHS.teacherCourseworkDetails(item.id)}
                          />
                        }
                      >
                        Review submissions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Create / Edit */}
      <CourseworkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        assignments={assignments}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        title="Delete this coursework?"
        description={`"${pendingDelete?.title}" and every submission against it will be permanently removed.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}