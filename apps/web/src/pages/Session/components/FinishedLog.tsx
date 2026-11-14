import type { SessionExercise } from '@/api/types.ts'

/** A finished session is a log to read, not a screen to tap. */
export default function FinishedLog({ exercises }: { exercises: SessionExercise[] }) {
  return (
    <div className="mt-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="mb-3 rounded-2xl bg-zinc-900 p-4">
          <div className="text-lg font-black tracking-tight uppercase">
            {exercise.exercise.name}
          </div>
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
