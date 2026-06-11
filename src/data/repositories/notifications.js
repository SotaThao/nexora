/**
 * notificationsRepository — API-only implementation.
 * TODO: Wire to real notifications API endpoints when available.
 */

import httpClient from '../../lib/httpClient'

export function createNotificationsRepository(client = httpClient) {
  return {
    /** 
     * @returns {Promise<Array>} 
     */
    async list() {
      const response = await client.get('/api/v1/notifications')
      // API returns a paged shape ({ items, pageNumber, ... }); support raw arrays too.
      const items = Array.isArray(response) ? response : (response.items || response.data || [])

      // Normalize to { id, type, title, body, isRead, createdAt }
      return items.map(item => {
        const isRead = Boolean(item.isRead || item.read)
        const body = item.body || item.message || ''
        const createdAt = item.createdAt || new Date().toISOString()
        return {
          id: item.id,
          type: item.type || 'info',
          title: item.title || '',
          body,
          isRead,
          createdAt,
          // Compatibility aliases for the dashboard header dropdown.
          read: isRead,
          message: body,
          time: new Date(createdAt).toLocaleString(),
        }
      })
    },

    /**
     * @returns {Promise<number>}
     */
    async unreadCount() {
      const response = await client.get('/api/v1/notifications/unread-count')
      return typeof response === 'number' ? response : (response.count || 0)
    },

    /**
     * @param {string} id
     */
    async markRead(id) {
      return client.put(`/api/v1/notifications/${id}/read`)
    },

    /**
     * Mark all notifications as read
     */
    async markAllRead() {
      return client.put('/api/v1/notifications/read-all')
    },

    /**
     * @deprecated server-side generation
     */
    async add(notification) {
      return notification
    },

    /**
     * @deprecated server-side generation
     */
    async replaceAll(list) {
      // no-op
    },
  }
}

export const notificationsRepository = createNotificationsRepository()
export default notificationsRepository
