/**
 * The only place in the web app that touches the network.
 *
 * Every call goes through `request`, so there is one answer to "what counts as
 * an error", "where does the base URL come from" and "how do we read a Nest
 * error body" — rather than one answer per component.
 */

// Vite proxies /api to Nest (vite.config.ts), so the browser only ever talks to
// its own origin. That is what lets the phone load the app over the LAN without
// a second port being reachable, and it sidesteps CORS entirely.
const BASE_URL = '/api'

/**
 * A request that failed: either the API answered with a non-2xx status, or it
 * never answered at all (`status: 0`).
 *
 * A class rather than a plain object, so `catch` blocks can ask `instanceof`
 * instead of sniffing at shapes.
 */
export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    // Subclassing Error does not set this for you; without it `name` stays
    // "Error" and every logged failure looks alike.
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }

  /** No reply at all: the API is down, or the phone dropped off the gym wifi. */
  get offline(): boolean {
    return this.status === 0
  }

  /**
   * `POST /sessions` answers 409 with the id of the session already in progress
   * (see sessions.service.ts). Reading it here keeps that contract in one place
   * instead of in every component that starts a workout.
   */
  get activeSessionId(): string | null {
    if (this.body && typeof this.body === 'object' && 'activeSessionId' in this.body) {
      const id = (this.body as { activeSessionId: unknown }).activeSessionId
      if (typeof id === 'string') return id
    }
    return null
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(BASE_URL + path, {
      method,
      // Only when there is something to describe: a bodyless POST carrying this
      // header makes Nest's body parser hand the controller `{}`.
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    // fetch rejects only when there was no reply at all. A 404 or a 500 is a
    // perfectly successful fetch — the check for those is below.
    throw new ApiError(0, 'Could not reach the API — is it running?', cause)
  }

  const payload = await readBody(response)

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(payload) ?? response.statusText, payload)
  }

  return payload as T
}

/**
 * `response.json()` throws on an empty body, and `GET /sessions/active` returns
 * a legitimate `null`, so the body is read as text first and parsed by hand.
 */
async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (text === '') return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    // A proxy error page, or plain text. Keep the raw string: it is the only
    // true thing left to put in a message.
    return text
  }
}

/** Dig the human-readable line out of a Nest error body. */
function messageFrom(payload: unknown): string | null {
  if (typeof payload === 'string' && payload !== '') return payload
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message
    // The global ValidationPipe reports every broken rule at once, so `message`
    // is an array whenever it is the one rejecting the request.
    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string' && message !== '') return message
  }
  return null
}

export const api = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T,>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T,>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T,>(path: string) => request<T>('DELETE', path),
}

/** Turn any thrown value into something worth putting on screen. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error) return e.message
  return 'Something went wrong'
}
