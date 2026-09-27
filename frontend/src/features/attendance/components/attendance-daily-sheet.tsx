import { Button } from "@/components/atoms/button"
import { Card } from "@/components/atoms/card"
import { Skeleton } from "@/components/atoms/skeleton"
import { cn } from "@/lib/utils"
import { CheckCheckIcon, SaveIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { AttendanceStatus } from "../@types"
import { useGetRosterAttendanceQuery, useMarkAttendanceMutation } from "../attendance-api"
import { ATTENDANCE_META, ATTENDANCE_STATUSES } from "../status"
import { AttendanceLegend } from "./attendance-legend"

interface Props {
  sectionId: string
  academicYearId: string
  date: string
  readOnly?: boolean
}

export function AttendanceDailySheet({ sectionId, academicYearId, date, readOnly }: Props) {
  const { data: roster, isLoading, isFetching } = useGetRosterAttendanceQuery(
    { sectionId, academicYearId, date },
    { skip: !sectionId || !academicYearId || !date }
  )
  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation()

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})

  // Re-seed the draft whenever the underlying roster changes (new date, new section, or a fresh save).
  useEffect(() => {
    if (!roster) return
    setDraft(Object.fromEntries(roster.map((r) => [r.enrollmentId, r.status])))
  }, [roster])

  const hasUnsavedChanges =
    !!roster && roster.some((r) => (draft[r.enrollmentId] ?? r.status) !== r.status)

  function setStatus(enrollmentId: string, status: AttendanceStatus) {
    if (readOnly) return
    setDraft((d) => ({ ...d, [enrollmentId]: status }))
  }

  function markAllPresent() {
    if (readOnly || !roster) return
    setDraft(Object.fromEntries(roster.map((r) => [r.enrollmentId, "Present" as AttendanceStatus])))
  }

  async function handleSave() {
    if (!roster) return
    try {
      await markAttendance({
        sectionId,
        academicYearId,
        data: {
          date,
          entries: roster.map((r) => ({
            enrollmentId: r.enrollmentId,
            status: draft[r.enrollmentId] ?? r.status,
          })),
        },
      }).unwrap()
      toast.success("Attendance saved")
    } catch {
      toast.error("Failed to save attendance")
    }
  }

  if (isLoading || isFetching) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!roster || roster.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        No active students in this section.
      </Card>
    )
  }

  const alreadyExists = roster.some((r) => r.attendanceId != null)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AttendanceLegend />
        {!readOnly && (
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
            <Button variant="outline" size="sm" onClick={markAllPresent}>
              <CheckCheckIcon className="size-4" />
              Mark all present
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              <SaveIcon className="size-4" />
              {isSaving ? "Saving…" : alreadyExists ? "Update attendance" : "Save attendance"}
            </Button>
          </div>
        )}
      </div>

      {alreadyExists && !readOnly && (
        <p className="text-xs text-muted-foreground">
          Attendance for this date already exists — changes here will update it.
        </p>
      )}

      <div className="grid gap-1.5">
        {roster.map((r) => {
          const status = draft[r.enrollmentId] ?? r.status
          return (
            <Card key={r.enrollmentId} className="flex-row items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.studentName}</p>
                <p className="text-xs text-muted-foreground">{r.enrollmentNumber}</p>
              </div>

              {readOnly ? (
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    ATTENDANCE_META[status].cellClass
                  )}
                >
                  {ATTENDANCE_META[status].label}
                </span>
              ) : (
                <div className="flex shrink-0 overflow-hidden rounded-lg border">
                  {ATTENDANCE_STATUSES.map((s) => {
                    const active = status === s
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(r.enrollmentId, s)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold transition-colors",
                          active ? ATTENDANCE_META[s].solidClass : "bg-card text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {ATTENDANCE_META[s].code}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}