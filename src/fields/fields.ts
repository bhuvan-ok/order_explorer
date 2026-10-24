import { CHANNELS, PAYMENT_METHODS, REGIONS, STATUSES, type Order } from '../data/types'
import { capitalize, EMPTY, formatAmount, formatCount, formatDateTime } from '../format/format'

export type FieldKey =
  | 'id'
  | 'customer'
  | 'email'
  | 'status'
  | 'amount'
  | 'createdAt'
  | 'updatedAt'
  | 'region'
  | 'channel'
  | 'priority'
  | 'paymentMethod'
  | 'itemCount'
  | 'notes'

export type FieldType = 'text' | 'number' | 'date' | 'enum'
export type EnumValue = string | number | null
export type EnumOption = { value: EnumValue; label: string }

/**
 * One entry per column. The grid, filter builder, chips and CSV export all read this list,
 * so a field's label, type, options and formatting are defined in exactly one place.
 */
export type Field = {
  key: FieldKey
  label: string
  type: FieldType
  /** Default column width in px. */
  width: number
  align: 'left' | 'right'
  /** Text shown in a grid cell. */
  display: (order: Order) => string
  /** Value used for sorting; null always sorts last. */
  sortValue: (order: Order) => string | number | null
  /** Allowed values for enum fields. */
  options?: EnumOption[]
}

const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: capitalize(value) }))
const REGION_OPTIONS = REGIONS.map((value) => ({ value, label: capitalize(value) }))
const CHANNEL_OPTIONS = CHANNELS.map((value) => ({ value, label: capitalize(value) }))
const PAYMENT_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  cod: 'COD',
  wallet: 'Wallet',
}
const PAYMENT_OPTIONS = PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_LABELS[value] }))
const PRIORITY_OPTIONS: EnumOption[] = [
  { value: 1, label: '1 – High' },
  { value: 2, label: '2 – Medium' },
  { value: 3, label: '3 – Low' },
  { value: null, label: 'None' },
]

function labeller(options: EnumOption[]) {
  const labels = new Map(options.map((option) => [option.value, option.label]))
  return (value: EnumValue) => labels.get(value) ?? String(value)
}

const statusLabel = labeller(STATUS_OPTIONS)
const regionLabel = labeller(REGION_OPTIONS)
const channelLabel = labeller(CHANNEL_OPTIONS)
const paymentLabel = labeller(PAYMENT_OPTIONS)
const priorityLabel = labeller(PRIORITY_OPTIONS)

const orEmpty = (text: string) => text || EMPTY

export const FIELDS: Field[] = [
  {
    key: 'id',
    label: 'ID',
    type: 'text',
    width: 112,
    align: 'left',
    display: (o) => o.id,
    sortValue: (o) => o.id,
  },
  {
    key: 'customer',
    label: 'Customer',
    type: 'text',
    width: 150,
    align: 'left',
    display: (o) => orEmpty(o.customer),
    sortValue: (o) => o.customer || null,
  },
  {
    key: 'email',
    label: 'Email',
    type: 'text',
    width: 230,
    align: 'left',
    display: (o) => orEmpty(o.email),
    sortValue: (o) => o.email || null,
  },
  {
    key: 'status',
    label: 'Status',
    type: 'enum',
    width: 104,
    align: 'left',
    options: STATUS_OPTIONS,
    display: (o) => statusLabel(o.status),
    sortValue: (o) => statusLabel(o.status),
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'number',
    width: 124,
    align: 'right',
    display: (o) => formatAmount(o.amount),
    sortValue: (o) => o.amount,
  },
  {
    key: 'createdAt',
    label: 'Created (UTC)',
    type: 'date',
    width: 140,
    align: 'left',
    display: (o) => formatDateTime(o.createdAt),
    sortValue: (o) => o.createdAt,
  },
  {
    key: 'updatedAt',
    label: 'Updated (UTC)',
    type: 'date',
    width: 140,
    align: 'left',
    display: (o) => formatDateTime(o.updatedAt),
    sortValue: (o) => o.updatedAt,
  },
  {
    key: 'region',
    label: 'Region',
    type: 'enum',
    width: 100,
    align: 'left',
    options: REGION_OPTIONS,
    display: (o) => regionLabel(o.region),
    sortValue: (o) => regionLabel(o.region),
  },
  {
    key: 'channel',
    label: 'Channel',
    type: 'enum',
    width: 96,
    align: 'left',
    options: CHANNEL_OPTIONS,
    display: (o) => channelLabel(o.channel),
    sortValue: (o) => channelLabel(o.channel),
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'enum',
    width: 100,
    align: 'left',
    options: PRIORITY_OPTIONS,
    display: (o) => priorityLabel(o.priority),
    sortValue: (o) => o.priority,
  },
  {
    key: 'paymentMethod',
    label: 'Payment',
    type: 'enum',
    width: 112,
    align: 'left',
    options: PAYMENT_OPTIONS,
    display: (o) => paymentLabel(o.paymentMethod),
    sortValue: (o) => paymentLabel(o.paymentMethod),
  },
  {
    key: 'itemCount',
    label: 'Items',
    type: 'number',
    width: 76,
    align: 'right',
    display: (o) => formatCount(o.itemCount),
    sortValue: (o) => o.itemCount,
  },
  {
    key: 'notes',
    label: 'Notes',
    type: 'text',
    width: 320,
    align: 'left',
    display: (o) => orEmpty(o.notes),
    sortValue: (o) => o.notes || null,
  },
]

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<
  FieldKey,
  Field
>

export function isFieldKey(value: unknown): value is FieldKey {
  return typeof value === 'string' && value in FIELD_BY_KEY
}
