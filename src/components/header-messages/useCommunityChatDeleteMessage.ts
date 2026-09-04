import { useCallback, useState } from 'react'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { useDeleteCommunityChatMessage } from '../../data/hooks/useCommunityChat'
import { resolveTranslatedApiError } from '../../utils/resolveTranslatedApiError'
import {
  HEADER_MESSAGES_CHAT_I18N,
  HeaderChatMessageDirection,
  type HeaderChatThreadMessage,
} from './headerMessagesConstants'

interface UseCommunityChatDeleteMessageOptions {
  sessionId: string | null | undefined
  onDeleted?: (messageId: string) => void
}

/**
 * Shared delete-own-message flow: confirm dialog → API → cache patch.
 */
export function useCommunityChatDeleteMessage({
  sessionId,
  onDeleted,
}: UseCommunityChatDeleteMessageOptions) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const deleteMessageMutation = useDeleteCommunityChatMessage()
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const chatTk = HEADER_MESSAGES_CHAT_I18N

  const deleteMessage = useCallback(async (message: HeaderChatThreadMessage) => {
    const activeSessionId = String(sessionId ?? '').trim()
    if (!activeSessionId) return
    if (message.direction !== HeaderChatMessageDirection.Outgoing) return
    if (deletingMessageId) return

    const confirmed = await showConfirm(
      t(`${chatTk}.deleteConfirm`),
      t(`${chatTk}.deleteConfirmTitle`),
    )
    if (!confirmed) return

    setDeletingMessageId(message.id)
    try {
      await deleteMessageMutation.mutateAsync({
        messageId: message.id,
        sessionId: activeSessionId,
      })
      onDeleted?.(message.id)
    } catch (error) {
      showToast(
        resolveTranslatedApiError(t, error, `${chatTk}.deleteError`),
        'error',
      )
    } finally {
      setDeletingMessageId(null)
    }
  }, [
    chatTk,
    deleteMessageMutation,
    deletingMessageId,
    onDeleted,
    sessionId,
    showConfirm,
    showToast,
    t,
  ])

  return {
    deletingMessageId,
    isDeleting: Boolean(deletingMessageId),
    deleteMessage,
  }
}
