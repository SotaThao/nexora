/**
 * notificationsRepository — API-only implementation.
 * TODO: Wire to real notifications API endpoints when available.
 */

export function createNotificationsRepository() {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      // TODO: Wire to GET /api/v1/notifications
      return []
    },

    /**
     * @param {object} notification
     * @returns {Promise<object>} the appended notification
     */
    async add(notification) {
      // TODO: Wire to POST /api/v1/notifications
      return notification
    },

    /**
     * @param {string} id
     */
    async markRead(id) {
      // TODO: Wire to PATCH /api/v1/notifications/:id/read
    },

    /**
     * @param {Array} list
     */
    async replaceAll(list) {
      // TODO: Wire to PUT /api/v1/notifications
    },
  }
}

export const notificationsRepository = createNotificationsRepository()
export default notificationsRepository
