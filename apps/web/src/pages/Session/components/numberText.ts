import { round1 } from '@/lib/format.ts'

/** The text as a number, with every unfinished or empty state reading as 0. */
export function toNumber(text: string): number {
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Reps are @IsInt() on the API, so they are rounded here rather than rejected there. */
export function toText(value: number, integer: boolean): string {
  return String(integer ? Math.round(value) : round1(value))
}
