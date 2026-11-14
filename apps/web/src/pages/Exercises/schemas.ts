import { z } from 'zod'

export const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'Give the exercise a name'),
  muscleGroup: z.string().trim(),
  notes: z.string().trim(),
})

export type ExerciseForm = z.infer<typeof exerciseSchema>
