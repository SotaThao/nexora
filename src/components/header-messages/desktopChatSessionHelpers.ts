import {
  expandDesktopChatSessionInPlace,
  normalizeDesktopChatSessions,
  promoteDesktopChatSession,
  type HeaderDesktopChatSession,
  type HeaderMessageConversation,
} from './headerMessagesConstants'

export interface DesktopChatLayoutContext {
  messagesPanelOpen: boolean
  keepExpandedConversationId?: string | null
}

export function getHeaderMessagesViewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280
}

export function layoutDesktopChatSessions(
  sessions: HeaderDesktopChatSession[],
  context: DesktopChatLayoutContext,
  viewportWidth = getHeaderMessagesViewportWidth(),
): HeaderDesktopChatSession[] {
  return normalizeDesktopChatSessions(
    sessions,
    viewportWidth,
    context.messagesPanelOpen,
    context.keepExpandedConversationId,
  )
}

export function minimizeDesktopChatSessionInPlace(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
): HeaderDesktopChatSession[] {
  return sessions.map((session) => (
    session.conversation.id === conversationId
      ? { ...session, minimized: true }
      : session
  ))
}

export function resolveDesktopConversationOpen(
  sessions: HeaderDesktopChatSession[],
  conversation: HeaderMessageConversation,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  const existingIndex = sessions.findIndex(
    (session) => session.conversation.id === conversation.id,
  )

  if (existingIndex < 0) {
    return layoutDesktopChatSessions(
      promoteDesktopChatSession(sessions, conversation),
      { ...context, keepExpandedConversationId: conversation.id },
    )
  }

  const existing = sessions[existingIndex]
  if (!existing.minimized) {
    return minimizeDesktopChatSessionInPlace(sessions, conversation.id)
  }

  return layoutDesktopChatSessions(
    expandDesktopChatSessionInPlace(sessions, conversation.id),
    { ...context, keepExpandedConversationId: conversation.id },
  )
}

/** Always expand (never toggle-minimize). Used when opening from a notification. */
export function resolveDesktopConversationForceOpen(
  sessions: HeaderDesktopChatSession[],
  conversation: HeaderMessageConversation,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  const existingIndex = sessions.findIndex(
    (session) => session.conversation.id === conversation.id,
  )

  if (existingIndex < 0) {
    return layoutDesktopChatSessions(
      promoteDesktopChatSession(sessions, conversation),
      { ...context, keepExpandedConversationId: conversation.id },
    )
  }

  return layoutDesktopChatSessions(
    expandDesktopChatSessionInPlace(sessions, conversation.id),
    { ...context, keepExpandedConversationId: conversation.id },
  )
}

export function resolveDesktopConversationExpand(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  return layoutDesktopChatSessions(
    expandDesktopChatSessionInPlace(sessions, conversationId),
    { ...context, keepExpandedConversationId: conversationId },
  )
}

export function resolveDesktopConversationMinimize(
  sessions: HeaderDesktopChatSession[],
  conversationId: string,
  context: DesktopChatLayoutContext,
): HeaderDesktopChatSession[] {
  return layoutDesktopChatSessions(
    minimizeDesktopChatSessionInPlace(sessions, conversationId),
    { ...context, keepExpandedConversationId: null },
  )
}
