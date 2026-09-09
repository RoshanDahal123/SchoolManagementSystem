import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { TableCell, TableRow } from "@/components/atoms/table"
import { format } from "date-fns"
import { CalendarCheckIcon, PencilIcon } from "lucide-react"
import type { AcademicYearResponse } from "../@types"

interface Props {
  year: AcademicYearResponse
  isAdmin: boolean
  onEdit: (year: AcademicYearResponse) => void
  onActivate: (year: AcademicYearResponse) => void
}

export function AcademicYearRow({ year, isAdmin, onEdit, onActivate }: Props) {
  return (
    <TableRow>
      <TableCell className="font-medium">{year.name}</TableCell>
      <TableCell className="text-muted-foreground">
        {format(new Date(year.startDate), "MMM d, yyyy")} – {format(new Date(year.endDate), "MMM d, yyyy")}
      </TableCell>
      <TableCell>
        {year.isActive ? (
          <Badge className="gap-1 text-xs">
            <CalendarCheckIcon className="size-3" /> Active
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Inactive</span>
        )}
      </TableCell>
      {isAdmin && (
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {!year.isActive && (
              <Button variant="ghost" size="sm" onClick={() => onActivate(year)}>Set active</Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(year)} title="Edit academic year">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  )
}