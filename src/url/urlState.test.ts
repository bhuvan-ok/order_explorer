import { describe, expect, it } from 'vitest'
import {
  DEFAULT_VIEW,
  encodeSelection,
  parseViewState,
  serializeViewState,
  type ViewState,
} from './urlState'

const id = (n: number) => `ORD-${String(n).padStart(7, '0')}`
const KNOWN = new Set(Array.from({ length: 100 }, (_, i) => id(i + 1)))

const VIEW: ViewState = {
  filter: {
    groups: [
      {
        id: 'g1',
        conditions: [
          { id: 'c1', field: 'status', operator: 'in', values: ['shipped', 'delivered'] },
          { id: 'c2', field: 'customer', operator: 'contains', values: ['gupta & co'] },
        ],
      },
      {
        id: 'g2',
        conditions: [{ id: 'c3', field: 'amount', operator: 'between', values: ['1000', ''] }],
      },
    ],
  },
  sort: { key: 'amount', direction: 'desc' },
  pinned: 'customer',
  selection: new Set([id(3), id(1), id(2), id(7)]),
}

/** Ids are regenerated on parse, so compare everything else. */
const withoutIds = (view: ViewState) => ({
  ...view,
  filter: view.filter.groups.map((g) =>
    g.conditions.map((c) => ({ field: c.field, operator: c.operator, values: c.values })),
  ),
  selection: [...view.selection].sort(),
})

describe('serializeViewState / parseViewState', () => {
  it('round-trips the full view, including incomplete conditions', () => {
    const search = serializeViewState(VIEW)
    const { view, errors } = parseViewState(search, KNOWN)
    expect(errors).toEqual([])
    expect(withoutIds(view)).toEqual(withoutIds(VIEW))
  })

  it('writes nothing for the default view', () => {
    expect(serializeViewState(DEFAULT_VIEW)).toBe('')
    expect(parseViewState('', KNOWN)).toEqual({ view: DEFAULT_VIEW, errors: [] })
  })

  it('stores "no pinned column" explicitly', () => {
    const search = serializeViewState({ ...DEFAULT_VIEW, pinned: null })
    expect(search).toContain('pin=none')
    expect(parseViewState(search, KNOWN).view.pinned).toBeNull()
  })

  it('ignores parameters it does not know about', () => {
    expect(parseViewState('?utm_source=mail', KNOWN).errors).toEqual([])
  })
})

describe('broken or hand-edited links fall back to the default view', () => {
  const broken: [string, string][] = [
    ['unreadable JSON', '?f=%%%{'],
    ['JSON of the wrong shape', '?f={}'],
    ['empty group', '?f=[[]]'],
    ['unknown field', '?f=[[["amout","gt",["1"]]]]'],
    ['operator not allowed for the type', '?f=[[["amount","contains",["1"]]]]'],
    ['text in a number filter', '?f=[[["amount","gt",["abc"]]]]'],
    ['impossible date', '?f=[[["createdAt","before",["2025-02-31x"]]]]'],
    ['unknown enum option', '?f=[[["status","in",["lost"]]]]'],
    ['bad sort direction', '?sort=amount.sideways'],
    ['unknown sort field', '?sort=foo.asc'],
    ['unknown pin column', '?pin=foo'],
    ['unreadable selection', '?sel=abc'],
    ['reversed range', '?sel=5-3'],
    ['order that does not exist', '?sel=1,500'],
    ['huge range', '?sel=1-999999999'],
    ['future version', '?v=2&sort=amount.asc'],
  ]

  it.each(broken)('%s', (_, search) => {
    const { view, errors } = parseViewState(search, KNOWN)
    expect(view).toBe(DEFAULT_VIEW)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('throws away valid parts too when one part is broken', () => {
    const { view } = parseViewState('?sort=amount.asc&pin=foo', KNOWN)
    expect(view.sort).toBeNull()
  })
})

describe('encodeSelection', () => {
  it('compresses consecutive ids into ranges', () => {
    const ids = new Set([1, 2, 3, 5, 7, 8].map(id))
    expect(encodeSelection(ids)).toBe('1-3,5,7-8')
    expect([...parseViewState('?sel=1-3,5,7-8', KNOWN).view.selection].sort()).toEqual(
      [...ids].sort(),
    )
  })
})
