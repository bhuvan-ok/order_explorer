import { FIELD_BY_KEY, isFieldKey, optionKey, type FieldKey } from '../fields/fields'
import { isOperatorFor, newId, type Condition, type Filter, type Operator } from '../filter/model'
import type { SortState } from '../grid/sortOrders'

/** Everything the PDF asks to keep in the URL. */
export type ViewState = {
  filter: Filter
  sort: SortState | null
  pinned: FieldKey | null
  selection: ReadonlySet<string>
}

export const DEFAULT_VIEW: ViewState = {
  filter: { groups: [] },
  sort: null,
  pinned: 'id',
  selection: new Set(),
}

/**
 * URL format (defaults are left out, so the default view has a clean URL):
 *
 *   ?v=1&f=[[["status","in",["shipped"]]],[["amount","gt",["1000"]]]]&sort=amount.desc&pin=customer&sel=12,40-55
 *
 * - v:    format version, so old links can be migrated if the format changes
 * - f:    groups -> conditions -> [field, operator, values]
 * - sort: field.asc | field.desc
 * - pin:  pinned field, or "none"
 * - sel:  numeric part of the selected order ids, sorted and compressed into ranges
 */
const VERSION = '1'
const ID_PATTERN = /^ORD-(\d+)$/
const ID_DIGITS = 7
const MAX_GROUPS = 20
const MAX_CONDITIONS = 20
const MAX_VALUE_LENGTH = 200
const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/

export function serializeViewState(view: ViewState): string {
  const params = new URLSearchParams()
  if (view.filter.groups.length > 0) {
    const compact = view.filter.groups.map((g) =>
      g.conditions.map((c) => [c.field, c.operator, c.values]),
    )
    params.set('f', JSON.stringify(compact))
  }
  if (view.sort) params.set('sort', `${view.sort.key}.${view.sort.direction}`)
  if (view.pinned !== DEFAULT_VIEW.pinned) params.set('pin', view.pinned ?? 'none')
  if (view.selection.size > 0) params.set('sel', encodeSelection(view.selection))
  if (params.size === 0) return ''
  params.set('v', VERSION)
  params.sort()
  return `?${params.toString()}`
}

export type ParseResult = { view: ViewState; errors: string[] }

/**
 * Reads the view from the URL. Never throws: if any part is broken or has bad values, the whole
 * view falls back to the default and `errors` says what was wrong, so the user is not shown a
 * half-applied view that the sender never meant.
 */
export function parseViewState(search: string, knownIds: ReadonlySet<string>): ParseResult {
  const params = new URLSearchParams(search)
  const errors: string[] = []

  const version = params.get('v')
  if (version !== null && version !== VERSION) {
    errors.push(`This link was made by a different version of the app (v=${version}).`)
  }

  const filterParam = params.get('f')
  const filter = filterParam === null ? DEFAULT_VIEW.filter : readFilter(filterParam, errors)

  const sortParam = params.get('sort')
  const sort = sortParam === null ? DEFAULT_VIEW.sort : readSort(sortParam, errors)

  const pinParam = params.get('pin')
  let pinned = DEFAULT_VIEW.pinned
  if (pinParam === 'none') pinned = null
  else if (pinParam !== null) {
    if (isFieldKey(pinParam)) pinned = pinParam
    else errors.push(`Unknown column to pin: "${pinParam}".`)
  }

  const selParam = params.get('sel')
  const selection =
    selParam === null ? DEFAULT_VIEW.selection : readSelection(selParam, knownIds, errors)

  if (errors.length > 0) return { view: DEFAULT_VIEW, errors }
  return { view: { filter, sort, pinned, selection }, errors }
}

function readFilter(text: string, errors: string[]): Filter {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    errors.push('The filter in the link could not be read.')
    return DEFAULT_VIEW.filter
  }
  if (!Array.isArray(raw) || raw.length > MAX_GROUPS) {
    errors.push('The filter in the link has an unexpected shape.')
    return DEFAULT_VIEW.filter
  }

  const groups = []
  for (const rawGroup of raw) {
    if (!Array.isArray(rawGroup) || rawGroup.length === 0 || rawGroup.length > MAX_CONDITIONS) {
      errors.push('The filter in the link has an unexpected shape.')
      return DEFAULT_VIEW.filter
    }
    const conditions: Condition[] = []
    for (const rawCondition of rawGroup) {
      const condition = readCondition(rawCondition, errors)
      if (!condition) return DEFAULT_VIEW.filter
      conditions.push(condition)
    }
    groups.push({ id: newId(), conditions })
  }
  return { groups }
}

