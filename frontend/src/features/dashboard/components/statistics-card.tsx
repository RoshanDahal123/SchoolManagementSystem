import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/tabs"
import StudentStatistics from "./student-statistics"
import TeacherStatistics from "./teacher-statistics"
import { BarChart3 } from "lucide-react"
import type { GradeStudentCount } from "../@types"

interface StatisticsCardProps {
  data?: GradeStudentCount[]
  isLoading?: boolean
}

export default function StatisticsCard({
  isLoading,
  data
}: StatisticsCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <Tabs defaultValue="students" className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                Distribution & Metrics
              </CardTitle>
              <CardDescription>
                Breakdown by grade level and faculty roles
              </CardDescription>
            </div>

            <TabsList className="self-start sm:self-auto">
              <TabsTrigger value="students" className="text-xs">
                Students
              </TabsTrigger>
              <TabsTrigger value="teachers" className="text-xs">
                Teachers
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <TabsContent value="students" className="mt-0">
            <StudentStatistics
              isLoading={isLoading}
              data={data}
            />
          </TabsContent>
          <TabsContent value="teachers" className="mt-0">
            <TeacherStatistics
              isLoading={isLoading}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
export { StatisticsCard }
