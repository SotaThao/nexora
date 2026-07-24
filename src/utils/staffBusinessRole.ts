/** Customer-facing job title at a linked business (`roleAtBusiness` only). */
export function resolveStaffBusinessJobTitle(roleAtBusiness?: string | null): string {
  return roleAtBusiness?.trim() || ''
}

/**
 * Merchant-facing role label for a staff row: prefer the business-editable
 * `roleAtBusiness` (set via "Set role"), fall back to the profile's own `position`.
 */
export function resolveStaffRoleLabel(member: {
  roleAtBusiness?: string | null
  position?: string | null
}): string {
  return member.roleAtBusiness || member.position || ''
}

/** @deprecated Use {@link resolveStaffBusinessJobTitle}. Kept for existing imports. */
export function resolveStaffBusinessDisplayRole(source: {
  roleAtBusiness?: string | null
}): string {
  return resolveStaffBusinessJobTitle(source.roleAtBusiness)
}
