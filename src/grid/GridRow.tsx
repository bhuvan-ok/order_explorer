import { memo } from 'react'
import type { Order } from '../data/types'
import { EMPTY } from '../format/format'
import type { Field, FieldKey } from '../fields/fields'
import styles from './DataGrid.module.css'
import { columnWidth, ROW_HEIGHT } from './layout'

type Props = {
  order: Order
  index: number
  columns: Field[]
  pinned: FieldKey | null
  selected: boolean
  /** The focused column if this row holds the focused cell, otherwise null. */
  activeCol: FieldKey | null
  cellIdPrefix: string
}

// Memoized: while scrolling, selecting or moving focus only the rows whose props changed re-render.
export const GridRow = memo(function GridRow({
  order,
  index,
  columns,
  pinned,
  selected,
  activeCol,
  cellIdPrefix,
}: Props) {
  const rowClasses = [styles.row]
  if (selected) rowClasses.push(styles.selected)
  if (activeCol) rowClasses.push(styles.activeRow)

  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selected}
      data-index={index}
      className={rowClasses.join(' ')}
      style={{ top: index * ROW_HEIGHT }}
    >
      {columns.map((column) => {
        const text = column.display(order)
        const isActive = column.key === activeCol
        const classes = [styles.cell]
        if (column.align === 'right') classes.push(styles.right)
        if (column.key === pinned) classes.push(styles.pinned)
        if (text === EMPTY) classes.push(styles.empty)
        if (isActive) classes.push(styles.activeCell)
        return (
          <div
            key={column.key}
            id={isActive ? `${cellIdPrefix}-${index}-${column.key}` : undefined}
            role="gridcell"
            data-col={column.key}
            className={classes.join(' ')}
            style={{ width: columnWidth(column.key) }}
            // Native tooltip shows the full value of text that is cut short.
            title={column.type === 'text' && text !== EMPTY ? text : undefined}
          >
            {text}
          </div>
        )
      })}
    </div>
  )
})
