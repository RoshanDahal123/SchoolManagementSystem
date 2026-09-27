import { Card } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { useGetSectionAttendanceRegisterQuery, useGetStudentAttendanceQuery, useGetStudentAttendanceSummaryQuery } from "../attendance-api"
import { isFuture, isWeekend, monthRange } from "../status"
import type { StudentRegisterRow } from "../@types"
import { AttendanceLegend } from "./attendance-legend"
import { AttendanceStatusCell } from "./attendance-status-cell"
import { AttendanceSummaryCards } from "./attendance-summary-cards"

type SectionModeProps = {
  mode: "section"
  sectionId: string
  academicYearId: string
  month: string // "YYYY-MM"
  canEdit?: boolean
  onEditDate?: (date: string) => void
}

type StudentModeProps = {
  mode: "student"
  studentId: string
  month: string
}

type Props = SectionModeProps | StudentModeProps

export function AttendanceRegister(props: Props) {
  const { from, to, dates } = useMemo(() => monthRange(props.month), [props.month])

  const sectionQuery = useGetSectionAttendanceRegisterQuery(
    props.mode === "section" ? { sectionId: props.sectionId, academicYearId: props.academicYearId, from, to } : (undefined as never),
    { skip: props.mode !== "section" }
  )

  const studentRecordsQuery = useGetStudentAttendanceQuery(
    props.mode === "student" ? { studentId: props.studentId, from, to } : (undefined as never),
    { skip: props.mode !== "student" }
  )
  const studentSummaryQuery = useGetStudentAttendanceSummaryQuery(
    props.mode === "student" ? { studentId: props.studentId, from, to } : (undefined as never),
    { skip: props.mode !== "student" }
  )

  const isLoading =
    props.mode === "section" ? sectionQuery.isLoading : studentRecordsQuery.isLoading || studentSummaryQuery.isLoading

  const rows: StudentRegisterRow[] = useMemo(() => {
    if (props.mode === "section") {
      return sectionQuery.data?.students ?? []
    }
    if (!studentRecordsQuery.data || !studentSummaryQuery.data) return []
    const statusByDate = Object.fromEntries(studentRecordsQuery.data.map((r) => [r.date, r.status]))
    return [
      {
        enrollmentId: "self",
        studentId: props.studentId,
        studentName: "Your attendance",
        enrollmentNumber: "",
        statusByDate,
        presentCount: studentSummaryQuery.data.presentCount,
        lateCount: studentSummaryQuery.data.lateCount,
        absentCount: studentSummaryQuery.data.absentCount,
        excusedCount: studentSummaryQuery.data.excusedCount,
        totalMarkedDays: studentSummaryQuery.data.totalMarkedDays,
        attendancePercentage: studentSummaryQuery.data.attendancePercentage,
      },
    ]
  }, [props, sectionQuery.data, studentRecordsQuery.data, studentSummaryQuery.data])

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (rows.length === 0) {
    return <Card className="p-12 text-center text-muted-foreground">No attendance records for this month yet.</Card>
  }

  // Student mode shows its own summary strip up top; section mode's summary is per-row, in the table.
  return (
    <div className="space-y-3">
      {props.mode === "student" && <AttendanceSummaryCards {...rows[0]} />}
      <div className="flex items-center justify-between">
        <AttendanceLegend />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-10 min-w-48 border-r bg-muted/40 p-2 text-left font-medium">
                {props.mode === "section" ? "Student" : ""}
              </th>
              {dates.map((d) => {
                const day = new Date(d + "T00:00:00")
                return (
                  <th
                    key={d}
                    className={cn(
                      "w-9 p-1 text-center text-[10px] font-medium",
                      isWeekend(d) && "bg-muted/70 text-muted-foreground"
                    )}
                  >
                    <div>{day.getDate()}</div>
                    <div className="text-muted-foreground">{day.toLocaleDateString(undefined, { weekday: "narrow" })}</div>
                  </th>
                )
              })}
              <th className="min-w-24 p-2 text-center font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.enrollmentId} className="border-b last:border-0">
                <td className="sticky left-0 z-10 border-r bg-card p-2">
                  <p className="truncate text-sm font-medium">{row.studentName}</p>
                  {row.enrollmentNumber && (
                    <p className="text-xs text-muted-foreground">{row.enrollmentNumber}</p>
                  )}
                </td>
                {dates.map((d) => {
                  const editable = props.mode === "section" && props.canEdit && !isFuture(d)
                  return (
                    <td key={d} className={cn("p-1 text-center", isWeekend(d) && "bg-muted/30")}>
                      <AttendanceStatusCell
                        status={row.statusByDate[d]}
                        muted={isWeekend(d) || isFuture(d)}
                        title={isFuture(d) ? "Future date" : isWeekend(d) ? "Weekend" : undefined}
                        onClick={editable ? () => props.onEditDate?.(d) : undefined}
                      />
                    </td>
                  )
                })}
                <td className="p-2 text-center">
                  <span className="text-sm font-semibold tabular-nums">{row.attendancePercentage.toFixed(0)}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}