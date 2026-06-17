import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'


// 2. Third-party
import { Filter, Moon, Settings, ShieldAlert, Sun, Check, Link } from 'lucide-react'

// 3. Internal — utils → contexts → data/constants → hooks → layout → views → modals → ui
import { logger } from '../utils/logger'
import { resolveMerchantStaffTipQr, toLocalCustomerTouchUrl } from '../utils/staffTipUrl'
import { mapTouchpointTypeToApi, resolveAssignedStaffProfileId } from '../utils/touchpointTypes'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { DEFAULT_PAYOUT_CONFIGS, MENU_ITEMS } from './dashboard/constants'
import { slugify, getPayoutConfigsFromMember } from './dashboard/utils'
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation'
import { useDevices } from './dashboard/hooks/useDevices'
import { useKybGate } from '../contexts/KybGateContext'
import { useStaffManagement } from './dashboard/hooks/useStaffManagement'
import { useTouchpoints, useCreateTouchpoint, useDeleteTouchpoint, useDownloadTouchpointQr } from '../data/hooks/useMerchantTouchpoints'
import { useMerchantStaff, StatusFilter } from '../data/hooks/useMerchantStaff'
import { useChartDateRange } from '../hooks/useChartDateRange'
import { useTransactions } from '../data/hooks/useTransactions'
import { useReviews } from '../data/hooks/useReviews'
import { useNotifications, useMarkNotificationRead } from '../data/hooks/useNotifications'
import { useProfileSettings, useSaveProfileSettings } from '../data/hooks/useProfileSettings'
import { useMerchantSetup, useSaveMerchantSetup } from '../data/hooks/useMerchantSetup'
import { useMerchantInviteLinkSetting } from '../data/hooks/useMerchantSettings'
import DashboardHeader from './dashboard/layout/DashboardHeader'
import DashboardSidebar from './dashboard/layout/DashboardSidebar'
import MobileMenuDrawer from './dashboard/layout/MobileMenuDrawer'
import Overview from './dashboard/overview/Overview'
import StaffView from './dashboard/views/StaffView'
import ReviewsView from './dashboard/views/ReviewsView'
import ReportsView from './dashboard/views/ReportsView'
import ComingSoon from './dashboard/views/ComingSoon'
import AnalyticsView from './AnalyticsView'
import SettingsView from './SettingsView'
import SupportView from './SupportView'
import TipsView from './TipsView'
import TouchpointsView from './TouchpointsView'
import StaffDetailView from './StaffDetailView'
import StaffModal from './dashboard/modals/StaffModal'
import QrModal from './dashboard/modals/QrModal'
import InviteShareModal from './dashboard/modals/InviteShareModal'
import AddTouchpointModal from './dashboard/modals/AddTouchpointModal'
import MobileBottomNav from './dashboard/layout/MobileBottomNav'


