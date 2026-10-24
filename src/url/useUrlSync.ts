import { useEffect, useRef } from 'react'
import { serializeViewState, type ViewState } from './urlState'

/**
 * At most one URL write per this many ms. Safari rejects more than ~100 history updates per
 * 10 s, which fast typing in a filter could otherwise hit.
 */
const MIN_INTERVAL_MS = 200

/**
 * Mirrors the view state into the address bar. React state stays the source of truth; the URL is
 * a copy. A change is written at once (so a refresh straight after a click keeps it), and rapid
 * changes such as typing are throttled, with the last one always written.
 * replaceState (not pushState) is used so Back does not step through every keystroke.
 */
export function useUrlSync(view: ViewState) {
  const lastWrite = useRef(0)

  useEffect(() => {
    const url = `${window.location.pathname}${serializeViewState(view)}${window.location.hash}`
    const write = () => {
      lastWrite.current = Date.now()
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (url !== current) window.history.replaceState(window.history.state, '', url)
    }
    const wait = lastWrite.current + MIN_INTERVAL_MS - Date.now()
    if (wait <= 0) {
      write()
      return
    }
    const timer = window.setTimeout(write, wait)
    return () => window.clearTimeout(timer)
  }, [view])
}
