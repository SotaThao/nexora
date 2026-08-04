import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useMerchantVoiceTenantStatus } from '../../../data/hooks/useMerchantVoiceBookings'
import BookingTodayPanel from './BookingTodayPanel'
import BookingCustomersPanel from './BookingCustomersPanel'
import BookingCallLogPanel from './BookingCallLogPanel'
import BookingSmsCampaignsPanel from './smsCampaigns/BookingSmsCampaignsPanel'
import BookingPlansPanel from './BookingPlansPanel'
import BookingSettingsPanel from './BookingSettingsPanel'
import { BookingHubVoiceProvider } from './BookingHubVoiceContext'
import {
  CalendarEventIcon,
  CalendarTabIcon,
  JournalIcon,
  MessageSquareTabIcon,
  PeopleTabIcon,
  PhoneTabIcon,
  SlidersTabIcon,
  TagsTabIcon,
} from './BookingHubIcons'
import { BookingHubTabsSkeleton } from './BookingHubSkeletons'
import {
  BookingTodayLayout,
} from './bookingTodayConstants'
import {
  BookingHubMainTab,
  BookingHubSubTab,
  parseBookingHubMainTab,
  parseBookingHubSubTab,
} from '../../../data/repositories/merchantVoice'
import {
  BOOKING_HUB_SETUP_GUIDE_PATH,
  getDefaultBookingHubTab,
  isBookingHubMainTabAllowed,
} from '../constants'
import './booking-hub.css'

const TK = 'components.dashboard.views.BookingHubView'

const BOOKING_HUB_SUBTAB_LAYOUT: Partial<Record<BookingHubSubTab, BookingTodayLayout>> = {
  [BookingHubSubTab.Today]: BookingTodayLayout.Appointments,
  [BookingHubSubTab.Calendar]: BookingTodayLayout.Calendar,
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  )
}

