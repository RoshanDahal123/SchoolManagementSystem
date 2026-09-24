import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/tabs";
import { AcademicYearsPanel } from "@/features/academic-years/components/academic-years-panel";
import { CurriculumPanel } from "@/features/academic/components/curriculum-panel";
import { GradeStructurePanel } from "@/features/academic/components/grade-structure-panel";
import { SubjectsPanel } from "@/features/academic/components/subjects-panel";
import { SectionRosterPanel } from "@/features/enrollment/components/section-roster-panel";
import { useAuth } from "@/hooks/use-auth";
import {
  BookOpenIcon,
  BoxesIcon,
  CalendarRangeIcon,
  LayersIcon,
  type LucideIcon,
  UsersIcon,
} from "lucide-react";
import { useSearchParams } from "react-router";

const TABS = [
  { value: "years", label: "Academic Years", icon: CalendarRangeIcon },
  { value: "grades", label: "Grades & Sections", icon: LayersIcon },
  { value: "subjects", label: "Subjects", icon: BookOpenIcon },
  { value: "curriculum", label: "Curriculum", icon: BoxesIcon },
  { value: "roster", label: "Roster", icon: UsersIcon },
] as const satisfies ReadonlyArray<{
  value: string;
  label: string;
  icon: LucideIcon;
}>;

type Tab = (typeof TABS)[number]["value"];

function isValidTab(value: string | null): value is Tab {
  return TABS.some((tab) => tab.value === value);
}

export default function AcademicPage() {
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: Tab = isValidTab(tabParam) ? tabParam : "years";

  const handleTabChange = (value: string) => {
    if (isValidTab(value)) {
      setSearchParams({ tab: value }, { replace: true });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Academic Structure
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Manage academic years, grades, sections, subjects, and curriculum
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Mobile: dropdown — nothing to scroll, every option visible in one tap */}
        <div className="sm:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => value && handleTabChange(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(() => {
                  const current = TABS.find((t) => t.value === activeTab)!;
                  const Icon = current.icon;
                  return (
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {current.label}
                    </span>
                  );
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              side="bottom"
              align="start"
              sideOffset={6}
              alignItemWithTrigger={false}
            >
              {TABS.map(({ value, label, icon: Icon }) => (
                <SelectItem key={value} value={value}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tablet: scrollable pills. Desktop (lg+): full-width grid, no scroll needed */}
        {/* Tablet: scrollable pills. Desktop (lg+): full-width grid, no scroll needed */}
        {/* Tablet: scrollable pills. Desktop (lg+): full-width grid, no scroll needed */}
        <div className="hidden sm:block sm:overflow-x-auto sm:pb-1">
          <TabsList
            className="
    !h-10 w-full min-w-max gap-1.5
    md:!h-12 md:gap-2
    lg:!h-14 lg:grid lg:grid-cols-5
  "
          >
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="
        gap-2 px-3 text-sm
        md:px-3.5
        lg:px-4 lg:text-base
      "
              >
                <Icon className="h-4 w-4 lg:h-[18px] lg:w-[18px]" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="years" className="mt-6 focus-visible:outline-none">
          <AcademicYearsPanel isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="grades" className="mt-6 focus-visible:outline-none">
          <GradeStructurePanel isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent
          value="subjects"
          className="mt-6 focus-visible:outline-none"
        >
          <SubjectsPanel isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent
          value="curriculum"
          className="mt-6 focus-visible:outline-none"
        >
          <CurriculumPanel isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="roster" className="mt-6 focus-visible:outline-none">
          <SectionRosterPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
