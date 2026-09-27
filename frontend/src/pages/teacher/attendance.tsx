import { Card } from "@/components/atoms/card"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { AttendanceDailySheet } from "@/features/attendance/components/attendance-daily-sheet"
import { AttendanceRegister } from "@/features/attendance/components/attendance-register"
import { useGetTeacherHomeroomSectionsQuery } from "@/features/teachers/teacher-api"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"

export default function TeacherAttendancePage() {
  const { teacherId } = useAuth()
  const { data: sections = [], isLoading } = useGetTeacherHomeroomSectionsQuery(teacherId ?? "", { skip: !teacherId })

  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [tab, setTab] = useState<"daily" | "register">("daily")

  const selected = sections.find((s) => s.sectionId === sectionId)
  const activeSectionId = sectionId || sections[0]?.sectionId || ""
  const activeYearId = selected?.academicYearId || sections[0]?.academicYearId || ""

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Take and review attendance for your homeroom section.</p>
      </div>

      {!isLoading && sections.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          You aren't assigned as a homeroom teacher for any section — contact your administrator.
        </Card>
      )}

      {sections.length > 0 && (
        <>
          <Card className="flex-row flex-wrap items-end gap-3 p-4">
            {sections.length > 1 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Section</label>
                <Select value={activeSectionId} onValueChange={(v) => v && setSectionId(v)}>
                  <SelectTrigger className="w-56">
                    <SelectValue>
                      {sections.find((s) => s.sectionId === activeSectionId)?.gradeLevelName} —{" "}
                      {sections.find((s) => s.sectionId === activeSectionId)?.sectionName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                    {sections.map((s) => (
                      <SelectItem key={s.sectionId} value={s.sectionId}>
                        {s.gradeLevelName} — {s.sectionName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setTab("daily")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tab === "daily" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              >
                Daily Attendance
              </button>
              <button
                onClick={() => setTab("register")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tab === "register" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}
              >
                Attendance Register
              </button>
            </div>

            <div className="ml-auto space-y-1">
              {tab === "daily" ? (
                <>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
                </>
              ) : (
                <>
                  <label className="text-sm font-medium">Month</label>
                  <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
                </>
              )}
            </div>
          </Card>

          {tab === "daily" ? (
            <AttendanceDailySheet sectionId={activeSectionId} academicYearId={activeYearId} date={date} />
          ) : (
            <AttendanceRegister
              mode="section"
              sectionId={activeSectionId}
              academicYearId={activeYearId}
              month={month}
              canEdit
              onEditDate={(d) => {
                setDate(d)
                setTab("daily")
              }}
            />
          )}
        </>
      )}
    </div>
  )
}