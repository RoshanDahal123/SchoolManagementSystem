import { Badge } from "@/components/atoms/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Progress } from "@/components/atoms/progress"
import { Skeleton } from "@/components/atoms/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table"
import { EmptyState } from "@/components/molecules/empty-state"
import { formatDate } from "@/helpers/date"
import { cn } from "@/lib/utils"
import { ChartNoAxesColumnIcon, MessageSquareTextIcon } from "lucide-react"
import { useGetProgressReportQuery } from "../coursework-api"
import { CourseworkStatusBadge } from "./coursework-status-badge"

interface Props {
  studentId: string
  /** Hidden on the student's own page, shown when a teacher or admin is looking. */
  showStudentName?: boolean
}

/** Green above 75, amber above 50, red below — the same thresholds a report card would use. */
function percentageTone(percentage: number) {
  if (percentage >= 75) return "text-green-600"
  if (percentage >= 50) return "text-amber-600"
  return "text-destructive"
}

export function ProgressReportPanel({ studentId, showStudentName = false }: Props) {
  const { data: report, isLoading } = useGetProgressReportQuery(
    { studentId },
    { skip: !studentId },
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!report) {
    return (
      <EmptyState
        icon={ChartNoAxesColumnIcon}
        title="No progress report available"
        description="Once coursework has been set and marked, results will appear here."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {showStudentName ? `${report.studentName} — overall` : "Overall"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {report.academicYearName ?? "No active academic year"}
            {showStudentName && ` · ${report.enrollmentNumber}`}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={cn("text-4xl font-semibold tabular-nums", percentageTone(report.overallPercentage))}>
              {report.overallPercentage.toFixed(1)}%
            </span>
            <span className="text-sm text-muted-foreground">
              {report.obtainedMarks} of {report.totalMarks} marks across {report.gradedCount} marked
              assignment{report.gradedCount === 1 ? "" : "s"}
            </span>
          </div>

          <Progress value={report.overallPercentage} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total set", value: report.totalCoursework, tone: "" },
              { label: "Submitted", value: report.submittedCount, tone: "text-blue-600" },
              { label: "Marked", value: report.gradedCount, tone: "text-green-600" },
              { label: "Overdue", value: report.overdueCount, tone: "text-destructive" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border p-3 text-center">
                <p className={cn("text-2xl font-semibold tabular-nums", stat.tone)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            The percentage counts marked work only, so it doesn't drop while a teacher still has
            your submissions to go through.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By subject</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.subjects.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing has been marked yet.</p>
          )}

          {report.subjects.map((subject) => (
            <div key={subject.subjectId} className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">
                  {subject.subjectName}
                  <Badge variant="outline" className="ml-2">
                    {subject.subjectCode}
                  </Badge>
                </p>
                <p className="text-sm tabular-nums">
                  <span className={cn("font-semibold", percentageTone(subject.percentage))}>
                    {subject.percentage.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {subject.obtainedMarks}/{subject.totalMarks} · {subject.gradedCount} marked
                  </span>
                </p>
              </div>
              <Progress value={subject.percentage} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Every assignment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead className="w-36">Subject</TableHead>
                <TableHead className="w-32">Due</TableHead>
                <TableHead className="w-36">Status</TableHead>
                <TableHead className="w-24">Marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No coursework has been set yet.
                  </TableCell>
                </TableRow>
              )}

              {report.items.map((item) => (
                <TableRow key={item.courseworkId}>
                  <TableCell>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.teacherName}</p>
                    {item.feedback && (
                      <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MessageSquareTextIcon className="mt-0.5 size-3 shrink-0" />
                        <span className="line-clamp-2">{item.feedback}</span>
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{item.subjectName}</TableCell>
                  <TableCell className="text-sm">{formatDate(item.dueAtUtc)}</TableCell>
                  <TableCell>
                    <CourseworkStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {item.marks != null ? (
                      <span className="font-medium">
                        {item.marks} / {item.maxMarks}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
