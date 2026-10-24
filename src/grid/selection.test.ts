import { describe, expect, it } from 'vitest'
import { nextActiveCell } from './activeCell'
import { selectRange, toggleId } from './selection'

describe('toggleId', () => {
  it('adds and removes an id without changing the input', () => {
    const empty = new Set<string>()
    const one = toggleId(empty, 'A')
    expect([...one]).toEqual(['A'])
    expect([...toggleId(one, 'A')]).toEqual([])
    expect(empty.size).toBe(0)
  })
})

describe('selectRange', () => {
  const rows = ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id }))

  it('adds every row between the anchor and the target, in either direction', () => {
    expect([...selectRange(new Set(), rows, 1, 3)].sort()).toEqual(['B', 'C', 'D'])
    expect([...selectRange(new Set(), rows, 3, 1)].sort()).toEqual(['B', 'C', 'D'])
  })

  it('keeps rows that were already selected', () => {
    expect([...selectRange(new Set(['E']), rows, 0, 1)].sort()).toEqual(['A', 'B', 'E'])
  })
})

describe('nextActiveCell', () => {
  const cols = ['id', 'customer', 'amount'] as const
  const at = { row: 5, col: 'customer' } as const

  it('moves with the arrow keys and stops at the edges', () => {
    expect(nextActiveCell('ArrowDown', false, at, cols, 10, 5)).toEqual({ row: 6, col: 'customer' })
    expect(nextActiveCell('ArrowRight', false, at, cols, 10, 5)).toEqual({ row: 5, col: 'amount' })
    expect(nextActiveCell('ArrowLeft', false, { row: 0, col: 'id' }, cols, 10, 5)).toEqual({
      row: 0,
      col: 'id',
    })
    expect(nextActiveCell('ArrowDown', false, { row: 9, col: 'id' }, cols, 10, 5)).toEqual({
      row: 9,
      col: 'id',
    })
  })

  it('pages and jumps', () => {
    expect(nextActiveCell('PageDown', false, at, cols, 10, 5)).toEqual({ row: 9, col: 'customer' })
    expect(nextActiveCell('PageUp', false, at, cols, 10, 5)).toEqual({ row: 0, col: 'customer' })
    expect(nextActiveCell('End', false, at, cols, 10, 5)).toEqual({ row: 5, col: 'amount' })
    expect(nextActiveCell('End', true, at, cols, 10, 5)).toEqual({ row: 9, col: 'amount' })
    expect(nextActiveCell('Home', true, at, cols, 10, 5)).toEqual({ row: 0, col: 'id' })
  })

  it('ignores other keys and empty grids', () => {
    expect(nextActiveCell('a', false, at, cols, 10, 5)).toBeNull()
    expect(nextActiveCell('ArrowDown', false, at, cols, 0, 5)).toBeNull()
  })
})
