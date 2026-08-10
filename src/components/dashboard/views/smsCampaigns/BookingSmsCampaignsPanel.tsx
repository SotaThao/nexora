import React, { useEffect, useMemo, useState } from 'react'
import { BOOKING_HUB_PAGE_SIZE } from '../../../../constants/pagination'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  isSmsCampaignCancellable,
  isSmsCampaignDeletable,
  isSmsCampaignEditable,
  isSmsCampaignViewable,
  MERCHANT_VOICE_SMS_CAMPAIGNS_POLL_INTERVAL_MS,
  SmsCampaignAudience,
  SmsCampaignScheduleMode,
  SmsCampaignStatus,
} from '../../../../data/merchantVoice/domain'
import { useMerchantVoiceMyTenant } from '../../../../data/hooks/useMerchantVoiceBookings'
import {
  useCancelMerchantVoiceSmsCampaign,
  useDeleteMerchantVoiceSmsCampaign,
  useMerchantVoiceSmsCampaignAudienceSummary,
  useMerchantVoiceSmsCampaignDashboard,
  useMerchantVoiceSmsCampaigns,
} from '../../../../data/hooks/useMerchantVoiceSmsCampaigns'
import type { SmsCampaignListItemDto } from '../../../../data/repositories/merchantVoiceSmsCampaigns'
import { usePagination } from '../../../../hooks/usePagination'
import { getApiErrorCode } from '../../../../types/domain'
import Pagination from '../../../ui/Pagination'
import {
  CalendarTabIcon,
  ClockIcon,
  GiftIcon,
  PeopleTabIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
  UserPlusIcon,
  WalletCardsIcon,
} from '../BookingHubIcons'
import { BOOKING_HUB_EMPTY_CELL, BOOKING_HUB_PAGINATION_CLASSNAME } from '../bookingHubFormatters'
import { BookingSmsCampaignsSkeleton } from '../BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from '../BookingHubVoiceContext'
import {
  getAudienceCount,
  SMS_CAMPAIGN_AUDIENCE_I18N_KEY,
  SMS_CAMPAIGN_DEFAULT_AUDIENCE,
  SMS_CAMPAIGN_MODE_I18N_KEY,
  SMS_CAMPAIGN_SEGMENT_CARDS,
  SMS_CAMPAIGN_STATUS_CLASS,
  SMS_CAMPAIGN_STATUS_I18N_KEY,
  SMS_CAMPAIGN_TK,
  SMS_CREDITS_LOW_THRESHOLD,
  formatSmsCostUsd,
  type SmsCampaignSegmentAccent,
} from './constants'
import SmsBuyCreditsModal from './SmsBuyCreditsModal'
import SmsCreateCampaignModal from './SmsCreateCampaignModal'
import SmsRecipientsModal from './SmsRecipientsModal'

const TK = SMS_CAMPAIGN_TK

const SEGMENT_ICON: Record<SmsCampaignAudience, React.ReactNode> = {
  [SmsCampaignAudience.New]: <UserPlusIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days15]: <CalendarTabIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days30]: <ClockIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days60]: <RefreshCwIcon className="marketing-icon" />,
  [SmsCampaignAudience.Vip]: <StarIcon className="marketing-icon" />,
  [SmsCampaignAudience.Birthday]: <GiftIcon className="marketing-icon" />,
  [SmsCampaignAudience.All]: <PeopleTabIcon className="marketing-icon" />,
}

const SEGMENT_ACCENT_STYLE: Record<SmsCampaignSegmentAccent, string> = {
  cyan: 'var(--cyan)',
  green: 'var(--green)',
  purple: 'var(--purple)',
  orange: 'var(--orange)',
  pink: 'var(--pink)',
  birthday: 'linear-gradient(90deg, var(--pink), var(--orange))',
}

function formatCount(value: number, language: string): string {
  return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(value)
}

function statusLabel(status: SmsCampaignStatus, t: (key: string) => string): string {
  return t(`${TK}.${SMS_CAMPAIGN_STATUS_I18N_KEY[status]}`)
}

function modeLabel(mode: SmsCampaignScheduleMode, t: (key: string) => string): string {
  return t(`${TK}.${SMS_CAMPAIGN_MODE_I18N_KEY[mode]}`)
}

