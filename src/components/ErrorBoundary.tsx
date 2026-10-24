import { Component, type ReactNode } from 'react'
import buttons from './Button.module.css'
import { StatusScreen } from './StatusScreen'

type Props = { children: ReactNode }
type State = { failed: boolean }

/**
 * Last line of defence: if anything still throws while rendering, show a way out instead of a
 * blank page. "Reset view" reloads without the URL parameters, i.e. the default view.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <StatusScreen title="Something went wrong." role="alert">
        <button
          type="button"
          className={buttons.primary}
          onClick={() => window.location.assign(window.location.pathname)}
        >
          Reset view
        </button>
      </StatusScreen>
    )
  }
}
