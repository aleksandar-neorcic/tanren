import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { errorMessage } from '@/api/client.ts'
import type { Template } from '@/api/types.ts'
import AddExerciseSheet from '@/components/AddExerciseSheet.tsx'
import ConfirmDialog from '@/components/ConfirmDialog.tsx'
import { PlusIcon, TrashIcon } from '@/components/icons.tsx'
import Loading from '@/components/Loading.tsx'
import { toNumberOrNull } from '@/lib/numberField.ts'
import useTemplateEditor from './hooks/useTemplateEditor.ts'
import { templateSchema, type TemplateForm } from './schemas.ts'

export default function TemplateEditor() {
  const { id } = useParams()
  const {
    template,
    exercises,
    error,
    isLoading,
    save,
    isSaving,
    saveError,
    removeTemplate,
    isRemoving,
    removeError,
  } = useTemplateEditor(id)

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: { name: '', notes: null, exercises: [] },
    values: template ? toForm(template) : undefined,
  })

  // The rows of the nested array. `fields` carries a generated `id` per row,
  // which is what keys them — stable across reorders, unlike the index, and
  // unique even if the same exercise is added twice.
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'exercises',
  })

  const [picking, setPicking] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const cancelDelete = useCallback(() => setConfirmingDelete(false), [])

  if (error) {
    return (
      <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error)}
      </p>
    )
  }

  if (isLoading) return <Loading />

  const rowErrors = form.formState.errors.exercises

  return (
    <>
      <form
        onSubmit={form.handleSubmit((values) => save(values))}
        className="max-w-xl md:max-w-3xl"
      >
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

        {(saveError ?? removeError) && (
          <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage(saveError ?? removeError)}
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
                <div className="mt-2 flex gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="block text-xs tracking-widest text-zinc-600 uppercase">
                      Sets
                    </span>
                    <input
                      {...form.register(`exercises.${index}.targetSets`, { valueAsNumber: true })}
                      inputMode="numeric"
                      aria-invalid={!!rowErrors?.[index]?.targetSets}
                      className={targetInputClass(!!rowErrors?.[index]?.targetSets)}
                    />
                    {rowErrors?.[index]?.targetSets && (
                      <p className="mt-1 text-center text-xs text-red-400">
                        {rowErrors[index]?.targetSets?.message}
                      </p>
                    )}
                  </label>
                  <label className="min-w-0 flex-1">
                    <span className="block text-xs tracking-widest text-zinc-600 uppercase">
                      Reps
                    </span>
                    <input
                      {...form.register(`exercises.${index}.targetReps`, {
                        setValueAs: toNumberOrNull,
                      })}
                      inputMode="numeric"
                      placeholder="—"
                      aria-invalid={!!rowErrors?.[index]?.targetReps}
                      className={targetInputClass(!!rowErrors?.[index]?.targetReps)}
                    />
                    {rowErrors?.[index]?.targetReps && (
                      <p className="mt-1 text-center text-xs text-red-400">
                        {rowErrors[index]?.targetReps?.message}
                      </p>
                    )}
                  </label>
                  <label className="min-w-0 flex-1">
                    <span className="block text-xs tracking-widest text-zinc-600 uppercase">
                      kg
                    </span>
                    <input
                      {...form.register(`exercises.${index}.targetWeight`, {
                        setValueAs: toNumberOrNull,
                      })}
                      inputMode="decimal"
                      placeholder="—"
                      aria-invalid={!!rowErrors?.[index]?.targetWeight}
                      className={targetInputClass(!!rowErrors?.[index]?.targetWeight)}
                    />
                    {rowErrors?.[index]?.targetWeight && (
                      <p className="mt-1 text-center text-xs text-red-400">
                        {rowErrors[index]?.targetWeight?.message}
                      </p>
                    )}
                  </label>
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

        <button
          type="button"
          onClick={() => setPicking(true)}
          className="mt-3 flex items-center gap-1 text-sm text-zinc-400"
        >
          <PlusIcon size={16} />
          Add exercise
        </button>

        {/* Only when editing: there is nothing to delete on /templates/new. */}
        {id !== undefined && (
          <button
            type="button"
            disabled={isRemoving}
            onClick={() => setConfirmingDelete(true)}
            className="mt-8 flex w-full items-center justify-center gap-1.5 py-2 text-sm text-zinc-600 disabled:opacity-40"
          >
            <TrashIcon size={14} />
            Delete this template
          </button>
        )}
      </form>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this template?"
          body={
            fields.length === 1
              ? 'Its one exercise goes with it. Past workouts that used it are kept.'
              : `Its ${fields.length} exercises go with it. Past workouts that used it are kept.`
          }
          confirmLabel="Delete"
          cancelLabel="Keep it"
          busy={isRemoving}
          onConfirm={() => removeTemplate()}
          onCancel={cancelDelete}
        />
      )}

      {picking && (
        <AddExerciseSheet
          busy={false}
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => {
            append({ exerciseId, targetSets: 3, targetReps: null, targetWeight: null })
            setPicking(false)
          }}
        />
      )}
    </>
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

function targetInputClass(hasError: boolean): string {
  return [
    'mt-1 h-10 w-full rounded-xl bg-zinc-950 px-3 text-center text-sm font-bold text-white',
    'placeholder:text-zinc-700 focus:outline-none focus:ring-2',
    hasError ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-lime-400',
  ].join(' ')
}
