import { useState } from "react"
import { useSearchParams } from "react-router"
import { useDebouncedCallback } from "./use-debounce"

/**
 * usePaginatedSearch
 *
 * Manages URL-based search + pagination state.
 * Returns:
 *   • page (number) – synced with ?page=…
 *   • searchQuery (string) – synced with ?search=… (debounced writes to URL)
 *   • searchInput (string) – local input value so typing is instant
 *   • handleSearchChange – sets local input and debounced-updates URL
 *   • handlePageChange – updates URL param
 *
 * Usage:
 *   const { page, searchQuery, searchInput, handleSearchChange, handlePageChange } = usePaginatedSearch()
 *   // useQuery({ page, search: searchQuery })
 */

interface UsePaginatedSearchOptions {
  /**
   * Debounce delay in milliseconds for search input → URL sync.
   * @default 300
   */
  debounceMs?: number
}

export function usePaginatedSearch(options?: UsePaginatedSearchOptions) {
  const debounceMs = options?.debounceMs ?? 300
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get("page") ?? "1")
  const searchQuery = searchParams.get("search") ?? ""

  // Local input state so typing feels instant
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Debounced: update URL search param (and reset page to 1)
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value.trim()) {
        next.set("search", value.trim())
      } else {
        next.delete("search")
      }
      next.set("page", "1")
      return next
    })
  }, debounceMs)

  function handleSearchChange(value: string) {
    setSearchInput(value)
    debouncedSetSearch(value)
  }

  function handlePageChange(newPage: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("page", newPage.toString())
      return next
    })
  }

  return {
    /**
     * Current page number (from URL). Use this in your query.
     */
    page,

    /**
     * Current search term (from URL, debounced). Use this in your query.
     */
    searchQuery,

    /**
     * Local search input (uncontrolled for instant feedback). Bind to your search input.
     */
    searchInput,

    /**
     * Call this when the search input changes (types into a search bar).
     * Will update local state immediately and URL after debounce.
     */
    handleSearchChange,

    /**
     * Call this when the user clicks a page number. Updates the URL.
     */
    handlePageChange,
  }
}
