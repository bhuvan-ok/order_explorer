import { useEffect, useMemo, useRef } from 'react'
import type { Order } from '../data/types'
import type { FieldKey } from '../fields/fields'
import styles from './DataGrid.module.css'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'
import { orderColumns, ROW_HEIGHT, widthVariables } from './layout'
import { nextSort, type SortState } from './sortOrders'
import { useColumnWidths } from './useColumnWidths'
import { useVirtualRange } from './useVirtualRange'

type Props = {
  orders: Order[]
  sort: SortState | null
  onSortChange: (sort: SortState) => void
  pinned: FieldKey | null
  onPinnedChange: (key: FieldKey | null) => void
}

/**
 * Hand-built virtualized grid. Header, rows and the pinned column all live inside one scroll
 * container and use `position: sticky`, so the browser keeps them aligned without JS syncing.
 */
export function DataGrid({ orders, sort, onSortChange, pinned, onPinnedChange }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const { widths, setWidth, resetWidth } = useColumnWidths()
  const columns = useMemo(() => orderColumns(pinned), [pinned])
  const { start, end } = useVirtualRange(viewportRef, orders.length)

  // A new sort (or later, filter) produces a new list: start again from the first row.
  useEffect(() => {
    if (viewportRef.current) viewportRef.current.scrollTop = 0
  }, [orders])

  const rows = []
  for (let index = start; index < end; index++) {
    const order = orders[index]
    rows.push(
      <GridRow key={order.id} order={order} index={index} columns={columns} pinned={pinned} />,
    )
  }

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      style={widthVariables(columns, widths)}
      role="grid"
      aria-rowcount={orders.length + 1}
      aria-colcount={columns.length}
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
      <div role="rowgroup" className={styles.body} style={{ height: orders.length * ROW_HEIGHT }}>
        {rows}
      </div>
    </div>
  )
}
