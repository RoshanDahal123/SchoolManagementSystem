import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { DataTable } from "@/components/organisms/data-table"
import type { StudentResponse } from "@/features/students/@types"
import {
  useCreateStudentMutation,
  useGetAllStudentsQuery,
  useInviteStudentMutation,
  useResendInviteMutation,
} from "@/features/students/student-api"
import { useAuth } from "@/hooks/use-auth"
import { createStudentSchema, type CreateStudentFormData } from "@/lib/validation/student"
import { PATHS } from "@/routes/paths"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { EyeIcon, MailIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"

export default function StudentsPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")

  const { data: students = [], isLoading } = useGetAllStudentsQuery()
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation()
  const [inviteStudent, { isLoading: isInviting }] = useInviteStudentMutation()
  const [resendInvite, { isLoading: isResending }] = useResendInviteMutation()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
  })

  const onSubmitCreate = async (data: CreateStudentFormData) => {
    try {
      await createStudent(data).unwrap()
      toast.success("Student created successfully")
      setCreateDialogOpen(false)
      reset()
    } catch (error) {
      toast.error("Failed to create student")
      console.error("Create student error:", error)
    }
  }

 const handleInvite = async () => {
  if (!selectedStudent || !inviteEmail) return

  try {
    await inviteStudent({ id: selectedStudent.id, email: inviteEmail }).unwrap()
    toast.success(`Invitation sent to ${inviteEmail}`)
    setInviteDialogOpen(false)
    setInviteEmail("")
    setSelectedStudent(null)
  } catch (error: any) {
    const message =
      error?.data?.detail ||
      error?.data?.title ||
      error?.data?.message ||
      "Failed to send invitation"
    toast.error(message)
  }
}

  const columns = [
    {
      accessorKey: "enrollmentNumber" as keyof StudentResponse,
      header: "Enrollment #",
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }: { row: { original: StudentResponse } }) => {
        const { firstName, lastName } = row.original
        return `${firstName} ${lastName}`
      },
    },
    {
      id: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }: { row: { original: StudentResponse } }) => {
        try {
          return format(new Date(row.original.dateOfBirth), "MMM dd, yyyy")
        } catch {
          return row.original.dateOfBirth
        }
      },
    },
    {
      id: "gender",
      header: "Gender",
      cell: ({ row }: { row: { original: StudentResponse } }) => (
        <Badge variant="outline">{row.original.gender}</Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: StudentResponse } }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(PATHS.adminStudentDetails(row.original.id))}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStudent(row.original)
                setInviteDialogOpen(true)
              }}
            >
              <MailIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
    {
  id: "actions",
  header: "Actions",
  cell: ({ row }: { row: { original: StudentResponse } }) => {
    const student = row.original
    const hasAccount = !!student.userId || student.hasPortalAccount

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.adminStudentDetails(student.id))}
        >
          <EyeIcon className="h-4 w-4" />
        </Button>

        {isAdmin && (
          <>
            {!hasAccount ? (
              // Not invited yet → show Invite
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStudent(student)
                  setInviteEmail("")
                  setInviteDialogOpen(true)
                }}
                title="Invite to Portal"
              >
                <MailIcon className="h-4 w-4" />
              </Button>
            ) : (
              // Already invited → show Resend
              <Button
                variant="ghost"
                size="sm"
                disabled={isResending}
                onClick={async () => {
                  try {
                    await resendInvite(student.id).unwrap()
                    toast.success("Invitation resent successfully")
                  } catch (error: any) {
                    const message =
                      error?.data?.detail ||
                      error?.data?.title ||
                      "Failed to resend invitation"
                    toast.error(message)
                  }
                }}
                title="Resend Invitation"
              >
                <MailIcon className="h-4 w-4 text-orange-500" />
              </Button>
            )}
          </>
        )}
      </div>
    )
  },
},
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">
            Manage student records and enrollments
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit(onSubmitCreate)}>
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student's information below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Field>
                  <FieldLabel>First Name</FieldLabel>
                  <Input {...register("firstName")} placeholder="John" />
                  {errors.firstName && (
                    <FieldError>{errors.firstName.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Last Name</FieldLabel>
                  <Input {...register("lastName")} placeholder="Doe" />
                  {errors.lastName && (
                    <FieldError>{errors.lastName.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Enrollment Number</FieldLabel>
                  <Input
                    {...register("enrollmentNumber")}
                    placeholder="STU2026001"
                  />
                  {errors.enrollmentNumber && (
                    <FieldError>{errors.enrollmentNumber.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <Input
                    {...register("dateOfBirth")}
                    type="date"
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                  {errors.dateOfBirth && (
                    <FieldError>{errors.dateOfBirth.message}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Gender</FieldLabel>
                  <Select
                    value={watch("gender")}
                    onValueChange={(value) =>
                      setValue("gender", value as "Male" | "Female" | "Other")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <FieldError>{errors.gender.message}</FieldError>
                  )}
                </Field>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Student"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={students} isLoading={isLoading} />

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Student to Portal</DialogTitle>
            <DialogDescription>
              Send an activation email to{" "}
              {selectedStudent &&
                `${selectedStudent.firstName} ${selectedStudent.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="student@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInviteDialogOpen(false)
                setInviteEmail("")
                setSelectedStudent(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
              {isInviting ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
