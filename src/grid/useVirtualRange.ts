import { useLayoutEffect, useState, type RefObject } from 'react'
import { HEADER_HEIGHT, ROW_HEIGHT } from './layout'

/** Extra rows rendered above and below the viewport so fast scrolling never shows a gap. */
const OVERSCAN = 6

export type VirtualRange = { start: number; end: number }

/**
 * Works out which rows are inside the scroll viewport. Only rows in [start, end) are rendered;
 * a spacer with the full height (rowCount * ROW_HEIGHT) keeps the native scrollbar correct.
 */
export function useVirtualRange(
  viewportRef: RefObject<HTMLElement | null>,
  rowCount: number,
): VirtualRange {
  const [range, setRange] = useState<VirtualRange>({ start: 0, end: 0 })

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const update = () => {
      const first = Math.floor(viewport.scrollTop / ROW_HEIGHT)
      const visible = Math.ceil((viewport.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) + 1
      const start = Math.max(0, first - OVERSCAN)
      const end = Math.min(rowCount, first + visible + OVERSCAN)
      // Only re-render when the rendered window actually changes, not on every scrolled pixel.
      setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }

    update()
    viewport.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => {
      viewport.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [viewportRef, rowCount])

  return range
}
