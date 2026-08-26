import { apiAuthAdapter } from './apiAuthAdapter'
import { mockAuthAdapter } from './mockAuthAdapter'

export const authAdapter = {
  async getSession() {
    const mockSession = await mockAuthAdapter.getSession()
    if (mockSession) return mockSession
    try {
      return await apiAuthAdapter.getSession()
    } catch {
      return null
    }
  },
  async login(credentials: any) {
    if (credentials.email?.includes('demo') || credentials.password === 'demo123') {
      return await mockAuthAdapter.login(credentials)
    }
    try {
      return await apiAuthAdapter.login(credentials)
    } catch {
      // Fallback to demo login if backend is down
      return await mockAuthAdapter.login(credentials)
    }
  },
  async logout() {
    await mockAuthAdapter.logout()
    try {
      await apiAuthAdapter.logout()
    } catch {}
  },
  async refreshSession() {
    const mock = await mockAuthAdapter.getSession()
    if (mock) return mock
    return await apiAuthAdapter.refreshSession()
  }
}
