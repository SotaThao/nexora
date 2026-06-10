import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import RootRedirect from './RootRedirect'
import LoadingScreen from './LoadingScreen'
import { isDemoToolsEnabled } from './demoTools'
import { useAuth } from '../auth/useAuth'
import {
  OverviewRoute, StaffRoute, StaffDetailRoute, TouchpointsRoute,
  ReviewsRoute, TipsRoute, ReportsRoute, AnalyticsRoute,
  SettingsRoute, SupportRoute, SubscriptionsRoute, FallbackRoute
} from '../components/dashboard/routes'

const SetupWizard = lazy(() => import('../components/SetupWizard'))
const Dashboard = lazy(() => import('../components/Dashboard'))
const CustomerFlow = lazy(() => import('../components/CustomerFlow'))
const RegisterWizard = lazy(() => import('../components/RegisterWizard'))
const StaffRegistrationWizard = lazy(() => import('../components/StaffRegistrationWizard'))
const StaffDashboard = lazy(() => import('../components/staff-dashboard/StaffDashboard'))
const StaffHome = lazy(() => import('../components/staff-dashboard/views/StaffHome'))
const StaffMyQR = lazy(() => import('../components/staff-dashboard/views/StaffMyQR'))
const StaffTips = lazy(() => import('../components/staff-dashboard/views/StaffTips'))
const StaffReviews = lazy(() => import('../components/staff-dashboard/views/StaffReviews'))
const StaffPay = lazy(() => import('../components/staff-dashboard/views/StaffPay'))
const StaffProfile = lazy(() => import('../components/staff-dashboard/views/StaffProfile'))
const StaffNotifications = lazy(() => import('../components/staff-dashboard/views/StaffNotifications'))
const ForgotPassword = lazy(() => import('../components/ForgotPassword'))
const ResetPassword = lazy(() => import('../components/ResetPassword'))
const LoginScreen = lazy(() => import('./LoginScreen'))

// Bridges the URL (path token / legacy ?flow=staff-invite biz) to the wizard's
// inviteData prop. A real token → API-backed invite; otherwise the legacy
// simulation/biz path (matches the pre-router ?flow=staff-invite payload shape).
function InviteRoute() {
  const { token } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const biz = state?.biz || ''
  const inviteData = token
    ? { token, biz }
    : { id: '', name: '', email: '', phone: '', role: 'Nail Technician', biz }
  return (
    <StaffRegistrationWizard
      inviteData={inviteData}
      isDemoToolsEnabled={isDemoToolsEnabled}
      onReturnToMerchant={() => navigate('/dashboard', { replace: true })}
    />
  )
}

export default function AppRouter() {
  const { session, logout } = useAuth()
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterWizard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/touch/:businessSlug/:touchPointSlug" element={<CustomerFlow />} />
        <Route path="/invite" element={<InviteRoute />} />
        <Route path="/invite/:token" element={<InviteRoute />} />
        <Route path="/staff/invite/:token" element={<InviteRoute />} />
        
        <Route path="/onboarding" element={
          <RequireAuth role="owner">
            <SetupWizard />
          </RequireAuth>
        } />
        
        <Route path="/dashboard" element={
          <RequireAuth role="owner">
            <Dashboard
               userEmail={session?.email}
               userRole="owner"
               verificationStatus={session?.verificationStatus || 'unverified'}
               hasKyb={session?.verificationStatus === 'kyb_approved'}
               onLogout={logout}
            />
          </RequireAuth>
        }>
          <Route index element={<OverviewRoute />} />
          <Route path="staff" element={<StaffRoute />} />
          <Route path="staff/:staffId" element={<StaffDetailRoute />} />
          <Route path="tips" element={<TipsRoute />} />
          <Route path="reviews" element={<ReviewsRoute />} />
          <Route path="reports" element={<ReportsRoute />} />
          <Route path="touchpoints" element={<TouchpointsRoute />} />
          <Route path="analytics" element={<AnalyticsRoute />} />
          <Route path="settings" element={<SettingsRoute />} />
          <Route path="settings/:tab" element={<SettingsRoute />} />
          <Route path="subscriptions" element={<SubscriptionsRoute />} />
          <Route path="support" element={<SupportRoute />} />
          <Route path="*" element={<FallbackRoute />} />
        </Route>
        
        <Route path="/staff" element={
          <RequireAuth role="staff">
            <StaffDashboard 
              staffId={session?.staffId}
              onLogout={logout}
            />
          </RequireAuth>
        }>
          <Route index element={<StaffHome />} />
          <Route path="qr" element={<StaffMyQR />} />
          <Route path="tips" element={<StaffTips />} />
          <Route path="reviews" element={<StaffReviews />} />
          <Route path="pay" element={<StaffPay />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="notifications" element={<StaffNotifications />} />
          <Route path="*" element={<FallbackRoute />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
