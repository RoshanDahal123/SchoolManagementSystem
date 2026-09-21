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
import { formatDateTime } from "@/helpers/date"
import { useAuth } from "@/hooks/use-auth"
import { getErrorMessage } from "@/lib/error-message"
import { PATHS } from "@/routes/paths"
import {
  BookOpenCheckIcon,
  CalendarClockIcon,
  PaperclipIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import { useState } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import type { CourseworkResponse } from "../@types"
import { useDeleteCourseworkMutation, useGetTeachingCourseworkQuery } from "../coursework-api"
import { CourseworkFormDialog } from "./coursework-form-dialog"

const ALL = "all"

export function TeacherCourseworkPanel() {
  const { teacherId } = useAuth()

  const [classSubjectId, setClassSubjectId] = useState<string>(ALL)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CourseworkResponse | null>(null)
  const [pendingDelete, setPendingDelete] = useState<CourseworkResponse | null>(null)

  const { data: assignments = [] } = useGetTeacherAssignmentsQuery(teacherId ?? "", {
    skip: !teacherId,
  })

  const { data: coursework, isLoading } = useGetTeachingCourseworkQuery(
    classSubjectId === ALL ? undefined : { classSubjectId },
  )

  const [deleteCoursework, { isLoading: isDeleting }] = useDeleteCourseworkMutation()

  const selectedAssignment = assignments.find((a) => a.classSubjectId === classSubjectId)

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
      toast.error(getErrorMessage(error, "Couldn't remove this coursework"))
    }
  }

  return (
    <div className="space-y-4">
      <Card className="flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Class</label>
          <Select value={classSubjectId} onValueChange={(value) => value && setClassSubjectId(value)}>
            <SelectTrigger className="w-72">
              <SelectValue>
                {classSubjectId === ALL
                  ? "All my classes"
                  : selectedAssignment &&
                    `${selectedAssignment.gradeLevelName} — ${selectedAssignment.subjectName}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All my classes</SelectItem>
              {assignments.map((assignment) => (
                <SelectItem key={assignment.classSubjectId} value={assignment.classSubjectId}>
                  {assignment.gradeLevelName} — {assignment.subjectName} ({assignment.academicYearName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button className="ml-auto" onClick={openCreate} disabled={assignments.length === 0}>
          <PlusIcon className="size-4" />
          New coursework
        </Button>
      </Card>

      {isLoading && (
        <div className="grid gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {!isLoading && coursework?.length === 0 && (
        <EmptyState
          icon={BookOpenCheckIcon}
          title="No coursework yet"
          description={
            assignments.length === 0
              ? "Once an administrator assigns you to a subject, you can set work for that class here."
              : "Post your first assignment and it will appear in your students' portals straight away."
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

      <div className="grid gap-3">
        {coursework?.map((item) => {
          // Marked-out-of-submitted, not out-of-class: the bar answers "how much marking is
          // left", which is the question a teacher actually has looking at this list.
          const markedPercent =
            item.submittedCount === 0 ? 0 : Math.round((item.gradedCount / item.submittedCount) * 100)

          return (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={PATHS.teacherCourseworkDetails(item.id)}
                      className="font-medium hover:underline"
                    >
                      {item.title}
                    </Link>
                    <Badge variant="secondary">{item.subjectCode}</Badge>
                    <Badge variant="outline">{item.gradeLevelName}</Badge>
                    {item.isPastDue && <Badge variant="destructive">Closed</Badge>}
                  </div>

                  {item.instructions && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{item.instructions}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClockIcon className="size-3.5" />
                      Due {formatDateTime(item.dueAtUtc)}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon className="size-3.5" />
                      {item.submittedCount} of {item.totalStudents} submitted
                    </span>
                    {item.attachments.length > 0 && (
                      <span className="flex items-center gap-1">
                        <PaperclipIcon className="size-3.5" />
                        {item.attachments.length} file{item.attachments.length > 1 ? "s" : ""}
                      </span>
                    )}
                    <span>Out of {item.maxMarks} marks</span>
                  </div>

                  <div className="max-w-xs space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Marking progress</span>
                      <span className="tabular-nums">
                        {item.gradedCount}/{item.submittedCount}
                      </span>
                    </div>
                    <Progress value={markedPercent} />
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button variant="outline" size="sm" render={<Link to={PATHS.teacherCourseworkDetails(item.id)} />}>
                    Review submissions
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="Edit">
                    <PencilIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setPendingDelete(item)}
                    aria-label="Delete"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <CourseworkFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        assignments={assignments}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this coursework?"
        description={`"${pendingDelete?.title}" and every submission against it will be permanently removed.`}
        confirmLabel="Delete"
        loading={isDeleting}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
