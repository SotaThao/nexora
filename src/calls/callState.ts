/**
 * callState.ts — singleton call-state module (US-05).
 *
 * Mirrors the pattern in `components/header-messages/communityChatRealtime.ts`: module-level
 * mutable state + a subscriber-callback list, NOT React Query/Context. Call state holds
 * non-serializable, long-lived objects (`RTCPeerConnection`, `MediaStream`) that must survive
 * unmount/navigate (closing the chat window or switching pages must not hang up an active call —
 * only an explicit hangup does), which rules out both React Query (server-data cache) and plain
 * Context (re-created on every Provider remount without a module singleton behind it).
 *
 * One-way dependency: this file calls `getCommunityChatHubConnection()` (exported by
 * `communityChatRealtime.ts`) to register its own handlers via `connection.on(...)` — it never
 * modifies that file's own chat logic.
 *
 * No UI, no `getUserMedia` here (US-06) — actions accept an already-obtained `localStream` so the
 * real `getUserMedia()` call can stay directly inside a click handler (Safari gesture requirement).
 */

import type { HubConnection } from '@microsoft/signalr'
import { getCommunityChatHubConnection } from '../components/header-messages/communityChatRealtime'
import {
  COMMUNITY_CALL_ENDED_RESET_DELAY_MS,
  COMMUNITY_CALL_NO_ANSWER_TIMEOUT_MS,
  CommunityCallEndReason,
  CommunityCallType,
} from '../constants/communityCall'
import { CommunityChatHubEvent, CommunityChatHubMethod } from '../lib/communityChatHub'
import type {
  CallAnsweredElsewhereEvent,
  CallCanceledEvent,
  CallEndedEvent,
  CallIdEvent,
  CommunityCallActionResultDto,
  CommunityCallSessionDto,
  IceCandidatePayload,
  IncomingCallEvent,
  SdpPayload,
} from '../types/communityChat'
import { logger } from '../utils/logger'
import { createPeerConnection, type ManagedPeerConnection } from './webrtc'

export type CallPhase =
  | 'idle'
  | 'outgoing-ringing'
  | 'incoming-ringing'
  | 'connecting'
  | 'active'
  | 'ended'

export interface CallStateSnapshot {
  phase: CallPhase
  callId: string | null
  chatSessionId: string | null
  callType: CommunityCallType | null
  peerUserProfileId: string | null
  peerName: string | null
  peerAvatarUrl: string | null
  isCaller: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  startedAt: string | null
  error: string | null
  peerConnectionRef: ManagedPeerConnection | null
  /** Generated once per page load (not per call) — lets the backend pick a winner across tabs. */
  tabToken: string
}

// Generated once per page load — used by AnswerCall so the backend can tell multiple tabs of the
// same user apart when they all race to answer the same incoming call.
const TAB_TOKEN = crypto.randomUUID()

const INITIAL_STATE: CallStateSnapshot = {
  phase: 'idle',
  callId: null,
  chatSessionId: null,
  callType: null,
  peerUserProfileId: null,
  peerName: null,
  peerAvatarUrl: null,
  isCaller: false,
  localStream: null,
  remoteStream: null,
  isMuted: false,
  startedAt: null,
  error: null,
  peerConnectionRef: null,
  tabToken: TAB_TOKEN,
}

let state: CallStateSnapshot = INITIAL_STATE
const subscribers = new Set<() => void>()

function setState(patch: Partial<CallStateSnapshot>) {
  state = { ...state, ...patch }
  subscribers.forEach((notify) => notify())
}

export function getCallStateSnapshot(): CallStateSnapshot {
  return state
}

export function subscribeCallState(callback: () => void): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error ?? 'Unknown error')
}

// ---------------------------------------------------------------------------
// Hub connection + handler registration (one-way dependency on communityChatRealtime.ts).
// ---------------------------------------------------------------------------

let attachedConnection: HubConnection | null = null
let activeConnection: HubConnection | null = null
let registerPromise: Promise<HubConnection | null> | null = null
/** ICE servers passed into the in-flight startOutgoingCall/answerCall — consumed once answered. */
let pendingIceServers: RTCIceServer[] = []

function attachHandlers(connection: HubConnection) {
  connection.on(CommunityChatHubEvent.IncomingCall, handleIncomingCall)
  connection.on(CommunityChatHubEvent.CallAnswered, handleCallAnswered)
  connection.on(CommunityChatHubEvent.CallAnsweredElsewhere, handleCallAnsweredElsewhere)
  connection.on(CommunityChatHubEvent.CallRejected, handleCallRejected)
  connection.on(CommunityChatHubEvent.CallCanceled, handleCallCanceled)
  connection.on(CommunityChatHubEvent.CallEnded, handleCallEnded)
  connection.on(CommunityChatHubEvent.ReceiveSdpOffer, handleReceiveSdpOffer)
  connection.on(CommunityChatHubEvent.ReceiveSdpAnswer, handleReceiveSdpAnswer)
  connection.on(CommunityChatHubEvent.ReceiveIceCandidate, handleReceiveIceCandidate)
  connection.on(CommunityChatHubEvent.CallError, handleCallError)
}

