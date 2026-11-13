export interface Exercise {
  id: string
  name: string
  muscleGroup: string | null
  notes: string | null
  archived: boolean
}

export interface TemplateExercise {
  id: string
  order: number
  exerciseId: string
  targetSets: number
  targetReps: number | null
  targetWeight: number | null
  exercise: Exercise
}

export interface Template {
  id: string
  name: string
  notes: string | null
  exercises: TemplateExercise[]
}

/**
 * The body `POST /templates` and `PUT /templates/:id` both take. `exercises`
 * is an ordered array and the server derives each row's `order` from its
 * index, so the two can never disagree.
 */
export interface TemplateInput {
  name: string
  notes: string | null
  exercises: TemplateExerciseInput[]
}

export interface TemplateExerciseInput {
  exerciseId: string
  targetSets: number
  targetReps: number | null
  targetWeight: number | null
}

export interface SetLog {
  id: string
  setNumber: number
  weight: number | null
  reps: number | null
  done: boolean
}

export interface SessionExercise {
  id: string
  order: number
  done: boolean
  exercise: Exercise
  sets: SetLog[]
}

export interface Session {
  id: string
  name: string
  notes: string | null
  startedAt: string
  finishedAt: string | null
  template: { id: string; name: string } | null
  exercises: SessionExercise[]
}

export interface SessionSummary {
  id: string
  name: string
  notes: string | null
  startedAt: string
  finishedAt: string | null
  template: { id: string; name: string } | null
  exerciseNames: string[]
  setCount: number
  volume: number
}
