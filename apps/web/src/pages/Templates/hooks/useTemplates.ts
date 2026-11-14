import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templatesApi } from '@/api/endpoints.ts'

export default function useTemplates() {
  const queryClient = useQueryClient()

  const { data: templates, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list(),
  })

  const {
    mutate: removeTemplate,
    isPending: isRemoving,
    error: removeError,
  } = useMutation({
    mutationFn: (id: string) => templatesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'], exact: true })
    },
  })

  return {
    templates,
    error,
    removeTemplate,
    isRemoving,
    removeError,
  }
}
