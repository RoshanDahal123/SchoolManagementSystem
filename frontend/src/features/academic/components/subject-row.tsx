
import {
  PencilIcon,
  PowerIcon,
  PowerOffIcon,
  Trash2Icon,
} from "lucide-react"
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button"
import {
  TableCell,
  TableRow,
} from "@/components/atoms/table"

import type { SubjectResponse } from "../@types"
import { cn } from "@/lib/utils"

interface SubjectRowProps {
  subject: SubjectResponse
  isAdmin: boolean
  onEdit: (
    subject: SubjectResponse,
  ) => void
onDeactivate: (subject: SubjectResponse) => void
  onReactivate: (subject: SubjectResponse) => void
  isMutating?: boolean
}

export function SubjectRow({
  subject,
  isAdmin,
  onEdit,
  onDeactivate,
  onReactivate,
  isMutating
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
{/* Status */}
      <TableCell className="px-4 py-2 text-center">
        <Badge
          variant={subject.isActive ? "secondary" : "outline"}
          className={cn(!subject.isActive && "text-muted-foreground")}
        >
          {subject.isActive ? "Active" : "Inactive"}
        </Badge>
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

              {subject.isActive ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDeactivate(subject)}
                disabled={isMutating}
                aria-label={`Deactivate ${subject.name}`}
              >
                <PowerOffIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onReactivate(subject)}
                disabled={isMutating}
                aria-label={`Reactivate ${subject.name}`}
              >
                <PowerIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      )}

    </TableRow>
  )
}

