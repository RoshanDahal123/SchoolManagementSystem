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
import { Skeleton } from "@/components/atoms/skeleton";
import { useGetSubjectsQuery } from "@/features/academic/academic-api";
import type { TeacherAssignmentResponse } from "@/features/teachers/@types";
import { SubjectChecklistField } from "@/features/teachers/components/subject-checklist-field";
import {
  useDeactivateTeacherMutation,
  useGetTeacherAssignmentsQuery,
  useGetTeacherByIdQuery,
  useReactivateTeacherMutation,
  useUpdateTeacherMutation,
} from "@/features/teachers/teacher-api";
import {
  createTeacherSchema,
  type CreateTeacherFormData,
} from "@/lib/validation/teacher";
import { PATHS } from "@/routes/paths";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowLeftIcon, MailIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
export default function TeacherDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: teacher, isLoading, error } = useGetTeacherByIdQuery(id!);
  const [updateTeacher, { isLoading: isUpdating }] = useUpdateTeacherMutation();
  const [deactivateTeacher, { isLoading: isDeactivating }] =
    useDeactivateTeacherMutation();
  const [reactivateTeacher, { isLoading: isReactivating }] =
    useReactivateTeacherMutation();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: assignments = [], isLoading: isAssignmentsLoading } =
    useGetTeacherAssignmentsQuery(id!, {
      skip: !id,
    });

  const assignmentsByYear = assignments.reduce<
    Record<string, TeacherAssignmentResponse[]>
  >((acc, a) => {
    (acc[a.academicYearName] ??= []).push(a);
    return acc;
  }, {});

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);

  // ── Edit form ────────────────────────────────────────────────────────────────
  const form = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
  });

  // Pre-fill form when the dialog opens
  useEffect(() => {
    if (editDialogOpen && teacher) {
      form.reset({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        employeeId: teacher.employeeId,
        phoneNumber: teacher.phoneNumber ?? "",
        subjectIds: teacher.specializations.map((s) => s.subjectId),
      });
    }
  }, [editDialogOpen, teacher]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const onSubmitEdit = async (formData: CreateTeacherFormData) => {
    if (!teacher) return;
    try {
      await updateTeacher({ id: teacher.id, data: formData }).unwrap();
      toast.success("Teacher updated successfully");
      setEditDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to update teacher";
      toast.error(message);
    }
  };

  const handleDeactivate = async () => {
    if (!teacher) return;
    try {
      await deactivateTeacher(teacher.id).unwrap();
      toast.success("Teacher deactivated successfully");
      setDeactivateDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to deactivate teacher";
      toast.error(message);
    }
  };

  const handleReactivate = async () => {
    if (!teacher) return;
    try {
      await reactivateTeacher(teacher.id).unwrap();
      toast.success("Teacher reactivated successfully");
      setReactivateDialogOpen(false);
    } catch (err: any) {
      const message =
        err?.data?.detail ??
        err?.data?.title ??
        err?.data?.message ??
        "Failed to reactivate teacher";
      toast.error(message);
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
    );
  }

  // ── Derived display values ───────────────────────────────────────────────────
  const initials =
    `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  const visibleSpecializations = teacher.specializations.slice(0, 3);
  const extraSpecializationCount = teacher.specializations.length - 3;

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-6">
        {/* 1. Back button row */}
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => navigate(PATHS.adminTeachers)}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Teachers
        </Button>

        {/* 2. Hero card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background px-6 py-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: avatar + identity */}
              <div className="flex items-center gap-5">
                {/* Avatar circle */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary ring-4 ring-background">
                  {initials}
                </div>

                {/* Name / ID / badges */}
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {teacher.firstName} {teacher.lastName}
                  </h1>
                  <p className="font-mono text-sm text-muted-foreground">
                    {teacher.employeeId}
                  </p>

                  {/* Status badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    {teacher.isActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-300 bg-green-50 text-green-700"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}

                    {/* Subject specialization preview badges */}
                    {visibleSpecializations.map((s) => (
                      <Badge key={s.subjectId} variant="secondary">
                        {s.subjectName}
                      </Badge>
                    ))}
                    {extraSpecializationCount > 0 && (
                      <Badge variant="outline">
                        +{extraSpecializationCount} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: action buttons */}
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  Edit
                </Button>
                {teacher.isActive ? (
                  <Button
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeactivateDialogOpen(true)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                    onClick={() => setReactivateDialogOpen(true)}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 3. Three-column info grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Contact & Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Contact &amp; Info
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-medium">
                  {teacher.phoneNumber ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Joined</span>
                <span className="text-sm font-medium">
                  {format(new Date(teacher.createdAtUtc), "MMM dd, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium">
                  {teacher.isActive ? (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Portal Access */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Portal Access
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">Linked</span>
                <span className="text-sm font-medium">
                  {teacher.hasPortalAccount ? (
                    <Badge
                      variant="outline"
                      className="border-green-300 bg-green-50 text-green-700"
                    >
                      Yes
                    </Badge>
                  ) : (
                    <Badge variant="outline">No</Badge>
                  )}
                </span>
              </div>
              {teacher.hasPortalAccount && teacher.email && (
                <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <MailIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {teacher.email}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                <span className="text-sm text-muted-foreground">
                  Portal Status
                </span>
                <span className="text-sm font-medium">
                  {teacher.hasPortalAccount ? (
                    teacher.isPortalActive ? (
                      <Badge
                        variant="outline"
                        className="border-green-300 bg-green-50 text-green-700"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </span>
              </div>
              {!teacher.hasPortalAccount && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Use the invite button from the teachers list to send a portal
                  activation email.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Subject Specializations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Subject Specializations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {teacher.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {teacher.specializations.map((s) => (
                    <Badge key={s.subjectId} variant="outline">
                      {s.subjectName}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground">
                  No specializations recorded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 4. Full-width Teaching Assignments card */}
        <Card>
          <CardHeader>
            <CardTitle>Teaching Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {isAssignmentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not currently assigned to teach any class. Assign this teacher
                from the Academic → Curriculum screen.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(assignmentsByYear).map(([yearName, rows]) => (
                  <div key={yearName}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {yearName}
                    </p>
                    <ul className="space-y-1.5">
                      {rows.map((a) => (
                        <li
                          key={a.classSubjectId}
                          className="text-sm flex items-center gap-2"
                        >
                          <Badge variant="outline">{a.gradeLevelName}</Badge>
                          <span>{a.subjectName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({a.subjectCode})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Dialog ─────────────────────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={form.handleSubmit(onSubmitEdit)}>
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
              <DialogDescription>
                Update the teacher's information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input {...form.register("firstName")} placeholder="Jane" />
                {form.formState.errors.firstName && (
                  <FieldError>
                    {form.formState.errors.firstName.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input {...form.register("lastName")} placeholder="Smith" />
                {form.formState.errors.lastName && (
                  <FieldError>
                    {form.formState.errors.lastName.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Employee ID</FieldLabel>
                <Input
                  {...form.register("employeeId")}
                  placeholder="TCH2026001"
                />
                {form.formState.errors.employeeId && (
                  <FieldError>
                    {form.formState.errors.employeeId.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input
                  {...form.register("phoneNumber")}
                  placeholder="+1 555 000 0000"
                />
              </Field>

              <Controller
                name="subjectIds"
                control={form.control}
                render={({ field }) => (
                  <SubjectChecklistField
                    subjects={subjects}
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.subjectIds?.message}
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
      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate{" "}
              <strong>
                {teacher.firstName} {teacher.lastName}
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
  );
}
