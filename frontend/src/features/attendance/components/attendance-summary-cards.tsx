import { Card, CardContent } from "@/components/atoms/card"
import { ATTENDANCE_META } from "../status"

interface Props {
  presentCount: number
  lateCount: number
  absentCount: number
  excusedCount: number
  totalMarkedDays: number
  attendancePercentage: number
}

export function AttendanceSummaryCards({
  presentCount, lateCount, absentCount, excusedCount, totalMarkedDays, attendancePercentage,
}: Props) {
  const items = [
    { label: "Present", value: presentCount, meta: ATTENDANCE_META.Present },
    { label: "Late", value: lateCount, meta: ATTENDANCE_META.Late },
    { label: "Absent", value: absentCount, meta: ATTENDANCE_META.Absent },
    { label: "Excused", value: excusedCount, meta: ATTENDANCE_META.Excused },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold tabular-nums ${item.meta.dotClass.replace("bg-", "text-")}`}>
              {item.value}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{attendancePercentage.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">{totalMarkedDays} days recorded</p>
        </CardContent>
      </Card>
    </div>
  )
}