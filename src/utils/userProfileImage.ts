export function getUserProfileImageUrl(profile: LooseObject | null | undefined): string | null {
  if (!profile) return null

  if (typeof profile.profileImageUrl === 'string' && profile.profileImageUrl.trim()) {
    return profile.profileImageUrl.trim()
  }

  const image = profile.profileImage
  if (typeof image === 'string' && image.trim()) return image.trim()
  if (image && typeof image === 'object') {
    const record = image as LooseObject
    const imageUrl = record.imageUrl ?? record.url ?? record.thumbnailUrl
    if (typeof imageUrl === 'string' && imageUrl.trim()) {
      return imageUrl.trim()
    }
  }

  return null
}

export function buildUpdateUserProfileDto(
  profile: LooseObject,
  patch: LooseObject = {},
): {
  firstName: string
  lastName: string
  phoneNumber: string
  profileImageUrl?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  address?: string
  website?: string
  youtube?: string
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
} {
  const fullName = String(patch.fullName ?? profile.fullName ?? '').trim()
  const firstName = String(
    patch.firstName ?? (fullName ? fullName.split(' ')[0] : profile.firstName) ?? '',
  ).trim()
  const lastName = String(
    patch.lastName ?? (fullName ? fullName.split(' ').slice(1).join(' ') : profile.lastName) ?? '',
  ).trim()

  const dto = {
    firstName,
    lastName,
    phoneNumber: String(patch.phone ?? patch.phoneNumber ?? profile.phone ?? profile.phoneNumber ?? '').trim(),
    city: patch.city ?? profile.city,
    state: patch.state ?? profile.state,
    country: patch.country ?? profile.country,
    zipCode: patch.zipCode ?? profile.zipCode,
    address: patch.address ?? profile.street ?? profile.address,
    website: patch.website ?? profile.businessWebsite ?? profile.website,
    youtube: patch.youtube ?? profile.youtube,
    instagram: patch.instagram ?? profile.instagram,
    facebook: patch.facebook ?? profile.facebook,
    twitter: patch.twitter ?? profile.twitter,
    tiktok: patch.tiktok ?? profile.tiktok,
  }

  const profileImageUrl = String(
    patch.profileImageUrl ?? patch.avatar ?? getUserProfileImageUrl(profile) ?? '',
  ).trim()
  if (profileImageUrl) {
    return { ...dto, profileImageUrl }
  }

  return dto
}
