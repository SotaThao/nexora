import type { StaffBusinessLink } from '../../../types/domain'
import {
  resolveStaffBusinessLinkStatusLabel,
  STAFF_BUSINESS_LINK_STATUS,
} from '../../../utils/staffBusinessLinkStatus'
import { StaffChatStartHintPlacement } from '../../staff/staffChatStartHintLayout'
import {
  canStaffMemberUseCommunityChat,
  type StaffChatMemberLike,
} from '../../staff/staffCommunityChatUtils'

export const SALON_CARD_PADDING_CLASS = {
  default: 'px-4 pt-4 pb-4',
  withChatStartHint: 'px-4 pt-4 pb-12',
} as const

export const SALON_CHAT_START_HINT_PLACEMENT = StaffChatStartHintPlacement.Below

export function toSalonChatMember(business: StaffBusinessLink): StaffChatMemberLike {
  return {
    id: business.businessId,
    businessId: business.businessId,
    userProfileId: business.ownerUserProfileId,
    displayName: business.businessName,
  }
}

export function toEligibleSalonChatMember(
  business: StaffBusinessLink,
): StaffChatMemberLike | null {
  const isActive = resolveStaffBusinessLinkStatusLabel(business).trim().toLowerCase()
    === STAFF_BUSINESS_LINK_STATUS.active
  if (!isActive) return null
  const member = toSalonChatMember(business)
  return canStaffMemberUseCommunityChat(member) ? member : null
}

export function getSalonChatMemberByBusinessId(
  salons: StaffBusinessLink[],
): Record<string, StaffChatMemberLike> {
  const membersByBusinessId: Record<string, StaffChatMemberLike> = {}
  for (const salon of salons) {
    const member = toEligibleSalonChatMember(salon)
    if (!member) continue
    membersByBusinessId[salon.businessId] = member
  }
  return membersByBusinessId
}
