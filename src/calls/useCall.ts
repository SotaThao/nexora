/**
 * useCall.ts — React adapter over the callState.ts singleton (US-05).
 *
 * Bridges the external module store into React via `useSyncExternalStore` (already used
 * elsewhere in this repo, e.g. usePosNextTurnBalance.ts) rather than useState+useEffect
 * boilerplate. Mounting this hook also registers call-signaling handlers on the shared hub
 * connection, so any component that renders it (e.g. the future global call banner/overlay,
 * US-06) is enough to start receiving `IncomingCall` events.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import {
  answerCall,
  endCall,
  getCallStateSnapshot,
  initCallSignaling,
  rejectCall,
  startOutgoingCall,
  subscribeCallState,
  toggleCamera,
  toggleMute,
} from './callState'
import type { AnswerCallParams, StartOutgoingCallParams } from './callState'

export function useCall() {
  const state = useSyncExternalStore(subscribeCallState, getCallStateSnapshot, getCallStateSnapshot)

  useEffect(() => {
    initCallSignaling()
  }, [])

  const start = useCallback((params: StartOutgoingCallParams) => startOutgoingCall(params), [])
  const answer = useCallback((params: AnswerCallParams) => answerCall(params), [])
  const reject = useCallback(() => rejectCall(), [])
  const end = useCallback(() => endCall(), [])
  const mute = useCallback(() => toggleMute(), [])
  const camera = useCallback(() => toggleCamera(), [])

  return {
    ...state,
    startOutgoingCall: start,
    answerCall: answer,
    rejectCall: reject,
    endCall: end,
    toggleMute: mute,
    toggleCamera: camera,
  }
}

export default useCall