async function ensureCallSignalingRegistered(): Promise<HubConnection | null> {
  if (registerPromise) return registerPromise
  registerPromise = (async () => {
    const connection = await getCommunityChatHubConnection()
    activeConnection = connection
    // The underlying connection instance is replaced (not just reconnected) when every chat-UI
    // subscriber unmounts and a later one restarts it — re-attach in that case.
    if (connection && connection !== attachedConnection) {
      attachHandlers(connection)
      attachedConnection = connection
    }
    return connection
  })()
  try {
    return await registerPromise
  } finally {
    registerPromise = null
  }
}

/**
 * Registers call-signaling handlers on the shared community-chat hub connection. Idempotent —
 * safe to call repeatedly. `useCall()` calls this on mount so incoming calls can be received
 * before the user has done anything; also exported for manual/console verification (US-05 has no
 * UI yet to trigger this via a mounted component — see ticket's "How to Verify").
 */
export function initCallSignaling(): void {
  void ensureCallSignalingRegistered()
}

// ---------------------------------------------------------------------------
// Cleanup / phase transitions.
// ---------------------------------------------------------------------------

let noAnswerTimer: ReturnType<typeof setTimeout> | null = null
let endedResetTimer: ReturnType<typeof setTimeout> | null = null

function clearNoAnswerTimer() {
  if (noAnswerTimer) {
    clearTimeout(noAnswerTimer)
    noAnswerTimer = null
  }
}

function clearEndedResetTimer() {
  if (endedResetTimer) {
    clearTimeout(endedResetTimer)
    endedResetTimer = null
  }
}

/** Stops local tracks + closes the peer connection. Does not touch React-visible state. */
function cleanupResources() {
  clearNoAnswerTimer()
  state.peerConnectionRef?.close()
  state.localStream?.getTracks().forEach((track) => track.stop())
}

/** Explicit local action (I hung up / declined / cancelled) — no "ended" flash, straight to idle. */
function resetToIdle(options: { error?: string | null } = {}) {
  cleanupResources()
  clearEndedResetTimer()
  setState({ ...INITIAL_STATE, tabToken: TAB_TOKEN, error: options.error ?? null })
}

/** Externally-driven end (peer rejected/cancelled/ended, or a detected network failure). */
function finishCall() {
  cleanupResources()
  setState({
    phase: 'ended',
    peerConnectionRef: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
  })
  clearEndedResetTimer()
  endedResetTimer = setTimeout(() => {
    endedResetTimer = null
    setState({ ...INITIAL_STATE, tabToken: TAB_TOKEN })
  }, COMMUNITY_CALL_ENDED_RESET_DELAY_MS)
}

function isForCurrentCall(callId: string): boolean {
  return Boolean(state.callId) && state.callId === callId
}

// ---------------------------------------------------------------------------
// Hub RPC helpers (best-effort — the local state transition never waits on these).
// ---------------------------------------------------------------------------

async function invokeEndCall(callId: string, reason: CommunityCallEndReason) {
  if (!activeConnection) return
  try {
    await activeConnection.invoke(CommunityChatHubMethod.EndCall, callId, reason, null)
  } catch (error) {
    logger.warn('Community call: EndCall invoke failed', error)
  }
}

async function invokeCancelCall(callId: string, reason: CommunityCallEndReason) {
  if (!activeConnection) return
  try {
    await activeConnection.invoke(CommunityChatHubMethod.CancelCall, callId, reason)
  } catch (error) {
    logger.warn('Community call: CancelCall invoke failed', error)
  }
}

async function invokeRejectCall(callId: string) {
  if (!activeConnection) return
  try {
    await activeConnection.invoke(CommunityChatHubMethod.RejectCall, callId)
  } catch (error) {
    logger.warn('Community call: RejectCall invoke failed', error)
  }
}

// ---------------------------------------------------------------------------
// WebRTC wiring (shared, unchanged across Phase 1/2 per webrtc.ts).
// ---------------------------------------------------------------------------

function handleLocalIceCandidate(candidate: RTCIceCandidate) {
  if (!state.callId || !activeConnection) return
  void activeConnection
    .invoke(CommunityChatHubMethod.SendIceCandidate, state.callId, JSON.stringify(candidate.toJSON()))
    .catch((error) => logger.warn('Community call: SendIceCandidate failed', error))
}

function handleRemoteTrack(event: RTCTrackEvent) {
  const [stream] = event.streams
  if (stream) setState({ remoteStream: stream })
}

