import { Card } from "@/components/atoms/card"
import { CalendarCheckIcon } from "lucide-react"

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">
          Track and manage student attendance
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-muted p-4">
            <CalendarCheckIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Attendance Module Not Available</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              This module isn't connected to a backend yet — coming in a later phase.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
