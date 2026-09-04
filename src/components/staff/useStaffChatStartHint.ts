import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  STAFF_CHAT_START_HINT_QUERY,
  STAFF_CHAT_START_HINT_VALUE,
} from './constants'
import {
  getFirstCommunityChatEligibleStaff,
  getStaffChatWindowKey,
  isStaffChatStartHintMember,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

export function useStaffChatStartHint() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isActive = searchParams.get(STAFF_CHAT_START_HINT_QUERY) === STAFF_CHAT_START_HINT_VALUE

  const dismiss = useCallback(() => {
    if (!searchParams.has(STAFF_CHAT_START_HINT_QUERY)) return
    const next = new URLSearchParams(searchParams)
    next.delete(STAFF_CHAT_START_HINT_QUERY)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  return { isActive, dismiss }
}

export function useStaffListChatStartHint(staff: StaffChatMemberLike[]) {
  const { isActive, dismiss } = useStaffChatStartHint()
  const firstEligibleWindowKey = useMemo(
    () => getStaffChatWindowKey(getFirstCommunityChatEligibleStaff(staff)),
    [staff],
  )

  const showStartHintForMember = useCallback(
    (member: StaffChatMemberLike) =>
      isActive && isStaffChatStartHintMember(member, firstEligibleWindowKey),
    [firstEligibleWindowKey, isActive],
  )

  return { showStartHintForMember, dismissChatStartHint: dismiss }
}
