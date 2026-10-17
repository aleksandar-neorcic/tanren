import { Link, useRouteError } from 'react-router'
import { ApiError } from '../api/client.ts'

/**
 * What a route shows when its loader throws, or when a component below it
 * crashes. Wired up as `errorElement` in routes.tsx.
 *
 * Without one, React Router renders its own stack-trace page: fine on a laptop,
 * useless when you are holding a phone in a gym. This says what broke and
 * offers the one action that ever helps — try again.
 */
export default function RouteError() {
  const error = useRouteError()

  const title =
    error instanceof ApiError && error.offline ? 'API unreachable' : 'Something broke'
  const detail =
    error instanceof Error ? error.message : 'An unexpected error stopped this page loading.'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-black uppercase tracking-tight">{title}</h1>
      <p className="max-w-sm text-sm text-zinc-500">{detail}</p>
      <div className="flex gap-3">
        <button
          type="button"
          // A hard reload, not a router navigation: the router has already
          // decided this route is in an error state, and re-running the loader
          // from here means re-mounting the whole app anyway.
          onClick={() => window.location.reload()}
          className="h-12 rounded-full bg-lime-400 px-6 font-bold text-black"
        >
          Try again
        </button>
        <Link
          to="/"
          className="flex h-12 items-center rounded-full border border-zinc-800 px-6 font-bold text-zinc-300"
        >
          Start
        </Link>
      </div>
    </div>
  )
}
