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
import { Skeleton } from "@/components/atoms/skeleton"
import { useGetSubjectsQuery } from "@/features/academic/academic-api"
import { SubjectChecklistField } from "@/features/teachers/components/subject-checklist-field"
import {
  useDeactivateTeacherMutation,
  useGetTeacherByIdQuery,
  useReactivateTeacherMutation,
  useUpdateTeacherMutation,
} from "@/features/teachers/teacher-api"
import { createTeacherSchema, type CreateTeacherFormData } from "@/lib/validation/teacher"
import { PATHS } from "@/routes/paths"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { ArrowLeftIcon, MailIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import { toast } from "sonner"

export default function TeacherDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: teacher, isLoading, error } = useGetTeacherByIdQuery(id!)
  const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherMutation()
  const [deactivateTeacher, { isLoading: isDeactivating }] = useDeactivateTeacherMutation()
  const [reactivateTeacher, { isLoading: isReactivating }] = useReactivateTeacherMutation()

  const { data: subjects = [] } = useGetSubjectsQuery()

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)

  // ── Edit form ────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
  })

  // Pre-fill form when the dialog opens
  useEffect(() => {
    if (editDialogOpen && teacher) {
      reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
        phoneNumber: teacher.phoneNumber ?? "",
        subjectIds: teacher.specializations.map((s) => s.subjectId),
      })
    }
  }, [editDialogOpen, teacher, reset])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onSubmitEdit = async (formData: CreateTeacherFormData) => {
    if (!teacher) return
    try {
      await updateTeacher({ id: teacher.id, data: formData }).unwrap()
      toast.success("Teacher updated successfully")
      setEditDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to update teacher"
      toast.error(message)
    }
  }

  const handleDeactivate = async () => {
    if (!teacher) return
    try {
      await deactivateTeacher(teacher.id).unwrap()
      toast.success("Teacher deactivated successfully")
      setDeactivateDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to deactivate teacher"
      toast.error(message)
    }
  }

  const handleReactivate = async () => {
    if (!teacher) return
    try {
      await reactivateTeacher(teacher.id).unwrap()
      toast.success("Teacher reactivated successfully")
      setReactivateDialogOpen(false)
    } catch (err: any) {
      const message =
        err?.data?.detail ?? err?.data?.title ?? err?.data?.message ?? "Failed to reactivate teacher"
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
  if (error || !teacher) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(PATHS.adminTeachers)}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Teachers
        </Button>
        <Card className="p-12 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Teacher Not Found</h3>
            <p className="text-sm text-muted-foreground">
              The teacher you're looking for doesn't exist or has been removed.
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
          <Button variant="ghost" onClick={() => navigate(PATHS.adminTeachers)}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Teachers
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
            {teacher.isActive ? (
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
              {teacher.firstName} {teacher.lastName}
            </h1>
            <p className="text-muted-foreground">Teacher Details</p>
          </div>
          {teacher.isActive ? (
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
                  {teacher.firstName} {teacher.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="text-base">
                  {teacher.phoneNumber ?? <span className="text-muted-foreground">—</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                <p className="text-base font-mono">{teacher.employeeId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Subject Specializations</p>
                {teacher.specializations.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {teacher.specializations.map((s) => (
                      <Badge key={s.subjectId} variant="outline">
                        {s.subjectName}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-base">
                    <span className="text-muted-foreground">—</span>
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Joined Since</p>
                <p className="text-base">
                  {format(new Date(teacher.createdAtUtc), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                {teacher.isActive ? (
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
                {teacher.hasPortalAccount ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    This teacher has a portal account
                    {teacher.email ? ` (${teacher.email})` : ""}.
                    Portal status:{" "}
                    <span
                      className={
                        teacher.isPortalActive
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {teacher.isPortalActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    Use the invite button from the teachers list to send this teacher a portal
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
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>Update the teacher's information below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input {...register("firstName")} placeholder="Jane" />
                {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input {...register("lastName")} placeholder="Smith" />
                {errors.lastName && <FieldError>{errors.lastName.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Employee ID</FieldLabel>
                <Input {...register("employeeId")} placeholder="TCH2026001" />
                {errors.employeeId && <FieldError>{errors.employeeId.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input {...register("phoneNumber")} placeholder="+1 555 000 0000" />
              </Field>

              <Controller
                name="subjectIds"
                control={control}
                render={({ field }) => (
                  <SubjectChecklistField
                    subjects={subjects}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.subjectIds?.message}
                  />
                )}
              />
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
            <AlertDialogTitle>Deactivate Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>
                {teacher.firstName} {teacher.lastName}
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
            <AlertDialogTitle>Reactivate Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate{" "}
              <strong>
                {teacher.firstName} {teacher.lastName}
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