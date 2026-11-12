import { QueryClient } from '@tanstack/react-query'

/**
 * The app's single React Query cache.
 *
 * It lives in its own module rather than inside `main.tsx` so a test can build a
 * provider around the same configuration the app runs with — a test that quietly
 * uses different defaults (no retries, no stale time) is testing a different app.
 *
 * The defaults deliberately differ from a desktop dashboard's, because this one
 * is used on a phone on gym wifi:
 *
 * - retries stay on. A dropped request mid-workout is the common case here, not
 *   an exception, and one silent retry is better than an error strip over a set
 *   you already did.
 * - refetching on reconnect stays on for the same reason: the phone comes back
 *   from a dead spot and the screen should catch up by itself.
 * - refetching on window focus is off. On a phone every glance at the screen is
 *   a focus event, and the session screen already holds the server's own reply
 *   to every mutation, so there is nothing to catch up to.
 * - `staleTime` is 30s, not 0, so moving between History and Templates does not
 *   refetch lists that cannot have changed — this is a single-user app and you
 *   are the only one writing to it.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})
