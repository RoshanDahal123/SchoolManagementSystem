import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog"
import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
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
import { Skeleton } from "@/components/atoms/skeleton"
import {
  useDeactivateStudentMutation,
  useGetStudentByIdQuery,
  useReactivateStudentMutation,
  useUpdateStudentMutation,
} from "@/features/students/student-api"
import { createStudentSchema, type CreateStudentFormData } from "@/lib/validation/student"
import { PATHS } from "@/routes/paths"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowLeftIcon, MailIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: student, isLoading, error } = useGetStudentByIdQuery(id!)
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation()
  const [deactivateStudent, { isLoading: isDeactivating }] = useDeactivateStudentMutation()
  const [reactivateStudent, { isLoading: isReactivating }] = useReactivateStudentMutation()

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)

  // ── Edit form ────────────────────────────────────────────────────────────────
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

  // Pre-fill form when the dialog opens
  useEffect(() => {
    if (editDialogOpen && student) {
      reset({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth.slice(0, 10), // ensure yyyy-MM-dd
        gender: student.gender,
        enrollmentNumber: student.enrollmentNumber,
      })
    }
  }, [editDialogOpen, student, reset])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onSubmitEdit = async (formData: CreateStudentFormData) => {
    if (!student) return
    try {
      await updateStudent({ id: student.id, data: formData }).unwrap()
      toast.success("Student updated successfully")
      setEditDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to update student"
      toast.error(message)
    }
  }

  const handleDeactivate = async () => {
    if (!student) return
    try {
      await deactivateStudent(student.id).unwrap()
      toast.success("Student deactivated successfully")
      setDeactivateDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to deactivate student"
      toast.error(message)
    }
  }

  const handleReactivate = async () => {
    if (!student) return
    try {
      await reactivateStudent(student.id).unwrap()
      toast.success("Student reactivated successfully")
      setReactivateDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to reactivate student"
      toast.error(message)
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────────
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

  // ── Error / not found state ───────────────────────────────────────────────────
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

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(PATHS.adminStudents)}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            {student.isActive ? (
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/40"
                onClick={() => setDeactivateDialogOpen(true)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant="outline"
                className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-300"
                onClick={() => setReactivateDialogOpen(true)}
              >
                Reactivate
              </Button>
            )}
          </div>
        </div>

        {/* Page heading + status badge */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-muted-foreground">Student Details</p>
          </div>
          {student.isActive ? (
            <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>

        {/* Detail cards */}
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
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
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
                <p className="text-sm font-medium text-muted-foreground">Enrollment Number</p>
                <p className="text-base font-mono">{student.enrollmentNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Enrolled Since</p>
                <p className="text-base">
                  {format(new Date(student.createdAtUtc), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                {student.isActive ? (
                  <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portal access card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-background p-2">
                <MailIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Portal Access</h3>
                {student.hasPortalAccount ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    This student has a portal account
                    {student.email ? ` (${student.email})` : ""}.
                    Portal status:{" "}
                    <span className={student.isPortalActive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {student.isPortalActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the invite button from the students list to send this student a portal
                    activation email.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update the student's information below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input {...register("firstName")} placeholder="John" />
                {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input {...register("lastName")} placeholder="Doe" />
                {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Enrollment Number</FieldLabel>
                <Input {...register("enrollmentNumber")} placeholder="STU2026001" />
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
                {errors.dateOfBirth && <FieldError>{errors.dateOfBirth.message}</FieldError>}
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
                {errors.gender && <FieldError>{errors.gender.message}</FieldError>}
              </Field>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>
                {student.firstName} {student.lastName}
              </strong>{" "}
              and their portal access. They will no longer be able to log in. You can reactivate
              them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeactivating}
              onClick={handleDeactivate}
            >
              {isDeactivating ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reactivate Confirmation ──────────────────────────────────────────────── */}
      <AlertDialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate{" "}
              <strong>
                {student.firstName} {student.lastName}
              </strong>{" "}
              and their portal access. They will be able to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isReactivating}
              onClick={handleReactivate}
            >
              {isReactivating ? "Reactivating…" : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
