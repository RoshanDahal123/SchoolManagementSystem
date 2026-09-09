
import { Button } from "@/components/atoms/button"
import { Skeleton } from "@/components/atoms/skeleton"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table"
import { EmptyState } from "@/components/molecules/empty-state"
import { BookOpenIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { SubjectResponse } from "../@types"
import {
  useCreateSubjectMutation,
  useGetSubjectsQuery,
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
  const {
    data: subjects = [],
    isLoading,
  } = useGetSubjectsQuery()

  const [
    createSubject,
    { isLoading: isCreating },
  ] = useCreateSubjectMutation()

  const [
    updateSubject,
    { isLoading: isUpdating },
  ] = useUpdateSubjectMutation()

  const [dialogOpen, setDialogOpen] =
    useState(false)

  const [editTarget, setEditTarget] =
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
        await createSubject(data).unwrap()

        toast.success("Subject created")
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

      {/* Add Subject */}
      {isAdmin && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddSubject}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      )}

      {/* Empty State */}
      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpenIcon}
          title="No subjects yet"
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
                />
              ))}
            </TableBody>

          </Table>
        </div>
      )}

      {/* Dialog */}
      <SubjectDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editing={editTarget}
        isSaving={
          isCreating || isUpdating
        }
        onSubmit={handleSubmit}
      />
    </div>
  )
}

