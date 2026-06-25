import type { StaffProfile, UserProfile } from '../types/domain'
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

/**
 * Map user identity (userprofile/me) and staff professional profile (staff/profile)
 * into one shape for the staff settings profile screen.
 */
export function mapStaffProfileView(
  userProfile: UserProfile | null | undefined,
  staffProfile: StaffProfile | null | undefined,
): StaffProfileView {
  const fullName = resolveUserFullName(userProfile)
  const userAvatar = getUserProfileImageUrl(userProfile)
  const staffPhoto = resolveStaffPhotoUrl(staffProfile)

  return {
    staffProfileId: staffProfile?.id ? String(staffProfile.id) : null,
    staffCode: staffProfile?.staffCode ? String(staffProfile.staffCode) : null,
    email: String(userProfile?.email || '').trim(),
    fullName,
    firstName: String(userProfile?.firstName || '').trim(),
    lastName: String(userProfile?.lastName || '').trim(),
    phone: String(userProfile?.phoneNumber || '').trim(),
    displayName: String(staffProfile?.displayName || fullName || userProfile?.firstName || '').trim(),
    bio: String(staffProfile?.bio || '').trim(),
    position: staffProfile?.position ? String(staffProfile.position).trim() : null,
    avatar: userAvatar || staffPhoto,
    isProfileComplete:
      typeof staffProfile?.isProfileComplete === 'boolean' ? staffProfile.isProfileComplete : null,
  }
}
