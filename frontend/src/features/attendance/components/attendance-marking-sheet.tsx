import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { useGetAcademicYearsQuery } from "@/features/academic-years/academic-year-api";
import {
    useGetGradeLevelsQuery,
    useGetSectionsQuery,
} from "@/features/academic/academic-api";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AttendanceStatus } from "../@types";
import {
    useGetRosterAttendanceQuery,
    useMarkAttendanceMutation,
} from "../attendance-api";

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Excused",
];

export function AttendanceMarkingSheet() {
  const [academicYearId, setAcademicYearId] = useState<string>("");
  const [gradeLevelId, setGradeLevelId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  // Local draft: enrollmentId -> { status, remarks }. Seeded from the server
  // response, then edited locally until "Save attendance" is pressed —
  // avoids firing a mutation on every single click in a 40-student class.
  const [draft, setDraft] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});

  const { data: years } = useGetAcademicYearsQuery();
  const { data: grades } = useGetGradeLevelsQuery();
  const { data: sections } = useGetSectionsQuery(gradeLevelId, {
    skip: !gradeLevelId,
  });

  const {
    data: roster,
    isLoading,
    isFetching,
  } = useGetRosterAttendanceQuery(
    { sectionId, academicYearId, date },
    { skip: !sectionId || !academicYearId || !date },
  );

  const [markAttendance, { isLoading: isSaving }] = useMarkAttendanceMutation();

  const rows = useMemo(() => {
    if (!roster) return [];
    return roster.map((r) => ({
      ...r,
      draftStatus: draft[r.enrollmentId]?.status ?? r.status ?? "Present",
      draftRemarks: draft[r.enrollmentId]?.remarks ?? r.remarks ?? "",
    }));
  }, [roster, draft]);

  function setRowStatus(enrollmentId: string, status: AttendanceStatus) {
    setDraft((d) => ({
      ...d,
      [enrollmentId]: { remarks: d[enrollmentId]?.remarks ?? "", status },
    }));
  }

  function setRowRemarks(enrollmentId: string, remarks: string) {
    setDraft((d) => ({
      ...d,
      [enrollmentId]: { status: d[enrollmentId]?.status ?? "Present", remarks },
    }));
  }

  function markAllPresent() {
    if (!roster) return;
    const next: typeof draft = {};
    for (const r of roster)
      next[r.enrollmentId] = { status: "Present", remarks: "" };
    setDraft(next);
  }

  async function handleSave() {
    if (!roster) return;
    try {
      await markAttendance({
        sectionId,
        academicYearId,
        data: {
          date,
          entries: roster.map((r) => ({
            enrollmentId: r.enrollmentId,
            status: draft[r.enrollmentId]?.status ?? r.status ?? "Present",
            remarks: draft[r.enrollmentId]?.remarks ?? r.remarks ?? undefined,
          })),
        },
      }).unwrap();
      toast.success("Attendance saved");
      setDraft({});
    } catch {
      toast.error("Failed to save attendance");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 flex-row flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-sm font-medium">Academic Year</label>
          <Select
            value={academicYearId}
            onValueChange={(value) => {
              if (value) {
                setAcademicYearId(value);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select year">
                {years?.find((y) => y.id === academicYearId)?.name}
              </SelectValue>
            </SelectTrigger>

            <SelectContent side="bottom" align="start" sideOffset={6}
              alignItemWithTrigger={false}>
              {years?.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Grade</label>
          <Select
            value={gradeLevelId}
            onValueChange={(v) => {
              v && setGradeLevelId(v);
              setSectionId("");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Select grade" >
                {grades?.find((g) => g.id === gradeLevelId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {grades?.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Section</label>
          <Select
            value={sectionId}
            onValueChange={(value) => {
              if (value) {
                setSectionId(value);
              }
            }}
            disabled={!gradeLevelId}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Select section" >
                {sections?.find((s) => s.id === sectionId)?.name}
                </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
              {sections?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className=" flex flex-col space-y-1">
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
            placeholder="Select date"
           
          />
        </div>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={markAllPresent}
            disabled={!roster?.length}
          >
            Mark all present
          </Button>
          <Button onClick={handleSave} disabled={!roster?.length || isSaving}>
            {isSaving ? "Saving..." : "Save attendance"}
          </Button>
        </div>
      </Card>

      {!sectionId || !academicYearId ? (
        <Card className="p-12 text-center text-muted-foreground">
          Select an academic year, grade and section to load the roster.
        </Card>
      ) : isLoading || isFetching ? (
        <Card className="p-12 text-center text-muted-foreground">
          Loading roster...
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          No active students in this section.
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.enrollmentId}>
                  <TableCell>{r.enrollmentNumber}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell>
                    <Select
                      value={r.draftStatus}
                      onValueChange={(v) =>
                        setRowStatus(r.enrollmentId, v as AttendanceStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.draftRemarks}
                      placeholder="Optional"
                      onChange={(e) =>
                        setRowRemarks(r.enrollmentId, e.target.value)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
