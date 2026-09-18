import { useAuth } from "@/hooks/use-auth"

export default function StudentDashboardPage() {
  const { email, studentId} = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-muted-foreground">Signed in as {email}</p>
      <p className="text-xs text-muted-foreground">Student Id: {studentId ?? "unresolved"}</p>
    </div>
  )
}