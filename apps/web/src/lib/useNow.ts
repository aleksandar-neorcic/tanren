import { useEffect, useState } from 'react'

/**
 * A clock that re-renders the component once a second, or a frozen one when
 * `running` is false (a finished session has nothing left to count).
 *
 * The interval lives in an effect because it is a side effect that outlives a
 * render: React calls the returned function on unmount and before every re-run,
 * and without it a tab left on the Start page would keep a timer alive for every
 * session it ever showed.
 */
export function useNow(running = true): number {
  // The initialiser is a function so Date.now() is called once, on mount,
  // instead of on every render only to be thrown away.
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [running])

  return now
}
