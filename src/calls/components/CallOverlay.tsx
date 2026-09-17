/**
 * CallOverlay.tsx — in-call UI (US-06, voice-only; Phase 2/US-07 adds the video tile).
 *
 * Covers `outgoing-ringing` (caller waiting for pickup), `connecting` (SDP/ICE exchange right
 * after answer), `active` (media flowing, ticking duration), and a brief `ended` flash before
 * call state auto-resets to idle. `incoming-ringing` is the banner's job, not this component's.
 */

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { HEADER_MESSAGES_CHAT_I18N } from '../../components/header-messages/headerMessagesConstants'
import { getHeaderMessageContactInitials } from '../../components/header-messages/headerMessagesMappers'
import { CommunityCallEndReason, CommunityCallType } from '../../constants/communityCall'
import { formatElapsedSince } from '../callFormat'
import type { CallPhase } from '../callState'
import useCall from '../useCall'

const I18N = HEADER_MESSAGES_CHAT_I18N

const PHASE_STATUS_KEY: Partial<Record<CallPhase, string>> = {
  'outgoing-ringing': 'callRinging',
  connecting: 'callConnecting',
  active: 'callActive',
}

// Cancelled / Answered show no extra label during the brief 'ended' flash — Answered already
// displayed its duration while active, and Cancelled reads fine with just the frozen avatar.
const ENDED_REASON_KEY: Partial<Record<CommunityCallEndReason, string>> = {
  [CommunityCallEndReason.Missed]: 'callMissed',
  [CommunityCallEndReason.Declined]: 'callDeclinedByPeer',
  [CommunityCallEndReason.Failed]: 'callNetworkError',
  [CommunityCallEndReason.NetworkError]: 'callNetworkError',
}

export default function CallOverlay() {
  const {
    phase,
    callType,
    peerName,
    peerAvatarUrl,
    startedAt,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    endCall,
    endedReason,
  } = useCall()
  const { t } = useTranslation()
  // Re-render every second while active so the elapsed-time label keeps ticking.
  const [, forceTick] = useState(0)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  // Voice calls render no <video> tile, so the remote audio-only stream needs its own
  // always-mounted sink — otherwise remoteVideoRef.current stays null and no audio ever plays.
  const remoteAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const isVideoCall = callType === CommunityCallType.Video

  // Bind MediaStreams to the <video>/<audio> elements imperatively (srcObject isn't a declarative prop).
  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])
  useEffect(() => {
    const target = isVideoCall ? remoteVideoRef.current : remoteAudioRef.current
    if (!target) return
    target.srcObject = remoteStream ?? null
    if (remoteStream) {
      // autoPlay can be silently blocked by browser autoplay policy; retry explicitly.
      void target.play().catch(() => undefined)
    }
  }, [remoteStream, isVideoCall])

  const isVisible = phase === 'outgoing-ringing' || phase === 'connecting' || phase === 'active' || phase === 'ended'
  if (!isVisible) return null
  const displayName = peerName?.trim() || '—'
  const initials = getHeaderMessageContactInitials(displayName)
  const endedKey = endedReason ? ENDED_REASON_KEY[endedReason] : undefined
  const statusKey = phase === 'ended' ? endedKey : PHASE_STATUS_KEY[phase]
  // Video calls show a dedicated "connecting video" label (US-07 i18n); everything else reuses the
  // shared voice labels.
  const resolvedStatusKey = isVideoCall && statusKey === 'callConnecting' ? 'videoCallConnecting' : statusKey
  // 'active' shows both the "Đang diễn ra" label and a live ticking duration (US-06 AC), everything
  // else shows a single phase/outcome label.
  const statusText = phase === 'active'
    ? `${t(`${I18N}.callActive`)} · ${formatElapsedSince(startedAt)}`
    : resolvedStatusKey
      ? t(`${I18N}.${resolvedStatusKey}`, { name: displayName })
      : ''
  // Only a still-ringing outgoing call is "cancelled" (nothing connected yet) — a connecting/active
  // call is "ended". Both map to the same `endCall()` action; only the button's label differs.
  const hangUpLabelKey = phase === 'outgoing-ringing' ? 'cancelCall' : 'endCall'

  const avatarNode = peerAvatarUrl ? (
    <img src={peerAvatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
  ) : (
    <span
      className="flex h-24 w-24 items-center justify-center rounded-full bg-nexoraBrandSoft text-2xl font-bold text-nexoraBrand"
      aria-hidden="true"
    >
      {initials}
    </span>
  )

  const controls = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={toggleMute}
        aria-label={t(`${I18N}.${isMuted ? 'unmuteCall' : 'muteCall'}`)}
        title={t(`${I18N}.${isMuted ? 'unmuteCall' : 'muteCall'}`)}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
          isMuted ? 'bg-nexoraWarning text-white' : 'bg-nexoraSurfaceMuted text-nexoraText'
        }`}
      >
        {isMuted ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
      </button>
      {isVideoCall ? (
        <button
          type="button"
          onClick={toggleCamera}
          aria-label={t(`${I18N}.toggleCamera`)}
          title={t(`${I18N}.toggleCamera`)}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            isCameraOff ? 'bg-nexoraWarning text-white' : 'bg-nexoraSurfaceMuted text-nexoraText'
          }`}
        >
          {isCameraOff ? <VideoOff className="h-5 w-5" aria-hidden="true" /> : <Video className="h-5 w-5" aria-hidden="true" />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => void endCall()}
        aria-label={t(`${I18N}.${hangUpLabelKey}`)}
        title={t(`${I18N}.${hangUpLabelKey}`)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-nexoraDanger text-white transition hover:opacity-90"
      >
        <PhoneOff className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
    >
      {isVideoCall ? (
        <div className="flex w-full max-w-2xl flex-col items-center gap-5">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-nexoraText shadow-2xl">
            {/* Remote video fills the stage; falls back to avatar + status until the peer's media arrives. */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`h-full w-full object-cover ${remoteStream ? '' : 'hidden'}`}
            />
            {!remoteStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                {avatarNode}
                <div>
                  <p className="text-lg font-bold text-white">{displayName}</p>
                  <p className="mt-1 text-sm font-medium text-white/70">{statusText}</p>
                </div>
              </div>
            ) : (
              <p className="absolute left-4 top-4 rounded-full bg-nexoraText/50 px-3 py-1 text-sm font-medium text-white">
                {statusText}
              </p>
            )}
            {/* Local preview (PiP), mirrored like every consumer camera view. */}
            <div className="absolute bottom-4 right-4 h-36 w-28 overflow-hidden rounded-2xl border border-white/20 bg-nexoraText shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full -scale-x-100 object-cover ${isCameraOff ? 'hidden' : ''}`}
              />
              {isCameraOff ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/70">
                  <VideoOff className="h-6 w-6" aria-hidden="true" />
                  <span className="text-xs font-medium">{t(`${I18N}.cameraOff`)}</span>
                </div>
              ) : null}
            </div>
          </div>
          {controls}
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl bg-nexoraSurface p-8 text-center shadow-2xl">
          {/* No visual surface needed — this is the sink that makes the peer's voice audible. */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
          {avatarNode}
          <div>
            <p className="text-lg font-bold text-nexoraText">{displayName}</p>
            <p className="mt-1 text-sm font-medium text-nexoraMuted">{statusText}</p>
          </div>
          {controls}
        </div>
      )}
    </div>
  )
}
