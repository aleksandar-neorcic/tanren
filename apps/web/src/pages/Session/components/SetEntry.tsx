import { useState } from 'react'
import type { SetLog } from '@/api/types.ts'
import NumberField from './NumberField.tsx'
import { toNumber, toText } from './numberText.ts'

/**
 * The numbers for the set you are on.
 *
 * They live here as local state rather than going to the server on every tap:
 * nudging 80 to 82.5 is three taps, and three PATCHes for a number you have not
 * committed to is three chances to fail on gym wifi. One write, on Done set.
 */
export default function SetEntry({
  set,
  busy,
  onDone,
}: {
  set: SetLog
  busy: boolean
  onDone: (weight: number, reps: number) => void
}) {
  // Seeded from the set the API prefilled: the weight and reps from the last
  // time you trained this exercise, so most sets are one tap.
  const [weight, setWeight] = useState(() => toText(set.weight ?? 0, false))
  const [reps, setReps] = useState(() => toText(set.reps ?? 8, true))

  return (
    <>
      <NumberField
        label="kg"
        value={weight}
        step={2.5}
        integer={false}
        disabled={busy}
        onChange={setWeight}
      />
      <NumberField label="reps" value={reps} step={1} integer disabled={busy} onChange={setReps} />
      <button
        type="button"
        disabled={busy}
        onClick={() => onDone(toNumber(weight), Math.round(toNumber(reps)))}
        className="h-20 w-full rounded-3xl bg-lime-400 text-2xl font-black text-black uppercase disabled:opacity-50"
      >
        Done set
      </button>
    </>
  )
}
