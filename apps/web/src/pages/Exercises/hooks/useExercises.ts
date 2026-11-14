import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exercisesApi } from '@/api/endpoints.ts'
import type { ExerciseInput, ExerciseUpdate } from '@/api/types.ts'

export default function useExercises(showArchived: boolean) {
  const queryClient = useQueryClient()

  const { data: exercises, error } = useQuery({
    queryKey: showArchived ? ['exercises', 'all'] : ['exercises'],
    queryFn: () => exercisesApi.list(showArchived),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exercises'] })

  const createMutation = useMutation({
    mutationFn: (body: ExerciseInput) => exercisesApi.create(body),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ExerciseUpdate }) =>
      exercisesApi.update(id, body),
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => exercisesApi.archive(id),
    onSuccess: invalidate,
  })

  return {
    exercises,
    error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    archive: archiveMutation.mutate,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isArchiving: archiveMutation.isPending,
    actionError: createMutation.error ?? updateMutation.error ?? archiveMutation.error,
  }
}
