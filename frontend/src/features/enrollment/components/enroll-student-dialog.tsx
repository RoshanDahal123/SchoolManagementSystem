import { Button } from "@/components/atoms/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { useGetAcademicYearsQuery, useGetActiveAcademicYearQuery } from "@/features/academic-years/academic-year-api"
import { useGetGradeLevelsQuery } from "@/features/academic/academic-api"
import { format } from "date-fns"
import { useEffect, useState } from "react"
import type { EnrollStudentRequest } from "../@types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentName: string
  isSaving: boolean
  onEnroll: (data: EnrollStudentRequest) => void
}

export function EnrollStudentDialog({ open, onOpenChange, studentName, isSaving, onEnroll }: Props) {
  const { data: years = [] } = useGetAcademicYearsQuery()
  const { data: activeYear } = useGetActiveAcademicYearQuery()
  const { data: gradeLevels = [] } = useGetGradeLevelsQuery()

  const [academicYearId, setAcademicYearId] = useState("")
  const [gradeLevelId, setGradeLevelId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [enrolledOn, setEnrolledOn] = useState(format(new Date(), "yyyy-MM-dd"))

  useEffect(() => {
    if (open) {
      setAcademicYearId(activeYear?.id ?? "")
      setGradeLevelId("")
      setSectionId("")
      setEnrolledOn(format(new Date(), "yyyy-MM-dd"))
    }
  }, [open, activeYear])

  const sections = gradeLevels.find((g) => g.id === gradeLevelId)?.sections ?? []
  const canSubmit = !!academicYearId && !!sectionId && !!enrolledOn

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Enroll student</DialogTitle>
          <DialogDescription>Assign {studentName} to a section for an academic year.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Academic year</FieldLabel>
            <Select value={academicYearId} onValueChange={(value)=>{if(value){setAcademicYearId(value)}}}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Select academic year…" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}{y.isActive ? " · Active" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Grade level</FieldLabel>
            <Select
              value={gradeLevelId}
              onValueChange={(value) => { if (value) { setGradeLevelId(value); setSectionId("") } }}
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
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Section</FieldLabel>
            <Select value={sectionId} onValueChange={(value) => { if (value) { setSectionId(value) } }} disabled={!gradeLevelId}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={gradeLevelId ? "Select section…" : "Pick a grade level first"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.capacity} seats</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel className="mb-1.5 text-sm font-medium text-foreground">Enrolled on</FieldLabel>
            <Input
              type="date"
              value={enrolledOn}
              max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setEnrolledOn(e.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!canSubmit || isSaving}
            onClick={() => onEnroll({ academicYearId, sectionId, enrolledOn })}
          >
            {isSaving ? "Enrolling…" : "Enroll"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}