// StaffDashboard — orchestrator for the staff personal account dashboard.
// Renders a responsive shell (desktop sidebar + mobile bottom nav + header)
// and switches the active screen. Wraps everything in StaffAccountProvider.
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { StaffAccountProvider } from '../../contexts/StaffAccountContext'

import StaffSidebar from './layout/StaffSidebar'
import StaffHeader from './layout/StaffHeader'
import StaffBottomNav from './layout/StaffBottomNav'
import StaffHome from './views/StaffHome'
import StaffMyQR from './views/StaffMyQR'
import StaffTips from './views/StaffTips'
import StaffReviews from './views/StaffReviews'
import StaffPay from './views/StaffPay'
import StaffProfile from './views/StaffProfile'
import StaffNotifications from './views/StaffNotifications'

const SCREENS = {
  home: StaffHome,
  qr: StaffMyQR,
  tips: StaffTips,
  reviews: StaffReviews,
  pay: StaffPay,
  profile: StaffProfile,
  notifications: StaffNotifications
}

export default function StaffDashboard({ staffId = null, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const activeScreen = location.pathname.split('/')[2] || 'home'
  
  const handleNavigate = (screen) => {
    navigate(screen === 'home' ? '/staff' : `/staff/${screen}`)
    setIsMobileMenuOpen(false)
  }

  return (
    <StaffAccountProvider staffId={staffId}>
      <div className="min-h-dvh bg-nexoraCanvas text-nexoraText">
        <StaffSidebar 
          activeScreen={activeScreen} 
          onNavigate={handleNavigate} 
          onLogout={onLogout} 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="lg:pl-72">
          <StaffHeader 
            activeScreen={activeScreen} 
            onNavigate={handleNavigate} 
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          <main className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6 lg:pb-10">
            <Outlet context={{ onNavigate: handleNavigate, onLogout }} />
          </main>
        </div>

        <StaffBottomNav activeScreen={activeScreen} onNavigate={handleNavigate} />
      </div>
    </StaffAccountProvider>
  )
}
