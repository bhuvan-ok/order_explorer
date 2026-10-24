// Selection is a set of order ids, not row indexes: indexes change with every sort and filter,
// ids do not.

/** Click or Space: add the id if missing, remove it if present. */
export function toggleId(selection: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selection)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Shift+click: add every row between the two indexes (inclusive, in the current view order). */
export function selectRange(
  selection: ReadonlySet<string>,
  rows: readonly { id: string }[],
  from: number,
  to: number,
): Set<string> {
  const next = new Set(selection)
  const [start, end] = from <= to ? [from, to] : [to, from]
  for (let i = start; i <= end; i++) next.add(rows[i].id)
  return next
}
