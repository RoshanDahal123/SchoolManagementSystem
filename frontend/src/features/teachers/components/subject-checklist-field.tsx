import { Checkbox } from "@/components/atoms/checkbox"
import { FieldError, FieldLabel } from "@/components/atoms/field"
import type { SubjectResponse } from "@/features/academic/@types"

interface Props {
  subjects: SubjectResponse[]
  value: string[]
  onChange: (ids: string[]) => void
  error?: string
}

export function SubjectChecklistField({ subjects, value, onChange, error }: Props) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <div>
      <FieldLabel className="mb-1.5">Subject Specializations</FieldLabel>
      <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
        {subjects.length === 0 ? (
          <p className="col-span-2 text-xs text-muted-foreground">
            No subjects yet — add one under Academic Structure first.
          </p>
        ) : (
          subjects.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={value.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
              />
              {s.name}
            </label>
          ))
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}