import { CommunityChatMessageType, CommunityChatType } from '../../constants/communityChat'
import {
  formatCommunityChatLastMessagePreview,
  isSameCommunityChatProfileId,
  resolveCommunityChatPeerDisplayName,
  type ResolveCommunityChatSessionTitleOptions,
} from '../../data/communityChatSessionUtils'
import type { CommunityChatMessage, CommunityChatSession } from '../../types/communityChat'
import { parseApiUtcDateTime } from '../../utils/localDate'
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

export interface MapCommunityChatSessionOptions extends ResolveCommunityChatSessionTitleOptions {
  untitledDirectLabel?: string
  untitledGroupLabel?: string
}

const DEFAULT_UNTITLED_DIRECT_LABEL = 'Conversation'
const DEFAULT_UNTITLED_GROUP_LABEL = 'Group chat'

export function resolveCommunityChatSessionTitle(
  session: CommunityChatSession,
  currentUserProfileId: string,
  options: MapCommunityChatSessionOptions = {},
): string {
  const untitledDirectLabel = options.untitledDirectLabel || DEFAULT_UNTITLED_DIRECT_LABEL
  const untitledGroupLabel = options.untitledGroupLabel || DEFAULT_UNTITLED_GROUP_LABEL

  if (session.chatType === CommunityChatType.Group) {
    const title = session.title?.trim()
    if (title) return title

    const currentId = String(currentUserProfileId ?? '').trim().toLowerCase()
    const names = session.participants
      .filter((participant) => (
        participant.isActive
        && String(participant.userProfileId ?? '').trim().toLowerCase() !== currentId
      ))
      .map((participant) => participant.fullName.trim())
      .filter(Boolean)

    if (names.length > 0) return names.join(', ')

    const businessId = String(session.businessId ?? '').trim()
    const businessName = businessId
      ? options.businessNameById?.get(businessId)?.trim()
      : ''
    return businessName || untitledGroupLabel
  }

  return resolveCommunityChatPeerDisplayName(session, currentUserProfileId, options)
    || untitledDirectLabel
}

export function mapCommunityChatSessionToConversation(
  session: CommunityChatSession,
  currentUserProfileId: string,
  previewKey: HeaderMessageListPreviewKey,
  options: MapCommunityChatSessionOptions = {},
): HeaderMessageConversation {
  const name = resolveCommunityChatSessionTitle(session, currentUserProfileId, options)
  const apiPreview = String(session.lastMessagePreview ?? '').trim()
  const isImagePreview = session.lastMessageType === CommunityChatMessageType.Image
  const textPreview = formatCommunityChatLastMessagePreview(
    session.lastMessagePreview,
    session.lastMessageType,
  )

  return {
    id: session.id,
    name,
    initials: getHeaderMessageContactInitials(name),
    chatType: session.chatType,
    previewKey,
    lastMessagePreviewKey: isImagePreview && !apiPreview ? 'imageReplyPreview' : undefined,
    lastMessagePreviewText: textPreview ?? undefined,
    lastMessageSenderId: session.lastMessageSenderId ?? null,
    updatedAt: session.lastMessageAt ?? '',
    unreadCount: session.unreadCount,
    businessId: String(session.businessId ?? '').trim() || null,
  }
}

export function mapCommunityChatMessageToThreadMessage(
  message: CommunityChatMessage,
  currentUserProfileId: string,
): HeaderChatThreadMessage {
  const isOutgoing = isSameCommunityChatProfileId(message.senderId, currentUserProfileId)
  const isImage = message.messageType === CommunityChatMessageType.Image

  return {
    id: message.id,
    direction: isOutgoing
      ? HeaderChatMessageDirection.Outgoing
      : HeaderChatMessageDirection.Incoming,
    bodyText: isImage ? undefined : message.content,
    imageUrl: isImage ? message.content : undefined,
    sentAt: message.sentAt,
    isDeleted: message.isDeleted,
  }
}

/** API returns newest-first; chat UI renders oldest-first. */
export function sortThreadMessagesForDisplay(
  messages: HeaderChatThreadMessage[],
): HeaderChatThreadMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = parseApiUtcDateTime(left.sentAt)?.getTime() ?? 0
    const rightTime = parseApiUtcDateTime(right.sentAt)?.getTime() ?? 0
    return leftTime - rightTime
  })
}
