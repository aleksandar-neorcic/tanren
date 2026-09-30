import { Prisma } from '@prisma/client';

/**
 * The one shape every session read returns, so the web app can rely on it:
 * the exercises in the order they are performed, each with its exercise row and
 * its sets in order. `template` is narrowed to id + name — a session only needs
 * to say where it came from, not carry the whole plan.
 */
export const sessionInclude = {
  template: { select: { id: true, name: true } },
  exercises: {
    orderBy: { order: 'asc' },
    include: {
      exercise: true,
      sets: { orderBy: { setNumber: 'asc' } },
    },
  },
} satisfies Prisma.WorkoutSessionInclude;

/** A session as loaded with `sessionInclude`, derived so the two cannot drift. */
export type FullSession = Prisma.WorkoutSessionGetPayload<{
  include: typeof sessionInclude;
}>;

/**
 * The history list only needs headline numbers, not every set, so a full session
 * is folded down to a summary here.
 *
 * Only `done` sets count: a session you bailed on halfway should not inflate the
 * history with sets you never actually did. A missing weight or reps counts as 0.
 */
export function toSessionSummary(session: FullSession) {
  const doneSets = session.exercises.flatMap((e) => e.sets.filter((s) => s.done));
  const volume = doneSets.reduce((total, s) => total + (s.weight ?? 0) * (s.reps ?? 0), 0);

  return {
    id: session.id,
    name: session.name,
    notes: session.notes,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    template: session.template,
    exerciseNames: session.exercises.map((e) => e.exercise.name),
    setCount: doneSets.length,
    // Floats accumulate noise (2.5kg plates add up to 1234.5000000000002), and
    // nobody needs sub-0.1kg precision on a volume total.
    volume: Math.round(volume * 10) / 10,
  };
}
