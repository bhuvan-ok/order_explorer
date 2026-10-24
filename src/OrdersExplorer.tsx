import { useEffect, useMemo, useRef, useState } from 'react'
import buttons from './components/Button.module.css'
import type { Order } from './data/types'
import { DetailsPanel } from './details/DetailsPanel'
import type { FieldKey } from './fields/fields'
import { formatCount } from './format/format'
import type { ActiveCell } from './grid/activeCell'
import { DataGrid } from './grid/DataGrid'
import { selectRange, toggleId } from './grid/selection'
import { sortOrders, type SortState } from './grid/sortOrders'
import styles from './OrdersExplorer.module.css'

type Props = {
  orders: Order[]
}

const FIRST_CELL: ActiveCell = { row: 0, col: 'id' }

/** The main screen, rendered once the orders have loaded. */
export function OrdersExplorer({ orders }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [sort, setSort] = useState<SortState | null>(null)
  const [pinned, setPinned] = useState<FieldKey | null>('id')
  const [active, setActive] = useState<ActiveCell>(FIRST_CELL)
  const [selection, setSelection] = useState<ReadonlySet<string>>(() => new Set())
  const [detailsOpen, setDetailsOpen] = useState(false)
  // The row a Shift+click range starts from. Not rendered, so it does not need to be state.
  const anchorId = useRef<string | null>(null)

  // Sorting is the expensive step, so it only re-runs when the sort itself changes.
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort])
  const activeOrder = sorted[active.row]

  // Keyboard users can start working straight away.
  useEffect(() => viewportRef.current?.focus(), [])

  function changeSort(next: SortState) {
    setSort(next)
    setActive((cell) => ({ ...cell, row: 0 }))
  }

  function selectRow(index: number, range: boolean) {
    const order = sorted[index]
    if (!order) return
    const anchorIndex =
      range && anchorId.current ? sorted.findIndex((o) => o.id === anchorId.current) : -1
    if (anchorIndex !== -1) {
      setSelection(selectRange(selection, sorted, anchorIndex, index))
      return
    }
    setSelection(toggleId(selection, order.id))
    anchorId.current = order.id
  }

  function clearSelection() {
    setSelection(new Set())
    anchorId.current = null
  }

  function closeDetails() {
    setDetailsOpen(false)
    viewportRef.current?.focus()
  }

  return (
    <div className={styles.screen}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>Orders Explorer</h1>
        <span className={styles.count}>{formatCount(sorted.length)} orders</span>
        <div className={styles.spacer} />
        <span className={styles.count} aria-live="polite">
          {formatCount(selection.size)} selected
        </span>
        <button
          type="button"
          className={buttons.button}
          onClick={clearSelection}
          disabled={selection.size === 0}
        >
          Clear selection
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.gridArea}>
          <DataGrid
            viewportRef={viewportRef}
            orders={sorted}
            sort={sort}
            onSortChange={changeSort}
            pinned={pinned}
            onPinnedChange={setPinned}
            active={active}
            onActiveChange={setActive}
            selection={selection}
            onSelectRow={selectRow}
            onOpenDetails={() => setDetailsOpen(true)}
            onCloseDetails={closeDetails}
          />
        </div>
        {detailsOpen && activeOrder && <DetailsPanel order={activeOrder} onClose={closeDetails} />}
      </main>

      <footer className={styles.hints}>
        <span>↑ ↓ ← → move</span>
        <span>Click / Space select</span>
        <span>Shift+click select range</span>
        <span>Enter details</span>
        <span>Esc close</span>
      </footer>
    </div>
  )
}
