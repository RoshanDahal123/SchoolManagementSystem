import { useAuth } from "@/hooks/use-auth"

export default function TeacherDashboardPage() {
  const { email, teacherId } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-muted-foreground">Signed in as {email}</p>
      <p className="text-xs text-muted-foreground">Teacher ID: {teacherId ?? "unresolved"}</p>
    </div>
  )
}