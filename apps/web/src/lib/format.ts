/**
 * Display formatting. These are pure functions on purpose: none of them reads
 * the clock, so a component decides when "now" is and they stay trivial to
 * reason about (and, later, to test).
 */

/**
 * Elapsed workout time as mm:ss, growing to h:mm:ss past the hour.
 *
 * `now` is a parameter rather than a `Date.now()` call inside, because the
 * ticking belongs to the component — see the interval in Session.tsx.
 */
export function formatElapsed(startedAt: string, now: number): string {
  const total = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  const seconds = total % 60
  const minutes = Math.floor(total / 60) % 60
  const hours = Math.floor(total / 3600)

  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** "Oct 7" — the form the mockups use for a last-trained hint. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Trim float noise: 2.5kg steps add up to 77.50000000000001 otherwise. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}
