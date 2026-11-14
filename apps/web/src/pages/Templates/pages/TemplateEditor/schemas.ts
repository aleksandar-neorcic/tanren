import { z } from 'zod'

export const templateExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  targetSets: z
    .number({ error: 'Enter a number' })
    .int('Whole numbers only')
    .min(1, 'At least 1 set'),
  targetReps: z
    .number({ error: 'Enter a number' })
    .int('Whole numbers only')
    .min(1, 'At least 1 rep')
    .nullable(),
  targetWeight: z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative').nullable(),
})

export const templateSchema = z.object({
  name: z.string().trim().min(1, 'Give the template a name'),
  notes: z.string().nullable(),
  exercises: z.array(templateExerciseSchema).min(1, 'Add at least one exercise'),
})

export type TemplateForm = z.infer<typeof templateSchema>
