import type { CSSProperties } from 'react'
import { FIELDS, type Field, type FieldKey } from '../fields/fields'

/** Fixed row height keeps virtualization O(1): row i always starts at i * ROW_HEIGHT. */
export const ROW_HEIGHT = 28
export const HEADER_HEIGHT = 32
export const MIN_COLUMN_WIDTH = 56
export const MAX_COLUMN_WIDTH = 800

export type ColumnWidths = Record<FieldKey, number>

export const DEFAULT_WIDTHS = Object.fromEntries(
  FIELDS.map((f) => [f.key, f.width]),
) as ColumnWidths

/** The pinned column is moved to the front so it can stick to the left edge. */
export function orderColumns(pinned: FieldKey | null): Field[] {
  if (!pinned) return FIELDS
  return [...FIELDS.filter((f) => f.key === pinned), ...FIELDS.filter((f) => f.key !== pinned)]
}

/**
 * Column widths are exposed as CSS variables on the grid root. Resizing a column only changes
 * these variables, so the (memoized) rows do not need to re-render while dragging.
 */
export function widthVariables(columns: Field[], widths: ColumnWidths): CSSProperties {
  const vars: Record<string, string> = {}
  let total = 0
  for (const column of columns) {
    vars[`--col-${column.key}`] = `${widths[column.key]}px`
    total += widths[column.key]
  }
  vars['--grid-width'] = `${total}px`
  return vars as CSSProperties
}

export const columnWidth = (key: FieldKey) => `var(--col-${key})`
