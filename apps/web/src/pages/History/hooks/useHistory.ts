import { useQuery } from '@tanstack/react-query'
import { sessionsApi } from '@/api/endpoints.ts'

export default function useHistory() {
  const { data: sessions, error } = useQuery({
    queryKey: ['sessions', 'history'],
    queryFn: () => sessionsApi.history(),
  })

  return {
    sessions,
    error,
  }
}
