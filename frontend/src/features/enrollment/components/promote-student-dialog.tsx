import { Button } from "@/components/atoms/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api"
import { useGetGradeLevelsQuery } from "@/features/academic/academic-api"
import { format } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import type { PromoteStudentRequest, StudentEnrollmentResponse } from "../@types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  currentEnrollment: StudentEnrollmentResponse | null
  isSaving: boolean
  onPromote: (data: PromoteStudentRequest) => void
}

export function PromoteStudentDialog({
  open, onOpenChange, studentName, currentEnrollment, isSaving, onPromote,
}: Props) {
  const { data: gradeLevels = [] } = useGetGradeLevelsQuery()
  const { data: years = [] } = useGetAcademicYearsQuery()

  const sortedGrades = useMemo(
    () => [...gradeLevels].sort((a, b) => a.sortOrder - b.sortOrder),
    [gradeLevels],
  )
  const currentGradeIndex = sortedGrades.findIndex((g) => g.id === currentEnrollment?.gradeLevelId)
  const suggestedGrade = currentGradeIndex >= 0 ? sortedGrades[currentGradeIndex + 1] : undefined

  const currentYear = years.find((y) => y.id === currentEnrollment?.academicYearId)
  const otherYears = years.filter((y) => y.id !== currentEnrollment?.academicYearId)
  const suggestedYear = currentYear
    ? [...otherYears].filter((y) => y.startDate > currentYear.startDate).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    : undefined

  const [academicYearId, setAcademicYearId] = useState("")
  const [gradeLevelId, setGradeLevelId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [enrolledOn, setEnrolledOn] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    if (open) {
      setAcademicYearId(suggestedYear?.id ?? "")
      setGradeLevelId(suggestedGrade?.id ?? "")
      setSectionId("")
      setEnrolledOn(format(new Date(), "yyyy-MM-dd"))
    }
    // Deliberately only on `open` — grade/year suggestions should only be recomputed when the dialog opens fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const sections = sortedGrades.find((g) => g.id === gradeLevelId)?.sections ?? []
  const selectedYear = years.find((y) => y.id === academicYearId)
  const selectedGrade = sortedGrades.find((g) => g.id === gradeLevelId)
  const selectedSection = sections.find((s) => s.id === sectionId)
  const canSubmit = !!academicYearId && !!sectionId && !!enrolledOn

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Promote student</DialogTitle>
          <DialogDescription>
            Move {studentName} up to the next grade for a new academic year.
            {currentEnrollment && (
              <> Currently {currentEnrollment.gradeLevelName} · {currentEnrollment.sectionName} ({currentEnrollment.academicYearName}).</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Academic year</FieldLabel>
            <Select value={academicYearId} onValueChange={(value) => { if(value) { setAcademicYearId(value) } }}>
              <SelectTrigger className="h-9 w-full">
                {selectedYear ? (
                  <span className="text-sm">{selectedYear.name}{selectedYear.isActive ? " · Active" : ""}</span>
                ) : (
                  <SelectValue placeholder="Select academic year…" />
                )}
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                {otherYears.map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}{y.isActive ? " · Active" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Grade level</FieldLabel>
            <Select value={gradeLevelId} onValueChange={(value) => { if(value) { setGradeLevelId(value); setSectionId("") } }}>
              <SelectTrigger className="h-9 w-full">
                {selectedGrade ? (
                  <span className="text-sm">{selectedGrade.name}</span>
                ) : (
                  <SelectValue placeholder="Select grade level…" />
                )}
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                {sortedGrades.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Section</FieldLabel>
            <Select value={sectionId} onValueChange={(value) => { if(value) { setSectionId(value) } }} disabled={!gradeLevelId}>
              <SelectTrigger className="h-9 w-full">
                {selectedSection ? (
                  <span className="text-sm">{selectedSection.name} · {selectedSection.capacity} seats</span>
                ) : (
                  <SelectValue placeholder={gradeLevelId ? "Select section…" : "Pick a grade level first"} />
                )}
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.capacity} seats</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Enrolled on</FieldLabel>
            <Input type="date" value={enrolledOn} onChange={(e) => setEnrolledOn(e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!canSubmit || isSaving}
            onClick={() => onPromote({ academicYearId, sectionId, enrolledOn })}
          >
            {isSaving ? "Promoting…" : "Promote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}