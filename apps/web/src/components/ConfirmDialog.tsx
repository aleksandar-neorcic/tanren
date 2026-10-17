import { useEffect, useRef } from 'react'

interface Props {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  /** Must be stable (useCallback) — the Escape listener depends on it. */
  onCancel: () => void
}

/**
 * A destructive "are you sure", for anything that cannot be undone.
 *
 * Fixed to the viewport rather than rendered inline where it was triggered: an
 * inline panel appears wherever the button happens to be, so on a scrolled page
 * the warning can open below the fold and go unread. A confirmation you have to
 * go looking for is not a confirmation.
 *
 * Bottom sheet on a phone, where the thumb is; centred on a PC, where the eye is.
 */
export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Focus lands on Cancel, never on the destructive button: a stray Enter or
    // Space should dismiss this, not go through with it.
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    // On document, not on the dialog: Escape has to work wherever focus is.
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  useEffect(() => {
    // Freeze the page behind. It is covered and unusable, so letting it scroll
    // only moves content nobody can act on — and on a phone it is what makes an
    // overlay feel like a stuck page rather than a dialog.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center"
    >
      {/* A sibling of the panel, not its parent, so a tap on the panel cannot
          bubble out to it and dismiss the dialog. */}
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative mx-auto w-full max-w-md rounded-t-3xl border border-zinc-800 bg-zinc-950 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:rounded-3xl md:pb-5">
        <h2 id="confirm-dialog-title" className="text-lg font-black uppercase tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">{body}</p>
        <div className="mt-5 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-12 flex-1 rounded-2xl bg-zinc-800 font-bold text-white disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="h-12 flex-1 rounded-2xl bg-red-500 font-bold text-white disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
