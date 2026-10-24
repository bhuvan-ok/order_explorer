import { Fragment } from 'react'
import type { ChipGroup } from '../filter/describe'
import styles from './FilterChips.module.css'

type Props = {
  groups: ChipGroup[]
  onRemove: (conditionId: string) => void
  onClearAll: () => void
}

/**
 * The active filter as small chips above the grid. Chips are grouped the same way as the logic
 * (OR inside a group, AND between groups) so the summary reads like the filter itself.
 */
export function FilterChips({ groups, onRemove, onClearAll }: Props) {
  if (groups.length === 0) {
    return (
      <div className={styles.bar}>
        <span className={styles.muted}>No filters applied</span>
      </div>
    )
  }

  return (
    <div className={styles.bar} role="region" aria-label="Active filters">
      {groups.map((group, groupIndex) => (
        <Fragment key={group.id}>
          {groupIndex > 0 && <span className={styles.and}>and</span>}
          <span
            className={groups.length > 1 && group.chips.length > 1 ? styles.group : styles.plain}
          >
            {group.chips.map((chip, chipIndex) => (
              <Fragment key={chip.id}>
                {chipIndex > 0 && <span className={styles.or}>or</span>}
                <span className={styles.chip}>
                  <span className={styles.label} title={chip.label}>
                    {chip.label}
                  </span>
                  <button
                    type="button"
                    className={styles.remove}
                    aria-label={`Remove filter: ${chip.label}`}
                    onClick={() => onRemove(chip.id)}
                  >
                    ×
                  </button>
                </span>
              </Fragment>
            ))}
          </span>
        </Fragment>
      ))}
      <button type="button" className={styles.clearAll} onClick={onClearAll}>
        Clear all
      </button>
    </div>
  )
}
