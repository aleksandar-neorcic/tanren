import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client.ts'
import { exercisesApi } from '../api/endpoints.ts'
import type { Exercise } from '../api/types.ts'
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
 * This one fetches in an effect rather than in a route loader, because it is not
 * a route: it opens on top of the session, and the library is only worth loading
 * if you actually open it.
 */
export default function AddExerciseSheet({ busy, onPick, onClose }: Props) {
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    // StrictMode runs effects twice in development to surface exactly this bug:
    // without the flag, a slow first response could land after the second one
    // and overwrite it. The flag makes the stale run's result a no-op.
    let cancelled = false
    exercisesApi.list().then(
      (list) => {
        if (!cancelled) setExercises(list)
      },
      (e: unknown) => {
        if (!cancelled) setError(errorMessage(e))
      },
    )
    return () => {
      cancelled = true
    }
    // No dependencies: fetch once, when the sheet opens.
  }, [])

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
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-zinc-500">
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
            its content and the whole sheet scrolls again. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {error && <p className="px-1 py-3 text-sm text-red-400">{error}</p>}
          {!error && exercises === null && (
            <p className="px-1 py-3 text-sm text-zinc-500">Loading…</p>
          )}
          {!error && exercises !== null && shown.length === 0 && (
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
