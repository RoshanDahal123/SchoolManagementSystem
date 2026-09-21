
import { Button } from "@/components/atoms/button"
import { formatFileSize, isImageFile, isPdfFile } from "@/helpers/file"
import { cn } from "@/lib/utils"
import { FileTextIcon, ImageIcon, PaperclipIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { useRef, useState, type DragEvent } from "react"

/** Must stay in step with FileStorageSettings.AllowedExtensions on the server. */
export const ACCEPTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"] as const
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB — matches FileStorage:MaxFileSizeBytes

interface Props {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  /** Shown under the drop target; defaults to describing the accepted types. */
  hint?: string
}

/**
 * Drag-and-drop or click-to-browse file picker.
 *
 * The same checks run again on the server — this pass exists so a student who picks a 40 MB
 * video finds out instantly instead of after a long upload that ends in a rejection.
 */
export function FileDropZone({ files, onChange, disabled, maxFiles = 5, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validate(candidates: File[]): { accepted: File[]; problem: string | null } {
    const accepted: File[] = []

    for (const file of candidates) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`

      if (!ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])) {
        return { accepted, problem: `"${file.name}" isn't a PNG, JPG or PDF.` }
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
          accepted,
          problem: `"${file.name}" is ${formatFileSize(file.size)} — the limit is ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`,
        }
      }

      // Same name and size twice over almost certainly means the user picked it twice.
      const duplicate =
        files.some((f) => f.name === file.name && f.size === file.size) ||
        accepted.some((f) => f.name === file.name && f.size === file.size)

      if (!duplicate) accepted.push(file)
    }

    return { accepted, problem: null }
  }

  function addFiles(candidates: File[]) {
    const { accepted, problem } = validate(candidates)

    if (problem) {
      setError(problem)
      return
    }

    if (files.length + accepted.length > maxFiles) {
      setError(`You can attach at most ${maxFiles} files.`)
      return
    }

    setError(null)
    onChange([...files, ...accepted])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    if (disabled) return
    addFiles(Array.from(event.dataTransfer.files))
  }

  function removeAt(index: number) {
    setError(null)
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <UploadCloudIcon className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          Drop files here, or <span className="text-primary underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {hint ?? `PNG, JPG or PDF · up to ${formatFileSize(MAX_FILE_SIZE_BYTES)} each · ${maxFiles} files max`}
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []))
            // Reset so picking the same file again after removing it still fires onChange.
            e.target.value = ""
          }}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = isImageFile(file.name) ? ImageIcon : isPdfFile(file.name) ? FileTextIcon : PaperclipIcon

            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAt(index)
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <XIcon className="size-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
