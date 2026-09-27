import { StudentCourseworkList } from "@/features/coursework/components/student-coursework-list"
import { useAuth } from "@/hooks/use-auth"
import { BookOpenIcon } from "lucide-react"

export default function StudentCourseworkPage() {
  const { firstName } = useAuth()

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <BookOpenIcon className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Coursework</h1>
          <p className="text-sm text-muted-foreground">
            Work set by your teachers — submit before the deadline.
          </p>
        </div>
      </div>

      <StudentCourseworkList />
    </div>
  )
}
