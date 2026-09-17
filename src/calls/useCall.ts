/**
 * useCall.ts — React adapter over the callState.ts singleton (US-05).
 *
 * Bridges the external module store into React via `useSyncExternalStore` (already used
 * elsewhere in this repo, e.g. usePosNextTurnBalance.ts) rather than useState+useEffect
 * boilerplate. While authenticated, mounting this hook also keeps the shared hub connection alive
 * and its call-signaling handlers attached (`registerCallSignaling`) independent of whether any
 * chat-UI surface is mounted — so the always-mounted `CallOverlayHost` keeps receiving
 * `IncomingCall` events app-wide, not just while the chat screen happens to be open.
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useSessionRole } from '../auth/useSessionRole'
import {
  answerCall,
  endCall,
  getCallStateSnapshot,
  registerCallSignaling,
  rejectCall,
  startOutgoingCall,
  subscribeCallState,
  toggleCamera,
  toggleMute,
} from './callState'
import type { AnswerCallParams, StartOutgoingCallParams } from './callState'

export function useCall() {
  const state = useSyncExternalStore(subscribeCallState, getCallStateSnapshot, getCallStateSnapshot)
  const { isAuthenticated } = useSessionRole()

  useEffect(() => {
    if (!isAuthenticated) return undefined
    return registerCallSignaling()
  }, [isAuthenticated])

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
