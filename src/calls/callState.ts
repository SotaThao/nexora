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
import {
  getCommunityChatHubConnection,
  subscribeCommunityChatHub,
} from '../components/header-messages/communityChatRealtime'
import {
  COMMUNITY_CALL_DISCONNECT_GRACE_MS,
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
import { startRingtone, stopRingtone } from './ringtone'
import { captureStatsSnapshotJson, createPeerConnection, type ManagedPeerConnection } from './webrtc'

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
  /** Video-call only (US-07) — local camera track disabled via `track.enabled`, no renegotiation. */
  isCameraOff: boolean
  startedAt: string | null
  error: string | null
  peerConnectionRef: ManagedPeerConnection | null
  /** Generated once per page load (not per call) — lets the backend pick a winner across tabs. */
  tabToken: string
  /** Set only during the brief `'ended'` flash — drives which label `CallOverlay` shows (US-06). */
  endedReason: CommunityCallEndReason | null
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
  isCameraOff: false,
  startedAt: null,
  error: null,
  peerConnectionRef: null,
  tabToken: TAB_TOKEN,
  endedReason: null,
}

let state: CallStateSnapshot = INITIAL_STATE
const subscribers = new Set<() => void>()

function setState(patch: Partial<CallStateSnapshot>) {
  const previousPhase = state.phase
  state = { ...state, ...patch }
  // Centralized here (rather than at each transition site) so the ringtone can never be left
  // playing regardless of which path ends the call — answer, decline, cancel-by-peer, tab-race
  // loss, or error.
  if (state.phase !== previousPhase) {
    if (state.phase === 'incoming-ringing') startRingtone()
    else if (previousPhase === 'incoming-ringing') stopRingtone()
  }
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
/** Keeps the shared hub alive independent of chat-UI mounts — see `registerCallSignaling`. */
let keepAliveRefCount = 0
let keepAliveUnsubscribe: (() => void) | null = null
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
 * Keeps the shared community-chat hub connection alive and call-signaling handlers attached for
 * as long as at least one caller holds a registration — independent of whether any chat-UI
 * surface (HeaderMessages, etc.) is mounted. Without this, the hub tears down whenever the chat
 * ref count hits 0 (it's only ref-counted against chat surfaces) and incoming calls silently stop
 * ringing outside the chat screen, with nothing left to reconnect it. `useCall()` calls this while
 * the user is authenticated. Returns an unsubscribe function.
 */
export function registerCallSignaling(): () => void {
  keepAliveRefCount += 1
  if (keepAliveRefCount === 1) {
    keepAliveUnsubscribe = subscribeCommunityChatHub()
  }
  // Always re-run: attaches handlers to whichever connection instance is current (idempotent —
  // ensureCallSignalingRegistered only reattaches when the instance actually changed).
  void ensureCallSignalingRegistered()

  return () => {
    keepAliveRefCount = Math.max(0, keepAliveRefCount - 1)
    if (keepAliveRefCount === 0 && keepAliveUnsubscribe) {
      keepAliveUnsubscribe()
      keepAliveUnsubscribe = null
    }
  }
}

// ---------------------------------------------------------------------------
// Cleanup / phase transitions.
// ---------------------------------------------------------------------------

let noAnswerTimer: ReturnType<typeof setTimeout> | null = null
let endedResetTimer: ReturnType<typeof setTimeout> | null = null
let disconnectGraceTimer: ReturnType<typeof setTimeout> | null = null

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

function clearDisconnectGraceTimer() {
  if (disconnectGraceTimer) {
    clearTimeout(disconnectGraceTimer)
    disconnectGraceTimer = null
  }
}

/** Stops local tracks + closes the peer connection. Does not touch React-visible state. */
function cleanupResources() {
  clearNoAnswerTimer()
  clearDisconnectGraceTimer()
  state.peerConnectionRef?.close()
  state.localStream?.getTracks().forEach((track) => track.stop())
}

/** Explicit local action (I hung up / declined / cancelled) — no "ended" flash, straight to idle. */
function resetToIdle(options: { error?: string | null } = {}) {
  cleanupResources()
  clearEndedResetTimer()
  setState({ ...INITIAL_STATE, tabToken: TAB_TOKEN, error: options.error ?? null })
}

/** A call concluded (peer action, self-hangup of a connecting/active call, timeout, or failure). */
function finishCall(reason: CommunityCallEndReason | null = null) {
  cleanupResources()
  setState({
    phase: 'ended',
    peerConnectionRef: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isCameraOff: false,
    endedReason: reason,
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

async function invokeEndCall(
  callId: string,
  reason: CommunityCallEndReason,
  statsJson: string | null = null,
) {
  if (!activeConnection) return
  try {
    await activeConnection.invoke(CommunityChatHubMethod.EndCall, callId, reason, statsJson)
  } catch (error) {
    logger.warn('Community call: EndCall invoke failed', error)
  }
}

/**
 * Ends a connecting/active call: snapshots `getStats()` *before* closing the peer connection (US-06
 * AC), flashes `phase: 'ended'` (auto-resets to idle shortly after — same for a self-hangup, a
 * peer-driven end, or a detected network failure), then reports the result to the backend.
 */
async function endActiveCallWithStats(callId: string, reason: CommunityCallEndReason) {
  const pc = state.peerConnectionRef?.pc ?? null
  const statsJson = pc ? await captureStatsSnapshotJson(pc) : null
  finishCall(reason)
  await invokeEndCall(callId, reason, statsJson)
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

/**
 * Only the caller side renegotiates on ICE restart — having both peers create competing offers at
 * once (glare) would need full perfect-negotiation handling that isn't otherwise needed here.
 */
async function attemptIceRestart() {
  if (!state.isCaller || !state.peerConnectionRef || !state.callId) return
  try {
    state.peerConnectionRef.pc.restartIce()
    const offer = await state.peerConnectionRef.pc.createOffer()
    await state.peerConnectionRef.pc.setLocalDescription(offer)
    await activeConnection?.invoke(CommunityChatHubMethod.SendSdpOffer, state.callId, offer.sdp)
  } catch (error) {
    logger.warn('Community call: ICE restart failed', error)
  }
}

function handleConnectionStateChange(connectionState: RTCPeerConnectionState) {
  if (connectionState === 'connected') {
    clearDisconnectGraceTimer()
    if (state.phase !== 'active') {
      setState({ phase: 'active', startedAt: state.startedAt ?? new Date().toISOString() })
    }
    return
  }
  if (connectionState === 'disconnected' && (state.phase === 'connecting' || state.phase === 'active')) {
    // May self-recover (brief network hiccup) — try an ICE restart right away, but only treat this
    // as a real failure if it hasn't recovered to 'connected' by the time the grace window elapses.
    void attemptIceRestart()
    clearDisconnectGraceTimer()
    disconnectGraceTimer = setTimeout(() => {
      disconnectGraceTimer = null
      if (state.phase !== 'connecting' && state.phase !== 'active') return
      const callId = state.callId
      if (callId) void endActiveCallWithStats(callId, CommunityCallEndReason.NetworkError)
    }, COMMUNITY_CALL_DISCONNECT_GRACE_MS)
    return
  }
  // 'failed' is always immediately terminal — 'disconnected' gets the grace window above instead.
  if (connectionState === 'failed' && (state.phase === 'connecting' || state.phase === 'active')) {
    clearDisconnectGraceTimer()
    const callId = state.callId
    if (callId) void endActiveCallWithStats(callId, CommunityCallEndReason.NetworkError)
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
  finishCall(CommunityCallEndReason.Declined)
}

function handleCallCanceled(event: CallCanceledEvent) {
  if (!isForCurrentCall(event.callId)) return
  finishCall(event.endReason as CommunityCallEndReason)
}

function handleCallEnded(event: CallEndedEvent) {
  if (!isForCurrentCall(event.callId)) return
  finishCall(event.endReason as CommunityCallEndReason)
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
    // Flash "Missed" briefly so the caller sees the outcome instead of the overlay silently
    // vanishing (business doc Luồng 1: "tự chuyển thành Nhỡ").
    finishCall(CommunityCallEndReason.Missed)
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

/**
 * Generic hangup — cancels an outgoing ring instantly (nothing to summarize, never connected), or
 * ends a connecting/active call via the same stats-then-flash path as a peer-driven end/failure.
 */
export async function endCall(): Promise<void> {
  const callId = state.callId
  if (!callId) return
  if (state.phase === 'outgoing-ringing') {
    await invokeCancelCall(callId, CommunityCallEndReason.Cancelled)
    resetToIdle()
    return
  }
  if (state.phase === 'connecting' || state.phase === 'active') {
    await endActiveCallWithStats(callId, CommunityCallEndReason.Answered)
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

/**
 * Camera on/off for video calls (US-07): flips `track.enabled` on the local video track — no track
 * removal and no SDP renegotiation (Technical Notes #2). No-op for voice calls (no video track).
 */
export function toggleCamera(): void {
  if (!state.localStream) return
  const videoTracks = state.localStream.getVideoTracks()
  if (videoTracks.length === 0) return
  const nextCameraOff = !state.isCameraOff
  videoTracks.forEach((track) => {
    track.enabled = !nextCameraOff
  })
  setState({ isCameraOff: nextCameraOff })
}
