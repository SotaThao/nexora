import { useEffect } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT } from './communityChatRealtime'
import { HEADER_MESSAGES_CHAT_I18N } from './headerMessagesConstants'

interface UseCommunityChatHubSendErrorToastOptions {
  /** Override default chat send-error i18n key. */
  fallbackErrorKey?: string
}

/** Surface SignalR MessageError events as toasts while a chat composer is mounted. */
export function useCommunityChatHubSendErrorToast({
  fallbackErrorKey = `${HEADER_MESSAGES_CHAT_I18N}.sendError`,
}: UseCommunityChatHubSendErrorToastOptions = {}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  useEffect(() => {
    function handleHubMessageError(event: Event) {
      const detail = (event as CustomEvent<{ message?: string }>).detail
      const message = String(detail?.message ?? '').trim()
      showToast(message || t(fallbackErrorKey), 'error')
    }

    window.addEventListener(COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT, handleHubMessageError)
    return () => {
      window.removeEventListener(COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT, handleHubMessageError)
    }
  }, [fallbackErrorKey, showToast, t])
}
