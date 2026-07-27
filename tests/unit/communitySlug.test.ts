import { describe, expect, it } from 'vitest'
import { createCommunitySlug } from '../../src/components/community/communitySlug'

describe('createCommunitySlug', () => {
  it('keeps the readable name and adds a unique suffix', () => {
    expect(createCommunitySlug('Nexora Official', '123e4567-e89b-12d3-a456-426614174000'))
      .toBe('nexora-official-123e4567e89b')
  })

  it('allows duplicate community names without producing duplicate slugs', () => {
    const first = createCommunitySlug('Nail Houston', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    const second = createCommunitySlug('Nail Houston', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')

    expect(first).not.toBe(second)
    expect(first).toMatch(/^nail-houston-[a-z0-9]{12}$/)
    expect(second).toMatch(/^nail-houston-[a-z0-9]{12}$/)
  })

  it('uses a valid fallback for names without ASCII slug characters', () => {
    expect(createCommunitySlug('✨✨✨', 'cccccccc-cccc-cccc-cccc-cccccccccccc'))
      .toBe('community-cccccccccccc')
  })
})
