import type { FieldKey } from '../fields/fields'

/**
 * The focused cell. The column is stored by key (not position) so it stays on the same field
 * when another column is pinned and the columns move.
 */
export type ActiveCell = { row: number; col: FieldKey }

/**
 * Where a navigation key moves the focused cell, or null if the key is not a navigation key.
 * Arrows move one cell, PageUp/PageDown one screen, Home/End to the first/last column,
 * Ctrl+Home/Ctrl+End to the first/last cell of the grid.
 */
export function nextActiveCell(
  key: string,
  ctrlKey: boolean,
  active: ActiveCell,
  columns: readonly FieldKey[],
  rowCount: number,
  pageSize: number,
): ActiveCell | null {
  if (rowCount === 0 || columns.length === 0) return null
  const lastRow = rowCount - 1
  const col = Math.max(0, columns.indexOf(active.col))
  const row = (r: number) => Math.max(0, Math.min(lastRow, r))
  const column = (c: number) => columns[Math.max(0, Math.min(columns.length - 1, c))]

  switch (key) {
    case 'ArrowUp':
      return { row: row(active.row - 1), col: active.col }
    case 'ArrowDown':
      return { row: row(active.row + 1), col: active.col }
    case 'ArrowLeft':
      return { row: active.row, col: column(col - 1) }
    case 'ArrowRight':
      return { row: active.row, col: column(col + 1) }
    case 'PageUp':
      return { row: row(active.row - pageSize), col: active.col }
    case 'PageDown':
      return { row: row(active.row + pageSize), col: active.col }
    case 'Home':
      return ctrlKey ? { row: 0, col: columns[0] } : { row: active.row, col: columns[0] }
    case 'End':
      return ctrlKey
        ? { row: lastRow, col: column(columns.length - 1) }
        : { row: active.row, col: column(columns.length - 1) }
    default:
      return null
  }
}
