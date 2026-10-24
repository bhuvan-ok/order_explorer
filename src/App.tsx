import buttons from './components/Button.module.css'
import { StatusScreen } from './components/StatusScreen'
import { useOrders } from './data/useOrders'

export default function App() {
  const { state, retry } = useOrders()

  if (state.status === 'loading') {
    return <StatusScreen title="Loading orders…" />
  }

  if (state.status === 'error') {
    return (
      <StatusScreen title="Could not load orders." role="alert">
        <span>{state.message}</span>
        <button type="button" className={buttons.primary} onClick={retry}>
          Try again
        </button>
      </StatusScreen>
    )
  }

  return <StatusScreen title={`${state.orders.length.toLocaleString('en-IN')} orders loaded`} />
}
