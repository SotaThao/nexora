import type { AuthSession } from '../../../types/auth'

export function isStaffSession(session: AuthSession): boolean {
  return (
    session.flag === '!personal' ||
    session.role === 'personal' ||
    session.role === 'staff'
  )
}

export function dashboardPathForSession(session: AuthSession): string {
  return isStaffSession(session) ? '/staff' : '/dashboard'
}
