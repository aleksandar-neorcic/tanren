import type { SetLog } from '@/api/types.ts'
import { CheckIcon, MinusIcon, PlusIcon } from '@/components/icons.tsx'

/** The sets already logged in this exercise, plus the − / + set controls. */
export default function SetChips({
  sets,
  busy,
  canRemove,
  onRemoveLast,
  onAppend,
}: {
  sets: SetLog[]
  busy: boolean
  canRemove: boolean
  onRemoveLast: () => void
  onAppend: () => void
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {sets
        .filter((s) => s.done)
        .map((s) => (
          <span
            key={s.id}
            className="flex items-center gap-1 rounded-full bg-lime-400/15 px-3 py-1 text-sm font-semibold text-lime-400"
          >
            <CheckIcon size={14} />
            {s.weight ?? 0} × {s.reps ?? 0}
          </span>
        ))}
      {/* Undoes a + set tap, or trims a template that planned for more sets
          than you have in you today. Only ever the last set, and only while it
          is unlogged: work you actually did should not be one mistap away from
          gone. */}
      <button
        type="button"
        aria-label="Remove the last set"
        disabled={busy || !canRemove}
        onClick={onRemoveLast}
        className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-400 disabled:opacity-40"
      >
        <MinusIcon size={14} />
        set
      </button>
      <button
        type="button"
        aria-label="Add a set"
        disabled={busy}
        onClick={onAppend}
        className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1 text-sm text-zinc-400 disabled:opacity-40"
      >
        <PlusIcon size={14} />
        set
      </button>
    </div>
  )
}
