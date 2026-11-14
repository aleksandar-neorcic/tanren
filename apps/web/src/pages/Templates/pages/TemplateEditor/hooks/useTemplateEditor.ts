import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { exercisesApi, templatesApi } from '@/api/endpoints.ts'
import type { TemplateInput } from '@/api/types.ts'

export default function useTemplateEditor(id?: string) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const templateQuery = useQuery({
    queryKey: ['templates', id],
    queryFn: () => templatesApi.get(id!),
    enabled: id !== undefined,
  })

  const exercisesQuery = useQuery({
    queryKey: ['exercises'],
    queryFn: () => exercisesApi.list(),
  })

  const {
    mutate: save,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: (body: TemplateInput) =>
      id === undefined ? templatesApi.create(body) : templatesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      navigate('/templates')
    },
  })

  const {
    mutate: removeTemplate,
    isPending: isRemoving,
    error: removeError,
  } = useMutation({
    mutationFn: () => templatesApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'], exact: true })
      navigate('/templates', { replace: true })
    },
  })

  return {
    template: templateQuery.data,
    exercises: exercisesQuery.data,
    error: templateQuery.error ?? exercisesQuery.error,
    // `isLoading`, not `isPending`: pending only means "no data yet", which a
    // disabled query reports forever. isLoading is pending && fetching, so the
    // new-template route — where the template query never runs — is not loading.
    isLoading: templateQuery.isLoading || exercisesQuery.isLoading,
    save,
    isSaving,
    saveError,
    removeTemplate,
    isRemoving,
    removeError,
  }
}
