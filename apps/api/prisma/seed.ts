import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises: { name: string; muscleGroup: string }[] = [
  { name: 'Barbell Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest' },
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Triceps Pushdown', muscleGroup: 'Triceps' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Pull-up', muscleGroup: 'Back' },
  { name: 'Face Pull', muscleGroup: 'Rear delts' },
  { name: 'Dumbbell Curl', muscleGroup: 'Biceps' },
  { name: 'Back Squat', muscleGroup: 'Quads' },
  { name: 'Romanian Deadlift', muscleGroup: 'Hamstrings' },
  { name: 'Leg Press', muscleGroup: 'Quads' },
  { name: 'Leg Curl', muscleGroup: 'Hamstrings' },
  { name: 'Calf Raise', muscleGroup: 'Calves' },
  { name: 'Deadlift', muscleGroup: 'Back' },
];

const templates: { name: string; exercises: [string, number, number][] }[] = [
  {
    name: 'Push',
    exercises: [
      ['Barbell Bench Press', 4, 8],
      ['Overhead Press', 3, 8],
      ['Incline Dumbbell Press', 3, 10],
      ['Lateral Raise', 3, 15],
      ['Triceps Pushdown', 3, 12],
    ],
  },
  {
    name: 'Pull',
    exercises: [
      ['Deadlift', 3, 5],
      ['Barbell Row', 4, 8],
      ['Lat Pulldown', 3, 10],
      ['Face Pull', 3, 15],
      ['Dumbbell Curl', 3, 12],
    ],
  },
  {
    name: 'Legs',
    exercises: [
      ['Back Squat', 4, 6],
      ['Romanian Deadlift', 3, 8],
      ['Leg Press', 3, 12],
      ['Leg Curl', 3, 12],
      ['Calf Raise', 4, 15],
    ],
  },
];

/**
 * What each lift is worked at in the *most recent* seeded session, paired with
 * the increment it moves in: [kg, stepKg]. Older sessions subtract whole steps,
 * so every weight in the history is one a real plate stack or dumbbell rack can
 * actually make — 82.5kg, not 81.3kg.
 */
const working: Record<string, [kg: number, stepKg: number]> = {
  'Barbell Bench Press': [82.5, 2.5],
  'Overhead Press': [52.5, 2.5],
  'Incline Dumbbell Press': [30, 2],
  'Lateral Raise': [12, 1],
  'Triceps Pushdown': [32.5, 2.5],
  'Barbell Row': [85, 2.5],
  'Lat Pulldown': [70, 5],
  'Face Pull': [25, 2.5],
  'Dumbbell Curl': [16, 2],
  'Back Squat': [120, 5],
  'Romanian Deadlift': [100, 5],
  'Leg Press': [180, 10],
  'Leg Curl': [55, 5],
  'Calf Raise': [90, 5],
  Deadlift: [150, 5],
};

/** How much history to seed: four weeks of a three-day rotation. */
const SESSION_COUNT = 12;

/**
 * A lift goes up one step each time it is trained, so `timesAgo` steps back from
 * the current working weight. One step per session, not per two: a template only
 * comes round four times in the seeded block, and stepping every other one left
 * consecutive sessions byte-identical, which reads as duplicated fixture data.
 *
 * Floored at 60% of the current load, or the oldest sessions stop looking like
 * the same person training.
 */
function weightFor(name: string, timesAgo: number): number {
  const [kg, step] = working[name];
  const floor = Math.round((kg * 0.6) / step) * step;
  return Math.max(kg - step * timesAgo, floor);
}

/**
 * Every row reading an exact "3 × 10" looks like a fixture rather than a log, so
 * the reps move a little: the last set of a long exercise drops one, and the
 * older half of the history is another rep short. Both are derived from the
 * position, not random, so each seed run produces the same numbers.
 */
