/**
 * apiAuthAdapter — stub for the future real API auth phase.
 * All methods throw NotImplemented; the real implementation will use
 * httpClient with httpOnly-cookie sessions.
 */

class NotImplemented extends Error {
  constructor(method) {
    super(`apiAuthAdapter.${method} is not yet implemented (API phase)`)
    this.name = 'NotImplemented'
  }
}

export const apiAuthAdapter = {
  async login(_credentials) {
    throw new NotImplemented('login')
  },

  async logout() {
    throw new NotImplemented('logout')
  },

  async getSession() {
    throw new NotImplemented('getSession')
  },
}

export default apiAuthAdapter
