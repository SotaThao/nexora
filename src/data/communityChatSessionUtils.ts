import { CommunityChatMessageType, CommunityChatType } from '../constants/communityChat'
import type {
  CommunityChatMessage,
  CommunityChatParticipant,
  CommunityChatSession,
} from '../types/communityChat'

function normalizeProfileId(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

/** Compare userProfileId / senderId safely (API casing can differ). */
export function normalizeCommunityChatProfileId(value: string | null | undefined): string {
  return normalizeProfileId(value)
}

export function isSameCommunityChatProfileId(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeProfileId(left)
  const b = normalizeProfileId(right)
  return Boolean(a && b && a === b)
}

/** Other active participant in a 1:1 session (excludes current user). */
export function getOneOnOnePeerParticipant(
  session: CommunityChatSession,
  currentUserProfileId: string,
): CommunityChatParticipant | null {
  if (session.chatType !== CommunityChatType.OneOnOne) return null

  const currentId = normalizeProfileId(currentUserProfileId)
  const active = session.participants.filter(
    (participant) => participant.isActive && normalizeProfileId(participant.userProfileId),
  )
  if (active.length === 0) return null

  const others = currentId
    ? active.filter((participant) => normalizeProfileId(participant.userProfileId) !== currentId)
    : active

  if (others.length === 1) return others[0]
  if (others.length > 1) {
    return others.find((participant) => participant.fullName.trim()) ?? others[0]
  }

  // Auth id did not match any participant — prefer a named peer over self-guess.
  return active.find((participant) => participant.fullName.trim()) ?? active[0]
}

export function getOneOnOnePeerUserProfileId(
  session: CommunityChatSession,
  currentUserProfileId: string,
): string | null {
  return getOneOnOnePeerParticipant(session, currentUserProfileId)?.userProfileId?.trim() || null
}

export interface ResolveCommunityChatSessionTitleOptions {
  /** businessId → display name (staff linked salons / merchant business). */
  businessNameById?: ReadonlyMap<string, string> | null
}

export function resolveCommunityChatPeerDisplayName(
  session: CommunityChatSession,
  currentUserProfileId: string,
  options: ResolveCommunityChatSessionTitleOptions = {},
): string | null {
  const titled = session.title?.trim()
  if (titled) return titled

  const peer = getOneOnOnePeerParticipant(session, currentUserProfileId)
  const peerName = peer?.fullName?.trim()
  if (peerName) return peerName

  const businessId = String(session.businessId ?? '').trim()
  const businessName = businessId
    ? options.businessNameById?.get(businessId)?.trim()
    : ''
  if (businessName) return businessName

  return null
}

function sessionLastMessageTime(session: CommunityChatSession): number {
  const raw = session.lastMessageAt
  if (!raw) return 0
  const time = new Date(raw).getTime()
  return Number.isFinite(time) ? time : 0
}

/** Prefer the session that already has traffic / is most recent. */
export function preferCommunityChatSession(
  left: CommunityChatSession,
  right: CommunityChatSession,
): CommunityChatSession {
  const leftTime = sessionLastMessageTime(left)
  const rightTime = sessionLastMessageTime(right)
  if (leftTime !== rightTime) return leftTime > rightTime ? left : right
  if ((left.unreadCount ?? 0) !== (right.unreadCount ?? 0)) {
    return (left.unreadCount ?? 0) > (right.unreadCount ?? 0) ? left : right
  }
  return left
}

/**
 * Collapse duplicate 1:1 sessions for the same peer (BE may return multiples
 * after Strict Mode / race creates). Groups stay one row each.
 */
export function dedupeCommunityChatSessions(
  sessions: CommunityChatSession[],
  currentUserProfileId: string,
): CommunityChatSession[] {
  const oneOnOneByPeer = new Map<string, CommunityChatSession>()
  const rest: CommunityChatSession[] = []

  sessions.forEach((session) => {
    const peerId = getOneOnOnePeerUserProfileId(session, currentUserProfileId)
    if (!peerId) {
      rest.push(session)
      return
    }

    const existing = oneOnOneByPeer.get(peerId)
    if (!existing) {
      oneOnOneByPeer.set(peerId, session)
      return
    }
    oneOnOneByPeer.set(peerId, preferCommunityChatSession(existing, session))
  })

  return [...oneOnOneByPeer.values(), ...rest]
}

export function formatCommunityChatLastMessagePreview(
  content: string | null | undefined,
  messageType: CommunityChatMessageType | null | undefined,
): string | null {
  if (messageType === CommunityChatMessageType.Image) return null
  const text = String(content ?? '').trim()
  return text || null
}

export function applyLastMessageToSession(
  session: CommunityChatSession,
  message: CommunityChatMessage,
): CommunityChatSession {
  if (session.id !== message.chatSessionId) return session
  return {
    ...session,
    lastMessageAt: message.sentAt || session.lastMessageAt,
    lastMessageContent: message.content,
    lastMessageType: message.messageType,
  }
}
