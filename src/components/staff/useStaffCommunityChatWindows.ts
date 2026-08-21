import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getHeaderMessageChatStackRightPx,
  type HeaderDesktopChatSession,
  type HeaderMessageConversation,
} from '../header-messages/headerMessagesConstants'
import {
  layoutDesktopChatSessions,
  minimizeDesktopChatSessionInPlace,
  resolveDesktopConversationExpand,
  resolveDesktopConversationForceOpen,
} from '../header-messages/desktopChatSessionHelpers'
import {
  getStaffChatWindowKey,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

export interface StaffCommunityChatWindow {
  member: StaffChatMemberLike
  minimized: boolean
}

const STAFF_CHAT_STRIP_CONTEXT = { messagesPanelOpen: false } as const

function toLayoutSessions(windows: StaffCommunityChatWindow[]): HeaderDesktopChatSession[] {
  return windows.map((windowItem) => ({
    conversation: { id: getStaffChatWindowKey(windowItem.member) } as HeaderMessageConversation,
    minimized: windowItem.minimized,
  }))
}

/** Map layout result back onto staff members; dropped sessions are closed. */
function applyLayout(
  windows: StaffCommunityChatWindow[],
  layout: HeaderDesktopChatSession[],
): StaffCommunityChatWindow[] {
  const membersByKey = new Map(
    windows.map((windowItem) => [getStaffChatWindowKey(windowItem.member), windowItem.member]),
  )
  return layout.flatMap((session) => {
    const member = membersByKey.get(session.conversation.id)
    if (!member) return []
    return [{ member, minimized: session.minimized }]
  })
}

function layoutWindows(
  windows: StaffCommunityChatWindow[],
  keepExpandedKey: string | null = null,
): StaffCommunityChatWindow[] {
  if (!windows.length) return windows
  return applyLayout(
    windows,
    layoutDesktopChatSessions(toLayoutSessions(windows), {
      ...STAFF_CHAT_STRIP_CONTEXT,
      keepExpandedConversationId: keepExpandedKey,
    }),
  )
}

/**
 * Desktop multi-window staff chats.
 * Overflow reuses header-messenger strip rules:
 * minimize oldest expanded first, then close oldest when still overflowing.
 */
export function useStaffCommunityChatWindows() {
  const [windows, setWindows] = useState<StaffCommunityChatWindow[]>([])
  const [focusKey, setFocusKey] = useState<string | null>(null)

  useEffect(() => {
    function reflow() {
      setWindows((current) => (
        current.length ? layoutWindows(current, focusKey) : current
      ))
    }

    reflow()
    window.addEventListener('resize', reflow)
    return () => window.removeEventListener('resize', reflow)
  }, [focusKey])

  const openWindow = useCallback((member: StaffChatMemberLike) => {
    const key = getStaffChatWindowKey(member)
    if (!key) return

    setFocusKey(key)
    setWindows((current) => {
      const membersByKey = new Map(
        current.map((windowItem) => [getStaffChatWindowKey(windowItem.member), windowItem.member]),
      )
      membersByKey.set(key, member)

      const nextSessions = resolveDesktopConversationForceOpen(
        toLayoutSessions(current),
        { id: key } as HeaderMessageConversation,
        { ...STAFF_CHAT_STRIP_CONTEXT, keepExpandedConversationId: key },
      )

      return nextSessions.flatMap((session) => {
        const staffMember = membersByKey.get(session.conversation.id)
        if (!staffMember) return []
        return [{ member: staffMember, minimized: session.minimized }]
      })
    })
  }, [])

  const closeWindow = useCallback((member: StaffChatMemberLike) => {
    const key = getStaffChatWindowKey(member)
    setFocusKey((current) => (current === key ? null : current))
    setWindows((current) => layoutWindows(
      current.filter((windowItem) => getStaffChatWindowKey(windowItem.member) !== key),
      null,
    ))
  }, [])

  const toggleMinimize = useCallback((member: StaffChatMemberLike) => {
    const key = getStaffChatWindowKey(member)
    setWindows((current) => {
      const target = current.find(
        (windowItem) => getStaffChatWindowKey(windowItem.member) === key,
      )
      if (!target) return current

      const sessions = toLayoutSessions(current)

      if (target.minimized) {
        setFocusKey(key)
        return applyLayout(
          current,
          resolveDesktopConversationExpand(sessions, key, {
            ...STAFF_CHAT_STRIP_CONTEXT,
            keepExpandedConversationId: key,
          }),
        )
      }

      setFocusKey((currentFocus) => (currentFocus === key ? null : currentFocus))
      return applyLayout(
        current,
        layoutDesktopChatSessions(
          minimizeDesktopChatSessionInPlace(sessions, key),
          { ...STAFF_CHAT_STRIP_CONTEXT, keepExpandedConversationId: null },
        ),
      )
    })
  }, [])

  const focusWindow = useCallback((member: StaffChatMemberLike) => {
    const key = getStaffChatWindowKey(member)
    if (!key) return
    setFocusKey(key)
  }, [])

  const stackSessions = useMemo(() => toLayoutSessions(windows), [windows])

  return {
    windows,
    focusKey,
    openWindow,
    closeWindow,
    toggleMinimize,
    focusWindow,
    getStackRightPx: (index: number) => getHeaderMessageChatStackRightPx(stackSessions, index),
  }
}
