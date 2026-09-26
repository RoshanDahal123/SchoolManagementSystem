import { Card, CardContent } from "@/components/atoms/card";
import { cn } from "@/lib/utils";
import type { CourseworkResponse } from "../@types";
import {
  isAwaitingMarks,
  isMarked,
  isNotSubmitted,
  isOverdue,
  type CourseworkFilter,
} from "../status";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  InboxIcon,
} from "lucide-react";

interface Props {
  coursework: CourseworkResponse[];
  active: CourseworkFilter;
  onSelect: (filter: CourseworkFilter) => void;
}

const CARD_DEFS = [
  {
    key: "marked" as const,
    label: "Marked",
    icon: CheckCircle2Icon,
    predicate: isMarked,
    colorClass: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  {
    key: "awaitingMarks" as const,
    label: "Awaiting Marks",
    icon: ClipboardListIcon,
    predicate: isAwaitingMarks,
    colorClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertTriangleIcon,
    predicate: isOverdue,
    colorClass: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  {
    key: "notSubmitted" as const,
    label: "Not Submitted",
    icon: InboxIcon,
    predicate: isNotSubmitted,
    colorClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
];

export function CourseworkSummaryCards({
  coursework,
  active,
  onSelect,
}: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARD_DEFS.map((def) => {
        const isActive = active === def.key;
        const count = coursework.filter(def.predicate).length;
        return (
          <Card
            key={def.key}
            role="button"
            tabIndex={0}
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? "all" : def.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(isActive ? "all" : def.key);
              }
            }}
            className={cn(
              "cursor-pointer transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              isActive &&
                "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20",
            )}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-2xl font-bold tabular-nums">{count}</p>
                <p className="text-xs font-medium text-muted-foreground">
                  {def.label}
                </p>
              </div>
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg shrink-0",
                  def.colorClass,
                )}
              >
                <def.icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
