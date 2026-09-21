import { TeacherCourseworkPanel } from "@/features/coursework/components/teacher-coursework-panel"

export default function TeacherCourseworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coursework</h1>
        <p className="text-muted-foreground">
          Set work for your classes, then review and mark what your students hand in.
        </p>
      </div>
      <TeacherCourseworkPanel />
    </div>
  )
}
