import {
  useEffect,
  useId,
  useMemo,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from 'react'
import type { Order } from '../data/types'
import type { Field, FieldKey } from '../fields/fields'
import { nextActiveCell, type ActiveCell } from './activeCell'
import styles from './DataGrid.module.css'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import {
  HEADER_HEIGHT,
  orderColumns,
  ROW_HEIGHT,
  widthVariables,
  type ColumnWidths,
} from './layout'
import { nextSort, type SortState } from './sortOrders'
import { useColumnWidths } from './useColumnWidths'
import { useVirtualRange } from './useVirtualRange'

type Props = {
  viewportRef: RefObject<HTMLDivElement | null>
  orders: Order[]
  sort: SortState | null
  onSortChange: (sort: SortState) => void
  pinned: FieldKey | null
  onPinnedChange: (key: FieldKey | null) => void
  active: ActiveCell
  onActiveChange: (cell: ActiveCell) => void
  selection: ReadonlySet<string>
  /** Click / Space on a row; `range` is true for Shift+click. */
  onSelectRow: (index: number, range: boolean) => void
  onOpenDetails: () => void
  onCloseDetails: () => void
}

/**
 * Hand-built virtualized grid. Header, rows and the pinned column all live inside one scroll
 * container and use `position: sticky`, so the browser keeps them aligned without JS syncing.
 *
 * Keyboard focus stays on the scroll container and points at the focused cell with
 * aria-activedescendant. With virtualization the focused cell's DOM node is removed when it
 * scrolls away, so real DOM focus on a cell would be lost.
 */
export function DataGrid({
  viewportRef,
  orders,
  sort,
  onSortChange,
  pinned,
  onPinnedChange,
  active,
  onActiveChange,
  selection,
  onSelectRow,
  onOpenDetails,
  onCloseDetails,
}: Props) {
  const cellIdPrefix = useId()
  const { widths, setWidth, resetWidth } = useColumnWidths()
  const columns = useMemo(() => orderColumns(pinned), [pinned])
  const columnKeys = useMemo(() => columns.map((c) => c.key), [columns])
  const { start, end } = useVirtualRange(viewportRef, orders.length)

  // A new sort (or later, filter) produces a new list: start again from the first row.
  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0
  }, [viewportRef, orders])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Keys pressed on header buttons belong to those buttons.
    if (event.target !== event.currentTarget) return
    const viewport = event.currentTarget

    if (event.key === ' ') {
      event.preventDefault()
      if (orders.length > 0) onSelectRow(active.row, false)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (orders.length > 0) onOpenDetails()
      return
    }
    if (event.key === 'Escape') {
      onCloseDetails()
      return
    }

    const pageSize = Math.max(
      1,
      Math.floor((viewport.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) - 1,
    )
    const next = nextActiveCell(
      event.key,
      event.ctrlKey || event.metaKey,
      active,
      columnKeys,
      orders.length,
      pageSize,
    )
    if (!next) return
    event.preventDefault()
    onActiveChange(next)
    scrollCellIntoView(viewport, next, columns, widths, pinned)
  }

  // One click handler for all rows (event delegation) keeps the memoized rows prop-free.
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-col]')
    const row = cell?.closest<HTMLElement>('[data-index]')
    if (!cell || !row) return
    const index = Number(row.dataset.index)
    onActiveChange({ row: index, col: cell.dataset.col as FieldKey })
    onSelectRow(index, event.shiftKey)
  }

  const rows = []
  for (let index = start; index < end; index++) {
    const order = orders[index]
    rows.push(
      <GridRow
        key={order.id}
        order={order}
        index={index}
        columns={columns}
        pinned={pinned}
        selected={selection.has(order.id)}
        activeCol={index === active.row ? active.col : null}
        cellIdPrefix={cellIdPrefix}
      />,
    )
  }

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      style={widthVariables(columns, widths)}
      role="grid"
      aria-label="Orders"
      aria-multiselectable="true"
      aria-rowcount={orders.length + 1}
      aria-colcount={columns.length}
      aria-activedescendant={
        orders.length > 0 ? `${cellIdPrefix}-${active.row}-${active.col}` : undefined
      }
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <GridHeader
        columns={columns}
        widths={widths}
        sort={sort}
        pinned={pinned}
        onSort={(key) => onSortChange(nextSort(sort, key))}
        onPin={onPinnedChange}
        onResize={setWidth}
        onResetWidth={resetWidth}
      />
      <div
        role="rowgroup"
        className={styles.body}
        style={{ height: orders.length * ROW_HEIGHT }}
        onClick={handleClick}
        onDoubleClick={onOpenDetails}
      >
        {rows}
      </div>
    </div>
  )
}

/** Scrolls just enough to show the cell below the sticky header and right of the pinned column. */
function scrollCellIntoView(
  viewport: HTMLElement,
  cell: ActiveCell,
  columns: Field[],
  widths: ColumnWidths,
  pinned: FieldKey | null,
) {
  const top = cell.row * ROW_HEIGHT
  const visibleHeight = viewport.clientHeight - HEADER_HEIGHT
  if (top < viewport.scrollTop) viewport.scrollTop = top
  else if (top + ROW_HEIGHT > viewport.scrollTop + visibleHeight) {
    viewport.scrollTop = top + ROW_HEIGHT - visibleHeight
  }

  if (cell.col === pinned) return
  let left = 0
  for (const column of columns) {
    if (column.key === cell.col) break
    left += widths[column.key]
  }
  const right = left + widths[cell.col]
  const pinnedWidth = pinned ? widths[pinned] : 0
  if (left < viewport.scrollLeft + pinnedWidth) viewport.scrollLeft = left - pinnedWidth
  else if (right > viewport.scrollLeft + viewport.clientWidth) {
    viewport.scrollLeft = right - viewport.clientWidth
  }
}
