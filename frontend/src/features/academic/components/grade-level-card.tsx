import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader } from "@/components/atoms/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/atoms/collapsible"
import { ChevronRightIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import type { GradeLevelResponse, SectionResponse } from "../@types"

interface Props {
  grade: GradeLevelResponse
  isAdmin: boolean
  onEditGrade: (grade: GradeLevelResponse) => void
  onDeleteGrade: (grade: GradeLevelResponse) => void
  onAddSection: (grade: GradeLevelResponse) => void
  onEditSection: (grade: GradeLevelResponse, section: SectionResponse) => void
  onDeleteSection: (grade: GradeLevelResponse, section: SectionResponse) => void
}

export function GradeLevelCard({
  grade, isAdmin, onEditGrade, onDeleteGrade, onAddSection, onEditSection, onDeleteSection,
}: Props) {
  return (
    <Collapsible>
      <Card className="overflow-hidden py-0">
        <CollapsibleTrigger render={ <CardHeader className="cursor-pointer select-none py-3 [&[data-state=open]_svg.chevron]:rotate-90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChevronRightIcon className="chevron h-4 w-4 text-muted-foreground transition-transform" />
                <span className="font-medium">{grade.name}</span>
                <Badge variant="outline" className="text-xs font-normal">
                  {grade.sections.length} section{grade.sections.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => onAddSection(grade)} title="Add section">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditGrade(grade)} title="Edit grade">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteGrade(grade)} title="Delete grade">
                    <Trash2Icon className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>}/>
         
        
        <CollapsibleContent>
          <CardContent className="pb-4">
            {grade.sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sections yet. Use the + button to add one.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {grade.sections.map((s) => (
                  <div key={s.id} className="group flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1 text-sm">
                    <span>{s.name}</span>
                    {s.capacity > 0 && <span className="text-xs text-muted-foreground">/{s.capacity}</span>}
                    {isAdmin && (
                      <span className="ml-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => onEditSection(grade, s)} className="text-muted-foreground hover:text-foreground">
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button onClick={() => onDeleteSection(grade, s)} className="text-muted-foreground hover:text-destructive">
                          <XIcon className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}