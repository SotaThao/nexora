import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { qk } from '../queryKeys'
import {
  commentsRepository,
  communitiesRepository,
  invitesRepository,
  joinRequestsRepository,
  membersRepository,
  postsRepository,
  profilesRepository,
  reactionsRepository,
} from '../repositories/community'
import type {
  CommunityDto,
  CreateCommentInput,
  CreateCommunityInput,
  CreateJoinRequestInput,
  CreatePostInput,
  JoinRequestDto,
  KeysetCursor,
  KeysetPage,
  MediaAsset,
  PostDto,
  ReactionDto,
  UploadCommunityPostMediaInput,
} from '../repositories/community'
import type { ReactionType } from '../community/enums'
import type { SupabaseDisplayError } from '../../lib/supabaseError'
import { useCommunityAuth } from '../../components/community/CommunityAuth'

type CommunityError = SupabaseDisplayError

const COMMUNITY_PAGE_SIZE = 24

function useCommunityQueryEnabled(enabled: boolean) {
  const { authReady } = useCommunityAuth()
  return enabled && authReady
}

export function useCommunityList({ enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<KeysetPage<CommunityDto>, CommunityError>({
    queryKey: qk.communityList({ limit: COMMUNITY_PAGE_SIZE }),
    queryFn: () => communitiesRepository.list({ limit: COMMUNITY_PAGE_SIZE }),
    enabled: queryEnabled,
  })
}

export function useMyCommunities({ enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<KeysetPage<CommunityDto>, CommunityError>({
    queryKey: qk.communityMyList(),
    queryFn: () => communitiesRepository.listMine({ limit: COMMUNITY_PAGE_SIZE }),
    enabled: queryEnabled,
  })
}

export function useCommunityDetail(communityId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<CommunityDto | null, CommunityError>({
    queryKey: qk.communityDetail(communityId ?? ''),
    queryFn: () => communitiesRepository.getById(communityId!),
    enabled: queryEnabled && Boolean(communityId),
    retry: false,
  })
}

export function useCommunityBySlug(slug?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<CommunityDto | null, CommunityError>({
    queryKey: qk.communityBySlug(slug ?? ''),
    queryFn: () => communitiesRepository.getBySlug(slug!),
    enabled: queryEnabled && Boolean(slug),
    retry: false,
  })
}

export function useCommunityFeedPosts(communityId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useInfiniteQuery({
    queryKey: qk.communityPosts(communityId ?? '', { limit: COMMUNITY_PAGE_SIZE }),
    queryFn: ({ pageParam }) => postsRepository.list(communityId!, { cursor: pageParam, limit: COMMUNITY_PAGE_SIZE }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled && Boolean(communityId),
    retry: false,
  })
}

export function useCommunityPost(postId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<PostDto | null, CommunityError>({
    queryKey: qk.communityPost(postId ?? ''),
    queryFn: () => postsRepository.getById(postId!),
    enabled: queryEnabled && Boolean(postId),
    retry: false,
  })
}

export function useCommunityComments(postId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useInfiniteQuery({
    queryKey: qk.communityComments(postId ?? '', { limit: COMMUNITY_PAGE_SIZE }),
    queryFn: ({ pageParam }: { pageParam: KeysetCursor | null }) =>
      commentsRepository.list(postId!, { cursor: pageParam, limit: COMMUNITY_PAGE_SIZE }),
    initialPageParam: null as KeysetCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled && Boolean(postId),
    retry: false,
  })
}

export function usePostReactions(postId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<ReactionDto[], CommunityError>({
    queryKey: qk.communityReactions(postId ?? ''),
    queryFn: () => reactionsRepository.list(postId!),
    enabled: queryEnabled && Boolean(postId),
    retry: false,
  })
}

export function useCommunityMembers(communityId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useInfiniteQuery({
    queryKey: qk.communityMembers(communityId ?? '', { limit: 100 }),
    queryFn: ({ pageParam }: { pageParam: KeysetCursor | null }) =>
      membersRepository.list(communityId!, { cursor: pageParam, limit: 100 }),
    initialPageParam: null as KeysetCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled && Boolean(communityId),
    retry: false,
  })
}

export function useCommunityProfile(profileId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery({
    queryKey: qk.communityProfile(profileId ?? ''),
    queryFn: () => profilesRepository.getById(profileId!),
    enabled: queryEnabled && Boolean(profileId),
    retry: false,
  })
}

export function useCommunityMediaUrl(asset?: MediaAsset | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery<string, CommunityError>({
    queryKey: ['community', 'media', asset?.deliveryType ?? '', asset?.path ?? ''],
    queryFn: () => postsRepository.resolveMediaUrl(asset!),
    enabled: queryEnabled && Boolean(asset?.path),
    staleTime: 4 * 60 * 1_000,
    retry: false,
  })
}

export function useCreateCommunity() {
  const queryClient = useQueryClient()
  return useMutation<CommunityDto, CommunityError, CreateCommunityInput>({
    mutationFn: (input) => communitiesRepository.create(input),
    onSuccess: (community) => {
      queryClient.setQueryData(qk.communityDetail(community.id), community)
      queryClient.invalidateQueries({ queryKey: ['community', 'list'] })
      queryClient.invalidateQueries({ queryKey: qk.communityMyList() })
    },
  })
}

export function useCreateCommunityPost() {
  const queryClient = useQueryClient()
  return useMutation<PostDto, CommunityError, CreatePostInput>({
    mutationFn: (input) => postsRepository.create(input),
    onSuccess: (post) => {
      queryClient.setQueryData(qk.communityPost(post.id), post)
      queryClient.invalidateQueries({ queryKey: ['community', 'posts', post.communityId] })
    },
  })
}

export function useUploadCommunityPostMedia() {
  return useMutation<MediaAsset, CommunityError, UploadCommunityPostMediaInput>({
    mutationFn: (input) => postsRepository.uploadMedia(input),
  })
}

export function useCreateCommunityComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsRepository.create(input),
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', comment.postId] })
      queryClient.invalidateQueries({ queryKey: qk.communityPost(comment.postId) })
    },
  })
}

