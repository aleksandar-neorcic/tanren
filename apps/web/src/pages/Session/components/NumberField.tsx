import { MinusIcon, PlusIcon } from '@/components/icons.tsx'
import { toNumber, toText } from './numberText.ts'

/**
 * The big number, with − / + on either side. One per value, so weight and reps
 * share the code.
 *
 * The number is an input, not a label: nudging from 0 to 100kg is forty taps,
 * and the steppers are for adjusting what is already roughly right.
 *
 * `value` is the text, not a number. A field being typed into passes through
 * "" and "2." on its way to "2.5", and neither of those is a number — holding
 * a number here would mean fighting the user's own keystrokes.
 */
export default function NumberField({
  label,
  value,
  step,
  integer,
  disabled,
  onChange,
}: {
  label: string
  value: string
  step: number
  integer: boolean
  disabled: boolean
  onChange: (next: string) => void
}) {
  const current = toNumber(value)

  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-3xl bg-zinc-900 p-3">
      <button
        type="button"
        aria-label={`Less ${label}`}
        disabled={disabled || current <= 0}
        onClick={() => onChange(toText(Math.max(0, current - step), integer))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <MinusIcon size={28} />
      </button>

      {/* A <label>, so a tap anywhere in the middle lands in the input instead
          of in the gap between two digits. */}
      <label className="min-w-0 flex-1 text-center">
        <input
          // Not type="number": that brings spinner arrows, changes the value on
          // a stray scroll wheel, and reports "2." as empty while you are still
          // typing "2.5". inputMode gets the phone's number pad without any of
          // that, and the parsing below is ours either way.
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          enterKeyHint="done"
          aria-label={label}
          value={value}
          disabled={disabled}
          // Tap the number and type: the old value is replaced rather than
          // appended to, so 80 → 100 is three keystrokes and no backspacing.
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(sanitize(e.target.value, integer))}
          // Tidy up only once you leave: "" becomes "0", "100." becomes "100".
          onBlur={() => onChange(toText(current, integer))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className={[
            'w-full bg-transparent text-center font-black leading-none tabular-nums caret-lime-400 outline-none disabled:opacity-40',
            // Long values would otherwise run under the +/− buttons.
            value.length > 4 ? 'text-6xl' : 'text-7xl',
          ].join(' ')}
        />
        <span className="mt-1 block text-sm tracking-widest text-zinc-500 uppercase">{label}</span>
      </label>

      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={disabled}
        onClick={() => onChange(toText(current + step, integer))}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 active:bg-zinc-700 disabled:opacity-40"
      >
        <PlusIcon size={28} />
      </button>
    </div>
  )
}

/** Drop anything that could never become a number, mid-keystroke included. */
function sanitize(raw: string, integer: boolean): string {
  const cleaned = raw.replace(integer ? /[^0-9]/g : /[^0-9.]/g, '')
  if (integer) return cleaned
  // At most one decimal point — the first one typed wins.
  const [head, ...rest] = cleaned.split('.')
  return rest.length > 0 ? `${head}.${rest.join('')}` : head
}
