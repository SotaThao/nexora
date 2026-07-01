function normalizeName(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

/** Match a transaction/review record to a staff roster or form member. */
export function staffRecordMatchesMember(member: LooseObject | null | undefined, record: LooseObject | null | undefined): boolean {
  if (!member || !record) return false

  const profileId = member.staffProfileId
  const staffCode = member.staffCode ?? member.nexoraStaffId
  const linkId = member.id ?? member.linkId ?? member.staffLinkId
  const names = [member.fullName, member.nickname, member.displayName]
    .map(normalizeName)
    .filter(Boolean)

  if (profileId && record.staffProfileId === profileId) return true
  if (staffCode && (record.staffCode === staffCode || record.staffId === staffCode)) return true
  if (linkId && (record.staffId === linkId || record.id === linkId)) return true

  const recordName = normalizeName(record.staffName)
  if (recordName && names.some((name) => name === recordName)) return true

  return false
}
