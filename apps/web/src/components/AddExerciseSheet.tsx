import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { errorMessage } from '@/api/client.ts'
import { exercisesApi } from '@/api/endpoints.ts'
import { useScrollLock } from '@/lib/useScrollLock.ts'
import { CloseIcon } from './icons.tsx'

interface Props {
  busy: boolean
  onPick: (exerciseId: string) => void
  onClose: () => void
}

/**
 * The bottom sheet for adding an exercise the template did not plan for
 * (docs/design/screens/screens-1.png).
 *
 * Keyed ['exercises'], the same key the editor and the Exercises screen use: a
 * sheet opened from a page that already holds the library renders from cache
 * with no request at all. It used to fetch in an effect with a cancel flag —
 * React Query owns that race now.
 */
export default function AddExerciseSheet({ busy, onPick, onClose }: Props) {
  const [query, setQuery] = useState('')

  const { data: exercises, error } = useQuery({
    queryKey: ['exercises'],
    queryFn: () => exercisesApi.list(),
  })

  useScrollLock()

  const needle = query.trim().toLowerCase()
  const shown = (exercises ?? []).filter(
    (e) => needle === '' || e.name.toLowerCase().includes(needle),
  )

  return (
    // The backdrop is a sibling of the panel, not its parent, so a tap on the
    // panel cannot bubble out to it and close the sheet.
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      {/* A fixed height, not max-height. A sheet sized by its contents and
          anchored to the bottom slides its own search box downwards as you
          filter — exactly when your eyes are on it. `dvh` rather than `vh` so
          the phone keyboard shrinks the sheet instead of pushing it off screen.
          Capped to max-w-xl and centred, because a full-width sheet on a
          monitor is a very long way to travel to tap a name. */}
      <div className="relative mx-auto flex h-[75dvh] w-full max-w-xl flex-col rounded-t-3xl border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
        {/* The header is outside the scroll container, so the search box cannot
            scroll out of view while you are typing in it. */}
        <div className="shrink-0 p-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black uppercase tracking-tight">Add exercise</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-zinc-500"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            // Focus the box as the sheet opens: on a phone that brings the
            // keyboard up in one step instead of two.
            autoFocus
            className="h-12 w-full rounded-2xl bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        {/* The only scrolling part. min-h-0 is what lets a flex child actually
            shrink: without it the default min-height:auto keeps it as tall as
            its content and the whole sheet scrolls again.

            overscroll-contain stops scroll chaining: without it, reaching the
            end of this list hands the remaining scroll to the page behind, so
            one flick past the last exercise drags the background along. */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {error && <p className="px-1 py-3 text-sm text-red-400">{errorMessage(error)}</p>}
          {!error && exercises === undefined && (
            <p className="px-1 py-3 text-sm text-zinc-500">Loading…</p>
          )}
          {!error && exercises !== undefined && shown.length === 0 && (
            <p className="px-1 py-3 text-sm text-zinc-500">Nothing matches “{query}”.</p>
          )}

          {shown.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              disabled={busy}
              onClick={() => onPick(exercise.id)}
              className="mb-2 flex w-full items-center justify-between rounded-2xl bg-zinc-900 p-4 text-left disabled:opacity-40"
            >
              <span className="font-bold">{exercise.name}</span>
              {exercise.muscleGroup && (
                <span className="text-xs uppercase tracking-widest text-zinc-500">
                  {exercise.muscleGroup}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
