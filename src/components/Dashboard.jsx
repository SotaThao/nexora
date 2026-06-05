// 1. React
import React, { useEffect, useMemo, useRef, useState } from 'react'

// 2. Third-party
import { Filter, Moon, Settings, ShieldAlert, Sun, Check, Link } from 'lucide-react'

// 3. Internal — utils → contexts → data/constants → hooks → layout → views → modals → ui
import { logger } from '../utils/logger'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { INITIAL_TRANSACTIONS, INITIAL_REVIEWS, INITIAL_TOUCHPOINTS, STAFF_PERFORMANCE } from './dashboard/data/mockData'
import { DEFAULT_PAYOUT_CONFIGS, MENU_ITEMS } from './dashboard/constants'
import { slugify, getPayoutConfigsFromMember } from './dashboard/utils'
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation'
import { useDevices } from './dashboard/hooks/useDevices'
import { useStaffManagement, normaliseMember } from './dashboard/hooks/useStaffManagement'
import { useChartDateRange } from '../hooks/useChartDateRange'
import { useTransactions } from '../data/hooks/useTransactions'
import { useReviews } from '../data/hooks/useReviews'
import { useNotifications, useReplaceAllNotifications, useMarkNotificationRead } from '../data/hooks/useNotifications'
import { useProfileSettings, useSaveProfileSettings } from '../data/hooks/useProfileSettings'
import { useMerchantSetup, useSaveMerchantSetup } from '../data/hooks/useMerchantSetup'
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

// ---------------------------------------------------------------------------
// Default notifications seeded on first dashboard load (no storage data yet)
// ---------------------------------------------------------------------------
const DEFAULT_NOTIFICATIONS = [
  { id: '1', type: 'feedback_alert', title: 'New Internal Feedback (2★)', message: 'Customer left feedback for Ashley P. at Pedicure Chair 02: "Great polish, but I waited 20 minutes after my appointment time."', time: '10 mins ago', read: false, linkTab: 'reviews' },
  { id: '2', type: 'tip_success', title: 'New Tip Received ($28.00)', message: 'Mia Tran received $28.00 tip via Venmo at Manicure Station 03.', time: '25 mins ago', read: true, linkTab: 'reports' },
  { id: '3', type: 'feedback_alert', title: 'New Internal Feedback (1★)', message: 'Customer left feedback for Vivian L. at Front Desk: "My color chipped after one day. I need someone to contact me."', time: '1 day ago', read: true, linkTab: 'reviews' }
]

