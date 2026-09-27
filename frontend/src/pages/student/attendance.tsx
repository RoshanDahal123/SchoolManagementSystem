import { Card } from "@/components/atoms/card"
import { Input } from "@/components/atoms/input"
import { AttendanceRegister } from "@/features/attendance/components/attendance-register"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"

export default function StudentAttendancePage() {
  const { studentId } = useAuth()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  if (!studentId) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground">Your attendance record for the selected month.</p>
        </div>
        <Card className="flex-row items-center gap-2 p-2">
          <label className="text-sm font-medium pl-2">Month</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
        </Card>
      </div>

      <AttendanceRegister mode="student" studentId={studentId} month={month} />
    </div>
  )
}