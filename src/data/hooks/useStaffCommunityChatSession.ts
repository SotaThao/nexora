import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  canStaffMemberUseCommunityChat,
  findStaffCommunityChatSession,
  resolveStaffChatParticipantUserProfileId,
  type StaffChatMemberLike,
} from '../../components/staff/staffCommunityChatUtils'
import type { CommunityChatSession } from '../../types/communityChat'
import { useProfileSettings } from './useProfileSettings'
import { useCommunityChatSessions, useCreateCommunityChatSession } from './useCommunityChat'

interface UseStaffCommunityChatSessionOptions {
  enabled?: boolean
}

/** Dedupes Strict Mode / remount create races for the same peer. */
const pendingSessionCreates = new Map<string, Promise<CommunityChatSession>>()

function getStaffChatCreateKey(businessId: string, participantUserProfileId: string) {
  return `${businessId}:${participantUserProfileId}`
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

  const participantUserProfileId = useMemo(
    () => (
      staffMember
        ? resolveStaffChatParticipantUserProfileId(staffMember)
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

  const staffKey = staffMember?.userProfileId
    ?? staffMember?.staffProfileId
    ?? staffMember?.staffCode
    ?? staffMember?.id
    ?? ''

  useEffect(() => {
    bootstrapAttemptedRef.current = false
    setChatSessionId(null)
    setBootstrapError(null)
  }, [staffKey])

  useEffect(() => {
    if (!chatAvailable || sessionsQuery.isLoading || sessionsQuery.isFetching) return

    if (existingSession?.id) {
      setChatSessionId(existingSession.id)
      return
    }

    if (!participantUserProfileId || !businessId) return
    if (bootstrapAttemptedRef.current) return
    bootstrapAttemptedRef.current = true

    const createKey = getStaffChatCreateKey(businessId, participantUserProfileId)
    let createPromise = pendingSessionCreates.get(createKey)
    if (!createPromise) {
      createPromise = createSessionMutation.mutateAsync({
        businessId,
        participantUserProfileIds: [participantUserProfileId],
      })
      pendingSessionCreates.set(createKey, createPromise)
      createPromise.finally(() => {
        pendingSessionCreates.delete(createKey)
      })
    }

    createPromise
      .then((session) => setChatSessionId(session.id))
      .catch((error) => {
        bootstrapAttemptedRef.current = false
        setBootstrapError(error)
      })
    // createSessionMutation identity is stable; omit to avoid re-bootstrap loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    businessId,
    chatAvailable,
    existingSession?.id,
    participantUserProfileId,
    sessionsQuery.isFetching,
    sessionsQuery.isLoading,
  ])

  const unavailableReason = !chatAvailable
    ? 'ineligible'
    : !participantUserProfileId && !existingSession
      ? 'no_user_profile'
      : null

  const isBootstrapping = chatAvailable && (
    sessionsQuery.isLoading
    || sessionsQuery.isFetching
    || createSessionMutation.isPending
    || (
      !chatSessionId
      && !bootstrapError
      && Boolean(participantUserProfileId && businessId)
    )
  )

  return {
    chatSessionId,
    chatAvailable,
    isReady: Boolean(chatSessionId),
    isBootstrapping,
    bootstrapError,
    participantUserProfileId,
    /** @deprecated Prefer participantUserProfileId */
    participantStaffProfileId: participantUserProfileId,
    unavailableReason,
    sessionsError: sessionsQuery.isError,
  }
}
