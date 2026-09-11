/**
 * CallOverlay.tsx — in-call UI (US-06, voice-only; Phase 2/US-07 adds the video tile).
 *
 * Covers `outgoing-ringing` (caller waiting for pickup), `connecting` (SDP/ICE exchange right
 * after answer), `active` (media flowing, ticking duration), and a brief `ended` flash before
 * call state auto-resets to idle. `incoming-ringing` is the banner's job, not this component's.
 */

import { useEffect, useState } from 'react'
import { Mic, MicOff, PhoneOff } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { HEADER_MESSAGES_CHAT_I18N } from '../../components/header-messages/headerMessagesConstants'
import { getHeaderMessageContactInitials } from '../../components/header-messages/headerMessagesMappers'
import { CommunityCallEndReason } from '../../constants/communityCall'
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
  const { phase, peerName, peerAvatarUrl, startedAt, isMuted, toggleMute, endCall, endedReason } = useCall()
  const { t } = useTranslation()
  // Re-render every second while active so the elapsed-time label keeps ticking.
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (phase !== 'active') return
    const interval = setInterval(() => forceTick((tick) => tick + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const isVisible = phase === 'outgoing-ringing' || phase === 'connecting' || phase === 'active' || phase === 'ended'
  if (!isVisible) return null

  const displayName = peerName?.trim() || '—'
  const initials = getHeaderMessageContactInitials(displayName)
  const endedKey = endedReason ? ENDED_REASON_KEY[endedReason] : undefined
  const statusKey = phase === 'ended' ? endedKey : PHASE_STATUS_KEY[phase]
  // 'active' shows both the "Đang diễn ra" label and a live ticking duration (US-06 AC), everything
  // else shows a single phase/outcome label.
  const statusText = phase === 'active'
    ? `${t(`${I18N}.callActive`)} · ${formatElapsedSince(startedAt)}`
    : statusKey
      ? t(`${I18N}.${statusKey}`, { name: displayName })
      : ''
  // Only a still-ringing outgoing call is "cancelled" (nothing connected yet) — a connecting/active
  // call is "ended". Both map to the same `endCall()` action; only the button's label differs.
  const hangUpLabelKey = phase === 'outgoing-ringing' ? 'cancelCall' : 'endCall'

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-5 rounded-3xl bg-nexoraSurface p-8 text-center shadow-2xl">
        {peerAvatarUrl ? (
          <img src={peerAvatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <span
            className="flex h-24 w-24 items-center justify-center rounded-full bg-nexoraBrandSoft text-2xl font-bold text-nexoraBrand"
            aria-hidden="true"
          >
            {initials}
          </span>
        )}
        <div>
          <p className="text-lg font-bold text-nexoraText">{displayName}</p>
          <p className="mt-1 text-sm font-medium text-nexoraMuted">{statusText}</p>
        </div>
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
      </div>
    </div>
  )
}
