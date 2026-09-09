import { Button } from "@/components/atoms/button"
import { TableCell, TableRow } from "@/components/atoms/table"
import { Trash2Icon, UserPlusIcon, UserRoundXIcon } from "lucide-react"
import type { ClassSubjectResponse } from "../@types"

interface Props {
  classSubject: ClassSubjectResponse
  isAdmin: boolean
  onAssignTeacher: (cs: ClassSubjectResponse) => void
  onRemoveTeacher: (cs: ClassSubjectResponse) => void
  onRemove: (cs: ClassSubjectResponse) => void
}

export function CurriculumSubjectRow({
  classSubject: cs,
  isAdmin,
  onAssignTeacher,
  onRemoveTeacher,
  onRemove,
}: Props) {
  return (
    <TableRow className="group">
      {/* Subject Code */}
      <TableCell className="py-3.5 pl-4 pr-3">
        <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
          {cs.subjectCode}
        </span>
      </TableCell>

      {/* Subject Name */}
      <TableCell className="px-4 py-3.5">
        <span className="text-sm font-medium text-foreground">{cs.subjectName}</span>
      </TableCell>

      {/* Assigned Teacher */}
      <TableCell className="px-4 py-3.5">
        {cs.assignedTeacherName ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs">
            <span className="size-2 shrink-0 rounded-full bg-green-500" />
            {cs.assignedTeacherName}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground/60">
            No teacher assigned
          </span>
        )}
      </TableCell>

      {/* Actions */}
      {isAdmin && (
        <TableCell className="py-3.5 pr-4 text-right">
          <div className="inline-flex items-center gap-1 opacity-50 transition-opacity group-hover:opacity-100">
            {/* Assign / reassign teacher — blue */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-md p-0 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => onAssignTeacher(cs)}
              title={cs.assignedTeacherId ? "Reassign teacher" : "Assign teacher"}
            >
              <UserPlusIcon className="size-4 text-blue-500" />
            </Button>

            {/* Remove teacher — amber, only shown when one is assigned */}
            {cs.assignedTeacherId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-md p-0 hover:bg-amber-50 dark:hover:bg-amber-950"
                onClick={() => onRemoveTeacher(cs)}
                title="Remove teacher"
              >
                <UserRoundXIcon className="size-4 text-amber-500" />
              </Button>
            )}

            {/* Divider */}
            <span className="mx-0.5 h-4 w-px bg-border" />

            {/* Remove subject — red */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-md p-0 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => onRemove(cs)}
              title="Remove subject from curriculum"
            >
              <Trash2Icon className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}
