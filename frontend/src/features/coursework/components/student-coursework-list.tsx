import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent } from "@/components/atoms/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import { Skeleton } from "@/components/atoms/skeleton"
import { EmptyState } from "@/components/molecules/empty-state"
import { formatDateTime } from "@/helpers/date"
import { cn } from "@/lib/utils"
import {
  BookOpenIcon,
  CalendarClockIcon,
  CircleCheckIcon,
  MessageSquareTextIcon,
  PaperclipIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { CourseworkStatus, StudentCoursework } from "../@types"
import { useGetMyCourseworkQuery } from "../coursework-api"
import { AttachmentList } from "./attachment-list"
import { CourseworkStatusBadge } from "./coursework-status-badge"
import { SubmitWorkDialog } from "./submit-work-dialog"

const ALL = "all"

type TabKey = "todo" | "submitted" | "marked" | "all"

const TABS: { key: TabKey; label: string; matches: (status: CourseworkStatus) => boolean }[] = [
  { key: "todo", label: "To do", matches: (s) => s === "Pending" || s === "Overdue" },
  { key: "submitted", label: "Awaiting marks", matches: (s) => s === "Submitted" },
  { key: "marked", label: "Marked", matches: (s) => s === "Graded" },
  { key: "all", label: "All", matches: () => true },
]

/** Rough "3 days left" / "2 days overdue" string — friendlier than a bare timestamp. */
function describeDeadline(dueAtUtc: string): { text: string; urgent: boolean } {
  const diffMs = new Date(dueAtUtc).getTime() - Date.now()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays)
    return { text: overdueDays === 0 ? "Due today — deadline passed" : `${overdueDays}d overdue`, urgent: true }
  }

  if (diffHours <= 24) return { text: `Due in ${Math.max(diffHours, 1)}h`, urgent: true }
  return { text: `${diffDays} day${diffDays === 1 ? "" : "s"} left`, urgent: diffDays <= 2 }
}

export function StudentCourseworkList() {
  const { data, isLoading } = useGetMyCourseworkQuery()

  const [tab, setTab] = useState<TabKey>("todo")
  const [subjectId, setSubjectId] = useState(ALL)
  const [submitting, setSubmitting] = useState<StudentCoursework | null>(null)

  const items = useMemo(() => data ?? [], [data])

  const subjects = useMemo(() => {
    const seen = new Map<string, string>()
    items.forEach((item) => seen.set(item.coursework.subjectId, item.coursework.subjectName))
    return [...seen.entries()].map(([id, name]) => ({ id, name }))
  }, [items])

  const activeTab = TABS.find((t) => t.key === tab)!

  const visible = items.filter(
    (item) =>
      activeTab.matches(item.status) &&
      (subjectId === ALL || item.coursework.subjectId === subjectId),
  )

  const counts = useMemo(
    () =>
      TABS.reduce<Record<TabKey, number>>(
        (acc, t) => {
          acc[t.key] = items.filter((item) => t.matches(item.status)).length
          return acc
        },
        { todo: 0, submitted: 0, marked: 0, all: 0 },
      ),
    [items],
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="flex-row flex-wrap items-center gap-3 p-3">
        {/* Plain buttons rather than the Tabs atom — these drive a filter, not separate panels,
            and keeping one list means the empty state reads correctly for every tab. */}
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <Badge variant="outline" className="ml-1.5">
                {counts[t.key]}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="ml-auto">
          <Select value={subjectId} onValueChange={(value) => value && setSubjectId(value)}>
            <SelectTrigger className="w-52">
              <SelectValue>
                {subjectId === ALL ? "All subjects" : subjects.find((s) => s.id === subjectId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="end" sideOffset={6} alignItemWithTrigger={false}>
              <SelectItem value={ALL}>All subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {visible.length === 0 && (
        <EmptyState
          icon={tab === "todo" ? CircleCheckIcon : BookOpenIcon}
          title={tab === "todo" ? "Nothing due right now" : "Nothing here yet"}
          description={
            tab === "todo"
              ? "You're caught up. New work from your teachers will appear here."
              : "Work will show up here once it reaches this stage."
          }
        />
      )}

      <div className="grid gap-3">
        {visible.map((item) => {
          const deadline = describeDeadline(item.coursework.dueAtUtc)
          const submission = item.mySubmissin

          return (
            <Card key={item.coursework.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.coursework.title}</p>
                      <Badge variant="secondary">{item.coursework.subjectName}</Badge>
                      <CourseworkStatusBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set by {item.coursework.teacherName} · out of {item.coursework.maxMarks} marks
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        deadline.urgent && item.status !== "Graded" && item.status !== "Submitted"
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      <CalendarClockIcon className="size-3.5" />
                      {deadline.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.coursework.dueAtUtc)}
                    </p>
                  </div>
                </div>

                {item.coursework.instructions && (
                  <p className="whitespace-pre-wrap text-sm">{item.coursework.instructions}</p>
                )}

                {item.coursework.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <PaperclipIcon className="size-3.5" />
                      From your teacher
                    </p>
                    <AttachmentList attachments={item.coursework.attachments} />
                  </div>
                )}

                {submission && (
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">
                      You submitted {formatDateTime(submission.submittedAtUtc)}
                      {submission.isLate && (
                        <span className="ml-1 font-medium text-amber-600">· late</span>
                      )}
                    </p>

                    <AttachmentList attachments={submission.attachments} />

                    {submission.marks != null && (
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-semibold tabular-nums">
                          {submission.marks}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          / {submission.maxMarks}
                        </span>
                      </div>
                    )}

                    {submission.feedback && (
                      <div className="flex items-start gap-2 pt-1 text-sm">
                        <MessageSquareTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <p className="whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  {item.canSubmit ? (
                    <Button
                      variant={submission ? "outline" : "default"}
                      size="sm"
                      onClick={() => setSubmitting(item)}
                    >
                      {submission ? "Replace submission" : "Submit work"}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {item.status === "Graded"
                        ? "Marked — this can no longer be changed."
                        : "Submissions are closed for this assignment."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SubmitWorkDialog
        open={!!submitting}
        onOpenChange={(open) => !open && setSubmitting(null)}
        item={submitting}
      />
    </div>
  )
}
