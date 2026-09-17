
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/atoms/alert-dialog"
import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { Card, CardContent } from "@/components/atoms/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/atoms/dialog"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select"
import { Textarea } from "@/components/atoms/textarea"
import type { AnnouncementResponse } from "@/features/announcements/@types"
import {
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementsQuery,
  useUpdateAnnouncementMutation,
} from "@/features/announcements/announcement-api"
import { announcementSchema, type AnnouncementFormData } from "@/lib/validation/announcement"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatDistanceToNow } from "date-fns"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const TARGET_ROLE_LABEL: Record<AnnouncementResponse["targetRole"], string> = {
  All: "Everyone",
  Teachers: "Teachers only",
  Students: "Students only",
}

const TARGET_ROLE_BADGE_CLASS: Record<AnnouncementResponse["targetRole"], string> = {
  All: "",
  Teachers: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Students: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
}

export default function AnnouncementsPage() {
  const { data: announcements = [], isLoading } = useGetAnnouncementsQuery()
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation()
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation()
  const [deleteAnnouncement] = useDeleteAnnouncementMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementResponse | null>(null)

  const {
    register, handleSubmit, formState: { errors }, reset, setValue, watch,
  } = useForm<AnnouncementFormData>({ resolver: zodResolver(announcementSchema) })

  const openCreate = () => {
    setEditing(null)
    reset({ title: "", body: "", targetRole: "All" })
    setDialogOpen(true)
  }

  const openEdit = (a: AnnouncementResponse) => {
    setEditing(a)
    reset({ title: a.title, body: a.body, targetRole: a.targetRole })
    setDialogOpen(true)
  }

  const onSubmit = async (formData: AnnouncementFormData) => {
    try {
      if (editing) {
        await updateAnnouncement({ id: editing.id, data: formData }).unwrap()
        toast.success("Announcement updated")
      } else {
        await createAnnouncement(formData).unwrap()
        toast.success("Announcement published")
      }
      setDialogOpen(false)
    } catch {
      toast.error(editing ? "Failed to update announcement" : "Failed to publish announcement")
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteAnnouncement(deleteTarget.id).unwrap()
      toast.success("Announcement deleted")
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete announcement")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">Publish notices to teachers, students, or everyone</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New announcement
        </Button>
      </div>

      <p className="text-sm font-medium text-muted-foreground">
        PUBLISHED — {announcements.length}
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No announcements yet. Publish your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((a:any) => (
            <Card key={a.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{a.title}</h3>
                    <Badge className={TARGET_ROLE_BADGE_CLASS[a.targetRole]}>
                      {TARGET_ROLE_LABEL[a.targetRole]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{a.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.createdAtUtc), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(a)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Announcement" : "New Announcement"}</DialogTitle>
              <DialogDescription>
                {editing ? "Update the announcement below." : "Publish a notice to the school."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input {...register("title")} placeholder="Parent-Teacher Conference — Oct 3" />
                {errors.title && <FieldError>{errors.title.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Body</FieldLabel>
                <Textarea {...register("body")} rows={4} placeholder="Details for the announcement…" />
                {errors.body && <FieldError>{errors.body.message}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Audience</FieldLabel>
                <Select
                  value={watch("targetRole")}
                  onValueChange={(value) => setValue("targetRole", value as AnnouncementFormData["targetRole"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" sideOffset={6} alignItemWithTrigger={false}>
                    <SelectItem value="All">Everyone</SelectItem>
                    <SelectItem value="Teachers">Teachers only</SelectItem>
                    <SelectItem value="Students">Students only</SelectItem>
                  </SelectContent>
                </Select>
                {errors.targetRole && <FieldError>{errors.targetRole.message}</FieldError>}
              </Field>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {editing
                  ? isUpdating ? "Saving…" : "Save changes"
                  : isCreating ? "Publishing…" : "Publish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title}". This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}