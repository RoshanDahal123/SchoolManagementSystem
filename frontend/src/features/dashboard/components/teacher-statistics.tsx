import { Skeleton } from "@/components/atoms/skeleton"
import { useGetAllTeachersQuery } from "@/features/teachers/teacher-api"

interface TeacherStatisticsProps {
  isLoading?: boolean
}

export function TeacherStatistics({ isLoading: isParentLoading }: TeacherStatisticsProps) {
  const { data: teachers, isLoading: isTeachersLoading } = useGetAllTeachersQuery()
  const isLoading = isParentLoading || isTeachersLoading

  if (isLoading) {
    return (
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const total = teachers?.length ?? 0

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No teachers added yet.
      </p>
    )
  }

  const categories = [
    {
      label: "Active Portal Access",
      count: teachers!.filter((t) => t.hasPortalAccount && t.isPortalActive === true).length,
      colorClass: "bg-primary",
      description: "Signed in and managing courses",
    },
    {
      label: "Pending Verification",
      count: teachers!.filter((t) => t.hasPortalAccount && t.isPortalActive !== true).length,
      colorClass: "bg-chart-3",
      description: "Invited, awaiting account setup",
    },
    {
      label: "Not Invited",
      count: teachers!.filter((t) => !t.hasPortalAccount).length,
      colorClass: "bg-muted-foreground/50",
      description: "No portal account yet",
    },
  ]

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Teaching Staff Status
        </span>
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Count (% total)
        </span>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const pct = Math.round((cat.count / total) * 100)

          return (
            <div key={cat.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{cat.count}</span>
                  <span className="text-muted-foreground">({pct}%)</span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${cat.colorClass}`}
                  style={{ width: cat.count > 0 ? `${Math.max(pct, 4)}%` : "0%" }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TeacherStatistics