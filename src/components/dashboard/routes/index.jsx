import React from 'react'
import { useOutletContext, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'

import Overview from '../overview/Overview'
import StaffView from '../views/StaffView'
import TouchpointsView from '../../TouchpointsView'
import ReviewsView from '../views/ReviewsView'
import TipsView from '../../TipsView'
import ReportsView from '../views/ReportsView'
import SettingsView from '../../SettingsView'
import AnalyticsView from '../../AnalyticsView'
import SupportView from '../../SupportView'
import ComingSoon from '../views/ComingSoon'
import StaffDetailView from '../../StaffDetailView'

export function OverviewRoute() {
  const ctx = useOutletContext()
  const navigate = useNavigate()
  return (
    <Overview
      metrics={ctx.metrics}
      activeKpi={ctx.activeKpi}
      setActiveKpi={ctx.setActiveKpi}
      chartRange={ctx.chartRange}
      setChartRange={ctx.handleChartRangeChange}
      chartStartDate={ctx.chartStartDate}
      chartEndDate={ctx.chartEndDate}
      setChartStartDate={ctx.setChartStartDate}
      setChartEndDate={ctx.setChartEndDate}
      transactions={ctx.transactions}
      selectedStaff={ctx.selectedLeaderboardStaff}
      setSelectedStaff={ctx.handleSelectLeaderboardStaff}
      onOpenTouchpoints={() => navigate('/dashboard/touchpoints')}
      onOpenReviews={() => navigate('/dashboard/reviews')}
      businessName={ctx.businessName}
      previewQr={ctx.previewQr}
      hasKyb={ctx.hasKyb}
      hasSetup={ctx.hasSetup}
      onStartSetup={ctx.onStartSetup}
      profile={ctx.profile}
      onNavigateMenu={ctx.onNavigateMenu}
    />
  )
}


export function StaffRoute() {
  const ctx = useOutletContext()
  const navigate = useNavigate()
  return (
    <StaffView
      staff={ctx.filteredStaff}
      pendingStaff={ctx.pendingStaff}
      allStaff={ctx.staff}
      isLoading={ctx.staffLoading}
      onApproveClick={ctx.openApproveStaff}
      onAdd={ctx.openAddStaff}
      onEdit={ctx.openEditStaff}
      onDelete={ctx.deleteStaff}
      onQr={ctx.previewQr}
      onToggle={ctx.toggleStaff}
      onToggleTipsFlow={ctx.toggleStaffTipsFlow}
      onViewDetail={(id) => navigate(`/dashboard/staff/${id}`)}
      onLinkStaff={ctx.handleLinkStaff}
      onInviteStaff={ctx.handleInviteStaff}
      onResendInvite={ctx.handleResendInvite}
      businessName={ctx.businessName}
      onAcceptJoin={ctx.handleAcceptJoinRequest}
      onDeclineJoin={ctx.handleDeclineJoinRequest}
      onAcceptUnlink={ctx.handleAcceptUnlinkRequest}
      onDeclineUnlink={ctx.handleDeclineUnlinkRequest}
      onOpenInviteShare={() => {
        ctx.setInviteShareDefaultName('')
        ctx.setInviteShareDefaultContact('')
        ctx.setIsInviteShareOpen(true)
      }}
    />
  )
}

export function StaffDetailRoute() {
  const ctx = useOutletContext()
  const { staffId } = useParams()
  const navigate = useNavigate()
  
  const member = ctx.staff.find((m) => m.id === staffId)
  if (!member) {
    return <Navigate to="/dashboard/staff" replace />
  }

  return (
    <StaffDetailView
      staffMember={member}
      onBack={() => navigate('/dashboard/staff')}
      transactions={ctx.transactions}
      reviews={ctx.reviews}
      onEdit={ctx.openEditStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
  )
}

export function StaffRoleRoute() {
  const ctx = useOutletContext()
  const navigate = useNavigate()
  // currentStaffId should be passed via context, wait, we didn't add it to dashboardCtx!
  // Let's rely on ctx.currentStaffId
  const member = ctx.staff.find((m) => m.id === ctx.currentStaffId)
  
  if (!member) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
        <div className="text-sm font-semibold text-nexoraMuted">
          We could not locate your staff profile.
        </div>
      </div>
    )
  }

  return (
    <StaffDetailView
      staffMember={member}
      onBack={null}
      transactions={ctx.transactions}
      reviews={ctx.reviews}
      onEdit={ctx.openEditStaff}
      onQr={ctx.previewQr}
      onDelete={null}
    />
  )
}

