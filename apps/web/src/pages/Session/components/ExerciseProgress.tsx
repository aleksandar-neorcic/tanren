import type { SessionExercise } from '@/api/types.ts'

/** One dot per exercise, wide and lime for the one you are on. */
export default function ExerciseProgress({
  exercises,
  currentIndex,
}: {
  exercises: SessionExercise[]
  currentIndex: number
}) {
  return (
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
  )
}