function readCondition(raw: unknown, errors: string[]): Condition | null {
  if (!Array.isArray(raw) || raw.length !== 3) {
    errors.push('A filter condition in the link has an unexpected shape.')
    return null
  }
  const [field, operator, values] = raw as unknown[]
  if (!isFieldKey(field)) {
    errors.push(`Unknown filter field "${String(field)}".`)
    return null
  }
  const type = FIELD_BY_KEY[field].type
  if (typeof operator !== 'string' || !isOperatorFor(type, operator as Operator)) {
    errors.push(`"${String(operator)}" is not a valid operator for ${FIELD_BY_KEY[field].label}.`)
    return null
  }
  if (
    !Array.isArray(values) ||
    !values.every((v) => typeof v === 'string' && v.length <= MAX_VALUE_LENGTH)
  ) {
    errors.push(`The ${FIELD_BY_KEY[field].label} filter has invalid values.`)
    return null
  }
  if (!valuesFitType(field, values as string[])) {
    errors.push(`The ${FIELD_BY_KEY[field].label} filter has invalid values.`)
    return null
  }
  return { id: newId(), field, operator: operator as Operator, values: values as string[] }
}

/** Values must be something the UI itself could have produced for that field. */
function valuesFitType(field: FieldKey, values: string[]): boolean {
  const { type, options } = FIELD_BY_KEY[field]
  if (type === 'enum') {
    const allowed = new Set((options ?? []).map((o) => optionKey(o.value)))
    return values.every((v) => allowed.has(v)) && new Set(values).size === values.length
  }
  if (values.length > 2) return false
  if (type === 'number') return values.every((v) => v === '' || Number.isFinite(Number(v)))
  if (type === 'date') {
    return values.every(
      (v) => v === '' || (DATE_INPUT.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`))),
    )
  }
  return true
}

function readSort(text: string, errors: string[]): SortState | null {
  const [key, direction, ...rest] = text.split('.')
  if (rest.length === 0 && isFieldKey(key) && (direction === 'asc' || direction === 'desc')) {
    return { key, direction }
  }
  errors.push(`The sort "${text}" is not valid.`)
  return null
}

/** [1, 2, 3, 5, 7, 8] -> "1-3,5,7-8" */
export function encodeSelection(ids: ReadonlySet<string>): string {
  const numbers = [...ids]
    .map((id) => Number(ID_PATTERN.exec(id)?.[1]))
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
  const parts: string[] = []
  let i = 0
  while (i < numbers.length) {
    let j = i
    while (j + 1 < numbers.length && numbers[j + 1] === numbers[j] + 1) j++
    parts.push(i === j ? `${numbers[i]}` : `${numbers[i]}-${numbers[j]}`)
    i = j + 1
  }
  return parts.join(',')
}

function readSelection(
  text: string,
  knownIds: ReadonlySet<string>,
  errors: string[],
): ReadonlySet<string> {
  const selection = new Set<string>()
  for (const part of text.split(',')) {
    const match = /^(\d+)(?:-(\d+))?$/.exec(part)
    const from = Number(match?.[1])
    const to = Number(match?.[2] ?? match?.[1])
    // The size check also stops a link like "1-999999999" from looping a billion times.
    if (!match || to < from || selection.size + (to - from) >= knownIds.size) {
      errors.push('The selected orders in the link could not be read.')
      return DEFAULT_VIEW.selection
    }
    for (let n = from; n <= to; n++) {
      const id = `ORD-${String(n).padStart(ID_DIGITS, '0')}`
      if (!knownIds.has(id)) {
        errors.push(`The link selects an order that does not exist (${id}).`)
        return DEFAULT_VIEW.selection
      }
      selection.add(id)
    }
  }
  return selection
}
