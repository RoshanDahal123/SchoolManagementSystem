import { Button } from "@/components/atoms/button"
import { Skeleton } from "@/components/atoms/skeleton"
import { ConfirmDialog } from "@/components/molecules/confirm-dialog"
import { EmptyState } from "@/components/molecules/empty-state"
import { LayersIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { GradeLevelResponse, SectionResponse } from "../@types"
import {
  useAssignHomeroomTeacherMutation,
    useCreateGradeLevelMutation, useCreateSectionMutation, useDeleteGradeLevelMutation,
    useDeleteSectionMutation, useGetGradeLevelsQuery, useRemoveHomeroomTeacherMutation, useUpdateGradeLevelMutation, useUpdateSectionMutation,
} from "../academic-api"
import { GradeLevelCard } from "./grade-level-card"
import { GradeLevelDialog, type GradeLevelFormData } from "./grade-level-dialog"
import { SectionDialog, type SectionFormData } from "./section-dialog"
import { useGetAllTeachersQuery } from "@/features/teachers/teacher-api"

import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api"


export function GradeStructurePanel({ isAdmin }: { isAdmin: boolean }) {
  const { data: grades = [], isLoading } = useGetGradeLevelsQuery()
  const [createGrade, { isLoading: isCreatingGrade }] = useCreateGradeLevelMutation()
  const [updateGrade, { isLoading: isUpdatingGrade }] = useUpdateGradeLevelMutation()
const { data: teachersData } = useGetAllTeachersQuery();
const { data: years = [] } = useGetAcademicYearsQuery(); // Assuming you have a query to fetch academic years
const activeYearId = years.find((y) => y.isActive)?.id ?? "";
  const activeTeachers = (teachersData ?? []).filter((t) => t.isActive)

  const [deleteGrade] = useDeleteGradeLevelMutation()
  const [createSection, { isLoading: isCreatingSection }] = useCreateSectionMutation()
  const [updateSection, { isLoading: isUpdatingSection }] = useUpdateSectionMutation()
  const [deleteSection] = useDeleteSectionMutation()
 const [removeHomeroomTeacher] = useRemoveHomeroomTeacherMutation()
 const [assignHomeroomTeacher,{isLoading: isAssigningHomeroomTeacher}] = useAssignHomeroomTeacherMutation()

  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [editGrade, setEditGrade] = useState<GradeLevelResponse | null>(null)
  const [deleteGradeTarget, setDeleteGradeTarget] = useState<GradeLevelResponse | null>(null)

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [sectionGrade, setSectionGrade] = useState<GradeLevelResponse | null>(null)
  const [editSection, setEditSection] = useState<SectionResponse | null>(null)
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<{ grade: GradeLevelResponse; section: SectionResponse } | null>(null)
 

   

  const handleSubmitGrade = async (data: GradeLevelFormData) => {
    try {
      if (editGrade) await updateGrade({ id: editGrade.id, data }).unwrap()
      else await createGrade(data).unwrap()
      toast.success(editGrade ? "Grade level updated" : "Grade level created")
      setGradeDialogOpen(false)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to save grade level") }
  }

  const handleSubmitSection = async (data: SectionFormData, originalTeacherId: string) => {
    if (!sectionGrade) return
    try {
      const section = editSection
        ? await updateSection({
            gradeLevelId: sectionGrade.id,
            sectionId: editSection.id,
            data: { name: data.name, capacity: data.capacity },
          }).unwrap()
        : await createSection({
            gradeLevelId: sectionGrade.id,
            data: { name: data.name, capacity: data.capacity },
          }).unwrap()

      const newTeacherId = data.teacherId ?? ""
      if (activeYearId && newTeacherId !== originalTeacherId) {
        if (newTeacherId) {
          await assignHomeroomTeacher({
            sectionId: section.id, yearId: activeYearId, data: { teacherId: newTeacherId },
          }).unwrap()
        } else {
          await removeHomeroomTeacher({ sectionId: section.id, yearId: activeYearId }).unwrap()
        }
      }

      toast.success(editSection ? "Section updated" : "Section added")
      setSectionDialogOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.detail ?? "Failed to save section")
    }
  }

  const handleDeleteGrade = async () => {
    if (!deleteGradeTarget) return
    try {
      await deleteGrade(deleteGradeTarget.id).unwrap()
      toast.success("Grade level deleted")
      setDeleteGradeTarget(null)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to delete grade level") }
  }

  const handleDeleteSection = async () => {
    if (!deleteSectionTarget) return
    try {
      await deleteSection({ gradeLevelId: deleteSectionTarget.grade.id, sectionId: deleteSectionTarget.section.id }).unwrap()
      toast.success("Section deleted")
      setDeleteSectionTarget(null)
    } catch (e: any) { toast.error(e?.data?.detail ?? "Failed to delete section") }
  }

  if (isLoading) return <div className="space-y-2 pt-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>

  return (
    <div className="pt-4 space-y-4">
      {isAdmin && !activeYearId && (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No active academic year is set — set one in the Academic Years tab before assigning homeroom teachers.
        </p>
      )}


      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditGrade(null); setGradeDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />Add Grade Level
          </Button>
        </div>
      )}

      {grades.length === 0 ? (
        <EmptyState icon={LayersIcon} title="No grade levels yet"
          description={isAdmin ? "Add a grade level, then split it into sections." : undefined} />
      ) : (
        <div className="space-y-2">
          {grades.map((grade) => (
            <GradeLevelCard
              key={grade.id}
              grade={grade}
              isAdmin={isAdmin}
              academicYearId={activeYearId}
              onEditGrade={(g) => { setEditGrade(g); setGradeDialogOpen(true) }}
              onDeleteGrade={setDeleteGradeTarget}
              onAddSection={(g) => { setSectionGrade(g); setEditSection(null); setSectionDialogOpen(true) }}
              onEditSection={(g, s) => { setSectionGrade(g); setEditSection(s); setSectionDialogOpen(true) }}
              onDeleteSection={(g, s) => setDeleteSectionTarget({ grade: g, section: s })}
            
            />
          ))}
        </div>
      )}

      <GradeLevelDialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen} editing={editGrade}
        nextSortOrder={grades.length} isSaving={isCreatingGrade || isUpdatingGrade} onSubmit={handleSubmitGrade} />

     <SectionDialog
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        grade={sectionGrade}
        editing={editSection}
        academicYearId={activeYearId}
        teachers={activeTeachers}
        isSaving={isCreatingSection || isUpdatingSection}
        onSubmit={handleSubmitSection}
      />
      <ConfirmDialog open={!!deleteGradeTarget} onOpenChange={(o) => !o && setDeleteGradeTarget(null)}
        title={`Delete ${deleteGradeTarget?.name}?`} description="This can't be undone. All sections must be removed first."
        confirmLabel="Delete" onConfirm={handleDeleteGrade} />

      <ConfirmDialog open={!!deleteSectionTarget} onOpenChange={(o) => !o && setDeleteSectionTarget(null)}
        title={`Delete section "${deleteSectionTarget?.section.name}"?`} description="This can't be undone."
        confirmLabel="Delete" onConfirm={handleDeleteSection} />

      
    </div>
  )
}