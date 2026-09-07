/**
 * EntityListLayout
 *
 * A reusable page-level layout for any entity list page (Students, Teachers, …).
 * It renders:
 *   • Page heading + sub-description
 *   • An optional "primary action" button slot (top-right)
 *   • A Card containing:
 *       – Card header: title + count badge + search bar
 *       – DataTable (with loading / empty states built-in)
 *       – Pagination footer (rendered by DataTable when pagination prop is supplied)
 *
 * Usage:
 *   <EntityListLayout
 *     heading="Students"
 *     description="Manage student records and enrollments"
 *     cardTitle="Directory"
 *     totalCount={totalCount}
 *     columns={columns}
 *     data={students}
 *     isLoading={isLoading}
 *     search={{ value: searchInput, placeholder: "Search students…", onChange: setSearchInput }}
 *     pagination={{ page, pageSize: 10, totalCount, onPageChange: handlePageChange }}
 *     emptyMessage="No students found"
 *     primaryAction={<Button onClick={…}>Add Student</Button>}
 *     toolbar={<Button variant="outline">Export</Button>}
 *   />
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card"
import type { Column, DataTablePaginationProps } from "@/components/organisms/data-table"
import { DataTable } from "@/components/organisms/data-table"
import type React from "react"

interface SearchProps {
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

interface EntityListLayoutProps<TData> {
  // Page header
  heading: string
  description?: string

  // Card header
  cardTitle?: string

  // Data
  columns: Column<TData>[]
  data: TData[]
  isLoading?: boolean
  totalCount?: number

  // Search (pass to DataTable)
  search?: SearchProps

  // Pagination (pass to DataTable)
  pagination?: DataTablePaginationProps

  // Empty state
  emptyMessage?: string
  emptyDescription?: string

  // Top-right page-level action (e.g., "Add Student" button)
  primaryAction?: React.ReactNode

  // Extra toolbar items rendered inside the DataTable header bar (right side)
  toolbar?: React.ReactNode
}

export function EntityListLayout<TData extends Record<string, unknown>>({
  heading,
  description,
  cardTitle,
  columns,
  data,
  isLoading = false,
  totalCount,
  search,
  pagination,
  emptyMessage,
  emptyDescription,
  primaryAction,
  toolbar,
}: EntityListLayoutProps<TData>) {
  const countLabel =
    totalCount !== undefined
      ? totalCount > 0
        ? `${totalCount} record${totalCount === 1 ? "" : "s"}`
        : "No records"
      : undefined

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {primaryAction && <div className="shrink-0">{primaryAction}</div>}
      </div>

      {/* ── Card ── */}
      <Card className="shadow-xs border-border/60 overflow-hidden">
        {/* Card header */}
        {(cardTitle || countLabel) && (
          <CardHeader className="px-4 py-4 sm:px-6 border-b border-border/40 space-y-0">
            <CardTitle className="text-base font-medium">
              {cardTitle ?? heading}
            </CardTitle>
            {countLabel && (
              <CardDescription className="text-xs">{countLabel}</CardDescription>
            )}
          </CardHeader>
        )}

        {/* DataTable (search bar + table + pagination footer live inside) */}
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            searchValue={search?.value}
            searchPlaceholder={search?.placeholder}
            onSearchChange={search?.onChange}
            pagination={pagination}
            emptyMessage={emptyMessage}
            emptyDescription={emptyDescription}
            toolbar={toolbar}
          />
        </CardContent>
      </Card>
    </div>
  )
}
