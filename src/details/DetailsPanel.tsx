import { Fragment } from 'react'
import type { Order } from '../data/types'
import { EMPTY } from '../format/format'
import { FIELDS } from '../fields/fields'
import styles from './DetailsPanel.module.css'

type Props = {
  order: Order | undefined
  open: boolean
  onClose: () => void
}

const LISTED_FIELDS = FIELDS.filter((f) => f.key !== 'id' && f.key !== 'notes')

/**
 * Non-modal side panel for the focused order. It follows the grid's focused row, so the user
 * can keep pressing ↑/↓ in the grid and read each order without closing anything.
 * It stays mounted and slides open/closed (width transition) instead of popping in; while closed
 * it is `inert`, so it cannot be focused or read by screen readers.
 */
export function DetailsPanel({ order, open, onClose }: Props) {
  return (
    <aside
      className={open ? `${styles.panel} ${styles.open}` : styles.panel}
      aria-label={order ? `Details for order ${order.id}` : 'Order details'}
      inert={!open}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {order && (
        <div className={styles.content}>
          <header className={styles.header}>
            <h2 className={styles.title}>{order.id}</h2>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close details"
            >
              ×
            </button>
          </header>

          <dl className={styles.list}>
            {LISTED_FIELDS.map((field) => (
              <Fragment key={field.key}>
                <dt>{field.label}</dt>
                <dd>{field.display(order)}</dd>
              </Fragment>
            ))}
            <dt>Currency</dt>
            <dd>{order.currency}</dd>
            <dt>Schema</dt>
            <dd>
              v{order.schemaVersion}
              {order.schemaVersion === 1 && ' (amount converted from paise)'}
            </dd>
          </dl>

          <h3 className={styles.subtitle}>Notes</h3>
          {/* Rendered as plain text: HTML-like notes such as <script> are shown, never run. */}
          <p className={styles.notes}>{order.notes || EMPTY}</p>

          <p className={styles.hint}>↑ ↓ next / previous order · Esc close</p>
        </div>
      )}
    </aside>
  )
}
