import React, { useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'

import Overview from '../overview/Overview'
import StaffView from '../views/StaffView'
import TouchpointsView from '../../TouchpointsView'
import ReviewsView from '../views/ReviewsView'
import TipsView from '../../TipsView'
import ReportsView from '../views/ReportsView'
import SettingsView from '../../SettingsView'
import AnalyticsView from '../../AnalyticsView'
import SupportView from '../../SupportView'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import ComingSoon from '../views/ComingSoon'
import ManagePlanView from '../views/ManagePlanView'
import StaffDetailView from '../../StaffDetailView'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import { useTransactionsPaginated } from '../../../data/hooks/useTransactions'
import { useDashboardReviews } from '../../../data/hooks/useReviews'
import { normaliseMember } from '../hooks/useStaffManagement'
import { SkeletonList } from '../../ui/skeleton'

function staffRecordMatchesMember(member, record) {
  if (!member || !record) return false
  const profileId = member.staffProfileId
  const staffCode = member.staffCode
  const linkId = member.id || member.linkId
  const name = member.fullName || member.nickname

  if (profileId && record.staffProfileId === profileId) return true
  if (staffCode && record.staffCode === staffCode) return true
  if (linkId && (record.staffId === linkId || record.id === linkId)) return true
  if (name && record.staffName === name) return true
  return false
}

export function OverviewRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  return (
    <Overview
      {...({
        chartRange: ctx.chartRange,
        setChartRange: ctx.handleChartRangeChange,
        chartStartDate: ctx.chartStartDate,
        chartEndDate: ctx.chartEndDate,
        setChartStartDate: ctx.setChartStartDate,
        setChartEndDate: ctx.setChartEndDate,
      } as any)}
      metrics={ctx.metrics}
      kpiDeltas={ctx.kpiDeltas}
      activeKpi={ctx.activeKpi}
      setActiveKpi={ctx.setActiveKpi}
      transactions={ctx.transactions}
      selectedStaff={ctx.selectedLeaderboardStaff}
      setSelectedStaff={ctx.handleSelectLeaderboardStaff}
      onOpenTouchpoints={() => navigate('/dashboard/touchpoints')}
      onOpenReviews={() => navigate('/dashboard/reviews')}
      onOpenStaff={() => navigate('/dashboard/staff')}
      businessName={ctx.businessName}
      previewQr={ctx.previewQr}
      touchpoints={ctx.touchpoints}
      hasKyb={ctx.hasKyb}
      hasSetup={ctx.hasSetup}
      onStartSetup={ctx.onStartSetup}
      profile={ctx.profile}
      onNavigateMenu={ctx.onNavigateMenu}
      onApproveClick={ctx.openApproveStaff}
      pendingStaff={ctx.pendingStaff}
      staff={ctx.staff}
      isLoading={ctx.isOverviewLoading}
      isTransactionsLoading={ctx.isTransactionsLoading}
      isTouchpointsLoading={ctx.isTouchpointsLoading}
      reviewsPage={ctx.reviewsPage}
      isReviewsPending={ctx.isReviewsPending}
      metricsMonth={ctx.metricsMonth}
      metricsYear={ctx.metricsYear}
    />
  )
}


