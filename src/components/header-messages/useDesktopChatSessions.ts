import { useCallback, useEffect, useState } from 'react'
import {
  layoutDesktopChatSessions,
  resolveDesktopConversationExpand,
  resolveDesktopConversationForceOpen,
  resolveDesktopConversationMinimize,
  resolveDesktopConversationOpen,
  type DesktopChatLayoutContext,
} from './desktopChatSessionHelpers'
import type { HeaderDesktopChatSession, HeaderMessageConversation } from './headerMessagesConstants'

interface UseDesktopChatSessionsOptions {
  enabled: boolean
  messagesPanelOpen: boolean
}

export function useDesktopChatSessions({
  enabled,
  messagesPanelOpen,
}: UseDesktopChatSessionsOptions) {
  const [sessions, setSessions] = useState<HeaderDesktopChatSession[]>([])
  const [focusConversationId, setFocusConversationId] = useState<string | null>(null)

  const buildLayoutContext = useCallback((
    keepExpandedConversationId: string | null = focusConversationId,
  ): DesktopChatLayoutContext => ({
    messagesPanelOpen,
    keepExpandedConversationId,
  }), [focusConversationId, messagesPanelOpen])

  useEffect(() => {
    if (!enabled) return

    function reflowSessions() {
      setSessions((current) => (
        current.length
          ? layoutDesktopChatSessions(current, buildLayoutContext())
          : current
      ))
    }

    reflowSessions()
    window.addEventListener('resize', reflowSessions)
    return () => window.removeEventListener('resize', reflowSessions)
  }, [buildLayoutContext, enabled, focusConversationId, messagesPanelOpen])

  const openConversation = useCallback((conversation: HeaderMessageConversation) => {
    setFocusConversationId(conversation.id)
    setSessions((current) => resolveDesktopConversationOpen(
      current,
      conversation,
      buildLayoutContext(conversation.id),
    ))
  }, [buildLayoutContext])

  const ensureConversationOpen = useCallback((conversation: HeaderMessageConversation) => {
    setFocusConversationId(conversation.id)
    setSessions((current) => resolveDesktopConversationForceOpen(
      current,
      conversation,
      buildLayoutContext(conversation.id),
    ))
  }, [buildLayoutContext])

  const toggleMinimize = useCallback((conversationId: string) => {
    setSessions((current) => {
      const session = current.find((item) => item.conversation.id === conversationId)
      if (!session) return current

      if (session.minimized) {
        setFocusConversationId(conversationId)
        return resolveDesktopConversationExpand(
          current,
          conversationId,
          buildLayoutContext(conversationId),
        )
      }

      setFocusConversationId((currentFocusId) => (
        currentFocusId === conversationId ? null : currentFocusId
      ))
      return resolveDesktopConversationMinimize(
        current,
        conversationId,
        buildLayoutContext(null),
      )
    })
  }, [buildLayoutContext])

  const closeConversation = useCallback((conversationId: string) => {
    setFocusConversationId((currentFocusId) => (
      currentFocusId === conversationId ? null : currentFocusId
    ))
    setSessions((current) => current.filter(
      (session) => session.conversation.id !== conversationId,
    ))
  }, [])

  return {
    sessions,
    focusConversationId,
    openConversation,
    ensureConversationOpen,
    toggleMinimize,
    closeConversation,
  }
}
