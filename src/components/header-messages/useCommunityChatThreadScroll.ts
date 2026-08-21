import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { COMMUNITY_CHAT_THREAD_SCROLL_LOAD_THRESHOLD_PX } from '../../constants/communityChat'

interface UseCommunityChatThreadScrollOptions {
  enabled?: boolean
  /** Reset scroll anchoring when the open session changes. */
  threadKey?: string | null
  messageCount: number
  hasOlderMessages: boolean
  isFetchingOlderMessages: boolean
  isInitialLoading: boolean
  onLoadOlder: () => Promise<unknown> | null | undefined
}

/**
 * Chat thread scroll:
 * - stick to bottom on first paint / new tail messages
 * - when user scrolls near top, load the next older page and keep viewport stable
 */
export function useCommunityChatThreadScroll(
  threadRef: RefObject<HTMLDivElement | null>,
  {
    enabled = true,
    threadKey = null,
    messageCount,
    hasOlderMessages,
    isFetchingOlderMessages,
    isInitialLoading,
    onLoadOlder,
  }: UseCommunityChatThreadScrollOptions,
) {
  const stickToBottomRef = useRef(true)
  const didInitialScrollRef = useRef(false)
  const pendingPrependAdjustRef = useRef(false)
  const previousScrollHeightRef = useRef(0)

  useEffect(() => {
    didInitialScrollRef.current = false
    stickToBottomRef.current = true
    pendingPrependAdjustRef.current = false
  }, [enabled, threadKey])

  useEffect(() => {
    if (!enabled || isInitialLoading) return
    const node = threadRef.current
    if (!node) return

    if (pendingPrependAdjustRef.current) {
      pendingPrependAdjustRef.current = false
      const delta = node.scrollHeight - previousScrollHeightRef.current
      node.scrollTop = Math.max(0, node.scrollTop + delta)
      return
    }

    if (!didInitialScrollRef.current) {
      node.scrollTop = messageCount === 0 ? 0 : node.scrollHeight
      didInitialScrollRef.current = true
      return
    }

    if (stickToBottomRef.current) {
      node.scrollTop = node.scrollHeight
    }
  }, [enabled, isInitialLoading, messageCount, threadRef])

  const handleThreadScroll = useCallback(() => {
    const node = threadRef.current
    if (!node || !enabled) return

    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight
    stickToBottomRef.current = distanceFromBottom <= COMMUNITY_CHAT_THREAD_SCROLL_LOAD_THRESHOLD_PX

    if (
      node.scrollTop > COMMUNITY_CHAT_THREAD_SCROLL_LOAD_THRESHOLD_PX
      || !hasOlderMessages
      || isFetchingOlderMessages
    ) {
      return
    }

    previousScrollHeightRef.current = node.scrollHeight
    pendingPrependAdjustRef.current = true
    void Promise.resolve(onLoadOlder()).then((result) => {
      if (!result) {
        pendingPrependAdjustRef.current = false
      }
    })
  }, [
    enabled,
    hasOlderMessages,
    isFetchingOlderMessages,
    onLoadOlder,
    threadRef,
  ])

  return { handleThreadScroll }
}
