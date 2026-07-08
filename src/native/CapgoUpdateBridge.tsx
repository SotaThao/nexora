import CapgoUpdateOverlay from './CapgoUpdateOverlay'
import { useCapgoUpdateUI } from './useCapgoUpdateUI'

export default function CapgoUpdateBridge() {
  const { state, dismiss } = useCapgoUpdateUI()

  return <CapgoUpdateOverlay state={state} onDismiss={dismiss} />
}
