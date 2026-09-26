import { Badge } from "@/components/atoms/badge"
import { cn } from "@/lib/utils"
import type { CourseworkResponse } from "../@types"
import { getLifecycleStatus, type LifecycleStatus } from "../status"
import {
  AlertTriangleIcon,
  CalendarIcon,
  ClockIcon,
} from "lucide-react"

const STYLES: Record<
  LifecycleStatus,
  {
    label: string
    icon: typeof ClockIcon
    className: string
  }
> = {
  Overdue: {
    label: "Overdue",
    icon: AlertTriangleIcon,
    className:
      "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },

  Active: {
    label: "Active",
    icon: ClockIcon,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },

  Upcoming: {
    label: "Upcoming",
    icon: CalendarIcon,
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
}

export function CourseworkLifecycleBadge({
  coursework,
  className,
}: {
  coursework: CourseworkResponse
  className?: string
}) {
  const status = getLifecycleStatus(coursework)
  const { label, icon: Icon, className: styleClass } = STYLES[status]

  return (
    <Badge
      className={cn(
        "gap-1 border-transparent font-medium",
        styleClass,
        className
      )}
    >
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}