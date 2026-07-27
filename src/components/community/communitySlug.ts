function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Community names are not unique. Keep the readable name in the slug while
 * adding enough client-generated entropy to avoid a unique-index conflict.
 */
export function createCommunitySlug(value: string, uniqueId = globalThis.crypto.randomUUID()) {
  const base = slugify(value) || 'community'
  const suffix = uniqueId.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
  return `${base}-${suffix}`
}
