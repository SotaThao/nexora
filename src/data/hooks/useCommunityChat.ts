import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import communityChatRepository, {
  type ListCommunityChatMessagesParams,
} from '../repositories/communityChat'
import type {
  AddCommunityChatParticipantInput,
  CommunityChatMessage,
  CommunityChatMessagesPage,
  CommunityChatSession,
  CreateCommunityChatSessionInput,
  RenameCommunityChatSessionInput,
  SendCommunityChatMessageInput,
} from '../../types/communityChat'

export function useCommunityChatSessions({ enabled = true } = {}) {
  return useQuery<CommunityChatSession[]>({
    queryKey: qk.communityChatSessions(),
    queryFn: () => communityChatRepository.listSessions(),
    enabled,
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
  })
}

export function useCreateCommunityChatSession() {
  const queryClient = useQueryClient()

  return useMutation<CommunityChatSession, Error, CreateCommunityChatSessionInput>({
    mutationFn: (input) => communityChatRepository.createSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
    },
  })
}

export function useSendCommunityChatMessage(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<CommunityChatMessage, Error, SendCommunityChatMessageInput>({
    mutationFn: (input) => communityChatRepository.sendMessage(sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatMessagesRoot(sessionId) })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}

export function useSendCommunityChatImage(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation<CommunityChatMessage, Error, File>({
    mutationFn: (file) => communityChatRepository.sendImage(sessionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatMessagesRoot(sessionId) })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}

export function useMarkCommunityChatSessionRead() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => communityChatRepository.markSessionRead(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatSessions() })
      queryClient.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
    },
  })
}

export function useDeleteCommunityChatMessage() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { messageId: string; sessionId: string }>({
    mutationFn: ({ messageId }) => communityChatRepository.deleteMessage(messageId),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: qk.communityChatMessagesRoot(sessionId) })
    },
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
