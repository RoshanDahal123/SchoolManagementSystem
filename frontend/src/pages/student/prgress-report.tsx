import { EmptyState } from "@/components/molecules/empty-state"
import { ProgressReportPanel } from "@/features/coursework/components/progress-report-panel"
import { useAuth } from "@/hooks/use-auth"
import { UserRoundXIcon } from "lucide-react"

export default function StudentProgressReportPage() {
  const { studentId } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress report</h1>
        <p className="text-muted-foreground">
          Your marks across every subject, updated as your teachers finish marking.
        </p>
      </div>

      {studentId ? (
        <ProgressReportPanel studentId={studentId} />
      ) : (
        <EmptyState
          icon={UserRoundXIcon}
          title="No student record linked"
          description="This account isn't linked to a student profile yet — please contact your school office."
        />
      )}
    </div>
  )
}
