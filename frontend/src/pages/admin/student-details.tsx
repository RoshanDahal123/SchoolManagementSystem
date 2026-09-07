import { useParams, useNavigate } from "react-router"
import { format } from "date-fns"
import { useGetStudentByIdQuery } from "@/features/students/student-api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Button } from "@/components/atoms/button"
import { Badge } from "@/components/atoms/badge"
import { Skeleton } from "@/components/atoms/skeleton"
import { ArrowLeftIcon, MailIcon } from "lucide-react"
import { PATHS } from "@/routes/paths"

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: student, isLoading, error } = useGetStudentByIdQuery(id!)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(PATHS.adminStudents)}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <Card className="p-12 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Student Not Found</h3>
            <p className="text-sm text-muted-foreground">
              The student you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(PATHS.adminStudents)}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" >
            Edit
          </Button>
          <Button variant="outline">
            Deactivate
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-muted-foreground">Student Details</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-base">
                {student.firstName} {student.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Date of Birth
              </p>
              <p className="text-base">
                {format(new Date(student.dateOfBirth), "MMMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <Badge variant="outline">{student.gender}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Enrollment Number
              </p>
              <p className="text-base font-mono">{student.enrollmentNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Enrolled Since
              </p>
              <p className="text-base">
                {format(new Date(student.createdAtUtc), "MMMM dd, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-background p-2">
              <MailIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Portal Access</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Use the invite button from the students list to send this student a
                portal activation email.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-900">
          <strong>Note:</strong> Update and Deactivate features are not yet available
          on the backend — these buttons are disabled until Phase B.
        </p>
      </div>
    </div>
  )
}
