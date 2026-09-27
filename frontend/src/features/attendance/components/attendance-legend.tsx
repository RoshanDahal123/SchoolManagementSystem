import { ATTENDANCE_META, ATTENDANCE_STATUSES } from "../status"

export function AttendanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {ATTENDANCE_STATUSES.map((s) => {
        const meta = ATTENDANCE_META[s]
        return (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${meta.dotClass}`} />
            {meta.code} = {meta.label}
          </span>
        )
      })}
    </div>
  )
}