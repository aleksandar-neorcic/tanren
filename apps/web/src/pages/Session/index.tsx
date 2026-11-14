import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router'
import { sessionExercisesApi, sessionsApi } from '@/api/endpoints.ts'
import type { Session as WorkoutSession, SessionExercise } from '@/api/types.ts'
import AddExerciseSheet from '@/components/AddExerciseSheet.tsx'
import ConfirmDialog from '@/components/ConfirmDialog.tsx'
import { ChevronLeftIcon, PlusIcon, TrashIcon } from '@/components/icons.tsx'
import { ExerciseProgress, FinishedLog, SetChips, SetEntry } from './components/index.ts'
import useSessionScreen from './hooks/useSessionScreen.ts'

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
  const {
    session,
    exercises,
    live,
    elapsed,
    busy,
    error,
    currentIndex,
    current,
    next,
    currentSet,
    canRemoveSet,
    openExercises,
    run,
    removeLastSet,
    completeSet,
    requestFinish,
    finish,
    discard,
    picking,
    setPicking,
    confirmingDiscard,
    setConfirmingDiscard,
    cancelDiscard,
    confirmingFinish,
    cancelFinish,
  } = useSessionScreen(loaded)

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
          <h1 className="text-lg font-black tracking-tight uppercase">{session.name}</h1>
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
            <p className="text-3xl font-black tracking-tight uppercase">Workout complete</p>
            <p className="mt-1 mb-8 text-sm text-zinc-500">
              {exercises.length} exercises · {doneSetCount(exercises)} sets
            </p>
            <button
              type="button"
              onClick={requestFinish}
              disabled={busy}
              className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black text-black uppercase disabled:opacity-50"
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
            <p className="text-3xl font-black tracking-tight uppercase">{current.exercise.name}</p>
            <p className="mt-1 mb-8 text-sm text-zinc-500">Every set here is logged.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => sessionExercisesApi.update(current.id, { done: true }))}
              className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black text-black uppercase disabled:opacity-50"
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
            <ExerciseProgress exercises={exercises} currentIndex={currentIndex} />

            <h2 className="text-4xl font-black tracking-tight uppercase">
              {current.exercise.name}
            </h2>
            <p className="mb-3 text-lg text-zinc-400">
              Set <b className="text-white">{current.sets.indexOf(currentSet) + 1}</b> of{' '}
              {current.sets.length}
            </p>

            <SetChips
              sets={current.sets}
              busy={busy}
              canRemove={canRemoveSet}
              onRemoveLast={() => removeLastSet()}
              onAppend={() => run(() => sessionExercisesApi.appendSet(current.id))}
            />

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
              <span className="font-semibold">{next ? `${next.exercise.name} ›` : 'Finish ›'}</span>
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
                onClick={requestFinish}
                className="text-zinc-500 disabled:opacity-40"
              >
                Finish workout
              </button>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmingDiscard(true)}
              className="mt-4 flex w-full items-center justify-center gap-1.5 py-2 text-sm text-red-400 disabled:opacity-40"
            >
              <TrashIcon size={14} />
              Delete this session
            </button>
          </div>
        )}
      </div>

      {confirmingFinish && (
        <ConfirmDialog
          title="Finish this workout?"
          body={`${openExercises} of ${exercises.length} ${
            exercises.length === 1 ? 'exercise is' : 'exercises are'
          } still open. Everything you logged is kept, but a finished session cannot be reopened.`}
          confirmLabel="Finish"
          cancelLabel="Keep going"
          tone="primary"
          busy={busy}
          onConfirm={finish}
          onCancel={cancelFinish}
        />
      )}

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

function doneSetCount(exercises: SessionExercise[]): number {
  return exercises.reduce((total, e) => total + e.sets.filter((s) => s.done).length, 0)
}
