import { useMemo, useState } from 'react'
import type { Order } from './data/types'
import type { FieldKey } from './fields/fields'
import { formatCount } from './format/format'
import { DataGrid } from './grid/DataGrid'
import { sortOrders, type SortState } from './grid/sortOrders'
import styles from './OrdersExplorer.module.css'

type Props = {
  orders: Order[]
}

/** The main screen, rendered once the orders have loaded. */
export function OrdersExplorer({ orders }: Props) {
  const [sort, setSort] = useState<SortState | null>(null)
  const [pinned, setPinned] = useState<FieldKey | null>('id')

  // Sorting is the expensive step, so it only re-runs when the sort itself changes.
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort])

  return (
    <div className={styles.screen}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>Orders Explorer</h1>
        <span className={styles.count}>{formatCount(sorted.length)} orders</span>
      </header>
      <main className={styles.main}>
        <DataGrid
          orders={sorted}
          sort={sort}
          onSortChange={setSort}
          pinned={pinned}
          onPinnedChange={setPinned}
        />
      </main>
    </div>
  )
}
