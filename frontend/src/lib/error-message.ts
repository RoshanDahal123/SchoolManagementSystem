/**
 * Pulls a message out of an RTK Query error.
 *
 * The API returns ProblemDetails for rejected requests (see ExceptionHandlingMiddleware), so
 * `data.detail` carries the actual reason — "that file type isn't accepted", "the deadline has
 * passed". Falling back to a generic string keeps callers from ever rendering "[object Object]".
 */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error || typeof error !== "object") return fallback

  const data = (error as { data?: unknown }).data

  if (typeof data === "string" && data.trim()) return data

  if (data && typeof data === "object") {
    const problem = data as { detail?: string; title?: string; message?: string }
    return problem.detail ?? problem.message ?? problem.title ?? fallback
  }

  return fallback
}