type ToggleReactionInput = {
  postId: string
  type: ReactionType
  userId: string
}

export function useToggleCommunityReaction() {
  const queryClient = useQueryClient()
  return useMutation<ReactionDto | null, CommunityError, ToggleReactionInput, { previous?: ReactionDto[] }>({
    mutationFn: async ({ postId, type, userId }) => {
      const current = queryClient.getQueryData<ReactionDto[]>(qk.communityReactions(postId)) ?? []
      const ownReaction = current.find((reaction) => reaction.userId === userId)
      if (ownReaction?.type === type) {
        await reactionsRepository.remove(postId, type)
        return null
      }
      return reactionsRepository.set(postId, type)
    },
    onMutate: async ({ postId, type, userId }) => {
      const queryKey = qk.communityReactions(postId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<ReactionDto[]>(queryKey)
      const remaining = (previous ?? []).filter((reaction) => reaction.userId !== userId)
      const existing = previous?.find((reaction) => reaction.userId === userId)
      const next = existing?.type === type
        ? remaining
        : [...remaining, {
            id: `optimistic-${userId}-${postId}`,
            postId,
            userId,
            type,
            createdAt: new Date().toISOString(),
          }]
      queryClient.setQueryData(queryKey, next)
      return { previous }
    },
    onError: (_error, variables, context) => {
      queryClient.setQueryData(qk.communityReactions(variables.postId), context?.previous)
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.communityReactions(variables.postId) })
    },
  })
}

export function useInvitePreview(token?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useQuery({
    queryKey: qk.communityInvitePreview(token ?? ''),
    queryFn: () => invitesRepository.validate(token!),
    enabled: queryEnabled && Boolean(token),
    retry: false,
  })
}

export function useConsumeInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => invitesRepository.consume(token),
    onSuccess: (membership) => {
      queryClient.invalidateQueries({ queryKey: qk.communityDetail(membership.communityId) })
      queryClient.invalidateQueries({ queryKey: ['community', 'members', membership.communityId] })
      queryClient.invalidateQueries({ queryKey: qk.communityMyList() })
    },
  })
}

export function useCreateJoinRequest() {
  const queryClient = useQueryClient()
  return useMutation<JoinRequestDto, CommunityError, CreateJoinRequestInput>({
    mutationFn: (input) => joinRequestsRepository.create(input),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'joinRequests', request.communityId] })
    },
  })
}

export function useCommunityJoinRequests(communityId?: string | null, { enabled = true } = {}) {
  const queryEnabled = useCommunityQueryEnabled(enabled)
  return useInfiniteQuery({
    queryKey: qk.communityJoinRequests(communityId ?? '', { limit: COMMUNITY_PAGE_SIZE }),
    queryFn: ({ pageParam }: { pageParam: KeysetCursor | null }) =>
      joinRequestsRepository.list(communityId!, { cursor: pageParam, limit: COMMUNITY_PAGE_SIZE }),
    initialPageParam: null as KeysetCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: queryEnabled && Boolean(communityId),
    retry: false,
  })
}

function useResolveJoinRequest(action: 'approve' | 'reject') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: string) => action === 'approve'
      ? joinRequestsRepository.approve(requestId)
      : joinRequestsRepository.reject(requestId),
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'joinRequests', request.communityId] })
      queryClient.invalidateQueries({ queryKey: ['community', 'members', request.communityId] })
    },
  })
}

export function useApproveJoinRequest() {
  return useResolveJoinRequest('approve')
}

export function useRejectJoinRequest() {
  return useResolveJoinRequest('reject')
}
