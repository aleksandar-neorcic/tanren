import { api } from './client.ts'
import type { Exercise, Session, SessionSummary, Template } from './types.ts'

/**
 * One function per row of the README's API table.
 *
 * Components never build URLs or remember which verb a route wants: they call
 * `sessionsApi.finish(id)`. When a route moves, it moves here only — and the
 * return types are the single place the server's shape is asserted, so a page
 * that misreads a response is a type error rather than a blank screen.
 */

export const exercisesApi = {
  list: () => api.get<Exercise[]>('/exercises'),
}

export const templatesApi = {
  list: () => api.get<Template[]>('/templates'),
}

export const sessionsApi = {
  history: (limit = 50) => api.get<SessionSummary[]>(`/sessions?limit=${limit}`),
  /** The unfinished session, or null when you are not mid-workout. */
  active: () => api.get<Session | null>('/sessions/active'),
  get: (id: string) => api.get<Session>(`/sessions/${id}`),
  /** Omit `templateId` for a freeform session. */
  start: (body: { templateId?: string; name?: string }) => api.post<Session>('/sessions', body),
  finish: (id: string) => api.post<Session>(`/sessions/${id}/finish`),
  addExercise: (id: string, exerciseId: string) =>
    api.post<Session>(`/sessions/${id}/exercises`, { exerciseId }),
}

// Child rows are addressed by their own id on flat routes — the phone already
// holds the id it is touching, so it never repeats the session id.
export const sessionExercisesApi = {
  update: (id: string, body: { done: boolean }) =>
    api.patch<Session>(`/session-exercises/${id}`, body),
  appendSet: (id: string) => api.post<Session>(`/session-exercises/${id}/sets`),
}

export const setsApi = {
  update: (id: string, body: { weight?: number | null; reps?: number | null; done?: boolean }) =>
    api.patch<Session>(`/sets/${id}`, body),
  remove: (id: string) => api.delete<Session>(`/sets/${id}`),
}
