// StaffDashboard — orchestrator for the staff personal account dashboard.
// Renders a responsive shell (desktop sidebar + mobile bottom nav + header)
// and switches the active screen. Wraps everything in StaffAccountProvider.
import { useState } from 'react'
import { StaffAccountProvider } from '../../contexts/StaffAccountContext'
import { DEMO_STAFF_ID } from './data/staffMockData'
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

export default function StaffDashboard({ staffId = DEMO_STAFF_ID, onLogout }) {
  const [activeScreen, setActiveScreen] = useState('home')
  const ActiveView = SCREENS[activeScreen] || StaffHome

  return (
    <StaffAccountProvider staffId={staffId}>
      <div className="min-h-dvh bg-nexoraCanvas text-nexoraText">
        <StaffSidebar activeScreen={activeScreen} onNavigate={setActiveScreen} onLogout={onLogout} />

        <div className="lg:pl-72">
          <StaffHeader activeScreen={activeScreen} onNavigate={setActiveScreen} />
          <main className="mx-auto max-w-3xl px-4 py-5 pb-28 sm:px-6 lg:pb-10">
            <ActiveView onNavigate={setActiveScreen} />
          </main>
        </div>

        <StaffBottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
      </div>
    </StaffAccountProvider>
  )
}
