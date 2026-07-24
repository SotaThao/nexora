import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BOOKING_HUB_PAGE_SIZE } from '../../../../constants/pagination'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SmsCampaignRecipientStatus } from '../../../../data/merchantVoice/domain'
import { useMerchantVoiceSmsCampaignRecipients } from '../../../../data/hooks/useMerchantVoiceSmsCampaigns'
import { getApiErrorCode } from '../../../../types/domain'
import Skeleton from '../../../ui/skeleton/Skeleton'
import { parseApiDateTime } from '../../utils'
import { CloseIcon } from '../BookingHubIcons'
import { BOOKING_HUB_EMPTY_CELL, formatVoicePhoneDisplay } from '../bookingHubFormatters'
import {
  SMS_CAMPAIGN_TK,
  SMS_RECIPIENT_STATUS_CLASS,
  SMS_RECIPIENT_STATUS_I18N_KEY,
} from './constants'

const TK = SMS_CAMPAIGN_TK
const FILTER_ALL = 'all' as const
const SKELETON_ROWS = 6

type StatusFilter = typeof FILTER_ALL | SmsCampaignRecipientStatus

type Props = {
  open: boolean
  campaignId: string | null
  campaignName: string
  onClose: () => void
}

/** API `*Utc` values often omit `Z` — parse as UTC, then format in the user's timezone. */
function formatRecipientSentAt(value: string | null, locale: string): string {
  if (!value) return BOOKING_HUB_EMPTY_CELL
  const date = parseApiDateTime(value)
  if (!date) return value
  const dateLabel = date.toLocaleDateString(locale, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
  const timeLabel = date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${dateLabel} · ${timeLabel}`
}

function SmsRecipientsTableSkeleton({ rows = SKELETON_ROWS }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, index) => (
        <tr key={`sms-recipient-skeleton-${index}`} className="sms-recipient-skeleton-row" aria-hidden="true">
          <td><Skeleton width="68%" height={14} borderRadius={6} /></td>
          <td><Skeleton width="72%" height={14} borderRadius={6} /></td>
          <td><Skeleton width={72} height={22} borderRadius={999} /></td>
          <td><Skeleton width={28} height={14} borderRadius={6} /></td>
          <td><Skeleton width="78%" height={14} borderRadius={6} /></td>
        </tr>
      ))}
    </>
  )
}

export default function SmsRecipientsModal({
  open,
  campaignId,
  campaignName,
  onClose,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(FILTER_ALL)
  const numberLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'

  const filters = useMemo(
    () => ({
      pageNumber: 1,
      pageSize: BOOKING_HUB_PAGE_SIZE,
      status: statusFilter === FILTER_ALL ? undefined : statusFilter,
    }),
    [statusFilter],
  )

  const recipientsQuery = useMerchantVoiceSmsCampaignRecipients(campaignId, filters, {
    enabled: open && !!campaignId,
  })

  useEffect(() => {
    if (!open) {
      setStatusFilter(FILTER_ALL)
      document.body.style.overflow = ''
      return undefined
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const recipients = recipientsQuery.data?.items ?? []
  const totalCount = recipientsQuery.data?.totalCount ?? recipients.length
  // Skeleton while first load / filter change (no cached page yet). Avoid flash on background refetch.
  const showSkeleton = !recipientsQuery.data && (recipientsQuery.isLoading || recipientsQuery.isFetching)

  return (
    <div
      className="sms-recipients-modal"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="sms-recipients-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sms-recipients-title"
        aria-busy={showSkeleton}
      >
        <div className="sms-recipients-modal-head">
          <div>
            <h3 className="sms-recipients-title" id="sms-recipients-title">
              {t(`${TK}.recipientsTitle`)}
            </h3>
            <p className="sms-recipients-subtitle">
              {campaignName || t(`${TK}.recipientsFallbackName`)}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            className="sms-recipients-close"
            type="button"
            aria-label={t(`${TK}.recipientsCloseAria`)}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon is-compact" />
          </button>
        </div>

        <div className="sms-recipients-modal-body">
          <div className="sms-recipients-toolbar">
            <span className="sms-recipients-count">
              {showSkeleton
                ? <Skeleton width={96} height={14} borderRadius={6} />
                : t(`${TK}.recipientsCount`, {
                  count: new Intl.NumberFormat(numberLocale).format(totalCount),
                })}
            </span>
            <label>
              <span className="sr-only">{t(`${TK}.recipientsFilterAria`)}</span>
              <select
                className="sms-recipients-filter"
                aria-label={t(`${TK}.recipientsFilterAria`)}
                value={statusFilter}
                disabled={showSkeleton && !recipientsQuery.data}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                }}
              >
                <option value={FILTER_ALL}>{t(`${TK}.recipientsFilterAll`)}</option>
                {Object.values(SmsCampaignRecipientStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(`${TK}.${SMS_RECIPIENT_STATUS_I18N_KEY[status]}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="sms-recipients-table-wrap">
            <table className="sms-recipients-table">
              <thead>
                <tr>
                  <th scope="col">{t(`${TK}.recipientsColCustomer`)}</th>
                  <th scope="col">{t(`${TK}.recipientsColPhone`)}</th>
                  <th scope="col">{t(`${TK}.recipientsColStatus`)}</th>
                  <th scope="col">{t(`${TK}.recipientsColSegments`)}</th>
                  <th scope="col">{t(`${TK}.recipientsColSentAt`)}</th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton ? (
                  <SmsRecipientsTableSkeleton />
                ) : recipientsQuery.isError ? (
                  <tr>
                    <td className="sms-recipient-empty" colSpan={5}>
                      {t(getErrorI18nKey(getApiErrorCode(recipientsQuery.error)))}
                    </td>
                  </tr>
                ) : recipients.length === 0 ? (
                  <tr>
                    <td className="sms-recipient-empty" colSpan={5}>
                      {t(`${TK}.recipientsEmpty`)}
                    </td>
                  </tr>
                ) : (
                  recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td>{recipient.customerName?.trim() || BOOKING_HUB_EMPTY_CELL}</td>
                      <td>{formatVoicePhoneDisplay(recipient.phoneNumber, BOOKING_HUB_EMPTY_CELL)}</td>
                      <td>
                        <span
                          className={`sms-recipient-status ${SMS_RECIPIENT_STATUS_CLASS[recipient.status]}`}
                        >
                          {t(`${TK}.${SMS_RECIPIENT_STATUS_I18N_KEY[recipient.status]}`)}
                        </span>
                      </td>
                      <td>{recipient.segments}</td>
                      <td>{formatRecipientSentAt(recipient.sentAtUtc, numberLocale)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
