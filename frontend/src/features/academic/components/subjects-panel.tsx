import { Button } from "@/components/atoms/button"
import { Skeleton } from "@/components/atoms/skeleton"
import { Switch } from "@/components/atoms/switch"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table"
import { ConfirmDialog } from "@/components/molecules/confirm-dialog"
import { EmptyState } from "@/components/molecules/empty-state"
import { BookOpenIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { SubjectResponse } from "../@types"
import {
  useCreateSubjectMutation,
  useDeactivateSubjectMutation,
  useGetSubjectsQuery,
  useReactivateSubjectMutation,
  useUpdateSubjectMutation,
} from "../academic-api"
import {
  SubjectDialog,
  type SubjectFormData,
} from "./subject-dialog"
import { SubjectRow } from "./subject-row"

interface SubjectsPanelProps {
  isAdmin: boolean
}

export function SubjectsPanel({
  isAdmin,
}: SubjectsPanelProps) {
  const [showInactive, setShowInactive] = useState(false)

  const {
    data: subjects = [],
    isLoading,
  } = useGetSubjectsQuery({ includeInactive: showInactive })

  const [
    createSubject,
    { isLoading: isCreating },
  ] = useCreateSubjectMutation()

  const [
    updateSubject,
    { isLoading: isUpdating },
  ] = useUpdateSubjectMutation()

  const [deactivateSubject, { isLoading: isDeactivating }] = useDeactivateSubjectMutation()
  const [reactivateSubject, { isLoading: isReactivating }] = useReactivateSubjectMutation()

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editTarget, setEditTarget] =
    useState<SubjectResponse | null>(null)

  const [deactivateTarget, setDeactivateTarget] =
    useState<SubjectResponse | null>(null)

  const handleSubmit = async (
    data: SubjectFormData,
  ) => {
    try {
      if (editTarget) {
        await updateSubject({
          id: editTarget.id,
          data,
        }).unwrap()

        toast.success("Subject updated")
      } else {
        const result = await createSubject(data).unwrap()

        // CreateAsync on the server reactivates a matching deactivated subject instead of
        // making a new one — worth telling the admin that's what actually happened, since
        // "created" would be misleading if this code already existed.
        toast.success(
          result.isActive && subjects.some((s) => s.code === result.code && s.id === result.id && !s.isActive)
            ? "Subject reactivated"
            : "Subject created",
        )
      }

      setDialogOpen(false)
      setEditTarget(null)
    } catch (e: any) {
      toast.error(
        e?.data?.detail ??
          "Failed to save subject",
      )
    }
  }

  const handleAddSubject = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const handleEditSubject = (
    subject: SubjectResponse,
  ) => {
    setEditTarget(subject)
    setDialogOpen(true)
  }

  const handleDialogChange = (
    open: boolean,
  ) => {
    setDialogOpen(open)

    if (!open) {
      setEditTarget(null)
    }
  }

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return

    try {
      await deactivateSubject(deactivateTarget.id).unwrap()
      toast.success(`"${deactivateTarget.name}" deactivated`)
      setDeactivateTarget(null)
    } catch (e: any) {
      toast.error(e?.data?.detail ?? "Failed to deactivate subject")
    }
  }

  const handleReactivate = async (subject: SubjectResponse) => {
    try {
      await reactivateSubject(subject.id).unwrap()
      toast.success(`"${subject.name}" reactivated`)
    } catch (e: any) {
      toast.error(e?.data?.detail ?? "Failed to reactivate subject")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 pt-4">
        {[1, 2, 3].map((item) => (
          <Skeleton
            key={item}
            className="h-10 w-full"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4">

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} />
          Show inactive subjects
        </label>

        {/* Add Subject */}
        {isAdmin && (
          <Button
            size="sm"
            onClick={handleAddSubject}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        )}
      </div>

      {/* Empty State */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title={showInactive ? "No subjects yet" : "No active subjects"}
          description={
            isAdmin
              ? "Add a subject to start building your curriculum."
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table className="text-sm ">

            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">

                {/* Code */}
                <TableHead className="w-[110px] px-4 py-2.5">
                  Code
                </TableHead>

                {/* Name */}
                <TableHead className="px-4 py-2.5">
                  Name
                </TableHead>

                {/* Credit Hours */}
                <TableHead className="w-[130px] px-4 py-2.5 text-center">
                  Credit Hours
                </TableHead>

                {/* Status */}
                <TableHead className="w-[100px] px-4 py-2.5 text-center">
                  Status
                </TableHead>

                {/* Actions */}
                {isAdmin && (
                  <TableHead className="w-[110px] px-4 py-2.5 text-right">
                    Actions
                  </TableHead>
                )}

              </TableRow>
            </TableHeader>

            <TableBody>
              {subjects.map((subject) => (
                <SubjectRow
                  key={subject.id}
                  subject={subject}
                  isAdmin={isAdmin}
                  onEdit={handleEditSubject}
                  onDeactivate={setDeactivateTarget}
                  onReactivate={handleReactivate}
                  isMutating={isDeactivating || isReactivating}
                />
              ))}
            </TableBody>

          </Table>
        </div>
      )}

      {/* Create/edit dialog */}
      <SubjectDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editing={editTarget}
        isSaving={
          isCreating || isUpdating
        }
        onSubmit={handleSubmit}
      />

      {/* Deactivate confirmation — this is a meaningful change (the subject stops being
          assignable to any grade), so it gets a confirm step; reactivating doesn't. */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        title="Deactivate this subject?"
        description={`"${deactivateTarget?.name}" will no longer be assignable to any class. Existing assignments, attendance, and coursework tied to it are kept.`}
        confirmLabel="Deactivate"
        loading={isDeactivating}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  )
}