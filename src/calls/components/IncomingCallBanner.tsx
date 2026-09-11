/**
 * IncomingCallBanner.tsx — global incoming-call banner (US-06).
 *
 * Mounted once at the app root (`CallOverlayHost`, see `App.tsx`) so it renders regardless of
 * which page/header is currently mounted — the caller's name/avatar come straight off the
 * `IncomingCall` payload already held in call state, no extra fetch needed.
 */

import { Phone, PhoneOff } from 'lucide-react'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { HEADER_MESSAGES_CHAT_I18N } from '../../components/header-messages/headerMessagesConstants'
import { getHeaderMessageContactInitials } from '../../components/header-messages/headerMessagesMappers'
import useIceServers from '../../data/hooks/useIceServers'
import { logger } from '../../utils/logger'
import useCall from '../useCall'

const I18N = HEADER_MESSAGES_CHAT_I18N

export default function IncomingCallBanner() {
  const { phase, peerName, peerAvatarUrl, answerCall, rejectCall } = useCall()
  // Fetched as soon as this (always-mounted) component renders — by the time a real call rings,
  // credentials are long cached (US-06 Technical Notes #2: never await this inside a click handler).
  const { data: iceServers } = useIceServers()
  const { t } = useTranslation()
  const { showToast } = useNotification()

  if (phase !== 'incoming-ringing') return null

  const displayName = peerName?.trim() || '—'
  const initials = getHeaderMessageContactInitials(displayName)

  const handleDecline = () => {
    showToast(t(`${I18N}.callDeclinedBySelf`), 'info')
    void rejectCall()
  }

  const handleAnswer = () => {
    if (!iceServers?.length) {
      showToast(t(`${I18N}.callNetworkError`), 'error')
      return
    }
    // getUserMedia must be the very first call in this handler, no prior `await` — Safari drops
    // gesture attribution otherwise and silently blocks the mic (US-06 AC).
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        void answerCall({ localStream: stream, iceServers })
      })
      .catch((error: unknown) => {
        logger.warn('Community call: getUserMedia failed answering incoming call', error)
        const deviceMissing = error instanceof DOMException && error.name === 'NotFoundError'
        showToast(t(`${I18N}.${deviceMissing ? 'callNoDeviceFound' : 'callMicPermissionDenied'}`), 'error')
        // Don't leave the caller ringing indefinitely just because we couldn't get a mic (US-06 AC).
        void rejectCall()
      })
  }

  return (
    <div
      className="fixed inset-x-0 top-3 z-[9000] flex justify-center px-3"
      role="alertdialog"
      aria-label={t(`${I18N}.incomingCallTitle`)}
    >
      <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-3 shadow-2xl">
        {peerAvatarUrl ? (
          <img src={peerAvatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-sm font-bold text-nexoraBrand"
            aria-hidden="true"
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-nexoraSubtle">
            {t(`${I18N}.incomingCallTitle`)}
          </p>
          <p className="truncate text-sm font-bold text-nexoraText">{displayName}</p>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          aria-label={t(`${I18N}.declineCall`)}
          title={t(`${I18N}.declineCall`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nexoraDanger text-white transition hover:opacity-90"
        >
          <PhoneOff className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleAnswer}
          aria-label={t(`${I18N}.answerCall`)}
          title={t(`${I18N}.answerCall`)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nexoraSuccess text-white transition hover:opacity-90"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
