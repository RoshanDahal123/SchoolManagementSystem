import { Button } from "@/components/atoms/button"
import { Skeleton } from "@/components/atoms/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/atoms/table"
import { ConfirmDialog } from "@/components/molecules/confirm-dialog"
import { EmptyState } from "@/components/molecules/empty-state"
import { CalendarRangeIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { AcademicYearResponse } from "../@types"
import {
    useActivateAcademicYearMutation, useCreateAcademicYearMutation,
    useGetAcademicYearsQuery, useUpdateAcademicYearMutation,
} from "../academic-year-api"
import { AcademicYearDialog, type AcademicYearFormData } from "./academic-year-dialog"
import { AcademicYearRow } from "./academic-year-row"

export function AcademicYearsPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: years = [], isLoading } = useGetAcademicYearsQuery()
  const [createYear, { isLoading: isCreating }] = useCreateAcademicYearMutation()
  const [updateYear, { isLoading: isUpdating }] = useUpdateAcademicYearMutation()
  const [activateYear] = useActivateAcademicYearMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicYearResponse | null>(null)
  const [activateTarget, setActivateTarget] = useState<AcademicYearResponse | null>(null)

  const handleSubmit = async (data: AcademicYearFormData) => {
    try {
      if (editing) await updateYear({ id: editing.id, data }).unwrap()
      else await createYear(data).unwrap()
      toast.success(editing ? "Academic year updated" : "Academic year created")
      setDialogOpen(false)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to save academic year") }
  }

  const handleActivate = async () => {
    if (!activateTarget) return
    try {
      await activateYear(activateTarget.id).unwrap()
      toast.success(`${activateTarget.name} is now the active academic year`)
      setActivateTarget(null)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to activate academic year") }
  }

  if (isLoading) return <div className="space-y-2 pt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>

  return (
    <div className="pt-4 space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />Add Academic Year
          </Button>
        </div>
      )}

     {years.length === 0 ? (
        <EmptyState icon={CalendarRangeIcon} title="No academic years yet"
          description={isAdmin ? "Add one to start setting up grades, subjects, and curriculum." : undefined} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((y) => (
                <AcademicYearRow key={y.id} year={y} isAdmin={isAdmin}
                  onEdit={(year) => { setEditing(year); setDialogOpen(true) }}
                  onActivate={setActivateTarget} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AcademicYearDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing}
        isSaving={isCreating || isUpdating} onSubmit={handleSubmit} />

      <ConfirmDialog
        open={!!activateTarget}
        onOpenChange={(o) => !o && setActivateTarget(null)}
        title={`Set "${activateTarget?.name}" as active?`}
        description="New enrollments and curriculum changes apply to this year by default. The previously active year is marked inactive."
        confirmLabel="Set active"
        destructive={false}
        onConfirm={handleActivate}
      />
    </div>
  )
}