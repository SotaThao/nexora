import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { StaffAccountProvider } from '../../../contexts/StaffAccountContext'
import StaffSidebar from '../../staff-dashboard/layout/StaffSidebar'
import { HomePageLayoutProvider } from '../context/HomePageLayoutContext'

interface HomePageStaffSidebarLayoutProps {
  staffId?: string | null
  onLogout: () => void
  children: ReactNode
}

export default function HomePageStaffSidebarLayout({
  staffId = null,
  onLogout,
  children,
}: HomePageStaffSidebarLayoutProps) {
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavigate = (screen: string) => {
    const path = screen === 'home' ? '/staff' : `/staff/${screen}`
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  const layoutValue = useMemo(
    () => ({
      hasMobileMenu: true,
      openSidebarMenu: () => setIsMobileMenuOpen(true),
    }),
    [],
  )

  return (
    <StaffAccountProvider staffId={staffId}>
      <HomePageLayoutProvider value={layoutValue}>
        <div className="min-h-dvh">
          <StaffSidebar
            activeScreen="public-home"
            isHomeActive
            mobileOnly
            onNavigate={handleNavigate}
            onLogout={onLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          {children}
        </div>
      </HomePageLayoutProvider>
    </StaffAccountProvider>
  )
}
