import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  canStaffMemberUseCommunityChat,
  findStaffCommunityChatSession,
  getStaffChatWindowKey,
  resolveStaffChatParticipantUserProfileId,
  resolveStaffChatUnavailableReason,
  type StaffChatMemberLike,
} from '../../components/staff/staffCommunityChatUtils'
import { STAFF_CHAT_ENSURE_SESSION_PRECONDITION_ERROR } from '../../components/staff/constants'
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

function attachSessionId(
  sessionId: string,
  setChatSessionId: (id: string | null) => void,
  chatSessionIdRef: { current: string | null },
) {
  chatSessionIdRef.current = sessionId
  setChatSessionId(sessionId)
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

  const participantUserProfileId = useMemo(
    () => (staffMember ? resolveStaffChatParticipantUserProfileId(staffMember) : null),
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
  const chatSessionIdRef = useRef<string | null>(null)
  const staffKey = getStaffChatWindowKey(staffMember)

  useEffect(() => {
    chatSessionIdRef.current = null
    setChatSessionId(null)
    setBootstrapError(null)
  }, [staffKey])

  useEffect(() => {
    if (!chatAvailable || sessionsQuery.isLoading || sessionsQuery.isFetching) return
    if (!existingSession?.id) return
    attachSessionId(existingSession.id, setChatSessionId, chatSessionIdRef)
  }, [
    chatAvailable,
    existingSession?.id,
    sessionsQuery.isFetching,
    sessionsQuery.isLoading,
  ])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (chatSessionIdRef.current) return chatSessionIdRef.current
    if (existingSession?.id) {
      attachSessionId(existingSession.id, setChatSessionId, chatSessionIdRef)
      return existingSession.id
    }
    if (!participantUserProfileId || !businessId) {
      throw new Error(STAFF_CHAT_ENSURE_SESSION_PRECONDITION_ERROR)
    }

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

    try {
      const session = await createPromise
      attachSessionId(session.id, setChatSessionId, chatSessionIdRef)
      setBootstrapError(null)
      return session.id
    } catch (error) {
      setBootstrapError(error)
      throw error
    }
  }, [
    businessId,
    createSessionMutation,
    existingSession?.id,
    participantUserProfileId,
  ])

  const unavailableReason = resolveStaffChatUnavailableReason({
    chatAvailable,
    participantUserProfileId,
    hasExistingSession: Boolean(existingSession),
  })

  const canComposeNew = Boolean(participantUserProfileId && businessId)
  const sessionsSettled = !sessionsQuery.isLoading && !sessionsQuery.isFetching

  /** Sessions list loaded — existing thread attached, or new chat can compose without create yet. */
  const isReady = chatAvailable && sessionsSettled && (
    Boolean(chatSessionId)
    || (canComposeNew && !sessionsQuery.isError)
  )

  const isBootstrapping = chatAvailable && !sessionsSettled

  return {
    chatSessionId,
    chatAvailable,
    isReady,
    isBootstrapping,
    bootstrapError,
    ensureSession,
    participantUserProfileId,
    /** @deprecated Prefer participantUserProfileId */
    participantStaffProfileId: participantUserProfileId,
    unavailableReason,
    sessionsError: sessionsQuery.isError,
  }
}
