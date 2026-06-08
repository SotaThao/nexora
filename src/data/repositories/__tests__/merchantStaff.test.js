import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createMerchantStaffRepository, normalizeStaffListItem, normalizeStaffSearchResult } from '../merchantStaff'

describe('merchantStaffRepository', () => {
  let mockClient
  let repo

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      del: vi.fn(),
    }
    repo = createMerchantStaffRepository(mockClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── DTO Normalization ──────────────────────────────────────────────

  describe('normalizeStaffListItem', () => {
    it('should normalize a link-type DTO with active status', () => {
      const dto = {
        id: 'row-1',
        staffLinkId: 'link-1',
        inviteId: null,
        staffProfileId: 'sp-1',
        staffCode: 'SC001',
        itemType: 'link',
        sortOrder: 2,
        isProfileComplete: true,
        tipCount: 15,
        averageRating: 4.5,
        displayName: 'Jane Doe',
        photoUrl: 'https://cdn/jane.jpg',
        status: 'Active',
        position: 'Nail Tech',
        invitedEmail: null,
        invitedPhone: null,
      }

      const result = normalizeStaffListItem(dto)

      expect(result).toEqual({
        id: 'row-1',
        staffLinkId: 'link-1',
        inviteId: null,
        staffProfileId: 'sp-1',
        staffCode: 'SC001',
        itemType: 'link',
        sortOrder: 2,
        isProfileComplete: true,
        tipCount: 15,
        averageRating: 4.5,
        fullName: 'Jane Doe',
        avatar: 'https://cdn/jane.jpg',
        status: 'Active',
        isActive: true,
        showInTipsFlow: true,
        position: 'Nail Tech',
        invitedEmail: null,
        invitedPhone: null,
      })
    })

    it('should normalize an invite-type DTO with pending status', () => {
      const dto = {
        id: 'row-2',
        staffLinkId: null,
        inviteId: 'inv-1',
        staffProfileId: null,
        staffCode: null,
        itemType: 'invite',
        sortOrder: 0,
        isProfileComplete: false,
        tipCount: 0,
        averageRating: 0,
        displayName: 'Pending Person',
        photoUrl: null,
        status: 'Pending',
        position: 'Stylist',
        invitedEmail: 'pending@example.com',
        invitedPhone: null,
      }

      const result = normalizeStaffListItem(dto)

      expect(result.inviteId).toBe('inv-1')
      expect(result.staffLinkId).toBeNull()
      expect(result.fullName).toBe('Pending Person')
      expect(result.avatar).toBeNull()
      expect(result.isActive).toBe(false)
      expect(result.showInTipsFlow).toBe(false)
      expect(result.itemType).toBe('invite')
    })

    it('should derive isActive from "Accepted" status', () => {
      const dto = {
        id: 'row-3',
        itemType: 'link',
        staffLinkId: 'link-3',
        status: 'Accepted',
        displayName: 'Accepted Staff',
      }

      const result = normalizeStaffListItem(dto)
      expect(result.isActive).toBe(true)
      expect(result.showInTipsFlow).toBe(true)
    })

    it('should derive isActive false from "Inactive" status', () => {
      const dto = {
        id: 'row-4',
        itemType: 'link',
        staffLinkId: 'link-4',
        status: 'Inactive',
        displayName: 'Inactive Staff',
      }

      const result = normalizeStaffListItem(dto)
      expect(result.isActive).toBe(false)
      expect(result.showInTipsFlow).toBe(false)
    })

    it('should apply defaults for missing optional DTO fields', () => {
      const dto = {
        id: 'row-5',
        itemType: 'link',
        staffLinkId: 'link-5',
        status: 'Active',
      }

      const result = normalizeStaffListItem(dto)
      expect(result.fullName).toBe('')
      expect(result.avatar).toBeNull()
      expect(result.staffCode).toBeNull()
      expect(result.staffProfileId).toBeNull()
      expect(result.sortOrder).toBe(0)
      expect(result.isProfileComplete).toBe(false)
      expect(result.tipCount).toBe(0)
      expect(result.averageRating).toBe(0)
      expect(result.position).toBeNull()
    })
  })

  describe('normalizeStaffSearchResult', () => {
    it('should normalize a search result DTO', () => {
      const dto = {
        staffProfileId: 'sp-10',
        staffCode: 'SC010',
        displayName: 'Searchable Staff',
        photoUrl: 'https://cdn/search.jpg',
        position: 'Barber',
      }

      const result = normalizeStaffSearchResult(dto)

      expect(result).toEqual({
        staffProfileId: 'sp-10',
        staffCode: 'SC010',
        fullName: 'Searchable Staff',
        avatar: 'https://cdn/search.jpg',
        position: 'Barber',
      })
    })

    it('should apply defaults for missing optional search DTO fields', () => {
      const dto = {
        staffProfileId: 'sp-11',
      }

      const result = normalizeStaffSearchResult(dto)

      expect(result.staffCode).toBeNull()
      expect(result.fullName).toBe('')
      expect(result.avatar).toBeNull()
      expect(result.position).toBeNull()
    })
  })

  // ── Repository Methods ─────────────────────────────────────────────

  describe('list()', () => {
    it('should call GET /api/v1/merchant/staff and normalize results', async () => {
      const apiResponse = [
        {
          id: 'row-1',
          staffLinkId: 'link-1',
          itemType: 'link',
          displayName: 'Jane',
          status: 'Active',
          photoUrl: 'https://cdn/jane.jpg',
        },
        {
          id: 'row-2',
          inviteId: 'inv-1',
          itemType: 'invite',
          displayName: 'Pending',
          status: 'Pending',
        },
      ]
      mockClient.get.mockResolvedValue(apiResponse)

      const result = await repo.list()

      expect(mockClient.get).toHaveBeenCalledWith('/api/v1/merchant/staff')
      expect(result).toHaveLength(2)
      expect(result[0].fullName).toBe('Jane')
      expect(result[0].staffLinkId).toBe('link-1')
      expect(result[1].inviteId).toBe('inv-1')
      expect(result[1].isActive).toBe(false)
    })

    it('should return empty array when API returns null', async () => {
      mockClient.get.mockResolvedValue(null)

      const result = await repo.list()
      expect(result).toEqual([])
    })

    it('should propagate API errors', async () => {
      const err = { status: 500, errorCode: 'INTERNAL_ERROR' }
      mockClient.get.mockRejectedValue(err)

      await expect(repo.list()).rejects.toEqual(err)
    })
  })

  describe('invite()', () => {
    it('should call POST /api/v1/merchant/staff/invite with InviteStaffCommand', async () => {
      mockClient.post.mockResolvedValue({ inviteId: 'inv-new' })

      const result = await repo.invite({
        name: 'John',
        email: 'john@example.com',
        phone: null,
        position: 'Nail Tech',
      })

      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/staff/invite', {
        invitedName: 'John',
        invitedEmail: 'john@example.com',
        invitedPhone: null,
        invitedPosition: 'Nail Tech',
      })
      expect(result).toEqual({ inviteId: 'inv-new' })
    })

    it('should default optional fields to null', async () => {
      mockClient.post.mockResolvedValue({ inviteId: 'inv-2' })

      await repo.invite({ name: 'Solo' })

      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/staff/invite', {
        invitedName: 'Solo',
        invitedEmail: null,
        invitedPhone: null,
        invitedPosition: null,
      })
    })

    it('should propagate validation errors', async () => {
      const err = { status: 400, errorCode: 'COMMON_VALIDATION_ERROR' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.invite({ name: '' })).rejects.toEqual(err)
    })
  })

  describe('resendInvite()', () => {
    it('should call POST /api/v1/merchant/staff/{inviteId}/resend', async () => {
      mockClient.post.mockResolvedValue(null)

      await repo.resendInvite('inv-42')

      expect(mockClient.post).toHaveBeenCalledWith('/api/v1/merchant/staff/inv-42/resend')
    })

    it('should encode special characters in inviteId', async () => {
      mockClient.post.mockResolvedValue(null)

      await repo.resendInvite('inv/special&id')

      expect(mockClient.post).toHaveBeenCalledWith(
        `/api/v1/merchant/staff/${encodeURIComponent('inv/special&id')}/resend`
      )
    })

    it('should propagate 404 errors', async () => {
      const err = { status: 404, errorCode: 'COMMON_NOT_FOUND' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.resendInvite('inv-missing')).rejects.toEqual(err)
    })
  })

  describe('search()', () => {
    it('should call GET /api/v1/merchant/staff/search with encoded query', async () => {
      const apiResponse = [
        {
          staffProfileId: 'sp-1',
          staffCode: 'SC001',
          displayName: 'Found Staff',
          photoUrl: 'https://cdn/found.jpg',
          position: 'Barber',
        },
      ]
      mockClient.get.mockResolvedValue(apiResponse)

      const result = await repo.search('Jane Doe')

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/v1/merchant/staff/search?q=Jane%20Doe'
      )
      expect(result).toHaveLength(1)
      expect(result[0].fullName).toBe('Found Staff')
      expect(result[0].staffProfileId).toBe('sp-1')
    })

    it('should return empty array when API returns null', async () => {
      mockClient.get.mockResolvedValue(null)

      const result = await repo.search('nobody')
      expect(result).toEqual([])
    })

    it('should encode special characters in query', async () => {
      mockClient.get.mockResolvedValue([])

      await repo.search('special&name=test')

      expect(mockClient.get).toHaveBeenCalledWith(
        `/api/v1/merchant/staff/search?q=${encodeURIComponent('special&name=test')}`
      )
    })
  })

  describe('sendLinkRequest()', () => {
    it('should call POST /api/v1/merchant/staff/link-request/{staffProfileId}', async () => {
      mockClient.post.mockResolvedValue(null)

      await repo.sendLinkRequest('sp-42')

      expect(mockClient.post).toHaveBeenCalledWith(
        '/api/v1/merchant/staff/link-request/sp-42'
      )
    })

    it('should propagate conflict errors', async () => {
      const err = { status: 400, errorCode: 'COMMON_VALIDATION_ERROR' }
      mockClient.post.mockRejectedValue(err)

      await expect(repo.sendLinkRequest('sp-dup')).rejects.toEqual(err)
    })
  })

  describe('updateStatus()', () => {
    it('should call PUT /api/v1/merchant/staff/{staffLinkId}/status with correct body', async () => {
      mockClient.put.mockResolvedValue(null)

      await repo.updateStatus('link-1', 'Inactive')

      expect(mockClient.put).toHaveBeenCalledWith(
        '/api/v1/merchant/staff/link-1/status',
        { staffLinkId: 'link-1', status: 'Inactive' }
      )
    })

    it('should handle Active status', async () => {
      mockClient.put.mockResolvedValue(null)

      await repo.updateStatus('link-2', 'Active')

      expect(mockClient.put).toHaveBeenCalledWith(
        '/api/v1/merchant/staff/link-2/status',
        { staffLinkId: 'link-2', status: 'Active' }
      )
    })

    it('should propagate 403 errors', async () => {
      const err = { status: 403, errorCode: 'COMMON_FORBIDDEN' }
      mockClient.put.mockRejectedValue(err)

      await expect(repo.updateStatus('link-1', 'Active')).rejects.toEqual(err)
    })
  })

  describe('reorder()', () => {
    it('should call PUT /api/v1/merchant/staff/reorder with ReorderStaffCommand shape', async () => {
      mockClient.put.mockResolvedValue(null)

      const items = [
        { staffLinkId: 'link-1', sortOrder: 0 },
        { staffLinkId: 'link-2', sortOrder: 1 },
        { staffLinkId: 'link-3', sortOrder: 2 },
      ]

      await repo.reorder(items)

      expect(mockClient.put).toHaveBeenCalledWith('/api/v1/merchant/staff/reorder', { items })
    })

    it('should handle empty items array', async () => {
      mockClient.put.mockResolvedValue(null)

      await repo.reorder([])

      expect(mockClient.put).toHaveBeenCalledWith('/api/v1/merchant/staff/reorder', { items: [] })
    })
  })

  describe('remove()', () => {
    it('should call DELETE /api/v1/merchant/staff/{staffLinkId}', async () => {
      mockClient.del.mockResolvedValue(null)

      await repo.remove('link-99')

      expect(mockClient.del).toHaveBeenCalledWith('/api/v1/merchant/staff/link-99')
    })

    it('should encode special characters in staffLinkId', async () => {
      mockClient.del.mockResolvedValue(null)

      await repo.remove('link/special&id')

      expect(mockClient.del).toHaveBeenCalledWith(
        `/api/v1/merchant/staff/${encodeURIComponent('link/special&id')}`
      )
    })

    it('should propagate 404 errors', async () => {
      const err = { status: 404, errorCode: 'COMMON_NOT_FOUND' }
      mockClient.del.mockRejectedValue(err)

      await expect(repo.remove('link-missing')).rejects.toEqual(err)
    })
  })
})
