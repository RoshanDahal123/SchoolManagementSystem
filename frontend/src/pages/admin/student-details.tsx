import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/atoms/alert-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Field, FieldError, FieldLabel } from "@/components/atoms/field";
import { Input } from "@/components/atoms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { Skeleton } from "@/components/atoms/skeleton";
import { EnrollStudentDialog } from "@/features/enrollment/components/enroll-student-dialog";
import { PromoteStudentDialog } from "@/features/enrollment/components/promote-student-dialog";
import { TransferStudentDialog } from "@/features/enrollment/components/transfer-studetnt-dialog";
import {
  useChangeEnrollmentStatusMutation,
  useEnrollStudentMutation,
  useGetEnrollmentHistoryQuery,
  usePromoteStudentMutation,
  useTransferStudentMutation,
} from "@/features/enrollment/enrollment-api";
import {
  useDeactivateStudentMutation,
  useGetStudentByIdQuery,
  useReactivateStudentMutation,
  useUpdateStudentMutation,
} from "@/features/students/student-api";
import {
  createStudentSchema,
  type CreateStudentFormData,
} from "@/lib/validation/student";
import { PATHS } from "@/routes/paths";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading, error } = useGetStudentByIdQuery(id!);
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [deactivateStudent, { isLoading: isDeactivating }] =
    useDeactivateStudentMutation();
  const [reactivateStudent, { isLoading: isReactivating }] =
    useReactivateStudentMutation();

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  //Student-enrollment-state
  const { data: enrollments = [] } = useGetEnrollmentHistoryQuery(id!, {
    skip: !id,
  });
  const currentEnrollment =
    enrollments.find((e) => e.status === "Active") ?? null;
  const pastEnrollments = enrollments.filter((e) => e.status !== "Active");

  const [enrollStudent, { isLoading: isEnrolling }] =
    useEnrollStudentMutation();
  const [transferStudent, { isLoading: isTransferring }] =
    useTransferStudentMutation();
  const [changeEnrollmentStatus, { isLoading: isChangingStatus }] =
    useChangeEnrollmentStatusMutation();
  const [promoteStudent, { isLoading: isPromoting }] =
    usePromoteStudentMutation();
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  // ── Edit form ────────────────────────────────────────────────────────────────
  const form = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
  });

  // Pre-fill form when the dialog opens
  useEffect(() => {
    if (editDialogOpen && student) {
      form.reset({
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth.slice(0, 10), // ensure yyyy-MM-dd
        gender: student.gender,
        enrollmentNumber: student.enrollmentNumber,
      });
    }
  }, [editDialogOpen, student]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onSubmitEdit = async (formData: CreateStudentFormData) => {
    if (!student) return;
    try {
      await updateStudent({ id: student.id, data: formData }).unwrap();
      toast.success("Student updated successfully");
      setEditDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to update student";
      toast.error(message);
    }
  };
  //deactivate/reactivate handlers
  const handleDeactivate = async () => {
    if (!student) return;
    try {
      await deactivateStudent(student.id).unwrap();
      toast.success("Student deactivated successfully");
      setDeactivateDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to deactivate student";
      toast.error(message);
    }
  };

  const handleReactivate = async () => {
    if (!student) return;
    try {
      await reactivateStudent(student.id).unwrap();
      toast.success("Student reactivated successfully");
      setReactivateDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to reactivate student";
      toast.error(message);
    }
  };
  const handleEnroll = async (
    data: import("@/features/enrollment/@types").EnrollStudentRequest,
  ) => {
    if (!student) return;
    try {
      await enrollStudent({ studentId: student.id, data }).unwrap();
      toast.success("Student enrolled");
      setEnrollDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.detail ??
          err?.data?.title ??
          err?.data?.message ??
          "Failed to enroll student",
      );
    }
  };

  const handleTransfer = async (newSectionId: string) => {
    if (!student || !currentEnrollment) return;
    try {
      await transferStudent({
        enrollmentId: currentEnrollment.id,
        studentId: student.id,
        data: { newSectionId },
      }).unwrap();
      toast.success("Student transferred");
      setTransferDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.detail ??
          err?.data?.title ??
          err?.data?.message ??
          "Failed to transfer student",
      );
    }
  };

  const handleWithdraw = async () => {
    if (!student || !currentEnrollment) return;
    try {
      await changeEnrollmentStatus({
        enrollmentId: currentEnrollment.id,
        studentId: student.id,
        data: { status: "Withdrawn" },
      }).unwrap();
      toast.success("Enrollment marked as withdrawn");
      setWithdrawDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.detail ??
          err?.data?.title ??
          err?.data?.message ??
          "Failed to update enrollment",
      );
    }
  }; //enrollmentstatus handler

  const handleStatusChange = async (
    newStatus: "Active" | "Completed" | "Withdrawn",
  ) => {
    if (
      !student ||
      !currentEnrollment ||
      newStatus === currentEnrollment.status
    )
      return;
    try {
      await changeEnrollmentStatus({
        enrollmentId: currentEnrollment.id,
        studentId: student.id,
        data: { status: newStatus },
      }).unwrap();
      toast.success(`Enrollment status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(
        err?.data?.detail ??
          err?.data?.title ??
          err?.data?.message ??
          "Failed to update status",
      );
    }
  };

  //promote handler
  const handlePromote = async (
    data: import("@/features/enrollment/@types").PromoteStudentRequest,
  ) => {
    if (!student || !currentEnrollment) return;
    try {
      await promoteStudent({
        enrollmentId: currentEnrollment.id,
        studentId: student.id,
        data,
      }).unwrap();
      toast.success("Student promoted");
      setPromoteDialogOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.detail ??
          err?.data?.title ??
          err?.data?.message ??
          "Failed to promote student",
      );
    }
  };
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
    );
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
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate(PATHS.adminStudents)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Students
        </Button>

        {/* Hero Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {student.firstName} {student.lastName}
                  </h1>
                  <p className="font-mono text-sm text-muted-foreground">
                    {student.enrollmentNumber}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {student.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    <Badge variant="secondary">{student.gender}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit
                </Button>
                {student.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeactivateDialogOpen(true)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => setReactivateDialogOpen(true)}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Info Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-4 pb-4">
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">
                  Date of Birth
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(student.dateOfBirth), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Gender</span>
                <Badge variant="outline">{student.gender}</Badge>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">
                  Registered
                </span>
                <span className="text-sm font-medium">
                  {format(new Date(student.createdAtUtc), "MMM dd, yyyy")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Portal Access */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portal Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-4 pb-4">
              <div className="flex items-center justify-between py-2.5 border-b">
                <span className="text-sm text-muted-foreground">Account</span>
                {student.hasPortalAccount ? (
                  <Badge
                    variant="outline"
                    className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  >
                    Linked
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not linked</Badge>
                )}
              </div>
              {student.email && (
                <div className="flex items-center justify-between py-2.5 border-b">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span
                    className="max-w-36 truncate text-sm font-medium"
                    title={student.email}
                  >
                    {student.email}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">
                  Portal Status
                </span>
                {student.hasPortalAccount ? (
                  student.isPortalActive ? (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Enrollment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Current Enrollment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 px-4 pb-3">
              {currentEnrollment ? (
                <>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">Class</span>
                    <span className="text-sm font-medium">
                      {currentEnrollment.gradeLevelName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">
                      Section
                    </span>
                    <span className="text-sm font-medium">
                      {currentEnrollment.sectionName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">Year</span>
                    <span className="text-sm font-medium">
                      {currentEnrollment.academicYearName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Select
                      value={currentEnrollment.status}
                      onValueChange={(v) =>
                        handleStatusChange(
                          v as "Active" | "Completed" | "Withdrawn",
                        )
                      }
                    >
                      <SelectTrigger className="h-7 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent
                        side="bottom"
                        align="end"
                        sideOffset={4}
                        alignItemWithTrigger={false}
                      >
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setTransferDialogOpen(true)}
                    >
                      Transfer
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPromoteDialogOpen(true)}
                    >
                      Promote
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Not enrolled in any section.
                  </p>
                  <Button size="sm" onClick={() => setEnrollDialogOpen(true)}>
                    Enroll Student
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enrollment History */}
        {pastEnrollments.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Enrollment History</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-0">
                {pastEnrollments.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-2.5 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {e.gradeLevelName} · {e.sectionName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.academicYearName} · since{" "}
                        {format(new Date(e.enrolledOn), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge variant="outline">{e.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={form.handleSubmit(onSubmitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update the student's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input {...form.register("firstName")} placeholder="John" />
                {form.formState.errors.firstName && (
                  <FieldError>
                    {form.formState.errors.firstName.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input {...form.register("lastName")} placeholder="Doe" />
                {form.formState.errors.lastName && (
                  <FieldError>
                    {form.formState.errors.lastName.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Enrollment Number</FieldLabel>
                <Input
                  {...form.register("enrollmentNumber")}
                  placeholder="STU2026001"
                />
                {form.formState.errors.enrollmentNumber && (
                  <FieldError>
                    {form.formState.errors.enrollmentNumber.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Date of Birth</FieldLabel>
                <Input
                  {...form.register("dateOfBirth")}
                  type="date"
                  max={format(new Date(), "yyyy-MM-dd")}
                />
                {form.formState.errors.dateOfBirth && (
                  <FieldError>
                    {form.formState.errors.dateOfBirth.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Gender</FieldLabel>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(value) =>
                    form.setValue(
                      "gender",
                      value as "Male" | "Female" | "Other",
                    )
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
                {form.formState.errors.gender && (
                  <FieldError>
                    {form.formState.errors.gender.message}
                  </FieldError>
                )}
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
      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>
                {student.firstName} {student.lastName}
              </strong>{" "}
              and their portal access. They will no longer be able to log in.
              You can reactivate them at any time.
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
      <AlertDialog
        open={reactivateDialogOpen}
        onOpenChange={setReactivateDialogOpen}
      >
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

      <EnrollStudentDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        studentName={`${student.firstName} ${student.lastName}`}
        isSaving={isEnrolling}
        onEnroll={handleEnroll}
      />

      <TransferStudentDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        studentName={`${student.firstName} ${student.lastName}`}
        currentEnrollment={currentEnrollment}
        isSaving={isTransferring}
        onTransfer={handleTransfer}
      />

      <PromoteStudentDialog
        open={promoteDialogOpen}
        onOpenChange={setPromoteDialogOpen}
        studentName={`${student.firstName} ${student.lastName}`}
        currentEnrollment={currentEnrollment}
        isSaving={isPromoting}
        onPromote={handlePromote}
      />

      <AlertDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              This marks {student.firstName} {student.lastName}'s current
              enrollment as withdrawn. This doesn't deactivate their account —
              use "Deactivate" above for that.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isChangingStatus}
              onClick={handleWithdraw}
            >
              {isChangingStatus ? "Withdrawing…" : "Withdraw"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
