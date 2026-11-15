import { useState } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '@/api/client.ts'
import type { Exercise } from '@/api/types.ts'
import { ChevronLeftIcon, PlusIcon } from '@/components/icons.tsx'
import Loading from '@/components/Loading.tsx'
import { ExerciseSheet } from './components/index.ts'
import useExercises from './hooks/useExercises.ts'
import type { ExerciseForm } from './schemas.ts'

export default function Exercises() {
  const [showArchived, setShowArchived] = useState(false)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ exercise?: Exercise } | null>(null)

  const { exercises, error, create, update, archive, isSaving, isArchiving, actionError } =
    useExercises(showArchived)

  if (error) {
    return (
      <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error)}
      </p>
    )
  }

  if (!exercises) return <Loading />

  const needle = query.trim().toLowerCase()

  const groups = [...new Set(exercises.map((exercise) => exercise.muscleGroup))]
    .filter((group) => group !== null)
    .sort()

  const shown = exercises.filter(
    (exercise) =>
      (needle === '' || exercise.name.toLowerCase().includes(needle)) &&
      (group === null || exercise.muscleGroup === group),
  )

  const closeSheet = () => setSheet(null)

  function handleSave(values: ExerciseForm) {
    const body = {
      name: values.name,
      muscleGroup: values.muscleGroup || null,
      notes: values.notes || null,
    }

    if (sheet?.exercise) {
      update({ id: sheet.exercise.id, body }, { onSuccess: closeSheet })
    } else {
      create(body, { onSuccess: closeSheet })
    }
  }

  function handleArchive() {
    if (!sheet?.exercise) return
    archive(sheet.exercise.id, { onSuccess: closeSheet })
  }

  return (
    <div className="max-w-xl md:max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {/* Phone-only way out: the pill bar shows Templates lit (it `owns`
              this route), which reads as "you are here", not "tap to leave".
              It sits inside the header row so it costs no vertical space --
              `md:hidden` takes it out of the flow on PC, where the sidebar
              already has an Exercises item, and the gap collapses with it. */}
          <Link
            to="/templates"
            aria-label="Back to templates"
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 md:hidden"
          >
            <ChevronLeftIcon size={20} />
          </Link>
          <h1 className="text-3xl font-black tracking-tight uppercase">Exercises</h1>
        </div>
        <button
          type="button"
          onClick={() => setSheet({})}
          className="flex h-9 items-center gap-1 rounded-full bg-lime-400 px-4 text-sm font-bold text-black"
        >
          <PlusIcon size={16} />
          New
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises"
        className="mt-4 h-12 w-full rounded-2xl bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-lime-400 focus:outline-none"
      />

      {groups.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button type="button" onClick={() => setGroup(null)} className={chipClass(!group)}>
            All
          </button>
          {groups.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setGroup(name)}
              className={chipClass(group === name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-zinc-500">
          {shown.length} {shown.length === 1 ? 'exercise' : 'exercises'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Show archived</span>
          <button
            type="button"
            role="switch"
            aria-checked={showArchived}
            aria-label="Show archived"
            onClick={() => setShowArchived((on) => !on)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              showArchived ? 'bg-lime-400' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                showArchived ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {actionError && (
        <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errorMessage(actionError)}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-500">
          {exercises.length === 0
            ? 'No exercises yet. Add one and it shows up here and in the picker.'
            : 'Nothing matches that search.'}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-zinc-900">
          {shown.map((exercise) => (
            <div key={exercise.id} className="flex items-center gap-3 py-3">
              <button
                type="button"
                onClick={() => setSheet({ exercise })}
                className={`min-w-0 flex-1 text-left ${exercise.archived ? 'opacity-40' : ''}`}
              >
                <div className="truncate font-bold">{exercise.name}</div>
                <div className="text-sm text-zinc-500">
                  {exercise.muscleGroup ?? 'No muscle group'}
                </div>
              </button>

              {exercise.archived && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => update({ id: exercise.id, body: { archived: false } })}
                  className="shrink-0 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 disabled:opacity-40"
                >
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {sheet && (
        <ExerciseSheet
          key={sheet.exercise?.id ?? 'new'}
          exercise={sheet.exercise}
          groups={groups}
          busy={isSaving || isArchiving}
          onSave={handleSave}
          onArchive={handleArchive}
          onClose={closeSheet}
        />
      )}
    </div>
  )
}

function chipClass(active: boolean): string {
  return [
    'h-8 shrink-0 rounded-full px-4 text-sm font-bold',
    active ? 'bg-lime-400 text-black' : 'bg-zinc-900 text-zinc-400',
  ].join(' ')
}
