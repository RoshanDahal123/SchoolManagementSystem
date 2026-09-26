import type { CourseworkResponse } from "./@types"

export type CourseworkFilter =
  | "all"
  | "awaitingMarks"
  | "marked"
  | "notSubmitted"
  | "overdue"

export const isOverdue = (c: CourseworkResponse) =>
  c.isPastDue && c.submittedCount < c.totalStudents

export const isAwaitingMarks = (c: CourseworkResponse) =>
  c.submittedCount > c.gradedCount

export const isMarked = (c: CourseworkResponse) =>
  c.submittedCount > 0 &&
  c.gradedCount === c.submittedCount

export const isNotSubmitted = (c: CourseworkResponse) =>
  c.submittedCount === 0

export function matchesFilter(
  c: CourseworkResponse,
  filter: CourseworkFilter
): boolean {
  switch (filter) {
    case "all":
      return true
    case "awaitingMarks":
      return isAwaitingMarks(c)
    case "marked":
      return isMarked(c)
    case "notSubmitted":
      return isNotSubmitted(c)
    case "overdue":
      return isOverdue(c)
  }
}

export type LifecycleStatus = "Overdue" | "Active" | "Upcoming"

const ACTIVE_WINDOW_DAYS = 3

export function getLifecycleStatus(c: CourseworkResponse): LifecycleStatus {
  if (c.isPastDue) {
    return "Overdue"
  }

  const daysUntilDue =
    (new Date(c.dueAtUtc).getTime() - Date.now()) / 86_400_000

  return daysUntilDue <= ACTIVE_WINDOW_DAYS ? "Active" : "Upcoming"
}