import { AttendanceMarkingSheet } from "@/features/attendance/components/attendance-marking-sheet"

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Mark and review daily attendance</p>
      </div>
      <AttendanceMarkingSheet />
    </div>
  )
}