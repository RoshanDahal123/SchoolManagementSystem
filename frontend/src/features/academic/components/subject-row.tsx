
import {
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/atoms/button"
import {
  TableCell,
  TableRow,
} from "@/components/atoms/table"

import type { SubjectResponse } from "../@types"

interface SubjectRowProps {
  subject: SubjectResponse
  isAdmin: boolean
  onEdit: (
    subject: SubjectResponse,
  ) => void
}

export function SubjectRow({
  subject,
  isAdmin,
  onEdit,
}: SubjectRowProps) {
  return (
    <TableRow className="h-11 hover:bg-muted/30">

      {/* Code */}
      <TableCell className="px-4 py-2 font-medium">
        {subject.code}
      </TableCell>

      {/* Name */}
      <TableCell className="px-4 py-2">
        {subject.name}
      </TableCell>

      {/* Credit Hours */}
      <TableCell className="px-4 py-2 text-center tabular-nums">
        {subject.creditHours}
      </TableCell>

      {/* Actions */}
      {isAdmin && (
        <TableCell className="px-4 py-2 text-right">
          <div className="flex items-center justify-end gap-1">

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                onEdit(subject)
              }
              aria-label={`Edit ${subject.name}`}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Delete ${subject.name}`}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>

          </div>
        </TableCell>
      )}

    </TableRow>
  )
}

