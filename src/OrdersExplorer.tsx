import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import buttons from './components/Button.module.css'
import { EmptyState } from './components/EmptyState'
import type { Order } from './data/types'
import { DetailsPanel } from './details/DetailsPanel'
import type { FieldKey } from './fields/fields'
import { compileFilter } from './filter/compile'
import { filterChips } from './filter/describe'
import { removeCondition } from './filter/edit'
import { EMPTY_FILTER, type Filter } from './filter/model'
import { FilterChips } from './filter-builder/FilterChips'
import { FilterPanel } from './filter-builder/FilterPanel'
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
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [filtersOpen, setFiltersOpen] = useState(true)
  // The row a Shift+click range starts from. Not rendered, so it does not need to be state.
  const anchorId = useRef<string | null>(null)

  // Sorting is the expensive step, so it only re-runs when the sort itself changes.
  const sorted = useMemo(() => sortOrders(orders, sort), [orders, sort])

  // Inputs update immediately (urgent); the 50,000-row filter pass runs as a deferred update,
  // so typing never waits for it. The filter is compiled once per change, then run per row.
  // Filtering keeps the sorted order, so changing a filter never needs a re-sort.
  const deferredFilter = useDeferredValue(filter)
  const predicate = useMemo(() => compileFilter(deferredFilter), [deferredFilter])
  const visible = useMemo(
    () => (predicate ? sorted.filter(predicate) : sorted),
    [sorted, predicate],
  )
  const isUpdating = filter !== deferredFilter
  const chips = useMemo(() => filterChips(filter), [filter])
  const activeOrder = visible[active.row]

  // Keyboard users can start working straight away.
  useEffect(() => viewportRef.current?.focus(), [])

  function changeSort(next: SortState) {
    setSort(next)
    setActive((cell) => ({ ...cell, row: 0 }))
  }

  function changeFilter(next: Filter) {
    setFilter(next)
    setActive((cell) => ({ ...cell, row: 0 }))
  }

  function selectRow(index: number, range: boolean) {
    const order = visible[index]
    if (!order) return
    const anchorIndex =
      range && anchorId.current ? visible.findIndex((o) => o.id === anchorId.current) : -1
    if (anchorIndex !== -1) {
      setSelection(selectRange(selection, visible, anchorIndex, index))
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
        <span className={styles.count} data-updating={isUpdating}>
          {formatCount(visible.length)} of {formatCount(orders.length)} orders
        </span>
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
        <FilterPanel
          filter={filter}
          onChange={changeFilter}
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
        />
        <div className={styles.gridArea}>
          <FilterChips
            groups={chips}
            onRemove={(id) => changeFilter(removeCondition(filter, id))}
            onClearAll={() => changeFilter(EMPTY_FILTER)}
          />
          <div className={styles.gridFrame}>
            <DataGrid
              viewportRef={viewportRef}
              orders={visible}
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
            {visible.length === 0 && (
              <EmptyState onClearFilters={() => changeFilter(EMPTY_FILTER)} />
            )}
          </div>
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
