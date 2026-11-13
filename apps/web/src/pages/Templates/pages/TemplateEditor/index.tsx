import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { errorMessage } from '@/api/client.ts'
import type { Template } from '@/api/types.ts'
import { TrashIcon } from '@/components/icons.tsx'
import Loading from '@/components/Loading.tsx'
import useTemplateEditor from './hooks/useTemplateEditor.ts'
import { templateSchema, type TemplateForm } from './schemas.ts'

export default function TemplateEditor() {
  const { id } = useParams()
  const { template, exercises, error, isLoading, save, isSaving, saveError } = useTemplateEditor(id)

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', notes: null, exercises: [] },
    values: template ? toForm(template) : undefined,
  })

  // The rows of the nested array. `fields` carries a generated `id` per row,
  // which is what keys them — stable across reorders, unlike the index, and
  // unique even if the same exercise is added twice.
  const { fields, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  if (error) {
    return (
      <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error)}
      </p>
    )
  }

  if (isLoading) return <Loading />

  return (
    <form onSubmit={form.handleSubmit((values) => save(values))} className="max-w-xl md:max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/templates" className="text-sm text-zinc-400">
          ‹ Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="h-9 rounded-full bg-lime-400 px-5 text-sm font-bold text-black disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {saveError && (
        <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage(saveError)}
        </p>
      )}

      <label className="mt-6 block text-xs tracking-widest text-zinc-500 uppercase">
        Template name
      </label>
      <input
        {...form.register('name')}
        placeholder="PUSH"
        className="mt-2 h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950 px-4 text-xl font-black tracking-tight text-white uppercase focus:border-lime-400 focus:outline-none"
      />
      {form.formState.errors.name && (
        <p className="mt-2 text-sm text-red-400">{form.formState.errors.name.message}</p>
      )}

      <div className="mt-6 text-xs tracking-widest text-zinc-500 uppercase">
        Exercises · {fields.length}
      </div>

      {form.formState.errors.exercises?.message && (
        <p className="mt-2 text-sm text-red-400">{form.formState.errors.exercises.message}</p>
      )}

      <div className="mt-2 space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-3 rounded-2xl bg-zinc-900 p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold">
                {exercises?.find((e) => e.id === field.exerciseId)?.name ?? 'Unknown exercise'}
              </div>
              <div className="text-sm text-zinc-500">
                {field.targetSets} × {field.targetReps ?? '—'}
                {field.targetWeight !== null ? ` @ ${field.targetWeight} kg` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="shrink-0 text-zinc-500"
              aria-label="Remove"
            >
              <TrashIcon size={18} />
            </button>
          </div>
        ))}
      </div>
    </form>
  )
}

/** The server's Template, flattened to what the form holds. */
function toForm(template: Template): TemplateForm {
  return {
    name: template.name,
    notes: template.notes,
    exercises: template.exercises.map((row) => ({
      exerciseId: row.exerciseId,
      targetSets: row.targetSets,
      targetReps: row.targetReps,
      targetWeight: row.targetWeight,
    })),
  }
}
