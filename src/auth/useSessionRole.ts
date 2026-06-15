import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useSessionRole() {
  const auth = useContext(AuthContext)
  const isAuthenticated = auth?.status === 'authenticated'
  const session = auth?.session ?? null

  return {
    status: auth?.status ?? 'loading',
    session,
    isAuthenticated,
    isOwner: isAuthenticated && session?.role === 'owner',
    isStaff: isAuthenticated && session?.role === 'staff',
  }
}
