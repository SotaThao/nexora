import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  canStaffMemberUseCommunityChat,
  findStaffCommunityChatSession,
  resolveStaffChatParticipantStaffProfileId,
  type StaffChatMemberLike,
} from '../../components/staff/staffCommunityChatUtils'
import { useProfileSettings } from './useProfileSettings'
import { useCommunityChatSessions, useCreateCommunityChatSession } from './useCommunityChat'

interface UseStaffCommunityChatSessionOptions {
  enabled?: boolean
}

export function useStaffCommunityChatSession(
  staffMember: StaffChatMemberLike | null | undefined,
  { enabled = true }: UseStaffCommunityChatSessionOptions = {},
) {
  const { session: authSession, status } = useAuth()
  const { data: profile } = useProfileSettings({ enabled })
  const currentUserProfileId = authSession?.id ?? ''
  const businessId = String(profile?.business?.businessId ?? profile?.business?.id ?? '').trim()
  const chatAvailable = enabled && canStaffMemberUseCommunityChat(staffMember)

  const sessionsQuery = useCommunityChatSessions({
    enabled: chatAvailable && status === 'authenticated',
  })

  const createSessionMutation = useCreateCommunityChatSession()
  const bootstrapAttemptedRef = useRef(false)

  const participantStaffProfileId = useMemo(
    () => (
      staffMember
        ? resolveStaffChatParticipantStaffProfileId(staffMember)
        : null
    ),
    [staffMember],
  )

  const existingSession = useMemo(
    () => (
      staffMember
        ? findStaffCommunityChatSession(
            staffMember,
            sessionsQuery.data ?? [],
            currentUserProfileId,
          )
        : null
    ),
    [currentUserProfileId, sessionsQuery.data, staffMember],
  )

  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [bootstrapError, setBootstrapError] = useState<unknown>(null)

  const staffKey = staffMember?.staffProfileId ?? staffMember?.staffCode ?? staffMember?.id ?? ''

  useEffect(() => {
    bootstrapAttemptedRef.current = false
    setChatSessionId(null)
    setBootstrapError(null)
  }, [staffKey])

  useEffect(() => {
    if (!chatAvailable || sessionsQuery.isLoading) return

    if (existingSession?.id) {
      setChatSessionId(existingSession.id)
      return
    }

    if (!participantStaffProfileId || !businessId) return
    if (bootstrapAttemptedRef.current) return
    bootstrapAttemptedRef.current = true

    createSessionMutation.mutateAsync({
      businessId,
      participantUserProfileIds: [participantStaffProfileId],
    })
      .then((session) => setChatSessionId(session.id))
      .catch((error) => setBootstrapError(error))
  }, [
    businessId,
    chatAvailable,
    existingSession?.id,
    participantStaffProfileId,
    sessionsQuery.isLoading,
  ])

  const unavailableReason = !chatAvailable
    ? 'ineligible'
    : !participantStaffProfileId && !existingSession
      ? 'no_staff_profile'
      : null

  const isBootstrapping = chatAvailable && (
    sessionsQuery.isLoading
    || createSessionMutation.isPending
    || (
      !chatSessionId
      && !bootstrapError
      && Boolean(participantStaffProfileId && businessId)
    )
  )

  return {
    chatSessionId,
    chatAvailable,
    isReady: Boolean(chatSessionId),
    isBootstrapping,
    bootstrapError,
    participantStaffProfileId,
    unavailableReason,
    sessionsError: sessionsQuery.isError,
  }
}