export default function Dashboard({
  setupData,
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved',
  userEmail = '',
  onKybRequired,
  onKybSuccess,
  initialMenu = 'overview',
  initialSettingsTab = 'profile',
  onLogout,
  userRole = 'owner',
  currentStaffId = null
}) {
  const { currentLanguage, t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const {
    activeMenu, setActiveMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    touchpointsTab, setTouchpointsTab,
    isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    viewingStaffDetailId, setViewingStaffDetailId,
    handleNavigateMenu, navigateMenu
  } = useDashboardNavigation(initialMenu, initialSettingsTab)
  const [showKybWarningModal, setShowKybWarningModal] = useState(false)
  const [processingFee, setProcessingFee] = useState(3.0)

  // ---------------------------------------------------------------------------
  // Server-state hooks (TanStack Query)
  // ---------------------------------------------------------------------------
  const { data: transactionsData } = useTransactions()
  const { data: reviewsData } = useReviews()
  const { data: notificationsData } = useNotifications()
  const { data: profileSettingsData } = useProfileSettings()
  const { data: merchantSetupData } = useMerchantSetup()

  const replaceAllNotificationsMutation = useReplaceAllNotifications()
  const markNotificationReadMutation = useMarkNotificationRead()
  const saveMerchantSetupMutation = useSaveMerchantSetup()

  // ---------------------------------------------------------------------------
  // Derived read data (with fallbacks so UI is never empty on first load)
  // ---------------------------------------------------------------------------
  const transactions = transactionsData ?? INITIAL_TRANSACTIONS
  const reviews = reviewsData ?? INITIAL_REVIEWS

  // Notifications — thin local mirror so UI updates optimistically and
  // preserves default seed on first load (no storage data).
  const [notifications, setNotifications] = useState(() =>
    notificationsData && notificationsData.length > 0
      ? notificationsData
      : DEFAULT_NOTIFICATIONS
  )

  // Keep local notification mirror in sync when query data arrives / changes
  // (e.g. bridge-triggered refetch after a cross-tab update).
  useEffect(() => {
    if (notificationsData === undefined) return
    if (notificationsData.length > 0) {
      setNotifications(notificationsData)
    } else {
      // Seed defaults into the repo so they persist across reloads.
      replaceAllNotificationsMutation.mutate(DEFAULT_NOTIFICATIONS)
      setNotifications(DEFAULT_NOTIFICATIONS)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsData])

  // Profile — thin local mirror with complex initialisation / override rules.
  const buildFallbackProfile = (storeInfo, reviewInfo) => ({
    fullName: storeInfo?.ownerName || (hasKyb ? 'Elena Rostova' : ''),
    email: storeInfo?.businessEmail || userEmail || (hasKyb ? 'owner@goldenglownails.com' : ''),
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    businessName: storeInfo?.name || (hasKyb ? 'Golden Glow Nail Spa & Salon' : ''),
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

  const [profile, setProfile] = useState(() => {
    // Prefer saved profile settings, fall back to business info from setupData.
    if (profileSettingsData) return profileSettingsData
    const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
    const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
    return buildFallbackProfile(storeInfo, reviewInfo)
  })

  // Sync profile when query data arrives (bridge-triggered refetch).
  useEffect(() => {
    if (profileSettingsData) {
      if (!hasKyb) {
        setProfile({
          ...profileSettingsData,
          fullName: '',
          email: userEmail || '',
          businessName: '',
          paymentAccounts: {
            zelle: '', bankwire: '', paypal: '',
            venmo: '', cashapp: '', applecash: '', vlinkpay: ''
          }
        })
      } else {
        setProfile(profileSettingsData)
      }
    } else {
      // No saved settings — build from setup data / merchant setup query.
      const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
      const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
      setProfile(buildFallbackProfile(storeInfo, reviewInfo))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSettingsData, hasKyb, userEmail])

  const [isNotiDropdownOpen, setIsNotiDropdownOpen] = useState(false)

  // Touchpoints — thin local mirror; bridge invalidation refetches setup and
  // the effect below syncs to local state.
  const [touchpoints, setTouchpoints] = useState(() => {
    if (merchantSetupData?.touchPoints?.length) return merchantSetupData.touchPoints
    if (setupData?.touchPoints?.length) return setupData.touchPoints
    return INITIAL_TOUCHPOINTS
  })

  // Sync touchpoints when merchant setup query updates.
  useEffect(() => {
    if (merchantSetupData?.touchPoints?.length) {
      setTouchpoints(merchantSetupData.touchPoints)
    }
  }, [merchantSetupData])

  const { devices, setDevices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus } = useDevices()
  const [qrTarget, setQrTarget] = useState(null)
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKpi, setActiveKpi] = useState('tips')
  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } = useChartDateRange(transactions)

  const [selectedLeaderboardStaff, setSelectedLeaderboardStaff] = useState(STAFF_PERFORMANCE[0].nickname)

  const businessName = profile?.businessName || setupData?.businessInfo?.name || 'Golden Glow Nail Spa'

  const {
    staff, setStaff,
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
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest
  } = useStaffManagement({ setupData, businessName, setTouchpoints, viewingStaffDetailId, setViewingStaffDetailId })

  // ---------------------------------------------------------------------------
  // Sync staff+touchpoints to repo whenever they change.
  // Previously done by a manual storage write; now goes through mutation →
  // repository → storageAdapter, and auto-invalidates the merchantSetup query
  // key so the bridge and other components see the update.
  // ---------------------------------------------------------------------------
  const lastSavedStaff = useRef(null)
  const lastSavedTouchpoints = useRef(null)

  useEffect(() => {
    // Skip on initial mount (no change yet).
    if (lastSavedStaff.current === null && lastSavedTouchpoints.current === null) {
      lastSavedStaff.current = staff
      lastSavedTouchpoints.current = touchpoints
      return
    }
    // Skip if nothing changed.
    if (lastSavedStaff.current === staff && lastSavedTouchpoints.current === touchpoints) {
      return
    }
    lastSavedStaff.current = staff
    lastSavedTouchpoints.current = touchpoints

    const base = merchantSetupData ?? setupData ?? {}
    saveMerchantSetupMutation.mutate({ ...base, staffList: staff, touchPoints: touchpoints })
  // eslint-disable name react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, touchpoints])

  // Seed staff / touchpoints from setupData prop (takes priority).
  useEffect(() => {
    if (setupData?.staffList?.length) {
      setStaff(setupData.staffList.map(normaliseMember))
    }
    if (setupData?.touchPoints?.length) {
      setTouchpoints(setupData.touchPoints)
    }
  // Only re-run when setupData reference changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupData])

  // Seed staff / touchpoints from persisted merchant-setup query (returning users
  // who have no setupData prop but have data in the repository).
  useEffect(() => {
    if (setupData?.staffList?.length) return  // setupData already handled above
    if (merchantSetupData?.staffList?.length) {
      setStaff(merchantSetupData.staffList.map(normaliseMember))
    }
    if (!setupData?.touchPoints?.length && merchantSetupData?.touchPoints?.length) {
      setTouchpoints(merchantSetupData.touchPoints)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantSetupData])

  // For staff dashboard: populate profile info from their staff profile.
  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && staff.length > 0) {
      const currentStaff = staff.find(s => s.id === currentStaffId)
      if (currentStaff) {
        setProfile({
          fullName: currentStaff.fullName,
          email: currentStaff.email,
          avatar: currentStaff.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
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
        { id: 'overview', label: currentLanguage === 'vi' ? 'Tài khoản của tôi' : 'My Dashboard', icon: MENU_ITEMS.find(i => i.id === 'overview')?.icon, image: MENU_ITEMS.find(i => i.id === 'overview')?.image },
        { id: 'support', label: t('dashboard.menu.support') || 'Support', icon: MENU_ITEMS.find(i => i.id === 'support')?.icon }
      ]
    : MENU_ITEMS

  // Filter lists based on searchQuery
  const filteredStaff = useMemo(() => {
    const visibleStaff = staff.filter(member => member.status !== 'Pending Acceptance')
    if (!searchQuery) return visibleStaff
    const query = searchQuery.toLowerCase().trim()
    return visibleStaff.filter(member =>
      member.fullName.toLowerCase().includes(query) ||
      member.nickname.toLowerCase().includes(query) ||
      member.position.toLowerCase().includes(query)
    )
  }, [staff, searchQuery])

  const pendingStaff = useMemo(() => {
    return staff.filter(member => member.status === 'Pending Acceptance')
  }, [staff])

  const filteredTouchpoints = useMemo(() => {
    if (!searchQuery) return touchpoints
    const query = searchQuery.toLowerCase().trim()
    return touchpoints.filter(point =>
      point.name.toLowerCase().includes(query) ||
      point.type.toLowerCase().includes(query) ||
      (point.staffName && point.staffName.toLowerCase().includes(query))
    )
  }, [touchpoints, searchQuery])

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase().trim()
    return reviews.filter(rev =>
      rev.comment.toLowerCase().includes(query) ||
      rev.staffName.toLowerCase().includes(query) ||
      rev.category.toLowerCase().includes(query) ||
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

    // Standard fallbacks to keep UI looking premium if empty/zero in range
    return {
      totalTips: totalTips || 4785.00,
      totalTransactions: totalTransactions || 312,
      averageTip: averageTip || 15.34,
      totalReviews: 128,
      googleRating: 4.8,
      googleReviews: 96,
      yelpRating: 4.5,
      yelpReviews: 32,
      responseRate: 68,
      returningCustomers: 68,
      returningCustomersDelta: 12
    }
  }, [filteredTxsForMetrics]);


  const addTouchpoint = (name, type, deviceId) => {
    const finalName = typeof name === 'string' ? name.trim() : (newTouchpoint.name || '').trim()
    const finalType = typeof type === 'string' ? type : (newTouchpoint.type || 'Table QR')
    const finalDeviceId = typeof deviceId === 'string' ? deviceId.trim() : ''

    if (!finalName) return
    setTouchpoints((current) => [...current, {
      id: `tp-${Date.now()}`,
      name: finalName,
      type: finalType,
      deviceId: finalDeviceId || undefined,
      isActive: true,
      scans: 0
    }])
    setNewTouchpoint({ name: '', type: 'Table QR' })
  }

  const linkDevice = (id, deviceId) => {
    setTouchpoints((current) =>
      current.map((point) =>
        point.id === id ? { ...point, deviceId: deviceId.trim() || undefined } : point
      )
    )
  }

  const toggleTouchpointStatus = (id) => {
    setTouchpoints((current) => current.map((point) => point.id === id ? { ...point, isActive: point.isActive === false ? true : false } : point))
  }

  const previewQr = (target) => {
    setQrTarget({
      name: target.name || `Personal QR - ${target.nickname}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: target.nickname ? `staff/${slugify(target.nickname)}` : `tp/${target.id}`,
      isActive: target.isActive !== undefined ? target.isActive : true
    })
  }

  const handleSelectLeaderboardStaff = (nickname) => {
    setSelectedLeaderboardStaff(nickname)
    const member = staff.find((s) => s.nickname === nickname || s.fullName.toLowerCase().includes(nickname.toLowerCase().split(' ')[0]))
    if (member) {
      setViewingStaffDetailId(member.id)
    }
  }

  // ---------------------------------------------------------------------------
  // Notification handlers — write via mutations; update local mirror optimistically
  // ---------------------------------------------------------------------------
  const handleSetNotifications = (updater) => {
    const next = typeof updater === 'function' ? updater(notifications) : updater
    setNotifications(next)
    replaceAllNotificationsMutation.mutate(next)
  }

  const renderContent = () => {
    if (userRole === 'staff') {
      const activeDetailStaff = staff.find((member) => member.id === currentStaffId)
      if (activeDetailStaff) {
        return (
          <StaffDetailView
            staffMember={activeDetailStaff}
            onBack={null}
            transactions={transactions}
            reviews={reviews}
            onEdit={openEditStaff}
            onQr={previewQr}
            onDelete={null}
          />
        )
      } else {
        return (
          <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
            <div className="text-sm font-semibold text-nexoraMuted">
              {currentLanguage === 'vi' ? 'Không tìm thấy hồ sơ thợ của bạn.' : 'Your staff profile was not found.'}
            </div>
          </div>
        )
      }
    }

    if (viewingStaffDetailId) {
      const activeDetailStaff = staff.find((member) => member.id === viewingStaffDetailId)
      if (activeDetailStaff) {
        return (
          <StaffDetailView
            staffMember={activeDetailStaff}
            onBack={() => setViewingStaffDetailId(null)}
            transactions={transactions}
            reviews={reviews}
            onEdit={openEditStaff}
            onQr={previewQr}
            onDelete={deleteStaff}
          />
        )
      }
    }
    if (activeMenu === 'overview') {
      return (
        <Overview
          metrics={metrics}
          activeKpi={activeKpi}
          setActiveKpi={setActiveKpi}
          chartRange={chartRange}
          setChartRange={handleChartRangeChange}
          chartStartDate={chartStartDate}
          chartEndDate={chartEndDate}
          setChartStartDate={setChartStartDate}
          setChartEndDate={setChartEndDate}
          transactions={transactions}
          selectedStaff={selectedLeaderboardStaff}
          setSelectedStaff={handleSelectLeaderboardStaff}
          onOpenTouchpoints={() => setActiveMenu('touchpoints')}
          onOpenReviews={() => setActiveMenu('reviews')}
          businessName={businessName}
          previewQr={previewQr}
          hasKyb={hasKyb}
        />
      )
    }
    if (activeMenu === 'staff') return (
      <StaffView
        staff={filteredStaff}
        pendingStaff={pendingStaff}
        allStaff={staff}
        onApproveClick={openApproveStaff}
        onAdd={openAddStaff}
        onEdit={openEditStaff}
        onDelete={deleteStaff}
        onQr={previewQr}
        onToggle={toggleStaff}
        onToggleTipsFlow={toggleStaffTipsFlow}
        onViewDetail={setViewingStaffDetailId}
        onLinkStaff={handleLinkStaff}
        onInviteStaff={handleInviteStaff}
        businessName={businessName}
        onAcceptJoin={handleAcceptJoinRequest}
        onDeclineJoin={handleDeclineJoinRequest}
        onAcceptUnlink={handleAcceptUnlinkRequest}
        onDeclineUnlink={handleDeclineUnlinkRequest}
        onOpenInviteShare={() => {
          setInviteShareDefaultName('')
          setInviteShareDefaultContact('')
          setIsInviteShareOpen(true)
        }}
      />
    )
    if (activeMenu === 'touchpoints') {
      return (
        <TouchpointsView
          touchpoints={filteredTouchpoints}
          newTouchpoint={newTouchpoint}
          setNewTouchpoint={setNewTouchpoint}
          onAdd={addTouchpoint}
          onDelete={(id) => setTouchpoints((current) => current.filter((point) => point.id !== id))}
          onQr={previewQr}
          onToggleStatus={toggleTouchpointStatus}
          onLinkDevice={linkDevice}
          transactions={transactions}
          businessName={businessName}
          devices={devices}
          onAddDevice={handleAddDevice}
          onDeleteDevice={handleDeleteDevice}
          onToggleDeviceStatus={handleToggleDeviceStatus}
          activeSubTab={touchpointsTab}
          onTabChange={setTouchpointsTab}
        />
      )
    }
    if (activeMenu === 'reviews') return (
      <ReviewsView
        reviews={filteredReviews}
        staff={staff}
        filter={reviewFilterStaff}
        setFilter={setReviewFilterStaff}
        setupData={setupData}
      />
    )
    if (activeMenu === 'tips') return (
      <TipsView
        transactions={transactions}
        staff={staff}
        activeTab={tipsTab}
        onTabChange={setTipsTab}
        processingFee={processingFee}
        setProcessingFee={setProcessingFee}
      />
    )
    if (activeMenu === 'reports') return <ReportsView transactions={filteredTransactions} staff={staff} touchpoints={touchpoints} />
    if (activeMenu === 'settings') {
      return (
        <SettingsView
          setupData={setupData}
          hasKyb={hasKyb}
          verificationStatus={verificationStatus}
          onBlockedFeatureClick={() => setShowKybWarningModal(true)}
          userEmail={userEmail}
          onKybRequired={onKybRequired}
          initialTab={settingsTab}
          onTabChange={setSettingsTab}
          onKybSuccess={onKybSuccess}
        />
      )
    }
    if (activeMenu === 'analytics') {
      return (
        <AnalyticsView
          transactions={transactions}
          staff={staff}
          touchpoints={touchpoints}
          processingFee={processingFee}
        />
      )
    }
    if (activeMenu === 'support') {
      return (
        <SupportView />
      )
    }
    return <ComingSoon activeMenu={activeMenu} onBack={() => setActiveMenu('overview')} />
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
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onLogout={onLogout}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        touchpointsTab={touchpointsTab}
        setTouchpointsTab={setTouchpointsTab}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTouchpoint={() => setActiveMenu('touchpoints')}
          profile={profile}
          businessName={businessName}
          onNavigateSettingsTab={(tab) => {
            setActiveMenu('settings')
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
          onViewStaffDetail={setViewingStaffDetailId}
          onApproveStaff={openApproveStaff}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="min-h-dvh p-4 sm:p-6 lg:p-7">
          {activeMenu !== 'overview' && !viewingStaffDetailId && (
            <button
              onClick={() => handleNavigateMenu('overview')}
              className="mb-5 inline-flex h-9 items-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-extrabold text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            >
              Back to Dashboard
            </button>
          )}
          {renderContent()}
        </main>
      </div>

      <button
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraSurface text-nexoraMuted shadow-lg"
        title="Toggle theme hook"
        aria-label="Toggle theme hook"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </button>

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        businessName={businessName}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        touchpointsTab={touchpointsTab}
        setTouchpointsTab={setTouchpointsTab}
        isTipsMobileExpanded={isTipsMobileExpanded}
        setIsTipsMobileExpanded={setIsTipsMobileExpanded}
        isTouchpointsMobileExpanded={isTouchpointsMobileExpanded}
        setIsTouchpointsMobileExpanded={setIsTouchpointsMobileExpanded}
        hasKyb={hasKyb}
        userRole={userRole}
        onLogout={onLogout}
        menuItemsToDisplay={menuItemsToDisplay}
        viewingStaffDetailId={viewingStaffDetailId}
        setViewingStaffDetailId={setViewingStaffDetailId}
        navigateMenu={navigateMenu}
      />

      <StaffModal
        open={isStaffModalOpen}
        editing={Boolean(editingStaffId)}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onClose={closeStaffModal}
        onSave={saveStaff}
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
        }}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onClose={() => {
          setIsApproveModalOpen(false)
          resetStaffForm()
        }}
        onSave={() => {
          if (approvingStaffMember) {
            handleAcceptJoinRequest(approvingStaffMember.id, staffForm)
          }
          setIsApproveModalOpen(false)
        }}
        reviews={reviews}
        merchantSetupData={merchantSetupData}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />

      <InviteShareModal
        open={isInviteShareOpen}
        businessName={businessName}
        defaultName={inviteShareDefaultName}
        defaultContact={inviteShareDefaultContact}
        onClose={() => setIsInviteShareOpen(false)}
        onSendInvite={(name, contact, role) => {
          const isEmail = contact.includes('@')
          const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`

          const newMember = {
            id: tempId,
            fullName: name.trim() || 'New Technician',
            nickname: name.trim() ? name.trim().split(' ')[0] + '.' : 'Tech.',
            position: role || 'Nail Technician',
            avatar: '',
            phone: isEmail ? '' : contact.trim(),
            email: isEmail ? contact.trim() : '',
            isActive: false,
            status: 'Pending Setup',
            flowType: 'Invite New Staff',
            paymentAccounts: {},
            payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
          }

          setStaff((current) => [...current, newMember])
          setTouchpoints((current) => [...current, {
            id: `tp-staff-${newMember.id}`,
            name: `Personal QR - ${newMember.nickname}`,
            type: 'Staff QR',
            staffId: newMember.id,
            staffName: newMember.nickname
          }])

          const event = new CustomEvent('showSimulationInvite', {
            detail: {
              id: tempId,
              name: newMember.fullName,
              email: newMember.email,
              phone: newMember.phone,
              role: role || 'Nail Technician',
              biz: businessName
            }
          })
          window.dispatchEvent(event)
          setIsInviteShareOpen(false)
          closeStaffModal()
        }}
      />

      {/* KYB Verification Warning Modal for gated features */}
      {showKybWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-nexoraBorder max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexoraWarning/10 text-nexoraWarning mx-auto shrink-0 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-nexoraText uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'Yêu cầu xác thực KYB' : 'KYB Verification Required'}
              </h3>
              <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tính năng này yêu cầu hồ sơ doanh nghiệp đã được xác thực KYB bởi VLINKPAY. Nhấp vào nút bên dưới để chuyển hướng đến trang Cài đặt > KYB để gửi thông tin doanh nghiệp của bạn.'
                  : 'This feature requires your business profile to be KYB verified by VLINKPAY. Click below to navigate to Settings > KYB tab and submit your compliance information.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowKybWarningModal(false)}
                className="px-5 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {currentLanguage === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowKybWarningModal(false)
                  setActiveMenu('settings')
                  setSettingsTab('kyb')
                  setIsMobileMenuOpen(false)
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
