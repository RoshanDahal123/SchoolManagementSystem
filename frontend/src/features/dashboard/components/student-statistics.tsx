import { Skeleton } from "@/components/atoms/skeleton"
import type { GradeStudentCount } from "@/features/dashboard/@types"

interface StudentStatisticsProps {
  data?: GradeStudentCount[]
  isLoading?: boolean
}

export function StudentStatistics({ data, isLoading }: StudentStatisticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
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

  if (!data?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No grade levels configured yet.
      </p>
    )
  }

  const total = data.reduce((sum, g) => sum + g.studentCount, 0)

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Grade Level
        </span>
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Students (% total)
        </span>
      </div>

      <div className="space-y-3">
        {data.map((grade) => {
          const pct = total > 0 ? Math.round((grade.studentCount / total) * 100) : 0
          return (
            <div key={grade.gradeLevelId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{grade.gradeLevelName}</span>
                <div className="flex items-center gap-1.5 text-xs tabular-nums">
                  <span className="font-semibold text-foreground">{grade.studentCount}</span>
                  <span className="text-muted-foreground">({pct}%)</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StudentStatistics