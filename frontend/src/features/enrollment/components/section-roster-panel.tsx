// features/enrollment/components/section-roster-panel.tsx
import { Badge } from "@/components/atoms/badge"
import { Card } from "@/components/atoms/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/atoms/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/atoms/table"
import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api"
import { useGetGradeLevelsQuery, useGetSectionsQuery } from "@/features/academic/academic-api"
import { useState } from "react"
import { useGetSectionRosterQuery } from "../enrollment-api"

export function SectionRosterPanel() {
  const [academicYearId, setAcademicYearId] = useState("")
  const [gradeLevelId, setGradeLevelId] = useState("")
  const [sectionId, setSectionId] = useState("")

  const { data: years } = useGetAcademicYearsQuery()
  const { data: grades } = useGetGradeLevelsQuery()
  const { data: sections } = useGetSectionsQuery(gradeLevelId, { skip: !gradeLevelId })

  const { data: roster, isLoading } = useGetSectionRosterQuery(
    { sectionId, academicYearId },
    { skip: !sectionId || !academicYearId },
  )

  return (
    <div className="space-y-4">
      <Card className="p-4 flex-row flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">Academic Year</label>
          <Select value={academicYearId} onValueChange={(value) => value &&setAcademicYearId(value)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Select year">
                {years?.find((y) => y.id === academicYearId)?.name}
                </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {years?.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Grade</label>
          <Select value={gradeLevelId} onValueChange={(value) => { value && setGradeLevelId(value); setSectionId("") }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Select grade">{grades?.find(g=>g.id===gradeLevelId)?.name} </SelectValue></SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {grades?.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Section</label>
          <Select value={sectionId} onValueChange={(value)=>value && setSectionId(value)} disabled={!gradeLevelId}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Select section">{sections?.find((s) => s.id === sectionId)?.name}</SelectValue></SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {sections?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {roster && <Badge variant="secondary" className="ml-auto">{roster.length} enrolled</Badge>}
      </Card>

      {!sectionId || !academicYearId ? (
        <Card className="p-12 text-center text-muted-foreground">
          Select a year, grade and section to view the roster.
        </Card>
      ) : isLoading ? (
        <Card className="p-12 text-center text-muted-foreground">Loading...</Card>
      ) : !roster?.length ? (
        <Card className="p-12 text-center text-muted-foreground">No students enrolled in this section yet.</Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.enrollmentNumber}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "Active" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell>{r.enrolledOn}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}