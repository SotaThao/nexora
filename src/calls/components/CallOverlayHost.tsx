/**
 * CallOverlayHost.tsx — single mount point for the call feature's global UI (US-06 AC).
 *
 * Mounted once in `App.tsx` beside `<KybGateProvider>` — banner/overlay must render regardless of
 * which page or header is currently on screen, not depend on `HeaderMessages.tsx` being mounted.
 * Both children stay mounted at all times (not gated behind call phase) so `IncomingCallBanner`'s
 * ICE-server prefetch starts on app load, not when a call first rings.
 */

import { useEffect, useRef } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { HEADER_MESSAGES_CHAT_I18N } from '../../components/header-messages/headerMessagesConstants'
import useCall from '../useCall'
import CallOverlay from './CallOverlay'
import IncomingCallBanner from './IncomingCallBanner'

const I18N = HEADER_MESSAGES_CHAT_I18N

/**
 * The signaling Hub only forwards `HubException.message` (raw text, no structured error code —
 * see `CommunityChatHub.cs`), so this is a best-effort keyword match for the one common failure
 * (`CommunityCallService.InitiateCallAsync`'s "already in a call" busy-check) rather than a real
 * error-code lookup. Anything else falls back to a generic connection-error message.
 */
function resolveCallErrorMessageKey(message: string): string {
  return message.toLowerCase().includes('already in a call') ? 'callBusy' : 'callNetworkError'
}

export default function CallOverlayHost() {
  const { error } = useCall()
  const { showToast } = useNotification()
  const { t } = useTranslation()
  const previousErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (error && error !== previousErrorRef.current) {
      showToast(t(`${I18N}.${resolveCallErrorMessageKey(error)}`), 'error')
    }
    previousErrorRef.current = error
  }, [error, showToast, t])

  return (
    <>
      <IncomingCallBanner />
      <CallOverlay />
    </>
  )
}
