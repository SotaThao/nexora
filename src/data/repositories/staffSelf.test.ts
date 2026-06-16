import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStaffSelfRepository, normalizeStaffLinkRequestDetail } from './staffSelf'

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

describe('staffSelfRepository', () => {
  let client: ReturnType<typeof createMockClient>
  let repo: ReturnType<typeof createStaffSelfRepository>

  beforeEach(() => {
    client = createMockClient()
    repo = createStaffSelfRepository(client)
  })

  describe('normalizeStaffLinkRequestDetail', () => {
    it('maps StaffLinkRequestDetailDto fields', () => {
      expect(normalizeStaffLinkRequestDetail({
        id: 'link-123',
        businessName: 'Nexora Nails',
        businessLogoUrl: 'https://example.com/logo.png',
        businessRole: 'Nail Tech',
        requestedAt: '2026-06-11T10:00:00Z',
        status: 'Pending',
      })).toEqual({
        id: 'link-123',
        businessName: 'Nexora Nails',
        businessLogoUrl: 'https://example.com/logo.png',
        businessRole: 'Nail Tech',
        requestedAt: '2026-06-11T10:00:00Z',
        status: 'Pending',
      })
    })
  })

  describe('getLinkRequest', () => {
    it('calls GET /api/v1/staff/link-requests/{linkId}', async () => {
      client.get.mockResolvedValue({ id: 'link-123', businessName: 'Nexora Nails' })

      const result = await repo.getLinkRequest('link-123')

      expect(client.get).toHaveBeenCalledWith('/api/v1/staff/link-requests/link-123')
      expect(result.businessName).toBe('Nexora Nails')
    })

    it('encodes the link id', async () => {
      client.get.mockResolvedValue({ id: 'a/b c' })

      await repo.getLinkRequest('a/b c')

      expect(client.get).toHaveBeenCalledWith('/api/v1/staff/link-requests/a%2Fb%20c')
    })
  })

  describe('acceptLinkRequest', () => {
    it('calls PUT /api/v1/staff/link-requests/{linkId}/accept', async () => {
      client.put.mockResolvedValue(undefined)

      await repo.acceptLinkRequest('link-123')

      expect(client.put).toHaveBeenCalledWith('/api/v1/staff/link-requests/link-123/accept')
    })
  })

  describe('rejectLinkRequest', () => {
    it('calls PUT /api/v1/staff/link-requests/{linkId}/reject', async () => {
      client.put.mockResolvedValue(undefined)

      await repo.rejectLinkRequest('link-123')

      expect(client.put).toHaveBeenCalledWith('/api/v1/staff/link-requests/link-123/reject')
    })
  })
})
