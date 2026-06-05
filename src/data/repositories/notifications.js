/**
 * notificationsRepository — in-app notification items.
 * Key: nexora_notifications.
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_notifications'

export function createNotificationsRepository(a = defaultAdapter) {
  return {
    /** @returns {Promise<Array>} */
    async list() {
      return (await a.get(KEY)) ?? []
    },

    /**
     * @param {object} notification
     * @returns {Promise<object>} the appended notification
     */
    async add(notification) {
      const list = (await a.get(KEY)) ?? []
      const updated = [...list, notification]
      await a.set(KEY, updated)
      return notification
    },

    /**
     * Set read:true on the notification with matching id.
     * @param {string} id
     */
    async markRead(id) {
      const list = (await a.get(KEY)) ?? []
      const updated = list.map((n) =>
        n.id === id ? { ...n, read: true } : n
      )
      await a.set(KEY, updated)
    },

    /**
     * Replace the entire notifications list.  Used by the realtime bridge when
     * a remote update arrives with a canonical list.
     * @param {Array} list
     */
    async replaceAll(list) {
      await a.set(KEY, list)
    },
  }
}

export const notificationsRepository = createNotificationsRepository()
export default notificationsRepository
