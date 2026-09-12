
import { Button } from "@/components/atoms/button"
import { Skeleton } from "@/components/atoms/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/atoms/table"
import { ConfirmDialog } from "@/components/molecules/confirm-dialog"
import { EmptyState } from "@/components/molecules/empty-state"
import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api"
import { useGetAllTeachersQuery } from "@/features/teachers/teacher-api"
import { BoxesIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { ClassSubjectResponse } from "../@types"
import {
  useAssignSubjectMutation, useAssignTeacherMutation, useGetClassSubjectsQuery,
  useGetGradeLevelsQuery, useGetSubjectsQuery, useRemoveClassSubjectMutation, useRemoveTeacherMutation,
} from "../academic-api"
import { AssignSubjectDialog } from "./assign-subject-dialog"
import { AssignTeacherDialog } from "./assign-teacher-dialog"

import { CurriculumFilters } from "./curriculam-filters"
import { CurriculumSubjectRow } from "./curriculum-subject-row"

export function CurriculumPanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: grades = [] } = useGetGradeLevelsQuery()
  const { data: years = [] } = useGetAcademicYearsQuery()
  const { data: subjects = [] } = useGetSubjectsQuery()
  const {data:teachersData}= useGetAllTeachersQuery();
  const teachers = (teachersData ?? []).filter((t) => t.isActive);

  const [gradeId, setGradeId] = useState("")
  const [yearId, setYearId] = useState(() => years.find((y) => y.isActive)?.id ?? "")

  const skip = !gradeId || !yearId
  const { data: classSubjects = [], isLoading } = useGetClassSubjectsQuery({ gradeLevelId: gradeId, yearId }, { skip })

  const [assignSubject, { isLoading: isAssigningSubject }] = useAssignSubjectMutation()
  const [removeClassSubject] = useRemoveClassSubjectMutation()
  const [assignTeacher, { isLoading: isAssigningTeacher }] = useAssignTeacherMutation()
  const [removeTeacher] = useRemoveTeacherMutation()

  const [assignSubjectOpen, setAssignSubjectOpen] = useState(false)
  const [teacherTarget, setTeacherTarget] = useState<ClassSubjectResponse | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ClassSubjectResponse | null>(null)

  const assignedSubjectIds = new Set(classSubjects.map((cs) => cs.subjectId))
  const availableSubjects = subjects.filter((s) =>  !assignedSubjectIds.has(s.id))

  const handleAssignSubject = async (subjectId: string) => {
    try {
      await assignSubject({ gradeLevelId: gradeId, yearId, data: { subjectId } }).unwrap()
      toast.success("Subject assigned")
      setAssignSubjectOpen(false)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to assign subject") }
  }

  const handleAssignTeacher = async (teacherId: string) => {
    if (!teacherTarget) return
    try {
      await assignTeacher({ classSubjectId: teacherTarget.id, gradeLevelId: gradeId, yearId, data: { teacherId } }).unwrap()
      toast.success("Teacher assigned")
      setTeacherTarget(null)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to assign teacher") }
  }

  const handleRemoveTeacher = async (cs: ClassSubjectResponse) => {
    try {
      await removeTeacher({ classSubjectId: cs.id, gradeLevelId: gradeId, yearId }).unwrap()
      toast.success("Teacher removed")
    } catch { toast.error("Failed to remove teacher") }
  }

  const handleRemoveSubject = async () => {
    if (!removeTarget) return
    try {
      await removeClassSubject({ classSubjectId: removeTarget.id, gradeLevelId: gradeId, yearId }).unwrap()
      toast.success("Subject removed from curriculum")
      setRemoveTarget(null)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to remove subject") }
  }

  return (
    <div className="pt-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <CurriculumFilters grades={grades} years={years} gradeId={gradeId} yearId={yearId}
          onGradeChange={(value) => { if (value !== null) setGradeId(value) }}
          onYearChange={(value) => { if (value !== null) setYearId(value) }} />
        {isAdmin && gradeId && yearId && (
          <Button onClick={() => setAssignSubjectOpen(true)} disabled={availableSubjects.length === 0}>
            <PlusIcon className="mr-2 h-4 w-4" />Assign Subject
          </Button>
        )}
      </div>

      {!gradeId || !yearId ? (
        <EmptyState icon={BoxesIcon} title="Pick a grade and academic year"
          description="The curriculum for that grade and year will show up here." />
      ) : isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
      ) : classSubjects.length === 0 ? (
        <EmptyState icon={BoxesIcon} title="No subjects assigned yet"
          description={isAdmin ? 'Use "Assign Subject" above to build this grade\'s curriculum.' : undefined} />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32 pl-4 pr-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Code
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </TableHead>
                <TableHead className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Teacher
                </TableHead>
                {isAdmin && (
                  <TableHead className="pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classSubjects.map((cs) => (
                <CurriculumSubjectRow
                  key={cs.id}
                  classSubject={cs}
                  isAdmin={isAdmin}
                  onAssignTeacher={setTeacherTarget}
                  onRemoveTeacher={handleRemoveTeacher}
                  onRemove={setRemoveTarget}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}


      <AssignSubjectDialog open={assignSubjectOpen} onOpenChange={setAssignSubjectOpen}
        availableSubjects={availableSubjects} isSaving={isAssigningSubject} onAssign={handleAssignSubject} />

      <AssignTeacherDialog open={!!teacherTarget} onOpenChange={(o) => !o && setTeacherTarget(null)}
        classSubject={teacherTarget} teachers={teachers} isSaving={isAssigningTeacher} onAssign={handleAssignTeacher} />

      <ConfirmDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Remove "${removeTarget?.subjectName}" from curriculum?`}
        description="This also removes the teacher assignment for this subject in this grade and year."
        confirmLabel="Remove" onConfirm={handleRemoveSubject} />
    </div>
  )
}