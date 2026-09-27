import { cn } from "@/lib/utils"
import { ATTENDANCE_META } from "../status"
import type { AttendanceStatus } from "../@types"

interface Props {
  status?: AttendanceStatus | null
  muted?: boolean // weekend / future — shown as a dash, no click affordance
  size?: "sm" | "md"
  title?: string
  onClick?: () => void
}

export function AttendanceStatusCell({ status, muted, size = "sm", title, onClick }: Props) {
  const dims = size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs"

  if (!status) {
    return (
      <span
        title={title ?? (muted ? "" : "Not recorded")}
        onClick={onClick}
        className={cn(
          "flex items-center justify-center rounded border border-dashed text-muted-foreground/40",
          dims,
          onClick && "cursor-pointer hover:border-primary/40",
          muted && "border-transparent"
        )}
      >
        {muted ? "" : "–"}
      </span>
    )
  }

  const meta = ATTENDANCE_META[status]
  return (
    <span
      title={title ?? meta.label}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded border font-semibold",
        dims,
        meta.cellClass,
        onClick && "cursor-pointer"
      )}
    >
      {meta.code}
    </span>
  )
}