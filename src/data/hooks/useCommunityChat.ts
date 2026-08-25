import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import communityChatRepository, {
  type ListCommunityChatMessagesParams,
} from '../repositories/communityChat'
import { COMMUNITY_CHAT_MISSING_SESSION_ERROR } from '../../constants/communityChatErrors'
import type {
  AddCommunityChatParticipantInput,
  CommunityChatMessage,
  CommunityChatMessagesPage,
  CommunityChatSession,
  CreateCommunityChatSessionInput,
  RenameCommunityChatSessionInput,
  SendCommunityChatMessageInput,
} from '../../types/communityChat'
import {
  mergeCommunityChatSessionPreviews,
  patchCommunityChatMessagesCache,
  patchCommunityChatSessionLastMessage,
} from '../communityChatCache'

export function useCommunityChatSessions({ enabled = true } = {}) {
  const queryClient = useQueryClient()

  return useQuery<CommunityChatSession[]>({
    queryKey: qk.communityChatSessions(),
    queryFn: async () => {
      const fresh = await communityChatRepository.listSessions()
      const previous = queryClient.getQueryData<CommunityChatSession[]>(
        qk.communityChatSessions(),
      )
      return mergeCommunityChatSessionPreviews(fresh, previous)
    },
    enabled,
    staleTime: 30_000,
  })
}

export function useCommunityChatSession(
  sessionId: string | null | undefined,
  { enabled = true } = {},
) {
  return useQuery<CommunityChatSession>({
    queryKey: qk.communityChatSession(sessionId),
    queryFn: () => communityChatRepository.getSession(sessionId!),
    enabled: enabled && Boolean(sessionId),
  })
}

export function useCommunityChatMessages(
  sessionId: string | null | undefined,
  params: ListCommunityChatMessagesParams = {},
  { enabled = true } = {},
) {
  return useQuery<CommunityChatMessagesPage>({
    queryKey: qk.communityChatMessages(sessionId, params),
    queryFn: () => communityChatRepository.listMessages(sessionId!, params),
    enabled: enabled && Boolean(sessionId),
    staleTime: 15_000,
  })
}

export function useCreateCommunityChatSession() {
  const queryClient = useQueryClient()

  return useMutation<CommunityChatSession, Error, CreateCommunityChatSessionInput>({
    mutationFn: (input) => communityChatRepository.createSession(input),
    onSuccess: (session) => {
      queryClient.setQueryData<CommunityChatSession[]>(
        qk.communityChatSessions(),
        (current) => {
          if (!current) return [session]
          if (current.some((item) => item.id === session.id)) return current
          return [session, ...current]
        },
      )
    },
  })
}

export function useSendCommunityChatMessage(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    CommunityChatMessage,
    Error,
    SendCommunityChatMessageInput & { sessionId?: string }
  >({
    mutationFn: (input) => {
      const id = String(input.sessionId || sessionId || '').trim()
      if (!id) return Promise.reject(new Error(COMMUNITY_CHAT_MISSING_SESSION_ERROR))
      return communityChatRepository.sendMessage(id, { content: input.content })
    },
    onSuccess: (message, variables) => {
      const id = message.chatSessionId || variables.sessionId || sessionId
      patchCommunityChatMessagesCache(queryClient, message)
      patchCommunityChatSessionLastMessage(queryClient, message)
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(id) })
    },
  })
}

export function useSendCommunityChatImage(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    CommunityChatMessage,
    Error,
    File | { file: File; sessionId?: string }
  >({
    mutationFn: (input) => {
      const file = input instanceof File ? input : input.file
      const id = String(
        (input instanceof File ? sessionId : input.sessionId) || sessionId || '',
      ).trim()
      if (!id) return Promise.reject(new Error(COMMUNITY_CHAT_MISSING_SESSION_ERROR))
      return communityChatRepository.sendImage(id, file)
    },
    onSuccess: (message) => {
      patchCommunityChatMessagesCache(queryClient, message)
      patchCommunityChatSessionLastMessage(queryClient, message)
    },
  })
}

export function useMarkCommunityChatSessionRead() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => communityChatRepository.markSessionRead(sessionId),
    onSuccess: (_data, sessionId) => {
      // Patch unread locally — do not invalidate sessions (avoids refetch storms).
      queryClient.setQueryData<CommunityChatSession[]>(
        qk.communityChatSessions(),
        (current) => (
          current
            ? current.map((session) => (
              session.id === sessionId ? { ...session, unreadCount: 0 } : session
            ))
            : current
        ),
      )
      queryClient.setQueryData<CommunityChatSession>(
        qk.communityChatSession(sessionId),
        (current) => (current ? { ...current, unreadCount: 0 } : current),
      )
    },
  })
}

export function useDeleteCommunityChatMessage() {
  return useMutation<void, Error, { messageId: string; sessionId: string }>({
    mutationFn: ({ messageId }) => communityChatRepository.deleteMessage(messageId),
    // Do NOT remove message from cache here - let SignalR "MessageDeleted" event handle it
    // to ensure consistent state across all clients/tabs (US-110)
  })
}

export function useAddCommunityChatParticipant(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, AddCommunityChatParticipantInput>({
    mutationFn: (input) => communityChatRepository.addParticipant(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}

export function useRemoveCommunityChatParticipant(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (userProfileId) => communityChatRepository.removeParticipant(sessionId, userProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}

export function useLeaveCommunityChatSession() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => communityChatRepository.leaveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
    },
  })
}

export function useRenameCommunityChatSession(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, RenameCommunityChatSessionInput>({
    mutationFn: (input) => communityChatRepository.renameSession(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}
