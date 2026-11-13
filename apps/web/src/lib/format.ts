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

/**
 * "Wed" — the weekday line the history rows stack above the date.
 *
 * Separate from `formatShortDate` rather than an option on it: the two are
 * rendered as two lines in two different sizes, so a caller always wants one
 * or the other, never a single string holding both.
 */
export function formatWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' })
}

/**
 * "7,840" — a kg volume with thousands separators and no decimals.
 *
 * Volume is a sum of `weight x reps`, so 2.5kg plates leave float noise behind
 * (see `round1`). Nobody lifts a tenth of a kilo, so the fraction is dropped
 * here rather than rounded upstream — the number stays exact in the API and
 * only the display is tidy.
 */
export function formatVolume(kg: number): string {
  return kg.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/** Trim float noise: 2.5kg steps add up to 77.50000000000001 otherwise. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10
}
