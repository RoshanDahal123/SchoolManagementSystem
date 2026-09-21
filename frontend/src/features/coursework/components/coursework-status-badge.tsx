import { Badge } from "@/components/atoms/badge"
import { cn } from "@/lib/utils"
import type { CourseworkStatus } from "../@types"

/**
 * One badge, four states, used identically on the teacher's board and the student's list so a
 * colour means the same thing everywhere in the app.
 */
const STYLES: Record<CourseworkStatus, { label: string; className: string }> = {
  Pending: { label: "Not submitted", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  Overdue: { label: "Overdue", className: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300" },
  Submitted: { label: "Awaiting marks", className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300" },
  Graded: { label: "Marked", className: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" },
}

export function CourseworkStatusBadge({ status, className }: { status: CourseworkStatus; className?: string }) {
  const style = STYLES[status] ?? STYLES.Pending
  return <Badge className={cn("border-transparent", style.className, className)}>{style.label}</Badge>
}
