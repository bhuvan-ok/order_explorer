import styles from './Banner.module.css'

type Props = {
  title: string
  details: string[]
  onDismiss: () => void
}

/** A dismissible warning strip under the toolbar, e.g. for a broken link. */
export function Banner({ title, details, onDismiss }: Props) {
  return (
    <div className={styles.banner} role="alert">
      <span aria-hidden="true">⚠</span>
      <p className={styles.text}>
        {title} <span className={styles.details}>{details.join(' ')}</span>
      </p>
      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label="Dismiss message"
      >
        ×
      </button>
    </div>
  )
}
