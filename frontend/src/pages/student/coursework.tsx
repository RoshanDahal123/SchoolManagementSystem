import { StudentCourseworkList } from "@/features/coursework/components/student-coursework-list"

export default function StudentCourseworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My coursework</h1>
        <p className="text-muted-foreground">
          Work set by your teachers. Upload your answers as PNG, JPG or PDF before the deadline.
        </p>
      </div>
      <StudentCourseworkList />
    </div>
  )
}
