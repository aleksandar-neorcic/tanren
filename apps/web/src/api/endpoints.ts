import { api } from './client.ts'
import type {
  Exercise,
  ExerciseInput,
  ExerciseUpdate,
  Session,
  SessionSummary,
  Template,
  TemplateInput,
} from './types.ts'

/**
 * One function per row of the README's API table.
 *
 * Components never build URLs or remember which verb a route wants: they call
 * `sessionsApi.finish(id)`. When a route moves, it moves here only — and the
 * return types are the single place the server's shape is asserted, so a page
 * that misreads a response is a type error rather than a blank screen.
 */

export const exercisesApi = {
  /** Active exercises only by default — archived ones are opt-in. */
  list: (includeArchived = false) =>
    api.get<Exercise[]>(`/exercises${includeArchived ? '?includeArchived=true' : ''}`),
  create: (body: ExerciseInput) => api.post<Exercise>('/exercises', body),
  /** `PATCH`, so an omitted field is left alone and `null` clears it. */
  update: (id: string, body: ExerciseUpdate) => api.patch<Exercise>(`/exercises/${id}`, body),
  /** Soft-archive. Restore is `update(id, { archived: false })`, not an endpoint. */
  archive: (id: string) => api.delete<Exercise>(`/exercises/${id}`),
}

export const templatesApi = {
  list: () => api.get<Template[]>('/templates'),
  get: (id: string) => api.get<Template>(`/templates/${id}`),
  create: (body: TemplateInput) => api.post<Template>('/templates', body),
  /**
   * `PUT`, not `PATCH`: the server replaces the whole template in one nested
   * write, so an omitted field means "clear it" rather than "leave it". The
   * editor always sends the complete template it is holding.
   */
  update: (id: string, body: TemplateInput) => api.put<Template>(`/templates/${id}`, body),
  /** Hard delete. Sessions keep their history — the FK is `onDelete: SetNull`. */
  remove: (id: string) => api.delete<void>(`/templates/${id}`),
}

export const sessionsApi = {
  history: (limit = 50) => api.get<SessionSummary[]>(`/sessions?limit=${limit}`),
  /** The unfinished session, or null when you are not mid-workout. */
  active: () => api.get<Session | null>('/sessions/active'),
  get: (id: string) => api.get<Session>(`/sessions/${id}`),
  /** Omit `templateId` for a freeform session. */
  start: (body: { templateId?: string; name?: string }) => api.post<Session>('/sessions', body),
  finish: (id: string) => api.post<Session>(`/sessions/${id}/finish`),
  /** Hard delete, cascading to its exercises and sets. There is no undo. */
  remove: (id: string) => api.delete<void>(`/sessions/${id}`),
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
