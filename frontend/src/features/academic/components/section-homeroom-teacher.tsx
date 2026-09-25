import { Skeleton } from "@/components/atoms/skeleton"
import { UserRoundIcon, UserRoundPlusIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { useGetHomeroomTeacherQuery, useRemoveHomeroomTeacherMutation } from "../academic-api"

interface Props {
  sectionId: string
  academicYearId: string
}

export function SectionHomeroomTeacher({ sectionId, academicYearId}: Props) {
  const { data: homeroom, isLoading } = useGetHomeroomTeacherQuery(
    { sectionId, yearId: academicYearId },
    { skip: !academicYearId }
  )
  const [removeHomeroomTeacher, { isLoading: isRemoving }] = useRemoveHomeroomTeacherMutation()

  if (!academicYearId) return null
  if (isLoading) return <Skeleton className="h-5 w-20 rounded-full" />

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await removeHomeroomTeacher({ sectionId, yearId: academicYearId }).unwrap()
      toast.success("Homeroom teacher removed")
    } catch (err: any) {
      toast.error(err?.data?.detail ?? "Failed to remove homeroom teacher")
    }
  }

  if (homeroom) {
    return (
      <span className="ml-1 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
        <UserRoundIcon className="h-3 w-3" />
       {homeroom.teacherName}
        <button
          onClick={handleRemove}
          className="ml-1 flex h-3 w-3 items-center justify-center rounded-full text-primary hover:bg-primary/20"
        >
          <XIcon className="h-3 w-3" />
        </button>
      </span>
    )
  }
}