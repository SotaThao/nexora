/**
 * notificationsRepository — API-only implementation.
 * Short-lived cache prevents StrictMode double-mount from duplicating calls.
 */

import httpClient from "../../lib/httpClient";

const CACHE_TTL = 5_000; // 5 seconds
let _listCache = { promise: null, ts: 0 };
let _unreadCache = { promise: null, ts: 0 };

function cachedFetch(cache, fetcher) {
  const now = Date.now();
  if (cache.promise && now - cache.ts < CACHE_TTL) return cache.promise;
  cache.ts = now;
  cache.promise = fetcher().catch((err) => {
    cache.promise = null;
    cache.ts = 0;
    throw err;
  });
  return cache.promise;
}

export function createNotificationsRepository(client = httpClient) {
  return {
    /**
     * @returns {Promise<Array>}
     */
    async list() {
      return cachedFetch(_listCache, async () => {
        const response = await client.get("/api/v1/notifications");
        const items = Array.isArray(response) ? response : response.data || [];
        return items.map((item) => ({
          id: item.id,
          type: item.type || "info",
          title: item.title || "",
          body: item.body || item.message || "",
          isRead: Boolean(item.isRead || item.read),
          createdAt: item.createdAt || new Date().toISOString(),
        }));
      });
    },

    /**
     * @returns {Promise<number>}
     */
    async unreadCount() {
      return cachedFetch(_unreadCache, async () => {
        const response = await client.get("/api/v1/notifications/unread-count");
        return typeof response === "number" ? response : response.count || 0;
      });
    },

    /**
     * @param {string} id
     */
    async markRead(id) {
      return client.put(`/api/v1/notifications/${id}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllRead() {
      return client.put("/api/v1/notifications/read-all");
    },

    /**
     * @deprecated server-side generation
     */
    async add(notification) {
      return notification;
    },

    /**
     * @deprecated server-side generation
     */
    async replaceAll(list) {
      // no-op
    },
  };
}

export const notificationsRepository = createNotificationsRepository();
export default notificationsRepository;
