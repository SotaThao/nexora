import type { StaffProfile, UserProfile } from '../types/domain'
import type { UpdateStaffProfileDto } from '../types/repositories'
import { getUserProfileImageUrl } from './userProfileImage'

/** Unified staff profile view — merges GET /userprofile/me + GET /staff/profile. */
export interface StaffProfileView {
  staffProfileId: string | null
  staffCode: string | null
  email: string
  fullName: string
  firstName: string
  lastName: string
  phone: string
  displayName: string
  bio: string
  position: string | null
  avatar: string | null
  isProfileComplete: boolean | null
  isKYCVerified: boolean
  createdAt: string | null
}

function resolveUserFullName(userProfile: UserProfile | null | undefined): string {
  if (!userProfile) return ''
  const explicit = String(userProfile.fullName || '').trim()
  if (explicit) return explicit
  return `${userProfile.firstName ?? ''} ${userProfile.lastName ?? ''}`.trim()
}

function resolveStaffPhotoUrl(staffProfile: StaffProfile | null | undefined): string | null {
  if (!staffProfile) return null
  const photoUrl = staffProfile.photoUrl ?? staffProfile.photo
  return typeof photoUrl === 'string' && photoUrl.trim() ? photoUrl.trim() : null
}

function resolveStaffIdentityNames(staffProfile: StaffProfile | null | undefined): {
  firstName: string
  lastName: string
  fullName: string
} {
  const firstName = String(staffProfile?.firstName || '').trim()
  const lastName = String(staffProfile?.lastName || '').trim()
  const fullName = `${firstName} ${lastName}`.trim()
  return { firstName, lastName, fullName }
}

function resolveIsKycVerified(userProfile: UserProfile | null | undefined): boolean {
  if (!userProfile) return false
  return userProfile.isKYCVerified === true || userProfile.isKycVerified === true
}

export function buildUpdateStaffProfileDto(
  sources: {
    account?: LooseObject
    userProfile?: UserProfile | null
    staffProfile?: StaffProfile | null
  },
  patch: LooseObject = {},
): UpdateStaffProfileDto {
  const account = sources.account ?? {}
  const userProfile = sources.userProfile ?? null
  const staffProfile = sources.staffProfile ?? null
  const staffIdentity = resolveStaffIdentityNames(staffProfile)

  const fullName = String(
    patch.fullName
      ?? account.fullName
      ?? staffIdentity.fullName
      ?? resolveUserFullName(userProfile)
      ?? '',
  ).trim()
  const firstName = String(
    patch.firstName ?? (fullName ? fullName.split(' ')[0] : staffIdentity.firstName || userProfile?.firstName) ?? '',
  ).trim()
  const lastName = String(
    patch.lastName
      ?? (fullName ? fullName.split(' ').slice(1).join(' ') : staffIdentity.lastName || userProfile?.lastName)
      ?? '',
  ).trim()
  const displayName = String(
    patch.defaultDisplayName
      ?? patch.displayName
      ?? account.defaultDisplayName
      ?? staffProfile?.displayName
      ?? fullName
      ?? '',
  ).trim()
  const photoUrl = String(
    patch.photoUrl
      ?? patch.avatar
      ?? account.avatar
      ?? resolveStaffPhotoUrl(staffProfile)
      ?? getUserProfileImageUrl(userProfile)
      ?? '',
  ).trim()

  return {
    displayName,
    position: String(patch.position ?? account.position ?? staffProfile?.position ?? '').trim() || undefined,
    bio: String(patch.bio ?? account.bio ?? staffProfile?.bio ?? '').trim(),
    photoUrl: photoUrl || undefined,
    firstName,
    lastName,
    phone: String(
      patch.phone ?? account.phone ?? staffProfile?.phone ?? userProfile?.phoneNumber ?? '',
    ).trim(),
  }
}

/**
 * Map user identity (userprofile/me) and staff professional profile (staff/profile)
 * into one shape for the staff settings profile screen.
 */
export function mapStaffProfileView(
  userProfile: UserProfile | null | undefined,
  staffProfile: StaffProfile | null | undefined,
): StaffProfileView {
  const staffIdentity = resolveStaffIdentityNames(staffProfile)
  const fullName = staffIdentity.fullName || resolveUserFullName(userProfile)
  const userAvatar = getUserProfileImageUrl(userProfile)
  const staffPhoto = resolveStaffPhotoUrl(staffProfile)

  return {
    staffProfileId: staffProfile?.id ? String(staffProfile.id) : null,
    staffCode: staffProfile?.staffCode ? String(staffProfile.staffCode) : null,
    email: String(userProfile?.email || '').trim(),
    fullName,
    firstName: staffIdentity.firstName || String(userProfile?.firstName || '').trim(),
    lastName: staffIdentity.lastName || String(userProfile?.lastName || '').trim(),
    phone: String(staffProfile?.phone ?? userProfile?.phoneNumber ?? '').trim(),
    displayName: String(staffProfile?.displayName || fullName || userProfile?.firstName || '').trim(),
    bio: String(staffProfile?.bio || '').trim(),
    position: staffProfile?.position ? String(staffProfile.position).trim() : null,
    avatar: userAvatar || staffPhoto,
    isProfileComplete:
      typeof staffProfile?.isProfileComplete === 'boolean' ? staffProfile.isProfileComplete : null,
    isKYCVerified: resolveIsKycVerified(userProfile),
    createdAt: userProfile?.createdAt || staffProfile?.createdAt || null,
  }
}
