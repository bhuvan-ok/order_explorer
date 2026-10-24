// Fixed value sets from data-notes.md. Stored in one canonical casing;
// display labels are a formatting concern and live elsewhere.
export const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export const REGIONS = ['NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NORTHEAST'] as const
export const CHANNELS = ['web', 'app', 'phone', 'store'] as const
export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'cod', 'wallet'] as const
export const PRIORITIES = [1, 2, 3] as const

export type Status = (typeof STATUSES)[number]
export type Region = (typeof REGIONS)[number]
export type Channel = (typeof CHANNELS)[number]
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type Priority = (typeof PRIORITIES)[number]

/** A record exactly as it appears in orders.json (shapes differ between schema versions). */
export type RawOrder = {
  id?: unknown
  schemaVersion?: unknown
  customerName?: unknown
  customer_name?: unknown
  customerEmail?: unknown
  status?: unknown
  amount?: unknown
  currency?: unknown
  createdAt?: unknown
  updatedAt?: unknown
  region?: unknown
  channel?: unknown
  priority?: unknown
  paymentMethod?: unknown
  itemCount?: unknown
  notes?: unknown
}

/** A cleaned record. Everything after normalization works only with this shape. */
export type Order = {
  id: string
  schemaVersion: 1 | 2
  customer: string
  email: string
  status: Status
  /** Always in rupees, rounded to paise. */
  amount: number
  currency: string
  /** Epoch milliseconds (UTC). */
  createdAt: number
  /** Epoch milliseconds (UTC); null when the source value was null or missing. */
  updatedAt: number | null
  region: Region
  channel: Channel
  paymentMethod: PaymentMethod
  /** null means the source had no priority ("None"). */
  priority: Priority | null
  itemCount: number
  /** Plain text; '' when the source was null or empty. Never rendered as HTML. */
  notes: string
}
