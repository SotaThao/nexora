/**
 * profileSettingsRepository — API-only implementation.
 * In-flight deduplication ensures concurrent callers (AuthProvider + React Query)
 * share a single HTTP round-trip for the same endpoint.
 */

import httpClient from "../../lib/httpClient";

// Short-lived cache: keeps resolved value for TTL ms so StrictMode remount
// and React Query queryFn share a single HTTP round-trip.
const CACHE_TTL = 5_000; // 5 seconds

let _profileCache = { promise: null, ts: 0 };
let _verifiedCache = { promise: null, ts: 0 };

function cachedFetch(cache, fetcher) {
  const now = Date.now();
  if (cache.promise && now - cache.ts < CACHE_TTL) return cache.promise;

  cache.ts = now;
  cache.promise = fetcher().catch((err) => {
    // On error, clear cache immediately so next call retries
    cache.promise = null;
    cache.ts = 0;
    throw err;
  });
  return cache.promise;
}

export function createProfileSettingsRepository(client = httpClient) {
  return {
    /**
     * @returns {Promise<object|null>}
     */
    async get() {
      return cachedFetch(_profileCache, () =>
        client
          .get("/api/v1/userprofile/me")
          .then((response) => response || null)
          .catch((err) => {
            if (err?.errorCode === "COMMON_NOT_FOUND" || err?.status === 404) {
              return null;
            }
            throw err;
          }),
      );
    },

    /**
     * @returns {Promise<object>}
     */
    async getVerifiedStatus() {
      return cachedFetch(_verifiedCache, () =>
        client.get("/api/v1/userprofile/verified-status"),
      );
    },

    /**
     * @param {object} dto
     * @param {string} dto.firstName
     * @param {string} dto.lastName
     * @param {string} dto.phoneNumber
     * @param {string} [dto.profileImageUrl]
     * @param {string} [dto.city]
     */
    async updateUserProfile(dto) {
      return client.put("/api/v1/userprofile/update", dto);
    },

    /**
     * @param {object} dto
     * @param {string} dto.displayName
     * @param {string} [dto.position]
     * @param {string} [dto.bio]
     * @param {string} [dto.photoUrl]
     */
    async updateStaffProfile(dto) {
      return client.put("/api/v1/staff/profile", dto);
    },

    /** @deprecated Use updateUserProfile instead */
    async save(settings) {
      // no-op
    },

    async clear() {
      // no-op
    },
  };
}

export const profileSettingsRepository = createProfileSettingsRepository();
export default profileSettingsRepository;
