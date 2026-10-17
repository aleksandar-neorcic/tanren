import { useCallback, useState } from 'react'
import { Link, useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router'
import { errorMessage } from '../api/client.ts'
import { sessionExercisesApi, sessionsApi, setsApi } from '../api/endpoints.ts'
import type { Session as WorkoutSession, SessionExercise, SetLog } from '../api/types.ts'
import AddExerciseSheet from '../components/AddExerciseSheet.tsx'
import ConfirmDialog from '../components/ConfirmDialog.tsx'
import { CheckIcon, ChevronLeftIcon, MinusIcon, PlusIcon, TrashIcon } from '../components/icons.tsx'
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
  // Deleting is irreversible, so the button arms a confirmation instead of
  // doing the thing. Local state, because it is a property of this screen
  // right now and of nothing else.
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  // Stable across renders, because ConfirmDialog's Escape listener depends on
  // it: a fresh arrow function each render would tear down and re-add that
  // listener on every keystroke elsewhere on the page.
  const cancelDiscard = useCallback(() => setConfirmingDiscard(false), [])

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

  // The set − removes: the last one, and only while it is still unlogged. An
  // exercise always keeps at least one set, so there is something to log into.
  const lastSet = current ? (current.sets[current.sets.length - 1] ?? null) : null
  const canRemoveSet = lastSet !== null && !lastSet.done && (current?.sets.length ?? 0) > 1

  /**
   * Close an exercise out once its last set has been *logged*.
   *
   * Only logging gets to do this. Tapping "Done set" is you saying you are
   * finished; deleting a set is housekeeping, and reading it as "finished"
   * moves you on from an exercise you never said you were done with — with no
   * way back if the delete was a mistap. So the delete path deliberately does
   * not call this and lets you choose instead.
   *
   * It works off the session the server just returned, never off what was
   * rendered: by the time the await resolves, that is already stale.
   */
  async function settleExercise(after: WorkoutSession, exerciseId: string) {
    const exercise = after.exercises.find((e) => e.id === exerciseId)
    const finished =
      exercise !== undefined &&
      !exercise.done &&
      exercise.sets.length > 0 &&
      exercise.sets.every((s) => s.done)

    return finished ? sessionExercisesApi.update(exercise.id, { done: true }) : after
  }

  async function removeLastSet() {
    if (lastSet === null) return
    // No settleExercise here, on purpose. If this was the last unlogged set the
    // exercise stays open with nothing to log into, and the screen asks what
    // you want to do about it rather than deciding for you.
    await run(() => setsApi.remove(lastSet.id))
  }

  async function completeSet(exercise: SessionExercise, set: SetLog, weight: number, reps: number) {
    await run(async () =>
      settleExercise(await setsApi.update(set.id, { weight, reps, done: true }), exercise.id),
    )
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

  /** Started the wrong template, or tapped start by accident. */
  async function discard() {
    setBusy(true)
    setError(null)
    try {
      await sessionsApi.remove(session.id)
      // `replace`, not a push: the session is gone, so leaving /session/:id in
      // the back stack only means a 404 the next time you swipe back.
      navigate('/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
      setConfirmingDiscard(false)
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
        ) : current === null ? (
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
        ) : currentSet === null ? (
          // Nothing left to log in this exercise, but it is still open: you
          // deleted its last unlogged set, or the PATCH that marks it done did
          // not land. Either way it is a question, not a conclusion — and *not*
          // the whole workout being over. Conflating the two is what made
          // removing a set jump straight to "Workout complete".
          //
          // Order matters here: `current === null` is tested first, so by this
          // branch TypeScript knows there is an exercise to talk about.
          <div className="mt-12 text-center">
            <p className="text-3xl font-black uppercase tracking-tight">{current.exercise.name}</p>
            <p className="mt-1 mb-8 text-sm text-zinc-500">Every set here is logged.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => sessionExercisesApi.update(current.id, { done: true }))}
              className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black uppercase text-black disabled:opacity-50"
            >
              {next ? 'Next exercise' : 'Finish up'}
            </button>
            {/* The way out of a mistapped delete. appendSet copies the previous
                set's numbers and leaves it unlogged, so this lands you straight
                back on the steppers where you were. */}
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => sessionExercisesApi.appendSet(current.id))}
              className="mt-4 flex w-full items-center justify-center gap-1.5 py-2 text-sm text-zinc-400 disabled:opacity-40"
            >
              <PlusIcon size={14} />
              add a set back
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
              {/* Undoes a + set tap, or trims a template that planned for more
                  sets than you have in you today. Only ever the last set, and
                  only while it is unlogged: work you actually did should not be
                  one mistap away from gone. */}
              <button
                type="button"
                aria-label="Remove the last set"
                disabled={busy || !canRemoveSet}
                onClick={() => removeLastSet()}
                className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-400 disabled:opacity-40"
              >
                <MinusIcon size={14} />
                set
              </button>
              <button
                type="button"
                aria-label="Add a set"
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
          <div className="mt-10 border-t border-zinc-900 pt-4">
            <div className="flex items-center justify-between text-sm">
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

            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDiscard(true)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 py-2 text-sm text-zinc-600 disabled:opacity-40"
            >
              <TrashIcon size={14} />
              Delete this session
            </button>
          </div>
        )}
      </div>

      {confirmingDiscard && (
        <ConfirmDialog
          title="Delete this session?"
          body={
            doneSetCount(exercises) === 0
              ? 'Nothing has been logged yet, so nothing is lost.'
              : `Its ${doneSetCount(exercises)} logged sets go with it, and there is no undo.`
          }
          confirmLabel="Delete"
          cancelLabel="Keep it"
          busy={busy}
          onConfirm={discard}
          onCancel={cancelDiscard}
        />
      )}

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

