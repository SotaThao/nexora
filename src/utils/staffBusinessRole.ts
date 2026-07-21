/** Customer-facing job title at a linked business (`roleAtBusiness` only). */
export function resolveStaffBusinessJobTitle(roleAtBusiness?: string | null): string {
  return roleAtBusiness?.trim() || ''
}

/** @deprecated Use {@link resolveStaffBusinessJobTitle}. Kept for existing imports. */
export function resolveStaffBusinessDisplayRole(source: {
  roleAtBusiness?: string | null
}): string {
  return resolveStaffBusinessJobTitle(source.roleAtBusiness)
}
