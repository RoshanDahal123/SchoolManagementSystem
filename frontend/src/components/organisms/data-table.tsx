
import { Input } from "@/components/atoms/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/pagination"
import { Skeleton } from "@/components/atoms/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table"
import { Search } from "lucide-react"
import type React from "react"

// ─── Column definition ────────────────────────────────────────────────────────

export interface Column<TData> {
  id?: string
  accessorKey?: keyof TData
  header: string
  cell?: (props: { row: { original: TData } }) => React.ReactNode
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface DataTablePaginationProps {
  page: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
  /** How many page buttons to show on each side of the current page. @default 1 */
  siblingCount?: number
}

// ─── Main Props ───────────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  columns: Column<TData>[]
  data: TData[]
  isLoading?: boolean

  // Search
  searchValue?: string
  searchPlaceholder?: string
  onSearchChange?: (value: string) => void

  // Pagination
  pagination?: DataTablePaginationProps

  // Empty state
  emptyMessage?: string
  emptyDescription?: string

  // Optional toolbar slot rendered to the right of search
  toolbar?: React.ReactNode
}

// ─── Pagination helper ────────────────────────────────────────────────────────

/**
 * Generates the page-number array shown in the pagination bar.
 * Mirrors the StudentPagination reference algorithm:
 *   always shows first + last, current ± siblingCount, and "..." gaps.
 */
function getPageNumbers(page: number, totalPages: number, siblingCount: number): (number | "...")[] {
  const totalNumbers = siblingCount * 2 + 5 // first, last, current + siblings + 2 ellipses

  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(page - siblingCount, 1)
  const rightSiblingIndex = Math.min(page + siblingCount, totalPages)

  const shouldShowLeftDots = leftSiblingIndex > 2
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1

  // No left dots, right dots needed
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
    return [...leftRange, "...", totalPages]
  }

  // Left dots needed, no right dots
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1,
    )
    return [1, "...", ...rightRange]
  }

  // Both sides need dots
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  )
  return [1, "...", ...middleRange, "...", totalPages]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  searchValue,
  searchPlaceholder = "Search…",
  onSearchChange,
  pagination,
  emptyMessage = "No results found.",
  emptyDescription,
  toolbar,
}: DataTableProps<TData>) {
  const hasSearch = onSearchChange !== undefined
  const hasPagination = pagination !== undefined
  const totalPages = hasPagination
    ? Math.ceil(pagination.totalCount / pagination.pageSize)
    : 0

  const startRange =
    hasPagination && pagination.totalCount > 0
      ? (pagination.page - 1) * pagination.pageSize + 1
      : 0
  const endRange = hasPagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.totalCount)
    : 0

  return (
    <div className="space-y-0">
      {/* ── Header bar: search + toolbar ── */}
      {(hasSearch || toolbar) && (
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border/40">
          {hasSearch && (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange!(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-8"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* ── Table ── */}
      <div className="rounded-b-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              {columns.map((column, index) => (
                <TableHead key={column.id ?? String(index)} className="font-medium">
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((_, colIdx) => (
                    <TableCell key={colIdx}>
                      <Skeleton className="h-5 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
                  {emptyDescription && (
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                      {emptyDescription}
                    </p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="transition-colors hover:bg-muted/30">
                  {columns.map((column, colIndex) => (
                    <TableCell key={column.id ?? String(colIndex)}>
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : column.accessorKey !== undefined
                          ? String(row[column.accessorKey] ?? "")
                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination footer ── */}
      {hasPagination && !isLoading && data.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Showing{" "}
            <span className="font-medium text-foreground">{startRange}</span>
            {" – "}
            <span className="font-medium text-foreground">{endRange}</span>
            {" of "}
            <span className="font-medium text-foreground">{pagination.totalCount}</span>
            {" results"}
          </p>

          <Pagination className="justify-end w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={
                    pagination.page > 1
                      ? () => pagination.onPageChange(pagination.page - 1)
                      : undefined
                  }
                  aria-disabled={pagination.page <= 1}
                  className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {getPageNumbers(pagination.page, totalPages, pagination.siblingCount ?? 1).map((item, idx) =>
                item === "..." ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === pagination.page}
                      onClick={(e) => {
                        e.preventDefault()
                        pagination.onPageChange(item as number)
                      }}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={
                    pagination.page < totalPages
                      ? () => pagination.onPageChange(pagination.page + 1)
                      : undefined
                  }
                  aria-disabled={pagination.page >= totalPages}
                  className={pagination.page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
