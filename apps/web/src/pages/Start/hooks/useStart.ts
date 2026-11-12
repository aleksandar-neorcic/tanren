import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client.ts'
import { sessionsApi, templatesApi } from '@/api/endpoints.ts'
import type { SessionSummary } from '@/api/types.ts'

export default function useStart() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list()
  })

  const historyQuery = useQuery({
    queryKey: ['sessions', 'history'],
    queryFn: () => sessionsApi.history(),
    select: lastTrainedByTemplate
  })

  const activeQuery = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: () => sessionsApi.active()
  })

  const { mutate: startSession, isPending: isStarting, error: startError } = useMutation({
    mutationFn: (body: { templateId?: string }) => sessionsApi.start(body),
    onSuccess: (session) => {
      navigate(`/session/${session.id}`)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (e) => {
      // 409: a workout is already running — another tab, or an app closed
      // mid-session. The id rides along on the error, so the right answer is to
      // take you there rather than to explain the problem.
      if (e instanceof ApiError && e.activeSessionId) {
        navigate(`/session/${e.activeSessionId}`)
        return
      }
    }
  })

  const isLoading = templatesQuery.isPending || historyQuery.isPending || activeQuery.isPending
  const error = templatesQuery.error ?? historyQuery.error ?? activeQuery.error

  return {
    templates: templatesQuery.data,
    lastTrained: historyQuery.data,
    active: activeQuery.data,
    isLoading,
    error,
    startSession,
    isStarting,
    startError
  }
}

/**
 * History comes back newest first, so the first session that mentions a
 * template is that template's most recent outing — no sorting, no comparisons.
 */
function lastTrainedByTemplate(history: SessionSummary[]): Record<string, string> {
  const latest: Record<string, string> = {}
  for (const session of history) {
    const id = session.template?.id
    if (id && !(id in latest)) {
      latest[id] = session.startedAt
    }
  }
  return latest
}
