import { CommunityChatMessageType, CommunityChatType } from '../../constants/communityChat'
import type { CommunityChatMessage, CommunityChatSession } from '../../types/communityChat'
import {
  HeaderChatMessageDirection,
  HeaderMessageListPreviewKey,
  type HeaderChatThreadMessage,
  type HeaderMessageConversation,
} from './headerMessagesConstants'

export function getHeaderMessageContactInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function resolveCommunityChatSessionTitle(
  session: CommunityChatSession,
  currentUserProfileId: string,
): string {
  if (session.chatType === CommunityChatType.Group) {
    const title = session.title?.trim()
    if (title) return title

    const names = session.participants
      .filter((participant) => participant.isActive && participant.userProfileId !== currentUserProfileId)
      .map((participant) => participant.fullName)
      .filter(Boolean)

    if (names.length > 0) return names.join(', ')
    return 'Group chat'
  }

  const other = session.participants.find(
    (participant) => participant.isActive && participant.userProfileId !== currentUserProfileId,
  )
  return other?.fullName?.trim() || 'Chat'
}

export function mapCommunityChatSessionToConversation(
  session: CommunityChatSession,
  currentUserProfileId: string,
  previewKey: HeaderMessageListPreviewKey,
): HeaderMessageConversation {
  const name = resolveCommunityChatSessionTitle(session, currentUserProfileId)

  return {
    id: session.id,
    name,
    initials: getHeaderMessageContactInitials(name),
    chatType: session.chatType,
    previewKey,
    updatedAt: session.lastMessageAt ?? '',
    unreadCount: session.unreadCount,
  }
}

export function mapCommunityChatMessageToThreadMessage(
  message: CommunityChatMessage,
  currentUserProfileId: string,
): HeaderChatThreadMessage {
  const isOutgoing = message.senderId === currentUserProfileId
  const isImage = message.messageType === CommunityChatMessageType.Image

  return {
    id: message.id,
    direction: isOutgoing
      ? HeaderChatMessageDirection.Outgoing
      : HeaderChatMessageDirection.Incoming,
    bodyText: isImage ? undefined : message.content,
    imageUrl: isImage ? message.content : undefined,
    sentAt: message.sentAt,
  }
}

/** API returns newest-first; chat UI renders oldest-first. */
export function sortThreadMessagesForDisplay(
  messages: HeaderChatThreadMessage[],
): HeaderChatThreadMessage[] {
  return [...messages].sort(
    (left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
  )
}
