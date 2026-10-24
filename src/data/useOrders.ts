import { useCallback, useEffect, useState } from 'react'
import { normalizeOrders } from './normalize'
import type { Order } from './types'

export type OrdersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; orders: Order[] }

const ORDERS_URL = `${import.meta.env.BASE_URL}orders.json`

/**
 * Fetches orders.json from the static folder at runtime (instead of bundling it), so the page
 * can render a loading state immediately and the 17 MB file is cached separately from the code.
 */
export function useOrders() {
  const [state, setState] = useState<OrdersState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetch(ORDERS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`The server answered ${response.status}.`)
        return response.json() as Promise<unknown>
      })
      .then((json) => {
        if (!Array.isArray(json)) throw new Error('The file does not contain a list of orders.')
        const { orders, skipped } = normalizeOrders(json)
        if (skipped > 0) console.warn(`Skipped ${skipped} unreadable order records.`)
        setState({ status: 'ready', orders })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Unknown error.'
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, retry }
}