export function StaffRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  return (
    <StaffView
      staff={ctx.filteredStaff}
      pendingStaff={ctx.pendingStaff}
      allStaff={ctx.staff}
      isLoading={ctx.staffListLoading ?? ctx.staffLoading}
      isFetching={ctx.staffListFetching}
      onApproveClick={ctx.openApproveStaff}
      onAdd={ctx.openAddStaff}
      onViewStaff={ctx.openViewStaff}
      onDelete={ctx.deleteStaff}
      onQr={ctx.previewQr}
      onToggle={ctx.toggleStaff}
      onToggleTipsFlow={ctx.toggleStaffTipsFlow}
      onViewDetail={(member) => navigate(`/dashboard/staff/${member.staffCode || member.id}`)}
      onResendInvite={ctx.handleResendInvite}
      businessName={ctx.businessName}
      businessSlug={ctx.businessSlug}
      inviteLinkSetting={ctx.inviteLinkSetting}
      isInviteLinkSettingLoading={ctx.isInviteLinkSettingLoading}
      onAcceptJoin={ctx.handleAcceptJoinRequest}
      onDeclineJoin={ctx.handleDeclineJoinRequest}
      onAcceptUnlink={ctx.handleAcceptUnlinkRequest}
      onDeclineUnlink={ctx.handleDeclineUnlinkRequest}
      onOpenInviteShare={() => {
        ctx.setInviteShareDefaultName('')
        ctx.setInviteShareDefaultContact('')
        ctx.setIsInviteShareOpen(true)
      }}
      // Pagination props
      pageNumber={ctx.activeStaffPage}
      pageSize={ctx.activeStaffPageSize}
      totalPages={ctx.activeStaffTotalPages}
      totalCount={ctx.activeStaffTotalCount}
      hasNextPage={ctx.activeStaffHasNext}
      hasPreviousPage={ctx.activeStaffHasPrev}
      onPageChange={ctx.setActiveStaffPage}
      togglingStaffId={ctx.togglingStaffId}
    />
  )
}

export function StaffDetailRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { staffId: staffKey } = useParams()
  const navigate = useNavigate()

  const {
    data: staffMember,
    isLoading: isStaffDetailLoading,
    isError: isStaffDetailError,
  } = useMerchantStaffByCode(staffKey)

  const fallbackMember = useMemo(
    () => ctx.staff.find((m) =>
      String(m.id) === String(staffKey) ||
      String(m.staffProfileId) === String(staffKey) ||
      String(m.staffCode) === String(staffKey) ||
      String(m.linkId) === String(staffKey),
    ),
    [ctx.staff, staffKey],
  )

  const resolvedMember = staffMember ?? fallbackMember
  const staffProfileId = resolvedMember?.staffProfileId

  const { data: tipsPage, isLoading: isTipsLoading } = useTransactionsPaginated(
    { staffProfileId, pageNumber: 1, pageSize: 100 },
    { enabled: !!staffProfileId },
  )

  const { data: reviewsPage } = useDashboardReviews(
    { pageNumber: 1, pageSize: 100 },
    { enabled: !!resolvedMember },
  )

  const transactions = useMemo(() => {
    if (tipsPage?.items?.length) return tipsPage.items
    return (ctx.transactions ?? []).filter((tx) => staffRecordMatchesMember(resolvedMember, tx))
  }, [tipsPage?.items, ctx.transactions, resolvedMember])

  const reviews = useMemo(() => {
    const source = reviewsPage?.items?.length ? reviewsPage.items : (ctx.reviews ?? [])
    return source.filter((rev) => staffRecordMatchesMember(resolvedMember, rev))
  }, [reviewsPage?.items, ctx.reviews, resolvedMember])

  if (isStaffDetailLoading || (!resolvedMember && ctx.staffLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} showAvatar lines={2} />
      </div>
    )
  }

  if ((isStaffDetailError && !fallbackMember) || !resolvedMember) {
    return <Navigate to="/dashboard/staff" replace />
  }

  return (
    <StaffDetailView
      staffMember={normaliseMember(resolvedMember)}
      onBack={() => navigate('/dashboard/staff')}
      transactions={transactions}
      reviews={reviews}
      isTipsLoading={isTipsLoading}
      onEdit={ctx.openEditStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
  )
}

