import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommunityAuth } from '../../components/community/CommunityAuth'
import type { SupabaseDisplayError } from '../../lib/supabaseError'
import { qk } from '../queryKeys'
import { directMessagesRepository } from '../repositories/community'
import type { DirectChannelDto, DirectMessageProfileDto } from '../repositories/community'

type DirectMessageError = SupabaseDisplayError

function useDirectMessageQueryEnabled(enabled: boolean) {
  const { authReady, isAnonymous } = useCommunityAuth()
  return enabled && authReady && !isAnonymous
}

export function useDirectChannels({ enabled = true } = {}) {
  const queryEnabled = useDirectMessageQueryEnabled(enabled)
  return useQuery<DirectChannelDto[], DirectMessageError>({
    queryKey: qk.communityDirectChannels(),
    queryFn: () => directMessagesRepository.listDirectChannels(),
    enabled: queryEnabled,
    retry: false,
  })
}

export function useProfileSearch(query: string, { enabled = true } = {}) {
  const normalizedQuery = query.trim()
  const queryEnabled = useDirectMessageQueryEnabled(enabled)
  return useQuery<DirectMessageProfileDto[], DirectMessageError>({
    queryKey: qk.communityDirectProfileSearch(normalizedQuery),
    queryFn: () => directMessagesRepository.searchProfiles(normalizedQuery),
    enabled: queryEnabled && normalizedQuery.length >= 2,
    retry: false,
  })
}

export function useFindOrCreateDirectChannel() {
  const queryClient = useQueryClient()
  return useMutation<DirectChannelDto, DirectMessageError, string>({
    mutationFn: (otherUserId) => directMessagesRepository.findOrCreateDirectChannel(otherUserId),
    onSuccess: (channel) => {
      queryClient.setQueryData(qk.communityDirectChannel(channel.id), channel)
      queryClient.invalidateQueries({ queryKey: qk.communityDirectChannels() })
    },
  })
}
