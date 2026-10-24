import buttons from './Button.module.css'
import styles from './EmptyState.module.css'

type Props = {
  onClearFilters: () => void
}

/**
 * Shown over the grid body when the filter matches nothing. The header and chips stay visible
 * above it so the user can see what is filtering everything out. Focus is not moved here: the
 * user is usually still typing in a filter input.
 */
export function EmptyState({ onClearFilters }: Props) {
  return (
    <div className={styles.empty} role="status">
      <p className={styles.title}>No orders match these filters</p>
      <p className={styles.text}>Remove a filter chip above, or start over.</p>
      <button type="button" className={buttons.primary} onClick={onClearFilters}>
        Clear all filters
      </button>
    </div>
  )
}
