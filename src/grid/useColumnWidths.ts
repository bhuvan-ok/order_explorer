import { useCallback, useState } from 'react'
import type { FieldKey } from '../fields/fields'
import { DEFAULT_WIDTHS, MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH, type ColumnWidths } from './layout'

export function useColumnWidths() {
  const [widths, setWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS)

  const setWidth = useCallback((key: FieldKey, width: number) => {
    const clamped = Math.round(Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, width)))
    setWidths((prev) => (prev[key] === clamped ? prev : { ...prev, [key]: clamped }))
  }, [])

  const resetWidth = useCallback((key: FieldKey) => setWidth(key, DEFAULT_WIDTHS[key]), [setWidth])

  return { widths, setWidth, resetWidth }
}
