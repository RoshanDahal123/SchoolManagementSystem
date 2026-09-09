import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs"
import { AcademicYearsPanel } from "@/features/academic-years/components/academic-years-panel"
import { CurriculumPanel } from "@/features/academic/components/curriculum-panel"
import { GradeStructurePanel } from "@/features/academic/components/grade-structure-panel"
import { SubjectsPanel } from "@/features/academic/components/subjects-panel"
import { useAuth } from "@/hooks/use-auth"
import { BookOpenIcon, BoxesIcon, CalendarRangeIcon, LayersIcon } from "lucide-react"
import { useSearchParams } from "react-router"

const VALID_TABS = ["years", "grades", "subjects", "curriculum"] as const
type Tab = (typeof VALID_TABS)[number]

function isValidTab(value: string | null): value is Tab {
  return VALID_TABS.includes(value as Tab)
}

export default function AcademicPage() {
  const { isAdmin } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get("tab")
  const activeTab: Tab = isValidTab(tabParam) ? tabParam : "years"

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Structure</h1>
        <p className="text-muted-foreground">
          Manage academic years, grades, sections, subjects, and curriculum
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="years">
            <CalendarRangeIcon className="mr-1.5 h-4 w-4" />
            Academic Years
          </TabsTrigger>
          <TabsTrigger value="grades">
            <LayersIcon className="mr-1.5 h-4 w-4" />
            Grades &amp; Sections
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpenIcon className="mr-1.5 h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="curriculum">
            <BoxesIcon className="mr-1.5 h-4 w-4" />
            Curriculum
          </TabsTrigger>
        </TabsList>

        <TabsContent value="years">
          <AcademicYearsPanel isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="grades">
          <GradeStructurePanel isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsPanel isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="curriculum">
          <CurriculumPanel isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
