import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Exercise } from '@/api/types.ts'
import { CloseIcon, TrashIcon } from '@/components/icons.tsx'
import { useScrollLock } from '@/lib/useScrollLock.ts'
import { exerciseSchema, type ExerciseForm } from '../schemas.ts'

interface Props {
  exercise?: Exercise
  groups: string[]
  busy: boolean
  onSave: (values: ExerciseForm) => void
  onArchive: () => void
  onClose: () => void
}

export default function ExerciseSheet({
  exercise,
  groups,
  busy,
  onSave,
  onArchive,
  onClose,
}: Props) {
  useScrollLock()

  const form = useForm<ExerciseForm>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: exercise?.name ?? '',
      muscleGroup: exercise?.muscleGroup ?? '',
      notes: exercise?.notes ?? '',
    },
  })

  const { errors } = form.formState

  const [suggesting, setSuggesting] = useState(false)
  const muscleGroupField = form.register('muscleGroup')
  const typed = useWatch({ control: form.control, name: 'muscleGroup' }).trim().toLowerCase()
  const matches = groups.filter((name) => name.toLowerCase().includes(typed))

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <form
        onSubmit={form.handleSubmit((values) => onSave(values))}
        className="relative mx-auto w-full max-w-xl rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight uppercase">
            {exercise ? 'Edit exercise' : 'New exercise'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-zinc-500">
            <CloseIcon size={20} />
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Name</span>
          <input
            {...form.register('name')}
            autoFocus
            placeholder="Bench Press"
            className={fieldClass(!!errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </label>

        <div className="mt-4">
          <label
            htmlFor="muscle-group"
            className="text-xs font-bold tracking-widest text-zinc-500 uppercase"
          >
            Muscle group
          </label>
          <div className="relative">
            <input
              {...muscleGroupField}
              id="muscle-group"
              autoComplete="off"
              onFocus={() => setSuggesting(true)}
              onBlur={(e) => {
                muscleGroupField.onBlur(e)
                setSuggesting(false)
              }}
              placeholder="Chest"
              className={fieldClass(false)}
            />

            {suggesting && matches.length > 0 && (
              <ul className="absolute bottom-full z-10 mb-2 max-h-44 w-full overflow-y-auto overscroll-contain rounded-2xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/60">
                {matches.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      // The press lands before blur, so the list is still open
                      // when the click arrives. preventDefault keeps focus in
                      // the input rather than moving it to this button.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        form.setValue('muscleGroup', name, { shouldDirty: true })
                        setSuggesting(false)
                      }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-zinc-300"
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Notes</span>
          <textarea
            {...form.register('notes')}
            rows={2}
            placeholder="Optional"
            className="mt-1 w-full resize-none rounded-2xl bg-zinc-900 px-4 py-3 text-white placeholder:text-zinc-700 focus:ring-2 focus:ring-lime-400 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-5 h-12 w-full rounded-2xl bg-lime-400 font-bold text-black disabled:opacity-40"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>

        {exercise && !exercise.archived && (
          <button
            type="button"
            disabled={busy}
            onClick={onArchive}
            className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-sm text-zinc-400 disabled:opacity-40"
          >
            <TrashIcon size={14} />
            Archive this exercise
          </button>
        )}
      </form>
    </div>
  )
}

function fieldClass(hasError: boolean): string {
  return [
    'mt-1 h-12 w-full rounded-2xl bg-zinc-900 px-4 text-white',
    'placeholder:text-zinc-700 focus:outline-none focus:ring-2',
    hasError ? 'ring-2 ring-red-500 focus:ring-red-500' : 'focus:ring-lime-400',
  ].join(' ')
}
