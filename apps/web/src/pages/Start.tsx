import { useState } from 'react'
import { Link, useLoaderData, useNavigate } from 'react-router'
import { ApiError, errorMessage } from '@/api/client.ts'
import { sessionsApi, templatesApi } from '@/api/endpoints.ts'
import type { Session, SessionSummary, Template } from '@/api/types.ts'
import { ChevronRightIcon, PlusIcon } from '@/components/icons.tsx'
import { formatElapsed, formatShortDate } from '@/lib/format.ts'
import { useNow } from '@/lib/useNow.ts'

interface StartData {
  templates: Template[]
  active: Session | null
  /** Template id -> when it was last trained, for the "last Oct 7" hint. */
  lastTrained: Record<string, string>
}

/**
 * Runs before the page renders, so there is no flash of an empty screen and no
 * `useEffect` fetch to clean up. Three independent reads, so they go out
 * together: Promise.all makes the page as slow as the slowest one, not the sum.
 */
export async function loader(): Promise<StartData> {
  const [templates, active, history] = await Promise.all([
    templatesApi.list(),
    sessionsApi.active(),
    sessionsApi.history(),
  ])
  return { templates, active, lastTrained: lastTrainedByTemplate(history) }
}

export default function Start() {
  // useLoaderData cannot know which route it was called from, so the type comes
  // from us. It is the value `loader` resolved to, already parsed.
  const { templates, active, lastTrained } = useLoaderData() as StartData
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const now = useNow(active !== null)

  async function start(body: { templateId?: string }) {
    setBusy(true)
    setError(null)
    try {
      const session = await sessionsApi.start(body)
      navigate(`/session/${session.id}`)
    } catch (e) {
      // 409: a workout is already running — another tab, or an app closed
      // mid-session. The id rides along on the error, so the right answer is to
      // take you there rather than to explain the problem.
      if (e instanceof ApiError && e.activeSessionId) {
        navigate(`/session/${e.activeSessionId}`)
        return
      }
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    // The phone is the design target; on PC the column is capped so the cards
    // do not stretch across a monitor.
    <div className="max-w-xl">
      {/* On phone the layout already shows the wordmark above this. */}
      <h1 className="mb-5 hidden text-3xl font-black uppercase tracking-tight md:block">Start</h1>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}

      {active && (
        <Link
          to={`/session/${active.id}`}
          className="mb-5 block rounded-2xl bg-lime-400 p-4 text-black"
        >
          <div className="text-xs uppercase tracking-widest opacity-80">Active session</div>
          <div className="flex items-end justify-between">
            <div className="text-xl font-bold">
              {active.name} · <span className="tabular-nums">{formatElapsed(active.startedAt, now)}</span>
            </div>
            <div className="font-bold">Resume ›</div>
          </div>
        </Link>
      )}

      <button
        type="button"
        onClick={() => start({})}
        // Starting a second one would only bounce off the server's 409. The
        // banner above is the way back into the workout you already have.
        disabled={busy || active !== null}
        className="mb-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 text-lg font-bold text-white disabled:opacity-40"
      >
        <PlusIcon size={20} />
        Start empty
      </button>

      <h2 className="mb-3 text-sm uppercase tracking-widest text-zinc-500">Templates</h2>

      {templates.length === 0 ? (
        <p className="rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-500">
          No templates yet.{' '}
          <Link to="/templates" className="font-semibold text-lime-400">
            Make one
          </Link>{' '}
          and it shows up here.
        </p>
      ) : (
        templates.map((template) => {
          const last = lastTrained[template.id]
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => start({ templateId: template.id })}
              disabled={busy || active !== null}
              className="mb-3 flex w-full items-center justify-between rounded-2xl bg-zinc-900 p-4 text-left disabled:opacity-40"
            >
              <span>
                <span className="block text-xl font-black uppercase tracking-tight">
                  {template.name}
                </span>
                <span className="block text-sm text-zinc-500">
                  {countLabel(template.exercises.length, 'exercise', 'exercises')}
                  {last ? ` · last ${formatShortDate(last)}` : ''}
                </span>
              </span>
              <ChevronRightIcon className="shrink-0 text-lime-400" size={22} />
            </button>
          )
        })
      )}
    </div>
  )
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

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}
