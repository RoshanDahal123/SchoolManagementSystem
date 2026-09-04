import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/** Narrows an unknown RTK Query error down to its HTTP status, if it has one. */
export function getErrorStatus(error: unknown): number | undefined {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as FetchBaseQueryError).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}