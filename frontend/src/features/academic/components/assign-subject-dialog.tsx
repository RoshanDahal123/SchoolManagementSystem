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
import { useEffect, useState } from "react"
import type { SubjectResponse } from "../@types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableSubjects: SubjectResponse[]
  isSaving: boolean
  onAssign: (subjectId: string) => void
}

export function AssignSubjectDialog({
  open,
  onOpenChange,
  availableSubjects,
  isSaving,
  onAssign,
}: Props) {
  const [subjectId, setSubjectId] = useState("")

  useEffect(() => {
    if (open) setSubjectId("")
  }, [open])

  const selected = availableSubjects.find((s) => s.id === subjectId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign subject</DialogTitle>
          <DialogDescription>
            Choose a subject to add to this grade&apos;s curriculum.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">
              Subject
            </FieldLabel>

            <Select
              value={subjectId}
              onValueChange={(value) => {
                if (value !== null) setSubjectId(value)
              }}
            >
              <SelectTrigger className="h-9 w-full">
                {selected ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {selected.code}
                    </span>
                    <span>{selected.name}</span>
                  </span>
                ) : (
                  <SelectValue placeholder="Select subject…" />
                )}
              </SelectTrigger>

              <SelectContent
                side="bottom"
                align="start"
                sideOffset={6}
                alignItemWithTrigger={false}
              >
                {availableSubjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {s.code}
                      </span>
                      <span>{s.name}</span>
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
          <Button disabled={!subjectId || isSaving} onClick={() => onAssign(subjectId)}>
            {isSaving ? "Assigning…" : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
