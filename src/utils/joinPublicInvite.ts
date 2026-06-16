import type { UserProfile } from '../types/domain'
import type { JoinPublicInviteDto } from '../types/repositories'

import { getUserProfileImageUrl } from './userProfileImage'

export function getUserProfilePhotoUrl(profile: UserProfile | null | undefined): string | null {
  return getUserProfileImageUrl(profile)
}

export function getUserProfileDisplayName(profile: UserProfile | null | undefined): string {
  const fullName = (profile?.fullName || '').trim()
  if (fullName.length >= 2) return fullName

  const combined = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
  if (combined.length >= 2) return combined

  const firstName = (profile?.firstName || '').trim()
  if (firstName.length >= 2) return firstName

  return 'Staff Member'
}

export function getUserProfileReferralCode(profile: UserProfile | null | undefined): string {
  const code = profile?.referralCode
  return typeof code === 'string' ? code.trim() : ''
}

export function buildJoinPublicInvitePayload(
  profile: UserProfile | null | undefined,
): JoinPublicInviteDto {
  const phoneNumber = profile?.phoneNumber || profile?.phone || null
  const position =
    (typeof profile?.position === 'string' ? profile.position : null) ||
    (typeof profile?.jobTitle === 'string' ? profile.jobTitle : null) ||
    null
  const bio = typeof profile?.bio === 'string' ? profile.bio : null

  return {
    referralCode: getUserProfileReferralCode(profile),
    displayName: getUserProfileDisplayName(profile),
    phoneNumber,
    position,
    bio,
    photoUrl: getUserProfilePhotoUrl(profile),
  }
}
