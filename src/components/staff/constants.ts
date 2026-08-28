export const STAFF_ROLE_AT_BUSINESS_MAX_LENGTH = 100 as const

export const STAFF_ROLE_ERROR_KEYS = {
  required: 'errors.staff_position_required',
  tooLong: 'errors.staff_position_too_long',
  linkNotActive: 'errors.staff_business_role_link_not_active',
  unauthorized: 'errors.staff_business_role_unauthorized',
  merchantLinkNotFound: 'errors.staff_role_link_not_found',
} as const

/** Fallback when staff nickname/displayName/fullName are all empty. */
export const STAFF_CHAT_FALLBACK_DISPLAY_NAME = 'Staff' as const

/** Stable key when staff identity fields are temporarily missing. */
export const STAFF_CHAT_WINDOW_KEY_FALLBACK = 'staff-chat' as const

/** Tailwind `sm` breakpoint — floating vs fullscreen staff messenger. */
export const STAFF_CHAT_DESKTOP_MESSENGER_MEDIA_QUERY = '(min-width: 640px)' as const

/** Roster row type that cannot open community chat. */
export const STAFF_CHAT_INELIGIBLE_ITEM_TYPE = 'invite' as const

/** Staff statuses that cannot open community chat yet. */
export const STAFF_CHAT_BLOCKED_STATUSES = new Set([
  'Pending',
  'Pending Setup',
  'Pending Acceptance',
  'WaitingStaffAcceptance',
  'StaffRejected',
])

export enum StaffChatUnavailableReason {
  Ineligible = 'ineligible',
  NoUserProfile = 'no_user_profile',
}

/** Staff roster chat-icon unread indicator (peer messaged, not yet read). */
export const STAFF_CHAT_UNREAD_DOT_CLASS =
  'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white' as const

/** Deep-link from Community Messenger empty state → staff list chat coachmark. */
export const STAFF_CHAT_START_HINT_QUERY = 'chatHint' as const
export const STAFF_CHAT_START_HINT_VALUE = 'start' as const

export function searchHasStaffChatStartHint(search: string): boolean {
  return new URLSearchParams(search).get(STAFF_CHAT_START_HINT_QUERY) === STAFF_CHAT_START_HINT_VALUE
}

export function withStaffChatStartHint(path: string, startChatHint?: boolean): string {
  if (!startChatHint) return path
  const params = new URLSearchParams({
    [STAFF_CHAT_START_HINT_QUERY]: STAFF_CHAT_START_HINT_VALUE,
  })
  return `${path}?${params.toString()}`
}

export function isStaffChatStartHintOnlySearchChange(
  previousSearch: string,
  nextSearch: string,
): boolean {
  if (previousSearch === nextSearch) return false

  const previous = new URLSearchParams(previousSearch)
  const next = new URLSearchParams(nextSearch)
  const previousHint = previous.get(STAFF_CHAT_START_HINT_QUERY)
  const nextHint = next.get(STAFF_CHAT_START_HINT_QUERY)
  previous.delete(STAFF_CHAT_START_HINT_QUERY)
  next.delete(STAFF_CHAT_START_HINT_QUERY)

  return previousHint !== nextHint && previous.toString() === next.toString()
}

export const STAFF_CHAT_I18N = {
  title: 'staff_detail.chat_title',
  subtitle: 'staff_detail.chat_subtitle',
  loading: 'staff_detail.chat_loading',
  loadError: 'staff_detail.chat_load_error',
  noUserProfile: 'staff_detail.chat_no_user_profile',
  unavailable: 'staff_detail.chat_unavailable',
  emptyTitle: 'staff_detail.chat_empty_title',
  emptySubtitle: 'staff_detail.chat_empty_subtitle',
  attachImage: 'staff_detail.chat_attach_image',
  inputPlaceholder: 'staff_detail.chat_input_placeholder',
  send: 'staff_detail.chat_send',
  sendError: 'staff_detail.chat_send_error',
  startError: 'staff_detail.chat_start_error',
  imageAlt: 'staff_detail.chat_image_alt',
  open: 'staff_detail.chat_open',
  manage: 'components.dashboard.views.StaffView.manage_chat',
  manageUnread: 'components.dashboard.views.StaffView.manage_chat_unread',
  salonManage: 'staff_salons.chat_manage',
  salonManageUnread: 'staff_salons.chat_manage_unread',
  startHint: 'components.dashboard.views.StaffView.start_chat_hint',
} as const

/** Thrown when ensureSession lacks businessId / participantUserProfileId. */
export const STAFF_CHAT_ENSURE_SESSION_PRECONDITION_ERROR =
  'Missing chat participant or business' as const

export type StaffChatCloseToastTone = 'error' | 'warning'

export const STAFF_CHAT_CLOSE_TOAST_BY_REASON: Record<
  'sessionsError' | StaffChatUnavailableReason,
  { messageKey: string; tone: StaffChatCloseToastTone }
> = {
  sessionsError: {
    messageKey: STAFF_CHAT_I18N.loadError,
    tone: 'error',
  },
  [StaffChatUnavailableReason.NoUserProfile]: {
    messageKey: STAFF_CHAT_I18N.noUserProfile,
    tone: 'warning',
  },
  [StaffChatUnavailableReason.Ineligible]: {
    messageKey: STAFF_CHAT_I18N.unavailable,
    tone: 'warning',
  },
}
