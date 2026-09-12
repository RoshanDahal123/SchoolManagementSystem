import { Button } from "@/components/atoms/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldLabel } from "@/components/atoms/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import type { TeacherResponse } from "@/features/teachers/@types"
import { useEffect, useState } from "react"
import type { ClassSubjectResponse } from "../@types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  classSubject: ClassSubjectResponse | null
  teachers: TeacherResponse[]
  isSaving: boolean
  onAssign: (teacherId: string) => void
}

export function AssignTeacherDialog({
  open,
  onOpenChange,
  classSubject,
  teachers,
  isSaving,
  onAssign,
}: Props) {
  const [teacherId, setTeacherId] = useState("")

  useEffect(() => {
    if (open) setTeacherId(classSubject?.assignedTeacherId ?? "")
  }, [open, classSubject])

  // UX-only filter — the real enforcement is the backend check in
  // ClassSubjectService.AssignTeacherAsync. Keep the currently-assigned
  // teacher selectable even if they're no longer specialized, so the
  // dialog doesn't silently hide who's already assigned.
  const eligibleTeachers = teachers.filter(
    (t) =>
      t.id === classSubject?.assignedTeacherId ||
      t.specializations.some((s) => s.subjectId === classSubject?.subjectId)
  )

  const selected = eligibleTeachers.find((t) => t.id === teacherId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign teacher</DialogTitle>
          <DialogDescription>
            Assign a teacher to &ldquo;{classSubject?.subjectName}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">
              Teacher
            </FieldLabel>

            <Select
              value={teacherId}
              onValueChange={(value) => {
                if (value !== null) setTeacherId(value)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                {selected ? (
                  <span className="text-sm">
                    {selected.firstName} {selected.lastName}
                  </span>
                ) : (
                  <SelectValue placeholder="Select teacher…" />
                )}
              </SelectTrigger>

              <SelectContent
                side="bottom"
                align="start"
                sideOffset={6}
                alignItemWithTrigger={false}
              >
                {eligibleTeachers.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No teacher is specialized in this subject yet.
                  </div>
                )}
                {eligibleTeachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-medium">
                      {t.firstName} {t.lastName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!teacherId || isSaving} onClick={() => onAssign(teacherId)}>
            {isSaving ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}