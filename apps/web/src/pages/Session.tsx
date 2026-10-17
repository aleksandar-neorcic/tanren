import { useState } from 'react'
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { sessionExercisesApi, sessionsApi, setsApi } from '../api/endpoints.ts'
import type { Session as WorkoutSession, SessionExercise, SetLog } from '../api/types.ts'
import AddExerciseSheet from '../components/AddExerciseSheet.tsx'
import { CheckIcon, ChevronLeftIcon, MinusIcon, PlusIcon } from '../components/icons.tsx'
import { formatElapsed, round1 } from '../lib/format.ts'
import { useNow } from '../lib/useNow.ts'

export async function loader({ params }: LoaderFunctionArgs): Promise<WorkoutSession> {
  // The route only matches with an `:id` present, but the type cannot say that,
  // so this is the one place the certainty is asserted.
  return sessionsApi.get(params.id!)
}

export default function Session() {
  const loaded = useLoaderData() as WorkoutSession

  // `key` is what resets the state inside SessionScreen when the route moves to
  // a different session. Passing new props would not: useState's argument is
  // only read on the first render. A new key is a new component instance.
  return <SessionScreen key={loaded.id} loaded={loaded} />
}

function SessionScreen({ loaded }: { loaded: WorkoutSession }) {
  const navigate = useNavigate()

  // Every mutation on the API answers with the whole session, so the entire
  // client-side state story is "keep the newest answer". Nothing to merge,
  // nothing to invalidate, no way for the screen to drift from the database.
  const [session, setSession] = useState(loaded)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  const live = session.finishedAt === null
  const now = useNow(live)
  const elapsed = formatElapsed(
    session.startedAt,
    live ? now : new Date(session.finishedAt!).getTime(),
  )

  /** One wrapper for every write: pending flag, error, and store the answer. */
  async function run(call: () => Promise<WorkoutSession>) {
    setBusy(true)
    setError(null)
    try {
      setSession(await call())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  // Which exercise and set you are on is *derived*, never stored: the server
  // already knows what is done, and a second copy of that in useState is a
  // second thing that can be wrong.
  const exercises = session.exercises
  const currentIndex = exercises.findIndex((e) => !e.done)
  const current = currentIndex === -1 ? null : exercises[currentIndex]
  const next = currentIndex === -1 ? null : (exercises[currentIndex + 1] ?? null)
  const currentSet = current?.sets.find((s) => !s.done) ?? null

  async function completeSet(exercise: SessionExercise, set: SetLog, weight: number, reps: number) {
    await run(async () => {
      const afterSet = await setsApi.update(set.id, { weight, reps, done: true })
      // Was that the exercise's last set? Decide from the answer that just came
      // back, not from the `exercise` we rendered — that one is already stale.
      const updated = afterSet.exercises.find((e) => e.id === exercise.id)
      if (updated && updated.sets.every((s) => s.done)) {
        return sessionExercisesApi.update(updated.id, { done: true })
      }
      return afterSet
    })
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      await sessionsApi.finish(session.id)
      navigate('/history')
    } catch (e) {
      setError(errorMessage(e))
      // Only on failure: on success this component is on its way out.
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-black px-4 pt-4 pb-10 text-white">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="-ml-2 flex items-center gap-1 p-2 text-sm text-zinc-500">
            <ChevronLeftIcon size={16} />
            Leave
          </Link>
          {!live && <span className="text-sm text-zinc-500">Finished</span>}
        </div>

        <div className="flex items-center justify-between py-1">
          <h1 className="text-lg font-black uppercase tracking-tight">{session.name}</h1>
          <div className="text-2xl font-black tabular-nums text-lime-400">{elapsed}</div>
        </div>

        {error && (
          <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {!live ? (
          <FinishedLog exercises={exercises} />
        ) : exercises.length === 0 ? (
          <p className="mt-10 text-center text-sm text-zinc-500">
            Nothing planned yet. Add an exercise to start logging.
          </p>
        ) : current === null || currentSet === null ? (
          <div className="mt-12 text-center">
            <p className="text-3xl font-black uppercase tracking-tight">Workout complete</p>
            <p className="mt-1 mb-8 text-sm text-zinc-500">
              {exercises.length} exercises · {doneSetCount(exercises)} sets
            </p>
            <button
              type="button"
              onClick={finish}
              disabled={busy}
              className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black uppercase text-black disabled:opacity-50"
            >
              Finish workout
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3 mb-6 flex items-center gap-1.5">
              {exercises.map((exercise, i) => (
                <span
                  key={exercise.id}
                  className={[
                    'h-2 rounded-full',
                    i === currentIndex ? 'w-6 bg-lime-400' : 'w-2',
                    i === currentIndex ? '' : exercise.done ? 'bg-lime-400/40' : 'bg-zinc-700',
                  ].join(' ')}
                />
              ))}
              <span className="ml-2 text-xs text-zinc-500">
                Exercise {currentIndex + 1} of {exercises.length}
              </span>
            </div>

            <h2 className="text-4xl font-black uppercase tracking-tight">
              {current.exercise.name}
            </h2>
            <p className="mb-3 text-lg text-zinc-400">
              Set <b className="text-white">{current.sets.indexOf(currentSet) + 1}</b> of{' '}
              {current.sets.length}
            </p>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              {current.sets
                .filter((s) => s.done)
                .map((s) => (
                  <span
                    key={s.id}
                    className="flex items-center gap-1 rounded-full bg-lime-400/15 px-3 py-1 text-sm font-semibold text-lime-400"
                  >
                    <CheckIcon size={14} />
                    {s.weight ?? 0} × {s.reps ?? 0}
                  </span>
                ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => sessionExercisesApi.appendSet(current.id))}
                className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-400 disabled:opacity-40"
              >
                <PlusIcon size={14} />
                set
              </button>
            </div>

            {/* Keyed by the set: when the set changes, the steppers get a fresh
                instance seeded from the new set's numbers instead of holding on
                to the previous one's. */}
            <SetEntry
              key={currentSet.id}
              set={currentSet}
              busy={busy}
              onDone={(weight, reps) => completeSet(current, currentSet, weight, reps)}
            />

            <div className="mt-4 flex items-center justify-between px-1 text-sm">
              <span className="text-zinc-500">Next</span>
              <span className="font-semibold">
                {next ? `${next.exercise.name} ›` : 'Finish ›'}
              </span>
            </div>
          </>
        )}

        {live && (
          <div className="mt-10 flex items-center justify-between border-t border-zinc-900 pt-4 text-sm">
            <button
              type="button"
              disabled={busy}
              onClick={() => setPicking(true)}
              className="flex items-center gap-1 text-zinc-400 disabled:opacity-40"
            >
              <PlusIcon size={16} />
              Add exercise
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={finish}
              className="text-zinc-500 disabled:opacity-40"
            >
              Finish workout
            </button>
          </div>
        )}
      </div>

      {picking && (
        <AddExerciseSheet
          busy={busy}
          onClose={() => setPicking(false)}
          onPick={async (exerciseId) => {
            await run(() => sessionsApi.addExercise(session.id, exerciseId))
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

/** The big number + / − pair. One per value, so weight and reps share the code. */
function Stepper({
  label,
  value,
  step,
  onChange,
  disabled,
}: {
  label: string
  value: number
  step: number
  onChange: (value: number) => void
  disabled: boolean
}) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-3xl bg-zinc-900 p-3">
      <button
        type="button"
        aria-label={`Less ${label}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(round1(Math.max(0, value - step)))}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <MinusIcon size={28} />
      </button>
      <div className="text-center">
        <div className="text-7xl font-black leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-sm uppercase tracking-widest text-zinc-500">{label}</div>
      </div>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={disabled}
        onClick={() => onChange(round1(value + step))}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <PlusIcon size={28} />
      </button>
    </div>
  )
}

/**
 * The numbers for the set you are on.
 *
 * They live here as local state rather than going to the server on every tap:
 * nudging 80 to 82.5 is three taps, and three PATCHes for a number you have not
 * committed to is three chances to fail on gym wifi. One write, on Done set.
 */
function SetEntry({
  set,
  busy,
  onDone,
}: {
  set: SetLog
  busy: boolean
  onDone: (weight: number, reps: number) => void
}) {
  // Seeded from the set the API prefilled: the weight and reps from the last
  // time you trained this exercise, so most sets are one tap.
  const [weight, setWeight] = useState(set.weight ?? 0)
  const [reps, setReps] = useState(set.reps ?? 8)

  return (
    <>
      <Stepper label="kg" value={weight} step={2.5} onChange={setWeight} disabled={busy} />
      <Stepper label="reps" value={reps} step={1} onChange={setReps} disabled={busy} />
      <button
        type="button"
        disabled={busy}
        onClick={() => onDone(weight, reps)}
        className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black uppercase text-black disabled:opacity-50"
      >
        Done set
      </button>
    </>
  )
}

/** A finished session is a log to read, not a screen to tap. */
function FinishedLog({ exercises }: { exercises: SessionExercise[] }) {
  return (
    <div className="mt-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="mb-3 rounded-2xl bg-zinc-900 p-4">
          <div className="text-lg font-black uppercase tracking-tight">{exercise.exercise.name}</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {exercise.sets.map((s) => (
              <span
                key={s.id}
                className={[
                  'rounded-full px-3 py-1 text-sm font-semibold',
                  s.done ? 'bg-lime-400/15 text-lime-400' : 'bg-zinc-800 text-zinc-500',
                ].join(' ')}
              >
                {s.weight ?? 0} × {s.reps ?? 0}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function doneSetCount(exercises: SessionExercise[]): number {
  return exercises.reduce((total, e) => total + e.sets.filter((s) => s.done).length, 0)
}
