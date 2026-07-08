import type { ReactNode } from 'react'
import useAuth from '../../../auth/useAuth'
import { HomePageLayoutProvider } from '../context/HomePageLayoutContext'
import { isStaffSession } from '../utils/sessionRouting'
import HomePageOwnerSidebarLayout from './HomePageOwnerSidebarLayout'
import HomePageStaffSidebarLayout from './HomePageStaffSidebarLayout'

interface HomePageAuthenticatedLayoutProps {
  children: ReactNode
}

const guestLayoutValue = {
  hasMobileMenu: false,
  openSidebarMenu: () => {},
}

export default function HomePageAuthenticatedLayout({ children }: HomePageAuthenticatedLayoutProps) {
  const { session, status, logout } = useAuth()

  if (status !== 'authenticated' || !session) {
    return (
      <HomePageLayoutProvider value={guestLayoutValue}>
        {children}
      </HomePageLayoutProvider>
    )
  }

  if (isStaffSession(session)) {
    return (
      <HomePageStaffSidebarLayout staffId={session.staffId} onLogout={logout}>
        {children}
      </HomePageStaffSidebarLayout>
    )
  }

  return (
    <HomePageOwnerSidebarLayout session={session} onLogout={logout}>
      {children}
    </HomePageOwnerSidebarLayout>
  )
}
