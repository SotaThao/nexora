export const MemberRole = {
  Owner: 'owner',
  Admin: 'admin',
  Moderator: 'moderator',
  Member: 'member',
} as const

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole]

export const MemberStatus = {
  Active: 'active',
  Pending: 'pending',
  Banned: 'banned',
  Left: 'left',
} as const

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus]

export const CommunityKind = {
  Public: 'public',
  Private: 'private',
  Salon: 'salon',
} as const

export type CommunityKind = (typeof CommunityKind)[keyof typeof CommunityKind]

export const CommunityVisibility = {
  Public: 'public',
  Private: 'private',
} as const

export type CommunityVisibility = (typeof CommunityVisibility)[keyof typeof CommunityVisibility]

export const JoinRequestStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
} as const

export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus]

export const ReactionType = {
  Like: 'like',
  Love: 'love',
  Celebrate: 'celebrate',
} as const

export type ReactionType = (typeof ReactionType)[keyof typeof ReactionType]

export const NotificationType = {
  Invite: 'invite',
  JoinRequest: 'join_request',
  JoinApproved: 'join_approved',
  Comment: 'comment',
  Mention: 'mention',
  Moderation: 'moderation',
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const ReportStatus = {
  Open: 'open',
  Resolved: 'resolved',
  Dismissed: 'dismissed',
} as const

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const ReportTargetType = {
  Post: 'post',
  Comment: 'comment',
  Member: 'member',
} as const

export type ReportTargetType = (typeof ReportTargetType)[keyof typeof ReportTargetType]

export const ChannelKind = {
  Main: 'main',
} as const

export type ChannelKind = (typeof ChannelKind)[keyof typeof ChannelKind]
