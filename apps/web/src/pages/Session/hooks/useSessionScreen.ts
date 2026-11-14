import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { errorMessage } from '@/api/client.ts'
import { sessionExercisesApi, sessionsApi, setsApi } from '@/api/endpoints.ts'
import type { Session as WorkoutSession, SessionExercise, SetLog } from '@/api/types.ts'
import { formatElapsed } from '@/lib/format.ts'
import { useNow } from '@/lib/useNow.ts'

/**
 * Everything the logging screen holds and everything it writes.
 *
 * Unlike the other features' hooks this one owns no queries: the session
 * arrives from the route loader, and every mutation answers with the whole
 * session, so the state story is "keep the newest answer".
 */
export default function useSessionScreen(loaded: WorkoutSession) {
  const navigate = useNavigate()
  // A bridge until this screen moves off its loader and onto Query hooks like
  // Start has. Finishing or discarding changes what `['sessions', *]` holds, and
  // this page is the only thing on the API that knows it — nothing else would
  // tell the cache, so Start would keep showing a workout that is over or gone.
  const queryClient = useQueryClient()

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
  const [confirmingFinish, setConfirmingFinish] = useState(false)
  const cancelFinish = useCallback(() => setConfirmingFinish(false), [])

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

  const openExercises = exercises.filter((e) => !e.done).length

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
      // Before navigating, not after: we are moving *toward* the screens that
      // read this data, so it has to be stale by the time they mount. (In
      // useStart the order is reversed, because starting a session navigates
      // away from Start rather than back to it.)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      navigate('/history')
    } catch (e) {
      setError(errorMessage(e))
      // Only on failure: on success this component is on its way out.
      setBusy(false)
    }
  }

  /**
   * Finishing is one-way: there is no endpoint that reopens a session, and
   * `finish` is idempotent so a retry will not undo it either. Walking out of
   * the gym mid-workout is a real thing to do, so this asks rather than blocks
   * — but it asks, because the tap is not recoverable.
   */
  function requestFinish() {
    if (openExercises > 0) {
      setConfirmingFinish(true)
    } else {
      void finish()
    }
  }

  /** Started the wrong template, or tapped start by accident. */
  async function discard() {
    setBusy(true)
    setError(null)
    try {
      await sessionsApi.remove(session.id)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      // `replace`, not a push: the session is gone, so leaving /session/:id in
      // the back stack only means a 404 the next time you swipe back.
      navigate('/', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
      setConfirmingDiscard(false)
    }
  }

  return {
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
  }
}
