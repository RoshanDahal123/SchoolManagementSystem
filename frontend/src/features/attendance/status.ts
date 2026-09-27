import type { AttendanceStatus } from "./@types"

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["Present", "Late", "Absent", "Excused"]

export const ATTENDANCE_META: Record<
  AttendanceStatus,
  { code: string; label: string; cellClass: string; dotClass: string; solidClass: string }
> = {
  Present: {
    code: "P",
    label: "Present",
    cellClass: "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
    dotClass: "bg-green-500",
    solidClass: "bg-green-600 text-white hover:bg-green-600",
  },
  Late: {
    code: "L",
    label: "Late",
    cellClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
    dotClass: "bg-amber-500",
    solidClass: "bg-amber-500 text-white hover:bg-amber-500",
  },
  Absent: {
    code: "A",
    label: "Absent",
    cellClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
    dotClass: "bg-red-500",
    solidClass: "bg-red-600 text-white hover:bg-red-600",
  },
  Excused: {
    code: "E",
    label: "Excused",
    cellClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
    dotClass: "bg-blue-500",
    solidClass: "bg-blue-600 text-white hover:bg-blue-600",
  },
}

export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function isWeekend(dateKey: string): boolean {
  const day = new Date(dateKey + "T00:00:00").getDay()
  return day === 0 || day === 6
}

export function isFuture(dateKey: string): boolean {
  return dateKey > toDateKey(new Date())
}

export function monthRange(monthKey: string): { from: string; to: string; dates: string[] } {
  const [y, m] = monthKey.split("-").map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const dates: string[] = []
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) dates.push(toDateKey(d))
  return { from: toDateKey(first), to: toDateKey(last), dates }
}