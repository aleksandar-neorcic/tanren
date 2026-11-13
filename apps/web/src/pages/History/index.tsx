import { formatShortDate, formatVolume, formatWeekday } from '@/lib/format.ts'
import useHistory from './hooks/useHistory.ts'
import { errorMessage } from '@/api/client.ts'
import Loading from '@/components/Loading.tsx'
import { useNow } from '@/lib/useNow.ts'

export default function History() {
  const { sessions, error } = useHistory()
  // A clock read once, on mount: a 7-day window has nothing to tick for.
  const now = useNow(false)

  if (error) {
    return (
      <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {errorMessage(error)}
      </p>
    )
  }

  if (!sessions) return <Loading />

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000
  const thisWeek = sessions.filter((session) => Date.parse(session.startedAt) >= weekAgo)
  const weekVolume = thisWeek.reduce((total, session) => total + session.volume, 0)

  return (
    <div className="max-w-xl md:max-w-3xl">
      <h1 className="text-3xl font-black tracking-tight uppercase">History</h1>
      <p className="mt-1 text-sm text-zinc-500">
        This week {thisWeek.length} {thisWeek.length === 1 ? 'session' : 'sessions'} ·{' '}
        {formatVolume(weekVolume)} kg
      </p>

      {sessions.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-500">
          No sessions yet. Finish a workout and it shows up here.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {sessions.map((session) => {
            const live = session.finishedAt === null

            return (
              <div
                key={session.id}
                className={[
                  'flex items-center gap-4 rounded-2xl bg-zinc-900 p-4',
                  live ? 'ring-2 ring-lime-400/70' : '',
                ].join(' ')}
              >
                <div className="w-12 shrink-0 text-center">
                  <div className="text-xs text-zinc-500">{formatWeekday(session.startedAt)}</div>
                  <div className="font-bold">{formatShortDate(session.startedAt)}</div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-black tracking-tight uppercase">
                    {session.name}
                  </div>
                  <div className="text-sm text-zinc-500">
                    {live ? (
                      <span className="text-lime-400">In progress</span>
                    ) : (
                      `${session.setCount} sets`
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold tabular-nums text-lime-400">
                    {formatVolume(session.volume)}
                  </div>
                  <div className="text-xs text-zinc-500">kg volume</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