export default function Dashboard({
  setupData = null,
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved',
  userEmail = '',
  onKybSuccess = () => {},
  initialMenu = 'overview',
  initialSettingsTab = 'profile',
  onLogout,
  userRole = 'owner',
  currentStaffId = null,
  onStartSetup = null,
}) {
  const { currentLanguage, t } = useTranslation()
  const queryClient = useQueryClient()
  const { showToast, showConfirm } = useNotification()
  const { requireKyb } = useKybGate()
  const {
    activeMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    handleNavigateMenu, navigateMenu
  } = useDashboardNavigation()
  const navigate = useNavigate()
  const handleStartSetup = useCallback(() => {
    if (typeof onStartSetup === 'function') {
      onStartSetup()
      return
    }

    navigate('/onboarding')
  }, [navigate, onStartSetup])
  const [processingFee, setProcessingFee] = useState(3.0)

  // ---------------------------------------------------------------------------
  // Server-state hooks (TanStack Query)
  // ---------------------------------------------------------------------------
  const { data: transactionsData } = useTransactions()
  const { data: reviewsData } = useReviews()
  const { data: notificationsData } = useNotifications()
  const { data: profileSettingsData } = useProfileSettings()
  const { data: merchantSetupData } = useMerchantSetup()
  const [activeStaffPage, setActiveStaffPage] = useState(1)
  const [activeStaffPageSize] = useState(9)
  const {
    data: staffListData,
    isLoading: isStaffListLoading,
    isFetching: isStaffListFetching,
  } = useMerchantStaff({
    statusFilter: StatusFilter.Active,
    pageNumber: activeStaffPage,
    pageSize: activeStaffPageSize,
  })
  const { data: pendingStaffData, isLoading: isPendingStaffLoading } = useMerchantStaff({
    statusFilter: StatusFilter.Pending,
    pageNumber: 1,
    pageSize: 100,
  })
  const {
    data: inviteLinkSetting,
    isLoading: isInviteLinkSettingLoading,
  } = useMerchantInviteLinkSetting({ enabled: userRole === 'owner' })

  const markNotificationReadMutation = useMarkNotificationRead()
  const saveMerchantSetupMutation = useSaveMerchantSetup()

  // ---------------------------------------------------------------------------
  // Derived read data (with fallbacks so UI is never empty on first load)
  // ---------------------------------------------------------------------------
  const transactions = transactionsData ?? []
  const reviews = reviewsData ?? []

  // Notifications — thin local mirror so UI updates optimistically.
  // Server-generated notifications come from GET /api/v1/notifications.
  const [notifications, setNotifications] = useState(() => notificationsData ?? [])

  // Keep local notification mirror in sync when query data arrives / changes
  // (e.g. bridge-triggered refetch after a cross-tab update).
  useEffect(() => {
    if (notificationsData === undefined) return
    setNotifications(notificationsData)
  }, [notificationsData])

  // Profile — thin local mirror with complex initialisation / override rules.
  const buildFallbackProfile = (storeInfo, reviewInfo) => ({
    fullName: storeInfo?.ownerName || '',
    email: storeInfo?.businessEmail || userEmail || '',
    avatar: storeInfo?.logo || null,
    businessName: storeInfo?.name || '',
    businessPhone: storeInfo?.phone || '',
    businessWebsite: storeInfo?.website || '',
    street: storeInfo?.address || '',
    googleReview: reviewInfo?.googleReview || '',
    yelpReview: reviewInfo?.yelpReview || '',
    paymentAccounts: storeInfo?.paymentAccounts || {
      zelle: '',
      bankwire: '',
      paypal: '',
      venmo: '',
      cashapp: '',
      applecash: '',
      vlinkpay: ''
    }
  })

  const businessLogo = merchantSetupData?.businessInfo?.logo || setupData?.businessInfo?.logo || null

  const [profile, setProfile] = useState(() => {
    // Prefer saved profile settings, fall back to business info from setupData.
    if (profileSettingsData) return { ...profileSettingsData, avatar: profileSettingsData.avatar || businessLogo }
    const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
    const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
    return buildFallbackProfile(storeInfo, reviewInfo)
  })

  // Sync profile when query data arrives (bridge-triggered refetch).
  useEffect(() => {
    if (profileSettingsData) {
      if (!hasKyb && verificationStatus !== 'basic') {
        setProfile({
          ...profileSettingsData,
          avatar: profileSettingsData.avatar || businessLogo,
          fullName: '',
          email: userEmail || '',
          businessName: '',
          paymentAccounts: {
            zelle: '', bankwire: '', paypal: '',
            venmo: '', cashapp: '', applecash: '', vlinkpay: ''
          }
        })
      } else {
        setProfile({ ...profileSettingsData, avatar: profileSettingsData.avatar || businessLogo })
      }
    } else {
      // No saved settings — build from setup data / merchant setup query.
      const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
      const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
      setProfile(buildFallbackProfile(storeInfo, reviewInfo))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSettingsData, hasKyb, userEmail, verificationStatus, businessLogo])

  const [isNotiDropdownOpen, setIsNotiDropdownOpen] = useState(false)

  // Use API hooks for Touchpoints
  const { data: touchpointsData } = useTouchpoints()
  const touchpoints = touchpointsData?.items || []
  const createTouchpointMutation = useCreateTouchpoint()
  const deleteTouchpointMutation = useDeleteTouchpoint()

  const { devices, setDevices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus } = useDevices()
  const [qrTarget, setQrTarget] = useState<any | null>(null)
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
  const [isAddTouchpointModalOpen, setIsAddTouchpointModalOpen] = useState(false)
  const [addTouchpointPrefill, setAddTouchpointPrefill] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKpi, setActiveKpi] = useState('tips')
  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } = useChartDateRange(transactions)

  const [selectedLeaderboardStaff, setSelectedLeaderboardStaff] = useState<any | null>(null)

  const businessName = profile?.businessName || setupData?.businessInfo?.name || merchantSetupData?.businessInfo?.name || ''
  const businessSlug =
    merchantSetupData?.businessInfo?.slug ||
    setupData?.businessInfo?.slug ||
    slugify(businessName || 'business')

  const combinedStaffData = useMemo(() => {
    const byId = new Map()
    for (const member of staffListData?.items ?? []) {
      if (member?.id != null) byId.set(member.id, member)
    }
    for (const member of pendingStaffData?.items ?? []) {
      if (member?.id != null) byId.set(member.id, member)
    }
    return Array.from(byId.values())
  }, [staffListData, pendingStaffData])

  const {
    staff,
    isStaffLoading: staffLoading,
    staffForm, setStaffForm,
    errors, setErrors,
    editingStaffId, setEditingStaffId,
    isStaffModalOpen, setIsStaffModalOpen,
    isApproveModalOpen, setIsApproveModalOpen,
    approvingStaffMember, setApprovingStaffMember,
    isInviteShareOpen, setIsInviteShareOpen,
    inviteShareDefaultName, setInviteShareDefaultName,
    inviteShareDefaultContact, setInviteShareDefaultContact,
    resetStaffForm, openAddStaff, openApproveStaff, openEditStaff, closeStaffModal,
    saveStaff, sendSetupLinkFromModal, handleLinkStaff, handleInviteStaff,
    handleResendInvite, handleCancelInvite,
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    inviteStaffMutation,
  } = useStaffManagement({ staffData: combinedStaffData, isStaffLoading: isStaffListLoading || isPendingStaffLoading, businessName })

  // Sync touchpoints removed (now handled by React Query cache)

  // Define hasSetup state
  const hasSetup = !!(merchantSetupData || setupData)

  // For staff dashboard: populate profile info from their staff profile.
  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && staff.length > 0) {
      const currentStaff = staff.find(s => s.id === currentStaffId)
      if (currentStaff) {
        setProfile({
          fullName: currentStaff.fullName,
          email: currentStaff.email,
          avatar: currentStaff.avatar || null,
          businessName: businessName,
          businessPhone: currentStaff.phone || '',
          businessWebsite: '',
          street: '',
          googleReview: '',
          yelpReview: '',
          paymentAccounts: currentStaff.paymentAccounts || {
            zelle: '',
            bankwire: '',
            paypal: '',
            venmo: '',
            cashapp: '',
            applecash: '',
            vlinkpay: ''
          }
        })
      }
    }
  }, [userRole, currentStaffId, staff, businessName])

  const menuItemsToDisplay = userRole === 'staff'
    ? [
        { id: 'overview', label: t('components.dashboardRoot.myDashboard'), icon: MENU_ITEMS.find(i => i.id === 'overview')?.icon, image: MENU_ITEMS.find(i => i.id === 'overview')?.image },
        { id: 'support', label: t('dashboard.menu.support'), icon: MENU_ITEMS.find(i => i.id === 'support')?.icon }
      ]
    : MENU_ITEMS

  // Filter lists based on searchQuery
  const filteredStaff = useMemo(() => {
    const visibleStaff = staffListData?.items ?? []

    if (!searchQuery) return visibleStaff
    const query = searchQuery.toLowerCase().trim()
    return visibleStaff.filter(member =>
      member.fullName?.toLowerCase().includes(query) ||
      (member.nickname && member.nickname.toLowerCase().includes(query)) ||
      member.position?.toLowerCase().includes(query)
    )
  }, [staffListData, searchQuery])

  const pendingStaff = pendingStaffData?.items ?? []

  const filteredTouchpoints = useMemo(() => {
    if (!searchQuery) return touchpoints
    const query = searchQuery.toLowerCase().trim()
    const normalize = (value) =>
      String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_-]+/g, '')
    const compactQuery = normalize(query)

    const toReadableType = (rawType) => {
      const value = String(rawType ?? '').toLowerCase()
      if (value === 'frontdesk') return 'front desk'
      if (value === 'staffcard') return 'staff qr'
      if (value === 'receipt') return 'receipt qr'
      if (value === 'table') return 'table qr'
      return value
    }

    return touchpoints.filter((point) => {
      const isActive = point?.isActive !== false
      const readableStatus = isActive ? 'active' : 'inactive'
      const readableType = toReadableType(point?.type)

      return (
        String(point?.name ?? '').toLowerCase().includes(query) ||
        String(point?.type ?? '').toLowerCase().includes(query) ||
        readableType.includes(query) ||
        (point?.staffName && String(point.staffName).toLowerCase().includes(query)) ||
        String(point?.deviceId ?? '').toLowerCase().includes(query) ||
        String(point?.slug ?? '').toLowerCase().includes(query) ||
        String(point?.id ?? '').toLowerCase().includes(query) ||
        String(point?.url ?? '').toLowerCase().includes(query) ||
        readableStatus.includes(query) ||
        normalize(point?.name).includes(compactQuery) ||
        normalize(point?.deviceId).includes(compactQuery) ||
        normalize(point?.slug).includes(compactQuery) ||
        normalize(point?.type).includes(compactQuery) ||
        normalize(readableType).includes(compactQuery) ||
        normalize(readableStatus).includes(compactQuery)
      )
    })
  }, [touchpoints, searchQuery])

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase().trim()
    return reviews.filter(rev =>
      String(rev.comment ?? '').toLowerCase().includes(query) ||
      String(rev.staffName ?? '').toLowerCase().includes(query) ||
      String(rev.category ?? '').toLowerCase().includes(query) ||
      String(rev.rating).includes(query)
    )
  }, [reviews, searchQuery])

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    const query = searchQuery.toLowerCase().trim()
    return transactions.filter(tx =>
      tx.id.toLowerCase().includes(query) ||
      tx.staffName.toLowerCase().includes(query) ||
      tx.touchpoint.toLowerCase().includes(query) ||
      tx.paymentMethod.toLowerCase().includes(query) ||
      tx.status.toLowerCase().includes(query) ||
      String(tx.amount).includes(query)
    )
  }, [transactions, searchQuery])

  const filteredTxsForMetrics = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.dateTime) return false;
      const date = tx.dateTime.split(' ')[0];
      return date >= chartStartDate && date <= chartEndDate;
    });
  }, [transactions, chartStartDate, chartEndDate]);

  const metrics = useMemo(() => {
    const totalTips = filteredTxsForMetrics
      .filter(tx => tx.status === 'Success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalTransactions = filteredTxsForMetrics.length;
    const averageTip = totalTransactions === 0 ? 0 : totalTips / totalTransactions;

    // Standard fallbacks — show real computed values (zeros if no data)
    return {
      totalTips,
      totalTransactions,
      averageTip,
      totalReviews: 0,
      googleRating: 0,
      googleReviews: 0,
      yelpRating: 0,
      yelpReviews: 0,
      responseRate: 0,
      returningCustomers: 0,
      returningCustomersDelta: 0
    }
  }, [filteredTxsForMetrics]);


  const addTouchpoint = async (name, type, deviceId, assignedStaffProfileId) => {
    const finalName = typeof name === 'string' ? name.trim() : (newTouchpoint.name || '').trim()
    const finalType = typeof type === 'string' ? type : (newTouchpoint.type || 'Table QR')
    const finalDeviceId = typeof deviceId === 'string' ? deviceId.trim() : ''

    if (!finalName) return

    const apiType = mapTouchpointTypeToApi(finalType)
    const resolvedAssignedStaffProfileId = resolveAssignedStaffProfileId(apiType, assignedStaffProfileId)

    const payload = {
      name: finalName,
      type: apiType,
      ...(resolvedAssignedStaffProfileId
        ? { assignedStaffProfileId: resolvedAssignedStaffProfileId }
        : {}),
    }

    await createTouchpointMutation.mutateAsync(payload)
    
    setNewTouchpoint({ name: '', type: 'Table QR' })
  }

  const linkDevice = (id, deviceId) => {
    // API not yet supported for device linking in touchpoints
  }

  const toggleTouchpointStatus = (id) => {
    // Toggle not supported by API yet. Use delete.
  }

  const deleteTouchpoint = (id) => {
    deleteTouchpointMutation.mutate(id)
  }

  const previewQr = (target) => {
    const staffName = target.nickname || target.fullName
    const masterTouchpoint =
      touchpoints.find((tp) => tp.type === 'FrontDesk') || touchpoints[0] || null

    // Staff personal QR → master touch URL + ?staffProfileId=… (skip staff picker).
    const staffTipQr = resolveMerchantStaffTipQr(target.staffProfileId, {
      businessName,
      masterTouchpoint,
    })
    if (staffTipQr?.tipUrl) {
      setQrTarget({
        name: target.name || `Personal QR - ${staffName}`,
        subtitle: target.position || 'Staff QR',
        slug: staffTipQr.touchPointSlug,
        url: staffTipQr.tipUrl,
        qrImageUrl: target.qrImageUrl || staffTipQr.qrImageUrl || null,
        isActive: target.isActive !== undefined ? target.isActive : true,
        isStaffQr: true,
      })
      return
    }

    const finalSlug = target.slug
      ? target.slug
      : (staffName ? `staff-${slugify(staffName)}` : slugify(target.name || target.id || 'general'))

    setQrTarget({
      name: target.name || `Personal QR - ${staffName}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: finalSlug,
      url: target.url ? toLocalCustomerTouchUrl(target.url) : null,
      qrImageUrl: target.qrImageUrl || null,
      isActive: target.isActive !== undefined ? target.isActive : true,
      isStaffQr: Boolean(staffName && target.staffProfileId),
    })
  }

  const handleSelectLeaderboardStaff = (nickname) => {
    setSelectedLeaderboardStaff(nickname)
    const member = staff.find((s) => s.nickname === nickname || s.fullName.toLowerCase().includes(nickname.toLowerCase().split(' ')[0]))
    if (member) {
      navigate(`/dashboard/staff/${member.id}`)
    }
  }

  // ---------------------------------------------------------------------------
  // Notification handlers — write via mutations; update local mirror optimistically
  // ---------------------------------------------------------------------------
  const handleSetNotifications = (updater) => {
    const next = typeof updater === 'function' ? updater(notifications) : updater
    // Persist read-state transitions to the API (PUT /notifications/{id}/read).
    next.forEach((n) => {
      const prev = notifications.find((p) => p.id === n.id)
      const nowRead = Boolean(n.read || n.isRead)
      const wasRead = Boolean(prev && (prev.read || prev.isRead))
      if (prev && nowRead && !wasRead) {
        markNotificationReadMutation.mutate(n.id)
      }
    })
    setNotifications(next)
  }

  const dashboardCtx = {
    metrics, activeKpi, setActiveKpi, chartRange, handleChartRangeChange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate,
    transactions, selectedLeaderboardStaff, handleSelectLeaderboardStaff, businessName, businessSlug, previewQr, hasKyb, hasSetup, onStartSetup: handleStartSetup,
    inviteLinkSetting, isInviteLinkSettingLoading,
    filteredStaff, pendingStaff, staff, staffLoading, openApproveStaff, openAddStaff, openEditStaff, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleLinkStaff, handleInviteStaff, handleResendInvite, handleAcceptJoinRequest, handleDeclineJoinRequest, handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    setInviteShareDefaultName, setInviteShareDefaultContact, setIsInviteShareOpen,
    filteredTouchpoints, setAddTouchpointPrefill, setIsAddTouchpointModalOpen, deleteTouchpoint, toggleTouchpointStatus, linkDevice, devices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus,
    activeStaffList: staffListData?.items ?? [],
    reviews, filteredReviews, reviewFilterStaff, setReviewFilterStaff, setupData: setupData ?? merchantSetupData,
    tipsTab, setTipsTab, processingFee, setProcessingFee,
    filteredTransactions, touchpoints,
    verificationStatus, requireKyb, userEmail, onKybSuccess, settingsTab, setSettingsTab,
    currentStaffId,
    profile,
    onNavigateMenu: handleNavigateMenu,
    // Pagination fields for active staff
    activeStaffPage,
    setActiveStaffPage,
    activeStaffTotalPages: staffListData?.totalPages ?? 1,
    activeStaffTotalCount: staffListData?.totalCount ?? 0,
    activeStaffHasNext: staffListData?.hasNextPage ?? false,
    activeStaffHasPrev: staffListData?.hasPreviousPage ?? false,
    staffListLoading: isStaffListLoading,
    staffListFetching: isStaffListFetching,
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas font-sans text-nexoraText">
      <DashboardSidebar
        activeMenu={activeMenu}
        setActiveMenu={handleNavigateMenu}
        businessName={businessName}
        profile={profile}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        hasKyb={hasKyb}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onLogout={onLogout}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTouchpoint={() => {
            setAddTouchpointPrefill(null)
            setIsAddTouchpointModalOpen(true)
          }}
          profile={profile}
          businessName={businessName}
          onNavigateSettingsTab={(tab) => {
            handleNavigateMenu('settings')
            setSettingsTab(tab)
          }}
          onLogout={onLogout}
          notifications={notifications}
          setNotifications={handleSetNotifications}
          isNotiDropdownOpen={isNotiDropdownOpen}
          setIsNotiDropdownOpen={setIsNotiDropdownOpen}
          onNavigateMenu={handleNavigateMenu}
          staff={staff}
          transactions={transactions}
          reviews={reviews}
          touchpoints={touchpoints}
          onViewStaffDetail={(id) => navigate(`/dashboard/staff/${id}`)}
          onApproveStaff={openApproveStaff}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <div
          className="h-[calc(4rem+var(--app-safe-area-top))] lg:hidden"
          aria-hidden="true"
        />

        <main className="min-h-dvh p-4 sm:p-6 lg:p-7 lg:pb-7 max-lg:min-h-[calc(100svh-4rem-var(--app-safe-area-top))] max-lg:pb-[calc(1.5rem+4rem+var(--app-safe-area-bottom))]">
          {activeMenu !== 'overview' && (
            <button
              onClick={() => handleNavigateMenu('overview')}
              className="mb-5 inline-flex h-9 items-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-extrabold text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            >
              Back to Dashboard
            </button>
          )}
          <Outlet context={dashboardCtx} />
        </main>
      </div>

      <button
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="fixed bottom-4 right-4 z-40 hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraSurface text-nexoraMuted shadow-lg"
        title="Toggle theme hook"
        aria-label="Toggle theme hook"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </button>

      <MobileBottomNav activeMenu={activeMenu} onNavigate={handleNavigateMenu} />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        businessName={businessName}
        activeMenu={activeMenu}
        setActiveMenu={handleNavigateMenu}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        isTipsMobileExpanded={isTipsMobileExpanded}
        setIsTipsMobileExpanded={setIsTipsMobileExpanded}
        hasKyb={hasKyb}
        userRole={userRole}
        onLogout={onLogout}
        menuItemsToDisplay={menuItemsToDisplay}
        navigateMenu={navigateMenu}
      />

      <StaffModal
        open={isStaffModalOpen}
        editing={Boolean(editingStaffId)}
        onDecline={closeStaffModal}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onClose={closeStaffModal}
        onSave={saveStaff}
        onLinkStaff={handleLinkStaff}
        onOpenInviteShare={(formDetails) => {
          setInviteShareDefaultName(formDetails.fullName || '')
          setInviteShareDefaultContact(formDetails.email || formDetails.phone || '')
          setIsInviteShareOpen(true)
        }}
        reviews={reviews}
        merchantSetupData={merchantSetupData}
      />

      <StaffModal
        open={isApproveModalOpen}
        editing={false}
        isApproveMode={true}
        onDecline={() => {
          if (approvingStaffMember) {
            handleDeclineJoinRequest(approvingStaffMember.id)
          }
          setIsApproveModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['merchantStaff'] })
        }}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onClose={() => {
          setIsApproveModalOpen(false)
          resetStaffForm()
          queryClient.invalidateQueries({ queryKey: ['merchantStaff'] })
        }}
        onSave={() => {
          if (approvingStaffMember) {
            handleAcceptJoinRequest(approvingStaffMember.id)
          }
          setIsApproveModalOpen(false)
          queryClient.invalidateQueries({ queryKey: ['merchantStaff'] })
        }}
        onOpenInviteShare={() => {}}
        reviews={reviews}
        merchantSetupData={merchantSetupData}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />

      <AddTouchpointModal
        open={isAddTouchpointModalOpen}
        initialValues={addTouchpointPrefill}
        activeStaff={staffListData?.items ?? []}
        onClose={() => setIsAddTouchpointModalOpen(false)}
        onAdd={async (name, type, deviceId, assignedStaffProfileId) => {
          await addTouchpoint(name, type, deviceId, assignedStaffProfileId)
          handleNavigateMenu('touchpoints')
        }}
      />

      <InviteShareModal
        open={isInviteShareOpen}
        businessName={businessName}
        businessSlug={businessSlug}
        inviteLinkSetting={inviteLinkSetting}
        isInviteLinkSettingLoading={isInviteLinkSettingLoading}
        defaultName={inviteShareDefaultName}
        defaultContact={inviteShareDefaultContact}
        onClose={() => setIsInviteShareOpen(false)}
        onSendInvite={(name, contact, role) => {
          handleInviteStaff(name, contact, role)
          setIsInviteShareOpen(false)
          closeStaffModal()
        }}
      />
    </div>
  )
}
