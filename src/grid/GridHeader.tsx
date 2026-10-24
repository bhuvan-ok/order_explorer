import type { PointerEvent } from 'react'
import type { Field, FieldKey } from '../fields/fields'
import styles from './DataGrid.module.css'
import { columnWidth, type ColumnWidths } from './layout'
import type { SortState } from './sortOrders'

type Props = {
  columns: Field[]
  widths: ColumnWidths
  sort: SortState | null
  pinned: FieldKey | null
  onSort: (key: FieldKey) => void
  onPin: (key: FieldKey | null) => void
  onResize: (key: FieldKey, width: number) => void
  onResetWidth: (key: FieldKey) => void
}

export function GridHeader({
  columns,
  widths,
  sort,
  pinned,
  onSort,
  onPin,
  onResize,
  onResetWidth,
}: Props) {
  function startResize(event: PointerEvent<HTMLDivElement>, key: FieldKey) {
    event.preventDefault()
    const handle = event.currentTarget
    const startX = event.clientX
    const startWidth = widths[key]
    // Pointer capture keeps the drag going when the cursor leaves the thin handle.
    handle.setPointerCapture(event.pointerId)

    const move = (e: globalThis.PointerEvent) => onResize(key, startWidth + e.clientX - startX)
    const stop = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  return (
    <div role="row" aria-rowindex={1} className={styles.header}>
      {columns.map((column) => {
        const sorted = sort?.key === column.key ? sort.direction : null
        const isPinned = column.key === pinned
        const classes = [styles.headerCell]
        if (column.align === 'right') classes.push(styles.right)
        if (isPinned) classes.push(styles.pinned)
        return (
          <div
            key={column.key}
            role="columnheader"
            aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
            className={classes.join(' ')}
            style={{ width: columnWidth(column.key) }}
          >
            <button
              type="button"
              className={styles.sortButton}
              onClick={() => onSort(column.key)}
              title={`Sort by ${column.label}`}
            >
              <span className={styles.headerLabel}>{column.label}</span>
              {sorted && (
                <span className={styles.sortIcon} aria-hidden="true">
                  {sorted === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </button>
            <button
              type="button"
              className={styles.pinButton}
              aria-pressed={isPinned}
              aria-label={isPinned ? `Unpin ${column.label}` : `Pin ${column.label}`}
              title={isPinned ? 'Unpin column' : 'Pin column to the left'}
              onClick={() => onPin(isPinned ? null : column.key)}
            >
              <PinIcon />
            </button>
            <div
              className={styles.resizeHandle}
              role="separator"
              aria-orientation="vertical"
              aria-label={`Resize ${column.label}`}
              title="Drag to resize, double-click to reset"
              onPointerDown={(e) => startResize(e, column.key)}
              onDoubleClick={() => onResetWidth(column.key)}
            />
          </div>
        )
      })}
    </div>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path
        d="M10.5 1.5 14.5 5.5 12 6.5 9.5 9l.5 3.5L8.5 14 2 7.5 3.5 6 7 6.5 9.5 4z M5 11l-3.5 3.5"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}