function handleConnectionStateChange(connectionState: RTCPeerConnectionState) {
  if (connectionState === 'connected' && state.phase !== 'active') {
    setState({ phase: 'active', startedAt: state.startedAt ?? new Date().toISOString() })
    return
  }
  // Only 'failed' is treated as terminal — 'disconnected' can self-recover (ICE restart/reconnect),
  // same reasoning as the backend's OnDisconnectedAsync grace window (US-03 Technical Notes #4).
  if (connectionState === 'failed' && (state.phase === 'connecting' || state.phase === 'active')) {
    const callId = state.callId
    finishCall()
    if (callId) void invokeEndCall(callId, CommunityCallEndReason.NetworkError)
  }
}

/** Caller side: build the peer connection and send the SDP offer once the callee has answered. */
async function beginOfferAsCaller() {
  if (!state.callId || !state.localStream) return
  try {
    const pc = createPeerConnection({
      iceServers: pendingIceServers,
      onIceCandidate: handleLocalIceCandidate,
      onTrack: handleRemoteTrack,
      onConnectionStateChange: handleConnectionStateChange,
    })
    pc.addLocalStream(state.localStream)
    setState({ phase: 'connecting', peerConnectionRef: pc })
    const offer = await pc.pc.createOffer()
    await pc.pc.setLocalDescription(offer)
    await activeConnection?.invoke(CommunityChatHubMethod.SendSdpOffer, state.callId, offer.sdp)
  } catch (error) {
    logger.error('Community call: failed to create/send SDP offer', error)
    setState({ error: extractErrorMessage(error) })
  }
}

// ---------------------------------------------------------------------------
// Hub event handlers.
// ---------------------------------------------------------------------------

function handleIncomingCall(event: IncomingCallEvent) {
  if (state.phase !== 'idle') {
    // Backend already prevents ringing a busy callee — this shouldn't happen; ignore defensively.
    logger.warn('Community call: IncomingCall received while not idle, ignoring', event)
    return
  }
  setState({
    phase: 'incoming-ringing',
    callId: event.id,
    chatSessionId: event.chatSessionId,
    callType: event.callType as CommunityCallType,
    peerUserProfileId: event.callerUserProfileId,
    peerName: event.callerName,
    peerAvatarUrl: event.callerAvatarUrl,
    isCaller: false,
    error: null,
  })
}

function handleCallAnswered(event: CallIdEvent) {
  if (!state.isCaller || !isForCurrentCall(event.callId)) return
  clearNoAnswerTimer()
  void beginOfferAsCaller()
}

function handleCallAnsweredElsewhere(event: CallAnsweredElsewhereEvent) {
  if (!isForCurrentCall(event.callId)) return
  if (event.winningTabToken === TAB_TOKEN) return // this tab won — handled by its own answerCall()
  if (state.phase === 'incoming-ringing') resetToIdle()
}

function handleCallRejected(event: CallIdEvent) {
  if (!isForCurrentCall(event.callId)) return
  finishCall()
}

function handleCallCanceled(event: CallCanceledEvent) {
  if (!isForCurrentCall(event.callId)) return
  finishCall()
}

function handleCallEnded(event: CallEndedEvent) {
  if (!isForCurrentCall(event.callId)) return
  finishCall()
}

async function handleReceiveSdpOffer(payload: SdpPayload) {
  if (!isForCurrentCall(payload.callId) || !state.peerConnectionRef) return
  try {
    await state.peerConnectionRef.setRemoteDescription({ type: 'offer', sdp: payload.sdp })
    const answer = await state.peerConnectionRef.pc.createAnswer()
    await state.peerConnectionRef.pc.setLocalDescription(answer)
    await activeConnection?.invoke(CommunityChatHubMethod.SendSdpAnswer, payload.callId, answer.sdp)
  } catch (error) {
    logger.error('Community call: failed to answer SDP offer', error)
    setState({ error: extractErrorMessage(error) })
  }
}

async function handleReceiveSdpAnswer(payload: SdpPayload) {
  if (!isForCurrentCall(payload.callId) || !state.peerConnectionRef) return
  try {
    await state.peerConnectionRef.setRemoteDescription({ type: 'answer', sdp: payload.sdp })
  } catch (error) {
    logger.error('Community call: failed to apply SDP answer', error)
    setState({ error: extractErrorMessage(error) })
  }
}

async function handleReceiveIceCandidate(payload: IceCandidatePayload) {
  if (!isForCurrentCall(payload.callId) || !state.peerConnectionRef) return
  try {
    const candidate = JSON.parse(payload.candidateJson) as RTCIceCandidateInit
    await state.peerConnectionRef.addRemoteIceCandidate(candidate)
  } catch (error) {
    logger.warn('Community call: failed to add remote ICE candidate', error)
  }
}

