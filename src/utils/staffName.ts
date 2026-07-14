export type StaffNameSource = {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  bio?: string | null
  displayName?: string | null
  nickname?: string | null
  isLocalStaff?: boolean
}

export type ResolvedStaffNames = {
  fullName: string
  nickname: string
  /** Bio safe for edit forms — omits legacy bio used only as a full-name fallback. */
  formBio: string
}

function pickNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    const trimmed = String(value ?? '').trim()
    if (trimmed) return trimmed
  }
  return ''
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

export function resolveStaffDisplayNames(source: StaffNameSource): ResolvedStaffNames {
  const fromParts = `${source.firstName ?? ''} ${source.lastName ?? ''}`.trim()
  let fullName = pickNonEmptyString(source.fullName, fromParts)
  let fullNameFromLegacyBio = false

  if (!fullName && source.isLocalStaff) {
    const bio = String(source.bio ?? '').trim()
    const displayName = pickNonEmptyString(source.nickname, source.displayName)
    if (bio && bio !== displayName) {
      fullName = bio
      fullNameFromLegacyBio = true
    }
  }

  const nickname = pickNonEmptyString(source.nickname, source.displayName)
  const rawBio = String(source.bio ?? '').trim()
  const formBio = fullNameFromLegacyBio ? '' : rawBio

  return { fullName, nickname, formBio }
}

/** Full-name resolution for API list/detail DTO normalization. */
export function resolveStaffFullNameFromApi(dto: {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  bio?: string | null
  displayName?: string | null
  isLocalStaff?: boolean
}): string {
  return resolveStaffDisplayNames(dto).fullName
}
