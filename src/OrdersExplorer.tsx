import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Banner } from './components/Banner'
import buttons from './components/Button.module.css'
import { EmptyState } from './components/EmptyState'
import type { Order } from './data/types'
import { DetailsPanel } from './details/DetailsPanel'
import { exportFileName, ordersToCsv } from './export/csv'
import { downloadTextFile } from './export/download'
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
import { extendSelection, selectRange, toggleId } from './grid/selection'
import { sortOrders, type SortState } from './grid/sortOrders'
import styles from './OrdersExplorer.module.css'
import { parseViewState, type ParseResult } from './url/urlState'
import { useUrlSync } from './url/useUrlSync'

type Props = {
  orders: Order[]
}

const FIRST_CELL: ActiveCell = { row: 0, col: 'id' }

/** Reads filter, sort, pinned column and selection from the link the page was opened with. */
function readLink(orders: Order[]): ParseResult {
  const knownIds = new Set(orders.map((o) => o.id))
  return parseViewState(window.location.search, knownIds)
}

/** The main screen, rendered once the orders have loaded. */
export function OrdersExplorer({ orders }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  // The link is read once, when the screen first appears; after that the URL only mirrors state.
  const [link] = useState(() => readLink(orders))
  const [linkErrors, setLinkErrors] = useState(link.errors)
  const [sort, setSort] = useState<SortState | null>(link.view.sort)
  const [pinned, setPinned] = useState<FieldKey | null>(link.view.pinned)
  const [active, setActive] = useState<ActiveCell>(FIRST_CELL)
  const [selection, setSelection] = useState<ReadonlySet<string>>(link.view.selection)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>(link.view.filter)
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

  // The "200 rows" decision: the selection survives filter changes, but only selected rows that
  // are visible count. This one list feeds both the on-screen count and the export, so they can
  // never disagree. Rows hidden by the filter stay selected and come back when it is loosened.
  const selectedVisible = useMemo(
    () => visible.filter((order) => selection.has(order.id)),
    [visible, selection],
  )
  const hiddenSelected = selection.size - selectedVisible.length

  const view = useMemo(
    () => ({ filter, sort, pinned, selection }),
    [filter, sort, pinned, selection],
  )
  useUrlSync(view)

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

  function extendRowSelection(fromIndex: number, toIndex: number) {
    const result = extendSelection(selection, visible, anchorId.current, fromIndex, toIndex)
    setSelection(result.selection)
    anchorId.current = result.anchorId
  }

  function clearSelection() {
    setSelection(new Set())
    anchorId.current = null
  }

  function exportSelected() {
    downloadTextFile(exportFileName(selectedVisible.length), ordersToCsv(selectedVisible))
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
          {formatCount(selectedVisible.length)} selected
          {hiddenSelected > 0 && (
            <span
              className={styles.hidden}
              title="Still selected, but hidden by the filter. Not included in the export."
            >
              {' '}
              · {formatCount(hiddenSelected)} hidden by filter
            </span>
          )}
        </span>
        <button
          type="button"
          className={buttons.button}
          onClick={clearSelection}
          disabled={selection.size === 0}
        >
          Clear selection
        </button>
        <button
          type="button"
          className={buttons.primary}
          onClick={exportSelected}
          disabled={selectedVisible.length === 0}
        >
          Export {formatCount(selectedVisible.length)}{' '}
          {selectedVisible.length === 1 ? 'row' : 'rows'}
        </button>
      </header>

      {linkErrors.length > 0 && (
        <Banner
          title="This link had invalid settings, so the default view is shown."
          details={linkErrors}
          onDismiss={() => setLinkErrors([])}
        />
      )}

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
              onExtendSelection={extendRowSelection}
              onOpenDetails={() => setDetailsOpen(true)}
              onCloseDetails={closeDetails}
            />
            {visible.length === 0 && (
              <EmptyState onClearFilters={() => changeFilter(EMPTY_FILTER)} />
            )}
          </div>
        </div>
        <DetailsPanel
          order={activeOrder}
          open={detailsOpen && activeOrder !== undefined}
          onClose={closeDetails}
        />
      </main>

      <footer className={styles.hints}>
        <span>↑ ↓ ← → move</span>
        <span>Click / Space select</span>
        <span>Shift+click / Shift+↑↓ select range</span>
        <span>Enter details</span>
        <span>Esc close</span>
      </footer>
    </div>
  )
}
