import { z } from 'zod'

export const templateExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z.number().int().min(1),
  targetReps: z.number().int().min(1).nullable(),
  targetWeight: z.number().min(0).nullable(),
})

export const templateSchema = z.object({
  name: z.string().min(1, 'Give the template a name'),
  notes: z.string().nullable(),
  exercises: z.array(templateExerciseSchema).min(1, 'Add at least one exercise'),
})

export type TemplateForm = z.infer<typeof templateSchema>
