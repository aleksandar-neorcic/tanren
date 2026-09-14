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

async function main() {
  const byName = new Map<string, string>();
  for (const e of exercises) {
    const row = await prisma.exercise.upsert({
      where: { name: e.name },
      update: { muscleGroup: e.muscleGroup },
      create: e,
    });
    byName.set(row.name, row.id);
  }

  for (const t of templates) {
    const exists = await prisma.template.findFirst({ where: { name: t.name } });
    if (exists) continue;
    await prisma.template.create({
      data: {
        name: t.name,
        exercises: {
          create: t.exercises.map(([name, targetSets, targetReps], order) => ({
            order,
            exerciseId: byName.get(name)!,
            targetSets,
            targetReps,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${exercises.length} exercises and ${templates.length} templates.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
