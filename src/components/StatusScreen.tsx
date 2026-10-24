import type { ReactNode } from 'react'
import styles from './StatusScreen.module.css'

type Props = {
  title: string
  children?: ReactNode
  role?: 'status' | 'alert'
}

/** Full-screen message used while orders load and when loading fails. */
export function StatusScreen({ title, children, role = 'status' }: Props) {
  return (
    <div className={styles.screen} role={role}>
      <p className={styles.title}>{title}</p>
      {children}
    </div>
  )
}
