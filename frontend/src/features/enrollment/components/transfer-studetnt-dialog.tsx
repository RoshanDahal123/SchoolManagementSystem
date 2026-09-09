import { Button } from "@/components/atoms/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldLabel } from "@/components/atoms/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useGetGradeLevelsQuery } from "@/features/academic/academic-api"
import { useEffect, useState } from "react"
import type { StudentEnrollmentResponse } from "../@types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  currentEnrollment: StudentEnrollmentResponse | null
  isSaving: boolean
  onTransfer: (newSectionId: string) => void
}

export function TransferStudentDialog({
  open, onOpenChange, studentName, currentEnrollment, isSaving, onTransfer,
}: Props) {
  const { data: gradeLevels = [] } = useGetGradeLevelsQuery()
  const [gradeLevelId, setGradeLevelId] = useState("")
  const [sectionId, setSectionId] = useState("")

  useEffect(() => {
    if (open && currentEnrollment) {
      setGradeLevelId(currentEnrollment.gradeLevelId)
      setSectionId("") // don't pre-select the section they're already in — force a deliberate pick
    }
  }, [open, currentEnrollment])

  const sections = gradeLevels.find((g) => g.id === gradeLevelId)?.sections ?? []
  const canSubmit = !!sectionId && sectionId !== currentEnrollment?.sectionId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Transfer student</DialogTitle>
          <DialogDescription>
            Move {studentName} out of {currentEnrollment?.gradeLevelName} · {currentEnrollment?.sectionName}
            {" "}({currentEnrollment?.academicYearName}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Grade level</FieldLabel>
            <Select
              value={gradeLevelId}
              onValueChange={(value) => { setGradeLevelId(value); setSectionId("") }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select grade level…" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">New section</FieldLabel>
            <Select value={sectionId} onValueChange={setSectionId} disabled={!gradeLevelId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select section…" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={s.id === currentEnrollment?.sectionId}>
                    {s.name} · {s.capacity} seats{s.id === currentEnrollment?.sectionId ? " (current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!canSubmit || isSaving} onClick={() => onTransfer(sectionId)}>
            {isSaving ? "Transferring…" : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}