export function TouchpointsRoute() {
  const ctx = useOutletContext()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'stations'

  return (
    <TouchpointsView
      touchpoints={ctx.filteredTouchpoints}
      onOpenAddModal={(prefill) => {
        ctx.setAddTouchpointPrefill(prefill || null)
        ctx.setIsAddTouchpointModalOpen(true)
      }}
      onDelete={(id) => ctx.deleteTouchpoint(id)}
      onQr={ctx.previewQr}
      onToggleStatus={ctx.toggleTouchpointStatus}
      onLinkDevice={ctx.linkDevice}
      transactions={ctx.transactions}
      businessName={ctx.businessName}
      devices={ctx.devices}
      onAddDevice={ctx.handleAddDevice}
      onDeleteDevice={ctx.handleDeleteDevice}
      onToggleDeviceStatus={ctx.handleToggleDeviceStatus}
      activeSubTab={tab}
      onTabChange={(t) => setSp({ tab: t }, { replace: true })}
    />
  )
}

export function ReviewsRoute() {
  const ctx = useOutletContext()
  return (
    <ReviewsView
      reviews={ctx.filteredReviews}
      staff={ctx.staff}
      filter={ctx.reviewFilterStaff}
      setFilter={ctx.setReviewFilterStaff}
      setupData={ctx.setupData}
    />
  )
}

export function TipsRoute() {
  const ctx = useOutletContext()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'overview'

  return (
    <TipsView
      transactions={ctx.transactions}
      staff={ctx.staff}
      activeTab={tab}
      onTabChange={(t) => setSp({ tab: t }, { replace: true })}
      processingFee={ctx.processingFee}
      setProcessingFee={ctx.setProcessingFee}
    />
  )
}

export function ReportsRoute() {
  const ctx = useOutletContext()
  return <ReportsView transactions={ctx.filteredTransactions} staff={ctx.staff} touchpoints={ctx.touchpoints} />
}

export function AnalyticsRoute() {
  const ctx = useOutletContext()
  return (
    <AnalyticsView
      transactions={ctx.transactions}
      staff={ctx.staff}
      touchpoints={ctx.touchpoints}
      processingFee={ctx.processingFee}
    />
  )
}

export function SettingsRoute() {
  const ctx = useOutletContext()
  const { tab = 'profile' } = useParams()
  const navigate = useNavigate()

  return (
    <SettingsView
      setupData={ctx.setupData}
      hasKyb={ctx.hasKyb}
      verificationStatus={ctx.verificationStatus}
      onBlockedFeatureClick={ctx.requireKyb}
      userEmail={ctx.userEmail}
      onKybRequired={ctx.requireKyb}
      initialTab={tab}
      onTabChange={(t) => navigate(`/dashboard/settings/${t}`)}
      onKybSuccess={ctx.onKybSuccess}
    />
  )
}

export function SupportRoute() {
  return <SupportView />
}

export function SubscriptionsRoute() {
  const navigate = useNavigate()
  return <ComingSoon activeMenu="subscriptions" onBack={() => navigate('/dashboard')} />
}

export function FallbackRoute() {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()
  return <ComingSoon activeMenu={currentPath} onBack={() => navigate('/dashboard')} />
}
