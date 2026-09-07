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
import { EntityListLayout } from "@/components/organisms/entity-list-layout"
import type { TeacherResponse } from "@/features/teachers/@types"
import {
  useCreateTeacherMutation,
  useGetAllTeachersQuery,
  useInviteTeacherMutation,
  useResendTeacherInviteMutation,
} from "@/features/teachers/teacher-api"
import { useAuth } from "@/hooks/use-auth"
import { usePaginatedSearch } from "@/hooks/use-paginated-search"
import { PATHS } from "@/routes/paths"
import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, MailIcon, PlusIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { z } from "zod"

// ─── Validation ───────────────────────────────────────────────────────────────

const createTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  subjectSpecialization: z.string().optional(),
  phoneNumber: z.string().optional(),
})

type CreateTeacherFormData = z.infer<typeof createTeacherSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeachersPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  // ── Search + pagination (URL-synced) ────────────────────────────────────────
  const { page, searchQuery, searchInput, handleSearchChange, handlePageChange } =
    usePaginatedSearch()

  // ── API ─────────────────────────────────────────────────────────────────────
  const { data: teachers = [], isLoading } = useGetAllTeachersQuery()
  const [createTeacher, { isLoading: isCreating }] = useCreateTeacherMutation()
  const [inviteTeacher, { isLoading: isInviting }] = useInviteTeacherMutation()
  const [resendTeacherInvite, { isLoading: isResending }] = useResendTeacherInviteMutation()

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherResponse | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")

  // ── Create form ─────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeacherFormData>({
    resolver: zodResolver(createTeacherSchema),
  })

  // ── Client-side filter + paginate ───────────────────────────────────────────
  // When the backend gains server-side search, replace with a query that accepts
  // { page, search } and swap `pagedData` / `totalCount` for server values.
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return teachers
    return teachers.filter((t) => {
      const name = `${t.firstName} ${t.lastName}`.toLowerCase()
      const empId = t.employeeId.toLowerCase()
      const subject = (t.subjectSpecialization ?? "").toLowerCase()
      return name.includes(q) || empId.includes(q) || subject.includes(q)
    })
  }, [teachers, searchQuery])

  const totalCount = filtered.length
  const pagedData = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  )

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onSubmitCreate = async (data: CreateTeacherFormData) => {
    try {
      await createTeacher(data).unwrap()
      toast.success("Teacher created successfully")
      setCreateDialogOpen(false)
      reset()
    } catch {
      toast.error("Failed to create teacher")
    }
  }

  const handleInvite = async () => {
    if (!selectedTeacher || !inviteEmail) return
    try {
      await inviteTeacher({ id: selectedTeacher.id, email: inviteEmail }).unwrap()
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteDialogOpen(false)
      setInviteEmail("")
      setSelectedTeacher(null)
    } catch (error: any) {
      const message =
        error?.data?.detail ?? error?.data?.title ?? error?.data?.message ?? "Failed to send invitation"
      toast.error(message)
    }
  }

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns = [
    {
      accessorKey: "employeeId" as keyof TeacherResponse,
      header: "Employee ID",
    },
    {
      id: "name",
      header: "Name",
      cell: ({ row }: { row: { original: TeacherResponse } }) =>
        `${row.original.firstName} ${row.original.lastName}`,
    },
    {
      id: "subjectSpecialization",
      header: "Subject",
      cell: ({ row }: { row: { original: TeacherResponse } }) =>
        row.original.subjectSpecialization ?? (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "phoneNumber",
      header: "Phone",
      cell: ({ row }: { row: { original: TeacherResponse } }) =>
        row.original.phoneNumber ?? (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: TeacherResponse } }) => {
        const teacher = row.original
        const hasAccount = !!teacher.userId || teacher.hasPortalAccount

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`${PATHS.adminTeachers}/${teacher.id}`)}
              title="View details"
            >
              <EyeIcon className="h-4 w-4" />
            </Button>

            {isAdmin && (
              <>
                {!hasAccount ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher(teacher)
                      setInviteEmail("")
                      setInviteDialogOpen(true)
                    }}
                    title="Invite to portal"
                  >
                    <MailIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isResending}
                    onClick={async () => {
                      try {
                        await resendTeacherInvite(teacher.id).unwrap()
                        toast.success("Invitation resent successfully")
                      } catch (error: any) {
                        toast.error(
                          error?.data?.detail ?? error?.data?.title ?? "Failed to resend invitation",
                        )
                      }
                    }}
                    title="Resend invitation"
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <EntityListLayout
        heading="Teachers"
        description="Manage teaching staff and assignments"
        cardTitle="Staff Directory"
        columns={columns}
        data={pagedData as unknown as Record<string, unknown>[]}
        isLoading={isLoading}
        totalCount={isLoading ? undefined : totalCount}
        search={{
          value: searchInput,
          placeholder: "Search by name, ID or subject…",
          onChange: handleSearchChange,
        }}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalCount,
          onPageChange: handlePageChange,
        }}
        emptyMessage={
          searchQuery ? `No teachers match "${searchQuery}"` : "No teachers yet"
        }
        emptyDescription={
          !searchQuery && isAdmin ? "Get started by adding a new teacher record." : undefined
        }
        primaryAction={
          isAdmin ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          ) : undefined
        }
      />

      {/* ── Create Teacher Dialog ── */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit(onSubmitCreate)}>
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Enter the teacher's information below.</DialogDescription>
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
                <FieldLabel>Subject Specialization</FieldLabel>
                <Input {...register("subjectSpecialization")} placeholder="Mathematics" />
              </Field>

              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <Input {...register("phoneNumber")} placeholder="+1 555 000 0000" />
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
                {isCreating ? "Creating…" : "Create Teacher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Teacher to Portal</DialogTitle>
            <DialogDescription>
              Send an activation email to{" "}
              {selectedTeacher && `${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input
                type="email"
                placeholder="teacher@school.edu"
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
                setSelectedTeacher(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail}>
              {isInviting ? "Sending…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
