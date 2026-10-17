import { useEffect } from 'react'

/**
 * Freeze the page behind an overlay for as long as the component is mounted.
 *
 * An overlay is `fixed`, so it stays put while the page behind it keeps
 * scrolling — the background slides around under a sheet you cannot scroll,
 * which reads as a stuck page rather than a dialog.
 *
 * The padding is not cosmetic: hiding the overflow removes the scrollbar, and
 * on a PC that widens the viewport and shifts the whole page sideways as the
 * overlay opens. Replacing the scrollbar's width with padding holds it still.
 */
export function useScrollLock() {
  useEffect(() => {
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight

    // innerWidth counts the scrollbar, clientWidth does not. The difference is
    // the gutter about to disappear. Zero on a phone and on overlay scrollbars.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbar > 0) {
      body.style.paddingRight = `${scrollbar}px`
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [])
}