export default function BookingSmsCampaignsPanel() {
  const { t, currentLanguage } = useTranslation()
  const { showConfirm, showToast } = useNotification()
  const voiceEnabled = useBookingHubVoiceEnabled()

  const { pageNumber, pageSize, setPage } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  })

  const myTenantQuery = useMerchantVoiceMyTenant({ enabled: voiceEnabled })
  const dashboardQuery = useMerchantVoiceSmsCampaignDashboard({ enabled: voiceEnabled })
  const audienceQuery = useMerchantVoiceSmsCampaignAudienceSummary({ enabled: voiceEnabled })
  const campaignsQuery = useMerchantVoiceSmsCampaigns(
    { pageNumber, pageSize },
    {
      enabled: voiceEnabled,
      refetchInterval: voiceEnabled ? MERCHANT_VOICE_SMS_CAMPAIGNS_POLL_INTERVAL_MS : false,
    },
  )

  const cancelMutation = useCancelMerchantVoiceSmsCampaign()
  const deleteMutation = useDeleteMerchantVoiceSmsCampaign()

  const [buyOpen, setBuyOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerAudience, setComposerAudience] = useState(SMS_CAMPAIGN_DEFAULT_AUDIENCE)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [viewingCampaign, setViewingCampaign] = useState<SmsCampaignListItemDto | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  const isPanelLoading =
    dashboardQuery.isLoading
    || audienceQuery.isLoading
    || (campaignsQuery.isLoading && pageNumber === 1)

  const isBusy =
    cancelMutation.isPending
    || deleteMutation.isPending

  const toastApiError = (error: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
  }

  useEffect(() => {
    const totalPages = campaignsQuery.data?.totalPages ?? 1
    if (pageNumber > totalPages) {
      setPage(totalPages)
    }
  }, [campaignsQuery.data?.totalPages, pageNumber, setPage])

  useEffect(() => {
    if (!myTenantQuery.isError) return
    toastApiError(myTenantQuery.error)
  }, [myTenantQuery.isError, myTenantQuery.error])

  const availableCredits = dashboardQuery.data?.creditBalance ?? 0
  const remainingUsd = formatSmsCostUsd(dashboardQuery.data?.estimatedCostUsd ?? 0)
  const openBuyCredits = () => setBuyOpen(true)

  const history = campaignsQuery.data?.items ?? []
  const campaignsTotalCount = campaignsQuery.data?.totalCount ?? 0

  const segments = useMemo(
    () => SMS_CAMPAIGN_SEGMENT_CARDS.map((card) => ({
      ...card,
      count: getAudienceCount(audienceQuery.data, card.id),
    })),
    [audienceQuery.data],
  )

  if (!voiceEnabled) return null

  if (isPanelLoading) {
    return <BookingSmsCampaignsSkeleton />
  }

  const openComposer = (audience: SmsCampaignAudience = SMS_CAMPAIGN_DEFAULT_AUDIENCE, campaignId: string | null = null) => {
    setComposerAudience(audience)
    setEditingCampaignId(campaignId)
    setComposerOpen(true)
  }

  const handleCancelCampaign = async (campaign: SmsCampaignListItemDto) => {
    const ok = await showConfirm(
      t(`${TK}.cancelConfirmMessage`, { name: campaign.name }),
      t(`${TK}.cancelConfirmTitle`),
    )
    if (!ok) return

    setPendingActionId(campaign.id)
    try {
      await cancelMutation.mutateAsync(campaign.id)
      showToast(t(`${TK}.cancelSuccess`, { name: campaign.name }), 'success')
    } catch (error) {
      toastApiError(error)
    } finally {
      setPendingActionId(null)
    }
  }

  const handleDeleteCampaign = async (campaign: SmsCampaignListItemDto) => {
    const ok = await showConfirm(
      t(`${TK}.deleteConfirmMessage`, { name: campaign.name }),
      t(`${TK}.deleteConfirmTitle`),
    )
    if (!ok) return

    setPendingActionId(campaign.id)
    try {
      await deleteMutation.mutateAsync(campaign.id)
      showToast(t(`${TK}.deleteSuccess`, { name: campaign.name }), 'success')
    } catch (error) {
      toastApiError(error)
    } finally {
      setPendingActionId(null)
    }
  }

  const handleCampaignSaved = (message: string) => {
    setComposerOpen(false)
    setEditingCampaignId(null)
    showToast(message, 'success')
  }

  const stats = dashboardQuery.data

  return (
    <>
      <div className="panel-sms-campaigns" id="panel-sms-campaigns">
        <div className="marketing-panel-head">
          <div>
            <p>{t(`${TK}.headerSubtitle`)}</p>
          </div>
          <div className="marketing-panel-actions">
            <div className="sms-credit-pill">
              <span>{t(`${TK}.creditsLabel`)}</span>
              <strong className={availableCredits < SMS_CREDITS_LOW_THRESHOLD ? 'is-low' : undefined}>
                {formatCount(availableCredits, currentLanguage)}
              </strong>
              <small>
                {t(`${TK}.creditsRemaining`, { amount: remainingUsd })}
              </small>
            </div>
            <button
              className="booking-secondary-button sms-credit-buy-button"
              type="button"
              disabled={isBusy}
              onClick={openBuyCredits}
            >
              <WalletCardsIcon className="marketing-icon" />
              <span>{t(`${TK}.buyCredits`)}</span>
            </button>
            <button
              className="booking-primary-button"
              type="button"
              disabled={isBusy}
              onClick={() => openComposer()}
            >
              <SparklesIcon className="marketing-icon" />
              <span>{t(`${TK}.createCampaign`)}</span>
            </button>
          </div>
        </div>

        <div className="sms-campaign-stats">
          <article className="sms-stat-card cyan">
            <span>{t(`${TK}.statTotalCustomers`)}</span>
            <strong>{formatCount(stats?.totalCustomers ?? 0, currentLanguage)}</strong>
          </article>
          <article className="sms-stat-card violet">
            <span>{t(`${TK}.statSmsSent`)}</span>
            <strong>{formatCount(stats?.smsSentThisMonth ?? 0, currentLanguage)}</strong>
          </article>
          <article className="sms-stat-card green">
            <span>{t(`${TK}.statCampaignsSent`)}</span>
            <strong>{formatCount(stats?.campaignsSentThisMonth ?? 0, currentLanguage)}</strong>
          </article>
          <article className="sms-stat-card orange">
            <span>{t(`${TK}.statActiveAuto`)}</span>
            <strong>{formatCount(stats?.activeAutoCampaigns ?? 0, currentLanguage)}</strong>
          </article>
        </div>

        <div className="marketing-section-heading">
          <h3>{t(`${TK}.segmentsHeading`)}</h3>
        </div>

        <div className="sms-campaign-grid">
          {segments.map((segment) => (
            <button
              key={segment.id}
              className="sms-campaign-card"
              type="button"
              disabled={isBusy}
              style={{ '--card-accent': SEGMENT_ACCENT_STYLE[segment.accent] } as React.CSSProperties}
              onClick={() => openComposer(segment.id)}
            >
              <span className="sms-campaign-icon">{SEGMENT_ICON[segment.id]}</span>
              <span className="sms-campaign-copy">
                <span className="sms-campaign-name">{t(`${TK}.${segment.nameKey}`)}</span>
                <span className="sms-campaign-desc">{t(`${TK}.${segment.descKey}`)}</span>
              </span>
              <span className="sms-campaign-meta">
                <span className="sms-campaign-count-wrap">
                  <span className="sms-campaign-count">{formatCount(segment.count, currentLanguage)}</span>
                  <span className="sms-campaign-count-label">{t(`${TK}.${segment.countLabelKey}`)}</span>
                </span>
                <span className="sms-campaign-badge">{t(`${TK}.${segment.badgeKey}`)}</span>
              </span>
            </button>
          ))}
        </div>

        <section className="sms-campaign-history" aria-labelledby="smsCampaignHistoryTitle">
          <div className="marketing-section-heading">
            <h3 id="smsCampaignHistoryTitle">{t(`${TK}.historyHeading`)}</h3>
          </div>
          <div className="sms-campaign-table-wrap">
            <table className="sms-campaign-table">
              <thead>
                <tr>
                  <th scope="col">{t(`${TK}.colName`)}</th>
                  <th scope="col">{t(`${TK}.colAudience`)}</th>
                  <th scope="col">{t(`${TK}.colMode`)}</th>
                  <th scope="col">{t(`${TK}.colStatus`)}</th>
                  <th scope="col">{t(`${TK}.colSent`)}</th>
                  <th scope="col">{t(`${TK}.colFailed`)}</th>
                  <th scope="col">{t(`${TK}.colActions`)}</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="sms-campaign-empty" colSpan={7}>
                      {t(`${TK}.emptyState`)}
                    </td>
                  </tr>
                ) : (
                  history.map((campaign) => {
                    const rowBusy = isBusy && pendingActionId === campaign.id
                    const canView = isSmsCampaignViewable(campaign.status)
                    const canEdit = isSmsCampaignEditable(campaign.status)
                    const canCancel = isSmsCampaignCancellable(campaign.status)
                    const canDelete = isSmsCampaignDeletable(campaign.status, campaign.totalSent)
                    const hasActions = canView || canEdit || canCancel || canDelete
                    return (
                      <tr key={campaign.id}>
                        <td>{campaign.name}</td>
                        <td>
                          {t(`${TK}.${SMS_CAMPAIGN_AUDIENCE_I18N_KEY[campaign.audienceSegment]}`)}
                        </td>
                        <td>{modeLabel(campaign.scheduleMode, t)}</td>
                        <td>
                          <span
                            className={`sms-campaign-status ${SMS_CAMPAIGN_STATUS_CLASS[campaign.status]}`}
                          >
                            {statusLabel(campaign.status, t)}
                          </span>
                        </td>
                        <td>
                          {formatCount(campaign.totalSent, currentLanguage)}
                        </td>
                        <td>
                          {formatCount(campaign.totalFailed, currentLanguage)}
                        </td>
                        <td>
                          {hasActions ? (
                            <div className="sms-campaign-actions">
                              {canView ? (
                                <button
                                  className="sms-campaign-action"
                                  type="button"
                                  data-sms-campaign-action="view"
                                  disabled={rowBusy}
                                  aria-label={t(`${TK}.actionViewAria`, { name: campaign.name })}
                                  onClick={() => setViewingCampaign(campaign)}
                                >
                                  {t(`${TK}.actionView`)}
                                </button>
                              ) : null}
                              {canEdit ? (
                                <button
                                  className="sms-campaign-action"
                                  type="button"
                                  data-sms-campaign-action="edit"
                                  disabled={rowBusy}
                                  aria-label={t(`${TK}.actionEditAria`, { name: campaign.name })}
                                  onClick={() => openComposer(campaign.audienceSegment, campaign.id)}
                                >
                                  {t(`${TK}.actionEdit`)}
                                </button>
                              ) : null}
                              {canCancel ? (
                                <button
                                  className="sms-campaign-action"
                                  type="button"
                                  data-sms-campaign-action="cancel"
                                  disabled={rowBusy}
                                  aria-label={t(`${TK}.actionCancelAria`, { name: campaign.name })}
                                  onClick={() => void handleCancelCampaign(campaign)}
                                >
                                  {t(`${TK}.actionCancel`)}
                                </button>
                              ) : null}
                              {canDelete ? (
                                <button
                                  className="sms-campaign-action is-danger"
                                  type="button"
                                  data-sms-campaign-action="delete"
                                  disabled={rowBusy}
                                  aria-label={t(`${TK}.actionDeleteAria`, { name: campaign.name })}
                                  onClick={() => void handleDeleteCampaign(campaign)}
                                >
                                  {t(`${TK}.actionDelete`)}
                                </button>
                              ) : null}
                            </div>
                          ) : (
                            BOOKING_HUB_EMPTY_CELL
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!campaignsQuery.isLoading && campaignsTotalCount > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={campaignsQuery.data?.totalPages ?? 1}
              totalCount={campaignsTotalCount}
              hasNextPage={campaignsQuery.data?.hasNextPage}
              hasPreviousPage={campaignsQuery.data?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={campaignsQuery.isFetching}
              className={BOOKING_HUB_PAGINATION_CLASSNAME}
            />
          ) : null}
        </section>
      </div>

      <div id="nx-campaign-root">
        <SmsBuyCreditsModal
          open={buyOpen}
          preserveBodyLock={composerOpen}
          onClose={() => setBuyOpen(false)}
        />
        <SmsCreateCampaignModal
          open={composerOpen}
          initialAudience={composerAudience}
          campaignId={editingCampaignId}
          availableCredits={availableCredits}
          audienceSummary={audienceQuery.data}
          onClose={() => {
            setComposerOpen(false)
            setEditingCampaignId(null)
          }}
          onSaved={handleCampaignSaved}
          onBuyCredits={openBuyCredits}
        />
        <SmsRecipientsModal
          open={!!viewingCampaign}
          campaignId={viewingCampaign?.id ?? null}
          campaignName={viewingCampaign?.name ?? ''}
          onClose={() => setViewingCampaign(null)}
        />
      </div>
    </>
  )
}