export function StaffRoleRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const member = ctx.staff.find((m) => m.id === ctx.currentStaffId)

  if (!member) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
        <div className="text-sm font-semibold text-nexoraMuted">
          {t('components.dashboardRoot.yourStaffProfileWas')}
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
  const ctx = useOutletContext<LooseObject>()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'stations'
  const activeSubTab = tab === 'devices' ? 'devices' : 'stations'

  return (
    <TouchpointsView
      onOpenAddModal={(prefill) => {
        ctx.setAddTouchpointPrefill(prefill || null)
        ctx.setIsAddTouchpointModalOpen(true)
      }}
      onDelete={(id) => ctx.deleteTouchpoint(id)}
      onQr={ctx.previewQr}
      onToggleStatus={ctx.toggleTouchpointStatus}
      togglingTouchpointId={ctx.togglingTouchpointId}
      onLinkDevice={ctx.linkDevice}
      transactions={ctx.transactions}
      businessName={ctx.businessName}
      devices={ctx.devices}
      onAddDevice={ctx.handleAddDevice}
      onDeleteDevice={ctx.handleDeleteDevice}
      onToggleDeviceStatus={ctx.handleToggleDeviceStatus}
      activeSubTab={activeSubTab}
      onTabChange={(nextTab) => {
        setSp({ tab: nextTab }, { replace: true })
      }}
    />
  )
}

export function ReviewsRoute() {
  const ctx = useOutletContext<LooseObject>()

  return (
    <ReviewsView
      reviews={ctx.reviewsPage?.items ?? []}
      isLoading={ctx.isReviewsPending}
      isFetching={ctx.reviewsListFetching}
      staff={ctx.filteredStaff}
      filter={ctx.reviewFilterStaff}
      setFilter={ctx.setReviewFilterStaff}
      setupData={ctx.setupData}
      pageNumber={ctx.activeReviewsPage}
      pageSize={ctx.activeReviewsPageSize}
      totalPages={ctx.activeReviewsTotalPages}
      totalCount={ctx.activeReviewsTotalCount}
      hasNextPage={ctx.activeReviewsHasNext}
      hasPreviousPage={ctx.activeReviewsHasPrev}
      onPageChange={ctx.setActiveReviewsPage}
    />
  )
}

export function TipsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const [sp, setSp] = useSearchParams()
  const rawTab = sp.get('tab') || 'overview'
  const tab = rawTab === 'transactions' ? 'overview' : rawTab

  useEffect(() => {
    if (rawTab === 'transactions') {
      setSp({ tab: 'overview' }, { replace: true })
    }
  }, [rawTab, setSp])

  return (
    <TipsView
      transactions={ctx.transactions}
      staff={ctx.staff}
      metrics={ctx.metrics}
      tipsChartData={ctx.tipsChartData}
      activeTab={tab}
      onTabChange={(t) => setSp({ tab: t }, { replace: true })}
      processingFee={ctx.processingFee}
      setProcessingFee={ctx.setProcessingFee}
    />
  )
}

export function ReportsRoute() {
  const ctx = useOutletContext<LooseObject>()
  return <ReportsView staff={ctx.staff} touchpoints={ctx.touchpoints} businessName={ctx.businessName} businessSlug={ctx.businessSlug} />
}

export function AnalyticsRoute() {
  const ctx = useOutletContext<LooseObject>()
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
  const ctx = useOutletContext<LooseObject>()
  const { tab = 'profile' } = useParams()
  const navigate = useNavigate()

  return (
    <SettingsView
      {...({ onBlockedFeatureClick: ctx.requireKyb } as any)}
      setupData={ctx.setupData}
      hasKyb={ctx.hasKyb}
      verificationStatus={ctx.verificationStatus}
      userEmail={ctx.userEmail}
      onKybRequired={ctx.requireKyb}
      initialTab={tab}
      onTabChange={(t) => navigate(`/dashboard/settings/${t}`)}
      onKybSuccess={ctx.onKybSuccess}
    />
  )
}

export function SupportRoute() {
  const { currentLanguage } = useTranslation()
  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_KEY

  if (!recaptchaKey) {
    return <SupportView recaptchaEnabled={false} />
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey} language={currentLanguage}>
      <SupportView recaptchaEnabled />
    </GoogleReCaptchaProvider>
  )
}

export function SubscriptionsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  const currentPlanId = ctx?.profile?.subscription?.plan ?? null
  return (
    <ManagePlanView
      currentPlanId={currentPlanId}
      onSelectPlan={() => navigate('/dashboard/support')}
    />
  )
}

export function FallbackRoute() {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()
  return <ComingSoon activeMenu={currentPath} onBack={() => navigate('/dashboard')} />
}
