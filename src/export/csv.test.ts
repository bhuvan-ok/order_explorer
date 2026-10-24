import { describe, expect, it } from 'vitest'
import type { Order } from '../data/types'
import { escapeCell, exportFileName, ordersToCsv } from './csv'

const order: Order = {
  id: 'ORD-0000262',
  schemaVersion: 1,
  customer: 'Myra Gupta',
  email: 'myra@example.com',
  status: 'delivered',
  amount: 123456.5,
  currency: 'INR',
  createdAt: Date.UTC(2025, 2, 14, 9, 30),
  updatedAt: null,
  region: 'NORTHEAST',
  channel: 'app',
  paymentMethod: 'netbanking',
  priority: null,
  itemCount: 3,
  notes: '<b>URGENT</b> Fragile, "handle" with care',
}

describe('ordersToCsv', () => {
  const csv = ordersToCsv([order])
  const [head, row] = csv.slice(1).split('\r\n')

  it('starts with a UTF-8 byte order mark and uses CRLF line endings', () => {
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('has one header per grid column', () => {
    expect(head).toBe(
      'ID,Customer,Email,Status,Amount (INR),Created (UTC),Updated (UTC),Region,Channel,Priority,Payment,Items,Notes',
    )
  })

  it('writes plain numbers, ISO dates, grid labels and escaped text', () => {
    expect(row).toBe(
      'ORD-0000262,Myra Gupta,myra@example.com,Delivered,123456.50,2025-03-14T09:30:00.000Z,,Northeast,App,None,Net banking,3,"<b>URGENT</b> Fragile, ""handle"" with care"',
    )
  })

  it('stops text cells from running as spreadsheet formulas', () => {
    const evil = ordersToCsv([{ ...order, customer: '=HYPERLINK("http://x")', notes: '+1' }])
    expect(evil).toContain(`"'=HYPERLINK(""http://x"")"`)
    expect(evil).toContain(`,'+1`)
  })

  it('writes just the header for no rows', () => {
    expect(ordersToCsv([]).split('\r\n').filter(Boolean)).toHaveLength(1)
  })
})

describe('escapeCell', () => {
  it('only quotes when needed', () => {
    expect(escapeCell('plain')).toBe('plain')
    expect(escapeCell('a,b')).toBe('"a,b"')
    expect(escapeCell('line\nbreak')).toBe('"line\nbreak"')
  })
})

describe('exportFileName', () => {
  it('includes the date and row count', () => {
    expect(exportFileName(20, new Date(2026, 9, 25, 23, 30))).toBe('orders-2026-10-25-20-rows.csv')
  })
})
