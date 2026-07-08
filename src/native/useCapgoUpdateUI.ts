import { useEffect, useState } from 'react'
import {
  dismissCapgoUpdateUi,
  getCapgoUpdateUiState,
  subscribeCapgoUpdateUi,
  type CapgoUpdateUiState,
} from './capgoUpdateEvents'

export type { CapgoUpdatePhase, CapgoUpdateUiState } from './capgoUpdateEvents'

export function useCapgoUpdateUI() {
  const [state, setState] = useState<CapgoUpdateUiState>(() => getCapgoUpdateUiState())

  useEffect(() => subscribeCapgoUpdateUi(setState), [])

  return {
    state,
    dismiss: dismissCapgoUpdateUi,
  }
}