export default function BookingHubView() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: tenantStatus, isLoading: isTenantStatusLoading } = useMerchantVoiceTenantStatus()
  const hasVoiceTenant = tenantStatus?.hasVoiceTenant === true
  const voiceFeaturesEnabled = hasVoiceTenant && !isTenantStatusLoading
  const [activeMainTab, setActiveMainTab] = useState<BookingHubMainTab>(BookingHubMainTab.Plans)
  const [activeSubtab, setActiveSubtab] = useState<BookingHubSubTab>(BookingHubSubTab.Today)

  useEffect(() => {
    if (isTenantStatusLoading) return

    const mainTab = searchParams.get('tab')
    const subTab = searchParams.get('view')
    const parsedMainTab = parseBookingHubMainTab(mainTab)
    const parsedSubTab = parseBookingHubSubTab(subTab)

    if (!hasVoiceTenant && !isBookingHubMainTabAllowed(parsedMainTab, false)) {
      const defaultTab = getDefaultBookingHubTab(false)
      setActiveMainTab(defaultTab)
      setActiveSubtab(BookingHubSubTab.Today)

      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', defaultTab)
      nextParams.delete('view')
      setSearchParams(nextParams, { replace: true })
      return
    }

    // HTML moved Team into Settings — legacy ?view=team opens Settings.
    if (parsedMainTab === BookingHubMainTab.Booking && parsedSubTab === BookingHubSubTab.Team) {
      setActiveMainTab(BookingHubMainTab.Settings)
      setActiveSubtab(BookingHubSubTab.Today)
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', BookingHubMainTab.Settings)
      nextParams.delete('view')
      setSearchParams(nextParams, { replace: true })
      return
    }

    setActiveMainTab(parsedMainTab)
    setActiveSubtab(parsedSubTab)
  }, [hasVoiceTenant, isTenantStatusLoading, searchParams, setSearchParams])

  useEffect(() => {
    if (isTenantStatusLoading || hasVoiceTenant) return

    void queryClient.removeQueries({
      predicate: (query) => {
        const [root, scope] = query.queryKey
        return root === 'merchantVoice' && scope !== 'tenant'
      },
    })
  }, [hasVoiceTenant, isTenantStatusLoading, queryClient])

  const updateQueryTabs = (
    mainTab: BookingHubMainTab,
    subTab: BookingHubSubTab = activeSubtab,
  ) => {
    if (!isBookingHubMainTabAllowed(mainTab, hasVoiceTenant)) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', mainTab)
    if (mainTab === BookingHubMainTab.Booking) {
      nextParams.set('view', subTab)
    } else {
      nextParams.delete('view')
    }
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <BookingHubVoiceProvider enabled={voiceFeaturesEnabled}>
    <section className="booking-hub-view">
      <div className="page-heading">
        <h1 className="page-title hidden sm:block">{t(`${TK}.title`)}</h1>
        <p className="page-description !mt-0 sm:!mt-2">{t(`${TK}.description`)}</p>
        <Link
          className="page-guide-link"
          to={BOOKING_HUB_SETUP_GUIDE_PATH}
          aria-label={t(`${TK}.setupGuideAria`)}
        >
          <JournalIcon />
          <span>{t(`${TK}.setupGuide`)}</span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
        {isTenantStatusLoading ? (
          <BookingHubTabsSkeleton />
        ) : (
          <div className="page-tabs" role="tablist" aria-label={t(`${TK}.ariaSections`)}>
            {hasVoiceTenant && (
              <button
                className={`page-tab ${activeMainTab === BookingHubMainTab.Booking ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeMainTab === BookingHubMainTab.Booking}
                onClick={() => updateQueryTabs(BookingHubMainTab.Booking)}
              >
                <span className="page-tab-icon"><CalendarTabIcon /></span>
                <span>{t(`${TK}.tabs.booking`)}</span>
              </button>
            )}
            {hasVoiceTenant && (
              <button
                className={`page-tab ${activeMainTab === BookingHubMainTab.Customers ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeMainTab === BookingHubMainTab.Customers}
                onClick={() => updateQueryTabs(BookingHubMainTab.Customers)}
              >
                <span className="page-tab-icon"><PeopleTabIcon /></span>
                <span>{t(`${TK}.tabs.customers`)}</span>
              </button>
            )}
            {hasVoiceTenant && (
              <button
                className={`page-tab ${activeMainTab === BookingHubMainTab.CallLog ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeMainTab === BookingHubMainTab.CallLog}
                onClick={() => updateQueryTabs(BookingHubMainTab.CallLog)}
              >
                <span className="page-tab-icon"><PhoneTabIcon /></span>
                <span>{t(`${TK}.tabs.callLog`)}</span>
              </button>
            )}
            {hasVoiceTenant && (
              <button
                className={`page-tab ${activeMainTab === BookingHubMainTab.SmsCampaigns ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeMainTab === BookingHubMainTab.SmsCampaigns}
                onClick={() => updateQueryTabs(BookingHubMainTab.SmsCampaigns)}
              >
                <span className="page-tab-icon"><MessageSquareTabIcon /></span>
                <span>{t(`${TK}.tabs.smsCampaigns`)}</span>
              </button>
            )}
            <button
              className={`page-tab ${activeMainTab === BookingHubMainTab.Plans ? 'is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeMainTab === BookingHubMainTab.Plans}
              onClick={() => updateQueryTabs(BookingHubMainTab.Plans)}
            >
              <span className="page-tab-icon"><TagsTabIcon /></span>
              <span>{t(`${TK}.tabs.plans`)}</span>
            </button>
            {hasVoiceTenant && (
              <button
                className={`page-tab ${activeMainTab === BookingHubMainTab.Settings ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={activeMainTab === BookingHubMainTab.Settings}
                onClick={() => updateQueryTabs(BookingHubMainTab.Settings)}
              >
                <span className="page-tab-icon"><SlidersTabIcon /></span>
                <span>{t(`${TK}.tabs.settings`)}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {!isTenantStatusLoading && voiceFeaturesEnabled && activeMainTab === BookingHubMainTab.Booking && (
      <section className="tab-panel is-active" aria-label={t(`${TK}.ariaPanel`)}>
        <div className="booking-toolbar">
          <div className="booking-subtabs" role="tablist" aria-label={t(`${TK}.ariaViews`)}>
            <button
              className={`booking-subtab ${activeSubtab === BookingHubSubTab.Today ? 'is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeSubtab === BookingHubSubTab.Today}
              onClick={() => updateQueryTabs(BookingHubMainTab.Booking, BookingHubSubTab.Today)}
            >
              <span className="booking-subtab-icon"><CalendarIcon /></span>
              <span>{t(`${TK}.schedule.today`)}</span>
            </button>
            <button
              className={`booking-subtab ${activeSubtab === BookingHubSubTab.Calendar ? 'is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeSubtab === BookingHubSubTab.Calendar}
              onClick={() => updateQueryTabs(BookingHubMainTab.Booking, BookingHubSubTab.Calendar)}
            >
              <span className="booking-subtab-icon"><CalendarEventIcon /></span>
              <span>{t(`${TK}.schedule.calendar`)}</span>
            </button>
          </div>
          <div className="sync-note">{t(`${TK}.schedule.syncNote`)}</div>
        </div>

        <BookingTodayPanel
          bookingLayout={
            BOOKING_HUB_SUBTAB_LAYOUT[activeSubtab] ?? BookingTodayLayout.Appointments
          }
        />
      </section>
      )}

      {!isTenantStatusLoading && voiceFeaturesEnabled && activeMainTab === BookingHubMainTab.Customers && (
        <section className="tab-panel is-active" aria-label={t(`${TK}.ariaCustomersPanel`)}>
          <BookingCustomersPanel />
        </section>
      )}

      {!isTenantStatusLoading && voiceFeaturesEnabled && activeMainTab === BookingHubMainTab.CallLog && (
        <section
          className="tab-panel is-active"
          id="panel-calllog"
          aria-label={t(`${TK}.ariaCallLogPanel`)}
        >
          <BookingCallLogPanel />
        </section>
      )}

      {!isTenantStatusLoading && voiceFeaturesEnabled && activeMainTab === BookingHubMainTab.SmsCampaigns && (
        <section
          className="tab-panel is-active"
          aria-label={t(`${TK}.ariaSmsCampaignsPanel`)}
        >
          <BookingSmsCampaignsPanel />
        </section>
      )}

      {!isTenantStatusLoading && activeMainTab === BookingHubMainTab.Plans && (
        <section className="tab-panel is-active" aria-label={t(`${TK}.ariaPlansPanel`)}>
          <BookingPlansPanel />
        </section>
      )}

      {!isTenantStatusLoading && voiceFeaturesEnabled && activeMainTab === BookingHubMainTab.Settings && (
        <section className="tab-panel is-active" aria-label={t(`${TK}.ariaSettingsPanel`)}>
          <BookingSettingsPanel />
        </section>
      )}
    </section>
    </BookingHubVoiceProvider>
  )
}
