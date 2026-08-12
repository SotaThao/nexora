import React, { useEffect, useMemo, useRef, useState } from 'react'
import { BOOKING_HUB_PAGE_SIZE } from '../../../../constants/pagination'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SmsCampaignRecipientStatus } from '../../../../data/merchantVoice/domain'
import { useMerchantVoiceSmsCampaignRecipients } from '../../../../data/hooks/useMerchantVoiceSmsCampaigns'
import { usePagination } from '../../../../hooks/usePagination'
import { getApiErrorCode } from '../../../../types/domain'
import Pagination from '../../../ui/Pagination'
import Skeleton from '../../../ui/skeleton/Skeleton'
import { CloseIcon } from '../BookingHubIcons'
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  formatBookingHubDateTime,
  formatVoicePhoneDisplay,
} from '../bookingHubFormatters'
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

/** API `*Utc` values — Staff Linked-date style in the user's timezone. */
function formatRecipientSentAt(value: string | null, language: string): string {
  if (!value) return BOOKING_HUB_EMPTY_CELL
  return formatBookingHubDateTime(value, language)
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
  const { pageNumber, pageSize, setPage, reset: resetPage } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  })

  const filters = useMemo(
    () => ({
      pageNumber,
      pageSize,
      status: statusFilter === FILTER_ALL ? undefined : statusFilter,
    }),
    [pageNumber, pageSize, statusFilter],
  )

  const recipientsQuery = useMerchantVoiceSmsCampaignRecipients(campaignId, filters, {
    enabled: open && !!campaignId,
  })

  useEffect(() => {
    if (!open) {
      setStatusFilter(FILTER_ALL)
      resetPage()
      document.body.style.overflow = ''
      return undefined
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open, resetPage])

  useEffect(() => {
    if (!open) return
    resetPage()
  }, [campaignId, open, resetPage])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    const totalPages = recipientsQuery.data?.totalPages
    if (!totalPages || totalPages < 1) return
    if (pageNumber > totalPages) setPage(totalPages)
  }, [recipientsQuery.data?.totalPages, pageNumber, setPage])

  if (!open) return null

  const recipients = recipientsQuery.data?.items ?? []
  const totalCount = recipientsQuery.data?.totalCount ?? 0
  // Skeleton while first load / filter or page change (no cached page yet).
  const showSkeleton = !recipientsQuery.data && (recipientsQuery.isLoading || recipientsQuery.isFetching)
  const showPagination = !recipientsQuery.isLoading && totalCount > 0

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
                  resetPage()
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
                      <td>{formatRecipientSentAt(recipient.sentAtUtc, currentLanguage)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showPagination ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={recipientsQuery.data?.totalPages ?? 1}
              totalCount={totalCount}
              hasNextPage={recipientsQuery.data?.hasNextPage}
              hasPreviousPage={recipientsQuery.data?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={recipientsQuery.isFetching}
              className={`${BOOKING_HUB_PAGINATION_CLASSNAME} sms-recipients-pagination`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
