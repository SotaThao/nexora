import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useMerchantVoiceTenantStatus } from '../../../data/hooks/useMerchantVoiceBookings'
import BookingTeamPanel from './BookingTeamPanel'
import BookingTodayPanel from './BookingTodayPanel'
import BookingPlansPanel from './BookingPlansPanel'
import BookingSettingsPanel from './BookingSettingsPanel'
import { BookingHubVoiceProvider } from './BookingHubVoiceContext'
import {
  CalendarTabIcon,
  SlidersTabIcon,
  TagsTabIcon,
} from './BookingHubIcons'
import { BookingHubTabsSkeleton } from './BookingHubSkeletons'
import {
  BookingHubMainTab,
  BookingHubSubTab,
  parseBookingHubMainTab,
  parseBookingHubSubTab,
} from '../../../data/repositories/merchantVoice'
import './booking-hub.css'

const TK = 'components.dashboard.views.BookingHubView'

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

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

    if (
      !hasVoiceTenant
      && (parsedMainTab === BookingHubMainTab.Booking || parsedMainTab === BookingHubMainTab.Settings)
    ) {
      setActiveMainTab(BookingHubMainTab.Plans)
      setActiveSubtab(BookingHubSubTab.Today)

      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('tab', BookingHubMainTab.Plans)
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
    if (
      !hasVoiceTenant
      && (mainTab === BookingHubMainTab.Booking || mainTab === BookingHubMainTab.Settings)
    ) {
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
        <h1 className="page-title">{t(`${TK}.title`)}</h1>
        <p className="page-description">{t(`${TK}.description`)}</p>
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
              className={`booking-subtab ${activeSubtab === BookingHubSubTab.Team ? 'is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={activeSubtab === BookingHubSubTab.Team}
              onClick={() => updateQueryTabs(BookingHubMainTab.Booking, BookingHubSubTab.Team)}
            >
              <span className="booking-subtab-icon"><TeamIcon /></span>
              <span>{t(`${TK}.schedule.team`)}</span>
            </button>
          </div>
          <div className="sync-note">{t(`${TK}.schedule.syncNote`)}</div>
        </div>

        {activeSubtab === BookingHubSubTab.Today ? <BookingTodayPanel /> : <BookingTeamPanel />}
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
