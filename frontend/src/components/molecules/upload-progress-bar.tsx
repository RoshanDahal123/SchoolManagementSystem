import { Progress } from "@/components/atoms/progress"
import { formatFileSize } from "@/helpers/file"
import type { UploadProgressState } from "@/lib/upload-progress"
import { CircleCheckIcon, LoaderIcon, TriangleAlertIcon } from "lucide-react"

interface Props {
  progress: UploadProgressState
  /** Hidden entirely while idle, so callers can render it unconditionally. */
  className?: string
}

/**
 * Renders the live state of one upload. Four distinct states matter to the user:
 *   uploading  — bytes in flight, real percentage
 *   processing — bytes delivered, server still working (the bar would otherwise sit at
 *                100% looking stuck while the API writes files and rows)
 *   done       — response received
 *   error      — request failed; the calling dialog shows the reason
 */
export function UploadProgressBar({ progress, className }: Props) {
  if (progress.status === "idle") return null

  const indeterminate = progress.status === "uploading" && progress.total === 0

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          {progress.status === "done" ? (
            <>
              <CircleCheckIcon className="size-3.5 text-green-600" />
              Upload complete
            </>
          ) : progress.status === "error" ? (
            <>
              <TriangleAlertIcon className="size-3.5 text-destructive" />
              Upload failed
            </>
          ) : progress.status === "processing" ? (
            <>
              <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
              Processing on the server…
            </>
          ) : (
            <>
              <LoaderIcon className="size-3.5 animate-spin text-muted-foreground" />
              Uploading…
            </>
          )}
        </span>

        {progress.status === "uploading" && !indeterminate && (
          <span className="tabular-nums text-muted-foreground">
            {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)} · {progress.percent}%
          </span>
        )}

        {progress.status === "done" && <span className="tabular-nums text-muted-foreground">100%</span>}
      </div>

      <Progress
        value={progress.status === "done" ? 100 : progress.percent}
        //@ts-expect-error Progress component accepts undefined for indeterminate, but the type is wrong
        indeterminate={indeterminate}
        barClassName={
          progress.status === "error"
            ? "bg-destructive"
            : progress.status === "done"
              ? "bg-green-600"
              : undefined
        }
      />
    </div>
  )
}