/**
 * The big number, with − / + on either side. One per value, so weight and reps
 * share the code.
 *
 * The number is an input, not a label: nudging from 0 to 100kg is forty taps,
 * and the steppers are for adjusting what is already roughly right.
 *
 * `value` is the text, not a number. A field being typed into passes through
 * "" and "2." on its way to "2.5", and neither of those is a number — holding
 * a number here would mean fighting the user's own keystrokes.
 */
function NumberField({
  label,
  value,
  step,
  integer,
  disabled,
  onChange,
}: {
  label: string
  value: string
  step: number
  integer: boolean
  disabled: boolean
  onChange: (next: string) => void
}) {
  const current = toNumber(value)

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-3xl bg-zinc-900 p-3">
      <button
        type="button"
        aria-label={`Less ${label}`}
        disabled={disabled || current <= 0}
        onClick={() => onChange(toText(Math.max(0, current - step), integer))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <MinusIcon size={28} />
      </button>

      {/* A <label>, so a tap anywhere in the middle lands in the input instead
          of in the gap between two digits. */}
      <label className="min-w-0 flex-1 text-center">
        <input
          // Not type="number": that brings spinner arrows, changes the value on
          // a stray scroll wheel, and reports "2." as empty while you are still
          // typing "2.5". inputMode gets the phone's number pad without any of
          // that, and the parsing below is ours either way.
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          enterKeyHint="done"
          aria-label={label}
          value={value}
          disabled={disabled}
          // Tap the number and type: the old value is replaced rather than
          // appended to, so 80 → 100 is three keystrokes and no backspacing.
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(sanitize(e.target.value, integer))}
          // Tidy up only once you leave: "" becomes "0", "100." becomes "100".
          onBlur={() => onChange(toText(current, integer))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className={[
            'w-full bg-transparent text-center font-black leading-none tabular-nums caret-lime-400 outline-none disabled:opacity-40',
            // Long values would otherwise run under the +/− buttons.
            value.length > 4 ? 'text-6xl' : 'text-7xl',
          ].join(' ')}
        />
        <span className="mt-1 block text-sm uppercase tracking-widest text-zinc-500">{label}</span>
      </label>

      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={disabled}
        onClick={() => onChange(toText(current + step, integer))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <PlusIcon size={28} />
      </button>
    </div>
  )
}

/** Drop anything that could never become a number, mid-keystroke included. */
function sanitize(raw: string, integer: boolean): string {
  const cleaned = raw.replace(integer ? /[^0-9]/g : /[^0-9.]/g, '')
  if (integer) return cleaned
  // At most one decimal point — the first one typed wins.
  const [head, ...rest] = cleaned.split('.')
  return rest.length > 0 ? `${head}.${rest.join('')}` : head
}

/** The text as a number, with every unfinished or empty state reading as 0. */
function toNumber(text: string): number {
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Reps are @IsInt() on the API, so they are rounded here rather than rejected there. */
function toText(value: number, integer: boolean): string {
  return String(integer ? Math.round(value) : round1(value))
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
  const [weight, setWeight] = useState(() => toText(set.weight ?? 0, false))
  const [reps, setReps] = useState(() => toText(set.reps ?? 8, true))

  return (
    <>
      <NumberField
        label="kg"
        value={weight}
        step={2.5}
        integer={false}
        disabled={busy}
        onChange={setWeight}
      />
      <NumberField
        label="reps"
        value={reps}
        step={1}
        integer
        disabled={busy}
        onChange={setReps}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => onDone(toNumber(weight), Math.round(toNumber(reps)))}
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