function repsFor(
  target: number,
  setIndex: number,
  setCount: number,
  timesAgo: number,
): number {
  const fatigue = setIndex === setCount - 1 && setCount >= 4 ? 1 : 0;
  const earlier = timesAgo >= 2 ? 1 : 0;
  return Math.max(target - fatigue - earlier, 1);
}

/**
 * `daysAgo` days back at 18:30 local time. Relative to now, never a literal
 * date: a hardcoded one would read as stale history a month after a deploy.
 */
function startedAtDaysAgo(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(18, 30, 0, 0);
  return d;
}

/**
 * Twelve finished sessions, so a fresh install has a History page with
 * something on it. All of them are finished and every set is `done`:
 * `SessionsService.create` rejects a second workout while one is unfinished,
 * and `toSessionSummary` counts only done sets towards setCount and volume.
 */
async function seedSessions(
  exerciseIds: Map<string, string>,
  templateIds: Map<string, string>,
) {
  // WorkoutSession has no natural unique key to upsert on, and inventing one for
  // the seed's sake would put a column in the schema the app never reads. So this
  // runs only on an empty history: re-running the seed after a real workout must
  // not bury it under a dozen fake ones.
  if ((await prisma.workoutSession.count()) > 0) return 0;

  // i counts backwards from the newest session, so `timesAgo` per template falls
  // straight out of how many times the loop has already seen it.
  const timesAgo = new Map<string, number>();

  for (let i = 0; i < SESSION_COUNT; i++) {
    const template = templates[i % templates.length];
    const ago = timesAgo.get(template.name) ?? 0;
    timesAgo.set(template.name, ago + 1);

    // Every other day, plus a rest day each time the rotation comes round, so
    // the gaps look like a week of training instead of a metronome.
    const startedAt = startedAtDaysAgo(i * 2 + Math.floor(i / 3));
    const setTotal = template.exercises.reduce((n, [, sets]) => n + sets, 0);

    await prisma.workoutSession.create({
      data: {
        // `SessionsService.create` names a session after its template, so the
        // seeded rows and the ones the app makes read the same in History.
        name: template.name,
        templateId: templateIds.get(template.name)!,
        startedAt,
        // Roughly three minutes a set plus a warm-up, rather than a flat hour:
        // the duration is derived from the work, so it varies per template.
        finishedAt: new Date(
          startedAt.getTime() + (12 + setTotal * 3) * 60_000,
        ),
        exercises: {
          create: template.exercises.map(([name, sets, reps], order) => ({
            order,
            exerciseId: exerciseIds.get(name)!,
            done: true,
            sets: {
              create: Array.from({ length: sets }, (_, setIndex) => ({
                setNumber: setIndex + 1,
                weight: weightFor(name, ago),
                reps: repsFor(reps, setIndex, sets, ago),
                done: true,
              })),
            },
          })),
        },
      },
    });
  }

  return SESSION_COUNT;
}

async function main() {
  const exerciseIds = new Map<string, string>();
  for (const e of exercises) {
    const row = await prisma.exercise.upsert({
      where: { name: e.name },
      update: { muscleGroup: e.muscleGroup },
      create: e,
    });
    exerciseIds.set(row.name, row.id);
  }

  const templateIds = new Map<string, string>();
  for (const t of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: t.name },
    });
    if (existing) {
      // Still needed below: the sessions point at whichever template is there,
      // whether this run created it or an earlier one did.
      templateIds.set(t.name, existing.id);
      continue;
    }
    const row = await prisma.template.create({
      data: {
        name: t.name,
        exercises: {
          create: t.exercises.map(([name, targetSets, targetReps], order) => ({
            order,
            exerciseId: exerciseIds.get(name)!,
            targetSets,
            targetReps,
          })),
        },
      },
    });
    templateIds.set(row.name, row.id);
  }

  const sessionCount = await seedSessions(exerciseIds, templateIds);

  console.log(
    `Seeded ${exercises.length} exercises and ${templates.length} templates, ` +
      (sessionCount
        ? `plus ${sessionCount} finished sessions.`
        : 'and left the existing session history alone.'),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
