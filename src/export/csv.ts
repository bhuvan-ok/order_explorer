import type { Order } from '../data/types'
import { FIELDS, type Field } from '../fields/fields'

// Byte order mark: tells Excel the file is UTF-8, so "₹", "–" and names show correctly.
const BOM = '﻿'
// Excel runs a cell starting with one of these as a formula ("CSV injection").
const FORMULA_START = /^[=+\-@\t\r]/

/**
 * Builds a CSV of the given orders, in the given order, with one column per field.
 * Values are machine-friendly so the file works in Excel or other tools: plain numbers
 * (1314.52, not "₹1,314.52") and ISO 8601 UTC dates. Enum values use the same labels as the grid.
 */
export function ordersToCsv(orders: readonly Order[]): string {
  const lines = [FIELDS.map((field) => escapeCell(header(field))).join(',')]
  for (const order of orders) {
    lines.push(FIELDS.map((field) => escapeCell(cellValue(field, order))).join(','))
  }
  return BOM + lines.join('\r\n') + '\r\n'
}

function header(field: Field): string {
  return field.key === 'amount' ? 'Amount (INR)' : field.label
}

function cellValue(field: Field, order: Order): string {
  const value = order[field.key]
  switch (field.type) {
    case 'number':
      return field.key === 'amount' ? (value as number).toFixed(2) : String(value)
    case 'date':
      return value === null ? '' : new Date(value as number).toISOString()
    case 'enum':
      return field.display(order)
    case 'text':
      return guardFormula(String(value))
  }
}

function guardFormula(text: string): string {
  return FORMULA_START.test(text) ? `'${text}` : text
}

/** RFC 4180: quote cells containing a comma, quote or line break, and double inner quotes. */
export function escapeCell(text: string): string {
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** e.g. "orders-2026-10-25-20-rows.csv", using the user's local date (the day they exported). */
export function exportFileName(rowCount: number, now = new Date()): string {
  const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-')
  return `orders-${day}-${rowCount}-rows.csv`
}
