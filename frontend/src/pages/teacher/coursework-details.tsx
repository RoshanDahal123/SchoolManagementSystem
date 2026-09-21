import { SubmissionBoard } from "@/features/coursework/components/submission-board"
import { PATHS } from "@/routes/paths"
import { Navigate, useParams } from "react-router"

export default function TeacherCourseworkDetailsPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) return <Navigate to={PATHS.teacherCoursework} replace />

  return <SubmissionBoard courseworkId={id} backTo={PATHS.teacherCoursework} />
}