function handleCallError(message: string) {
  logger.warn('Community call hub error', message)
  setState({ error: String(message ?? '').trim() || 'Call error.' })
}

// ---------------------------------------------------------------------------
// Public actions (consumed by useCall.ts).
// ---------------------------------------------------------------------------

export interface StartOutgoingCallParams {
  chatSessionId: string
  peerUserProfileId: string
  peerName?: string | null
  peerAvatarUrl?: string | null
  callType?: CommunityCallType
  /** Already obtained via getUserMedia() in the caller's click handler (US-06) — not fetched here. */
  localStream: MediaStream
  iceServers: RTCIceServer[]
}

function startNoAnswerTimer(callId: string) {
  clearNoAnswerTimer()
  noAnswerTimer = setTimeout(() => {
    noAnswerTimer = null
    if (state.callId !== callId || state.phase !== 'outgoing-ringing') return
    void invokeCancelCall(callId, CommunityCallEndReason.Missed)
    resetToIdle()
  }, COMMUNITY_CALL_NO_ANSWER_TIMEOUT_MS)
}

export async function startOutgoingCall(params: StartOutgoingCallParams): Promise<void> {
  if (state.phase !== 'idle') {
    logger.warn('Community call: startOutgoingCall ignored, a call is already in progress')
    return
  }
  const callType = params.callType ?? CommunityCallType.Voice
  pendingIceServers = params.iceServers
  setState({
    phase: 'outgoing-ringing',
    chatSessionId: params.chatSessionId,
    callType,
    peerUserProfileId: params.peerUserProfileId,
    peerName: params.peerName ?? null,
    peerAvatarUrl: params.peerAvatarUrl ?? null,
    isCaller: true,
    localStream: params.localStream,
    error: null,
  })
  try {
    const connection = await ensureCallSignalingRegistered()
    if (!connection) throw new Error('Signaling connection unavailable.')
    const call = await connection.invoke<CommunityCallSessionDto>(
      CommunityChatHubMethod.InitiateCall,
      params.chatSessionId,
      callType,
    )
    setState({ callId: call.id })
    startNoAnswerTimer(call.id)
  } catch (error) {
    logger.error('Community call: InitiateCall failed', error)
    resetToIdle({ error: extractErrorMessage(error) })
  }
}

export interface AnswerCallParams {
  /** Already obtained via getUserMedia() in the Answer button's click handler (US-06). */
  localStream: MediaStream
  iceServers: RTCIceServer[]
}

export async function answerCall(params: AnswerCallParams): Promise<void> {
  if (state.phase !== 'incoming-ringing' || !state.callId) {
    logger.warn('Community call: answerCall ignored, no incoming call to answer')
    return
  }
  const callId = state.callId
  pendingIceServers = params.iceServers
  try {
    const connection = await ensureCallSignalingRegistered()
    if (!connection) throw new Error('Signaling connection unavailable.')
    const result = await connection.invoke<CommunityCallActionResultDto>(
      CommunityChatHubMethod.AnswerCall,
      callId,
      TAB_TOKEN,
    )
    if (!result.success) {
      // Another tab of this user already answered, or the call ended before we could.
      resetToIdle()
      return
    }
    const pc = createPeerConnection({
      iceServers: pendingIceServers,
      onIceCandidate: handleLocalIceCandidate,
      onTrack: handleRemoteTrack,
      onConnectionStateChange: handleConnectionStateChange,
    })
    pc.addLocalStream(params.localStream)
    setState({
      phase: 'connecting',
      localStream: params.localStream,
      peerConnectionRef: pc,
      error: null,
    })
  } catch (error) {
    logger.error('Community call: AnswerCall failed', error)
    resetToIdle({ error: extractErrorMessage(error) })
  }
}

export async function rejectCall(): Promise<void> {
  if (state.phase !== 'incoming-ringing' || !state.callId) return
  const callId = state.callId
  await invokeRejectCall(callId)
  resetToIdle()
}

/** Generic hangup — cancels an outgoing ring, or ends a connecting/active call. */
export async function endCall(): Promise<void> {
  const callId = state.callId
  if (!callId) return
  if (state.phase === 'outgoing-ringing') {
    await invokeCancelCall(callId, CommunityCallEndReason.Cancelled)
    resetToIdle()
    return
  }
  if (state.phase === 'connecting' || state.phase === 'active') {
    await invokeEndCall(callId, CommunityCallEndReason.Answered)
    resetToIdle()
  }
}

export function toggleMute(): void {
  if (!state.localStream) return
  const nextMuted = !state.isMuted
  state.localStream.getAudioTracks().forEach((track) => {
    track.enabled = !nextMuted
  })
  setState({ isMuted: nextMuted })
}
