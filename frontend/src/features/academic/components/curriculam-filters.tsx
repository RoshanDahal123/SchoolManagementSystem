import { Field, FieldLabel } from "@/components/atoms/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select"
import type { AcademicYearResponse } from "@/features/academic-years/@types"
import type { GradeLevelResponse } from "../@types"

interface Props {
  grades: GradeLevelResponse[]
  years: AcademicYearResponse[]
  gradeId: string
  yearId: string
  onGradeChange: (id: string | null) => void
  onYearChange: (id: string | null) => void
}

export function CurriculumFilters({
  grades,
  years,
  gradeId,
  yearId,
  onGradeChange,
  onYearChange,
}: Props) {
  const selectedGrade = grades.find((g) => g.id === gradeId)
  const selectedYear = years.find((y) => y.id === yearId)

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Grade Level */}
      <Field className="w-52">
        <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">
          Grade level
        </FieldLabel>

        <Select value={gradeId} onValueChange={onGradeChange}>
          <SelectTrigger className="h-9 w-full">
            {selectedGrade ? (
              <span className="text-sm">{selectedGrade.name}</span>
            ) : (
              <SelectValue placeholder="Select grade…" />
            )}
          </SelectTrigger>

          <SelectContent
            side="bottom"
            align="start"
            sideOffset={6}
            alignItemWithTrigger={false}
          >
            {grades.map((grade) => (
              <SelectItem key={grade.id} value={grade.id}>
                {grade.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Academic Year */}
      <Field className="w-56">
        <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">
          Academic year
        </FieldLabel>

        <Select value={yearId} onValueChange={onYearChange}>
          <SelectTrigger className="h-9 w-full">
            {/* Show the selected year name + Active badge inline in the trigger */}
            {selectedYear ? (
              <span className="flex items-center gap-2 text-sm">
                <span>{selectedYear.name}</span>
                {selectedYear.isActive && (
                  <span className="rounded-full bg-green-100 px-1.5 py-px text-[11px] font-medium leading-tight text-green-700">
                    Active
                  </span>
                )}
              </span>
            ) : (
              <SelectValue placeholder="Select academic year…" />
            )}
          </SelectTrigger>

          <SelectContent
            side="bottom"
            align="start"
            sideOffset={6}
            alignItemWithTrigger={false}
          >
            {years.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                <span className="flex items-center gap-2">
                  <span>{year.name}</span>
                  {year.isActive && (
                    <span className="rounded-full bg-green-100 px-1.5 py-px text-[11px] font-medium leading-tight text-green-700">
                      Active
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
