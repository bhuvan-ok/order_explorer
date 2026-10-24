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
}

export const GridRow = memo(function GridRow({ order, index, columns, pinned }: Props) {
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      className={styles.row}
      style={{ top: index * ROW_HEIGHT }}
    >
      {columns.map((column) => {
        const text = column.display(order)
        const classes = [styles.cell]
        if (column.align === 'right') classes.push(styles.right)
        if (column.key === pinned) classes.push(styles.pinned)
        if (text === EMPTY) classes.push(styles.empty)
        return (
          <div
            key={column.key}
            role="gridcell"
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
