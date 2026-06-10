import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStaffInvitesRepository, normalizeInviteInfo } from '../staffInvites'

// ---------------------------------------------------------------------------
// Mock HTTP client
// ---------------------------------------------------------------------------
function createMockClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
    upload: vi.fn(),
  }
}

describe('staffInvitesRepository', () => {
  let client
  let repo

  beforeEach(() => {
    client = createMockClient()
    repo = createStaffInvitesRepository(client)
  })

  // =========================================================================
  // normalizeInviteInfo
  // =========================================================================
  describe('normalizeInviteInfo', () => {
    it('maps all DTO fields', () => {
      const dto = {
        invitedName: 'Lisa Tran',
        invitedPosition: 'Nail Technician',
        businessName: 'Pretty Nails Salon',
      }
      const result = normalizeInviteInfo(dto)
      expect(result).toEqual({
        invitedName: 'Lisa Tran',
        invitedPosition: 'Nail Technician',
        businessName: 'Pretty Nails Salon',
      })
    })

    it('defaults missing fields', () => {
      const result = normalizeInviteInfo({})
      expect(result).toEqual({
        invitedName: '',
        invitedPosition: null,
        businessName: '',
      })
    })
  })

  // =========================================================================
  // getInviteInfo
  // =========================================================================
  describe('getInviteInfo', () => {
    it('calls GET with anonymous option and normalizes result', async () => {
      const dto = {
        invitedName: 'Lisa',
        invitedPosition: 'Tech',
        businessName: 'Salon',
      }
      client.get.mockResolvedValue(dto)

      const result = await repo.getInviteInfo('abc-token-123')
      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/staff/invite/abc-token-123',
        { anonymous: true }
      )
      expect(result.invitedName).toBe('Lisa')
      expect(result.businessName).toBe('Salon')
    })

    it('encodes special characters in token', async () => {
      client.get.mockResolvedValue({ invitedName: 'X', businessName: 'Y' })
      await repo.getInviteInfo('a/b c')
      expect(client.get).toHaveBeenCalledWith(
        '/api/v1/staff/invite/a%2Fb%20c',
        { anonymous: true }
      )
    })
  })

  // =========================================================================
  // acceptInvite
  // =========================================================================
  describe('acceptInvite', () => {
    it('calls POST with anonymous option and correct body', async () => {
      client.post.mockResolvedValue(undefined)

      await repo.acceptInvite('token-xyz', {
        displayName: 'Lisa Tran',
        position: 'Nail Tech',
        bio: 'Expert in gel nails',
        photoUrl: 'https://example.com/photo.jpg',
      })

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/staff/invite/token-xyz/accept',
        {
          token: 'token-xyz',
          displayName: 'Lisa Tran',
          position: 'Nail Tech',
          bio: 'Expert in gel nails',
          photoUrl: 'https://example.com/photo.jpg',
        },
        { anonymous: true }
      )
    })

    it('sends null for optional fields when not provided', async () => {
      client.post.mockResolvedValue(undefined)

      await repo.acceptInvite('token-abc', {
        displayName: 'John',
      })

      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/staff/invite/token-abc/accept',
        {
          token: 'token-abc',
          displayName: 'John',
          position: null,
          bio: null,
          photoUrl: null,
        },
        { anonymous: true }
      )
    })
  })
})
