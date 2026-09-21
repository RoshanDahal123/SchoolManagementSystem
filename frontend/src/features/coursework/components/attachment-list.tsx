import { Button } from "@/components/atoms/button"
import { formatFileSize, isImageFile, isPdfFile } from "@/helpers/file"
import { DownloadIcon, FileTextIcon, ImageIcon, LoaderIcon, PaperclipIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { Attachment } from "../@types"
import { downloadAttachment } from "../download"

interface Props {
  attachments: Attachment[]
  /** Supplied by the teacher's edit view; omitted everywhere the list is read-only. */
  onRemove?: (attachmentId: string) => void
  emptyText?: string
}

export function AttachmentList({ attachments, onRemove, emptyText }: Props) {
  // Tracks which file is downloading so the spinner sits on the right row, not on all of them.
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function handleDownload(attachment: Attachment) {
    setDownloadingId(attachment.id)
    try {
      await downloadAttachment(attachment.downloadUrl, attachment.fileName)
    } catch {
      toast.error(`Couldn't download "${attachment.fileName}"`)
    } finally {
      setDownloadingId(null)
    }
  }

  if (attachments.length === 0) {
    return emptyText ? <p className="text-sm text-muted-foreground">{emptyText}</p> : null
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {attachments.map((attachment) => {
        const Icon = isImageFile(attachment.fileName)
          ? ImageIcon
          : isPdfFile(attachment.fileName)
            ? FileTextIcon
            : PaperclipIcon

        return (
          <li
            key={attachment.id}
            className="flex max-w-full items-center gap-2 rounded-md border bg-card py-1.5 pr-1.5 pl-2.5"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{attachment.fileName}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSizeBytes)}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => handleDownload(attachment)}
              disabled={downloadingId === attachment.id}
              aria-label={`Download ${attachment.fileName}`}
            >
              {downloadingId === attachment.id ? (
                <LoaderIcon className="size-4 animate-spin" />
              ) : (
                <DownloadIcon className="size-4" />
              )}
            </Button>

            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-destructive"
                onClick={() => onRemove(attachment.id)}
                aria-label={`Remove ${attachment.fileName}`}
              >
                <XIcon className="size-4" />
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
