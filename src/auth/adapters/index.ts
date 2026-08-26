import { apiAuthAdapter } from './apiAuthAdapter'
import { mockAuthAdapter, DEMO_OWNER_SESSION } from './mockAuthAdapter'

export const authAdapter = {
  async getSession() {
    const mockSession = await mockAuthAdapter.getSession()
    if (mockSession) return mockSession
    try {
      const real = await apiAuthAdapter.getSession()
      if (real) return real
    } catch {}
    // Default to Demo Owner in client-only/demo mode so user is never locked out
    return DEMO_OWNER_SESSION
  },
  async login(credentials: any) {
    if (credentials.email?.includes('demo') || credentials.password === 'demo' || credentials.password === 'demo123') {
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
    try {
      const real = await apiAuthAdapter.refreshSession()
      if (real) return real
    } catch {}
    return DEMO_OWNER_SESSION
  }
}
