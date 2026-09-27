import { Card } from "@/components/atoms/card"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { AttendanceDailySheet } from "@/features/attendance/components/attendance-daily-sheet"
import { AttendanceRegister } from "@/features/attendance/components/attendance-register"
import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api"
import { useGetGradeLevelsQuery, useGetSectionsQuery } from "@/features/academic/academic-api"
import { useState } from "react"

export default function AttendancePage() {
  const [academicYearId, setAcademicYearId] = useState("")
  const [gradeLevelId, setGradeLevelId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [tab, setTab] = useState<"daily" | "register">("daily")

  const { data: years } = useGetAcademicYearsQuery()
  const { data: grades } = useGetGradeLevelsQuery()
  const { data: sections } = useGetSectionsQuery(gradeLevelId, { skip: !gradeLevelId })

  const ready = !!academicYearId && !!sectionId

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Take, review, and correct attendance across the school.</p>
      </div>

      <Card className="flex-row flex-wrap items-end gap-3 p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Academic Year</label>
          <Select value={academicYearId} onValueChange={(v) => v && setAcademicYearId(v)}>
            <SelectTrigger className="w-48">
              <SelectValue>{years?.find((y) => y.id === academicYearId)?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {years?.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Grade</label>
          <Select value={gradeLevelId} onValueChange={(v) => { v && setGradeLevelId(v); setSectionId("") }}>
            <SelectTrigger className="w-40">
              <SelectValue>{grades?.find((g) => g.id === gradeLevelId)?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {grades?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Section</label>
          <Select value={sectionId} onValueChange={(v) => v && setSectionId(v)} disabled={!gradeLevelId}>
            <SelectTrigger className="w-36">
              <SelectValue>{sections?.find((s) => s.id === sectionId)?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {sections?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTab("daily")} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tab === "daily" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>Daily</button>
          <button onClick={() => setTab("register")} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${tab === "register" ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>Register</button>
        </div>

        <div className="ml-auto space-y-1">
          {tab === "daily" ? (
            <><label className="text-sm font-medium">Date</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" /></>
          ) : (
            <><label className="text-sm font-medium">Month</label><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" /></>
          )}
        </div>
      </Card>

      {!ready ? (
        <Card className="p-12 text-center text-muted-foreground">Select a year, grade, and section.</Card>
      ) : tab === "daily" ? (
        <AttendanceDailySheet sectionId={sectionId} academicYearId={academicYearId} date={date} />
      ) : (
        <AttendanceRegister
          mode="section"
          sectionId={sectionId}
          academicYearId={academicYearId}
          month={month}
          canEdit
          onEditDate={(d) => { setDate(d); setTab("daily") }}
        />
      )}
    </div>
  )
}