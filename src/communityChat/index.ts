/**
 * Community Chat — public barrel exports for FE integration.
 */

export {
  COMMUNITY_CHAT_ALLOWED_IMAGE_EXTENSIONS,
  COMMUNITY_CHAT_DEFAULT_PAGE_SIZE,
  COMMUNITY_CHAT_HUB_PATH,
  COMMUNITY_CHAT_MAX_IMAGE_BYTES,
  COMMUNITY_CHAT_MAX_TITLE_LENGTH,
  COMMUNITY_CHAT_NOTIFICATION_TYPE,
  COMMUNITY_CHAT_REST_BASE,
  COMMUNITY_CHAT_SESSION_PATH_PREFIX,
  COMMUNITY_CHAT_SIGNALR_GROUP_PREFIX,
  COMMUNITY_CHAT_TYPING_INDICATOR_TIMEOUT_MS,
  CommunityChatMessageType,
  CommunityChatStatus,
  CommunityChatType,
} from '../constants/communityChat'

export { CommunityChatErrorCode } from '../constants/communityChatErrors'
export type { CommunityChatErrorCodeValue } from '../constants/communityChatErrors'

export type {
  AddCommunityChatParticipantInput,
  CommunityChatHubSendMessagePayload,
  CommunityChatMessage,
  CommunityChatMessagesPage,
  CommunityChatParticipant,
  CommunityChatReceiveMessageEvent,
  CommunityChatSession,
  CommunityChatTypingEvent,
  CommunityChatUserStatusChangedEvent,
  CreateCommunityChatSessionInput,
  RenameCommunityChatSessionInput,
  SendCommunityChatMessageInput,
} from '../types/communityChat'

export {
  communityChatRepository,
  createCommunityChatRepository,
  normalizeCommunityChatMessage,
  normalizeCommunityChatParticipant,
  normalizeCommunityChatSession,
} from '../data/repositories/communityChat'
export type { ListCommunityChatMessagesParams } from '../data/repositories/communityChat'

export {
  CommunityChatHubEvent,
  CommunityChatHubMethod,
  createCommunityChatHubConnection,
  getCommunityChatHubUrl,
  joinCommunityChatSession,
  leaveCommunityChatSession,
  sendCommunityChatHubMessage,
  startCommunityChatTyping,
  stopCommunityChatTyping,
} from '../lib/communityChatHub'
export type {
  CommunityChatHubHandlers,
  CreateCommunityChatHubConnectionOptions,
} from '../lib/communityChatHub'

export {
  useAddCommunityChatParticipant,
  useCommunityChatMessages,
  useCommunityChatSession,
  useCommunityChatSessions,
  useCreateCommunityChatSession,
  useDeleteCommunityChatMessage,
  useLeaveCommunityChatSession,
  useMarkCommunityChatSessionRead,
  useRemoveCommunityChatParticipant,
  useRenameCommunityChatSession,
  useSendCommunityChatImage,
  useSendCommunityChatMessage,
} from '../data/hooks/useCommunityChat'
