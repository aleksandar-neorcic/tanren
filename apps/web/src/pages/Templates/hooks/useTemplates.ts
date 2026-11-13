import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/api/endpoints.ts'

export default function useTemplates() {
  const { data: templates, error } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list(),
  })

  return {
    templates,
    error,
  }
}
