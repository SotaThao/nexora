// Operational customer profile for the POS front desk.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  Cake,
  Clock3,
  Footprints,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  UserRound,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePagination } from '../../../../../hooks/usePagination'
import { usePosCustomerDetail, usePosCustomerOrderHistory } from '../../../../../data/hooks/usePosCustomers'
import { useMerchantVoiceTenantStatus, useUpdateMerchantVoiceCustomer } from '../../../../../data/hooks/useMerchantVoiceBookings'
import { useSessionRole } from '../../../../../auth/useSessionRole'
import {
  normalizeMerchantVoiceCustomerStatus,
  normalizeMerchantVoiceCustomerType,
} from '../../../../../data/repositories/merchantVoice'
import BookingCustomerModal from '../../BookingCustomerModal'
import { SkeletonList } from '../../../../ui/skeleton'
import Pagination from '../../../../ui/Pagination'
import { formatPosDateTime } from '../posDateTime'
import { statusLabelKey } from '../booking/bookingFormatters'
import { formatCustomerPhone } from './customerFormatters'

const CUSTOMER_ORDER_HISTORY_PAGE_SIZE = 10

const CUSTOMER_STATUS_LABEL_KEYS: Record<string, string> = {
  Active: 'customerStatus.Active',
  InActive: 'customerStatus.InActive',
}
const CUSTOMER_TYPE_LABEL_KEYS: Record<string, string> = {
  Individual: 'customerType.Individual',
  Business: 'customerType.Business',
  Vip: 'customerType.Vip',
  Guest: 'customerType.Guest',
  Partner: 'customerType.Partner',
  Internal: 'customerType.Internal',
}
const CUSTOMER_SOURCE_LABEL_KEYS: Record<string, string> = {
  Call: 'customerSource.Call',
  Qr: 'customerSource.Qr',
  Web: 'customerSource.Web',
  Sms: 'customerSource.Sms',
  Receipt: 'customerSource.Receipt',
  Manual: 'customerSource.Manual',
  PosCheckIn: 'customerSource.PosCheckIn',
}
const CUSTOMER_STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  InActive: 'bg-rose-50 text-rose-700 ring-rose-200',
}
const HISTORY_STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  Confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  Waiting: 'bg-violet-50 text-violet-700 ring-violet-200',
  InService: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function formatProfileDate(value: string, currentLanguage: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  return new Intl.DateTimeFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-nexoraCanvas/70 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-nexoraBrand shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-nexoraText">{value}</p>
      </div>
    </div>
  )
}

export default function CustomerDetailModal({
  businessId,
  customerId,
  initialEditing,
  onClose,
}: {
  businessId: string
  customerId: string
  initialEditing?: boolean
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const { isOwner } = useSessionRole()
  const { data: tenantStatus } = useMerchantVoiceTenantStatus({ enabled: isOwner })
  const canEditCustomer = isOwner && tenantStatus?.hasVoiceTenant
  const [isEditing, setIsEditing] = useState(initialEditing ?? false)
  const dialogRef = useRef<HTMLElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditingRef = useRef(false)
  /** True only when edit mode was entered via the pencil button below, while the detail view was on screen — that's the one case with a view to go "Back" to. */
  const editedFromDetailViewRef = useRef(false)
  const updateCustomer = useUpdateMerchantVoiceCustomer()
  const p = 'components.dashboard.views.pos.CustomerTab.'
  const formatDateTime = (iso: string | null | undefined) => formatPosDateTime(iso, currentLanguage)
  const { data: customer, isLoading: isDetailLoading } = usePosCustomerDetail(businessId, customerId)
  const { pageNumber, pageSize, setPage } = usePagination({ pageSize: CUSTOMER_ORDER_HISTORY_PAGE_SIZE })
  const {
    data: historyPage,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
  } = usePosCustomerOrderHistory(businessId, customerId, { pageNumber, pageSize })

  useEffect(() => {
    if (wasEditingRef.current && !isEditing) editButtonRef.current?.focus()
    wasEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    const previous = document.activeElement
    closeButtonRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])

  const historyItems = historyPage?.items ?? []
  const notProvided = t(p + 'viewDetailNotProvided')
  const customerName = customer?.name || t(p + 'unnamedCustomer')
  const customerPhone = customer
    ? formatCustomerPhone(customer.phone, customer.phoneE164) || notProvided
    : notProvided
  const customerType = customer
    ? t(p + (CUSTOMER_TYPE_LABEL_KEYS[customer.type] ?? 'customerType.Individual'))
    : ''
  const customerStatus = customer
    ? t(p + (CUSTOMER_STATUS_LABEL_KEYS[customer.status] ?? 'customerStatus.Active'))
    : ''
  const customerSource = customer
    ? t(p + (CUSTOMER_SOURCE_LABEL_KEYS[customer.source] ?? 'customerSource.Manual'))
    : ''

  if (isEditing && customer && canEditCustomer) {
    return (
      <BookingCustomerModal
        customer={{
          id: customer.id,
          name: customer.name ?? null,
          phoneNumber: customer.phoneE164 || (customer.phoneCountryCode
            ? `${customer.phoneCountryCode}${customer.phone}`
            : customer.phone),
          email: customer.email ?? null,
          address: customer.address ?? null,
          dateOfBirth: customer.dateOfBirth ?? null,
          type: normalizeMerchantVoiceCustomerType(customer.type),
          status: normalizeMerchantVoiceCustomerStatus(customer.status),
        }}
        onClose={onClose}
        onBack={editedFromDetailViewRef.current ? () => setIsEditing(false) : undefined}
        onSave={(body) => updateCustomer.mutateAsync({ id: customer.id, body })}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-[2px] sm:p-4">
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-detail-dialog-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            onClose()
            return
          }
          if (event.key !== 'Tab') return
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
            ':is(button, input, select, textarea, a[href], [tabindex]):not(:disabled):not([tabindex="-1"])',
          )
          if (!controls?.length) return
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }}
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
      >
        <header className="shrink-0 border-b border-nexoraBorder bg-gradient-to-br from-nexoraCanvas via-white to-nexoraLavender/20 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p
                id="customer-detail-dialog-title"
                className="text-[10px] font-black uppercase tracking-[0.16em] text-nexoraBrand"
              >
                {t(p + 'viewDetailModalTitle')}
              </p>
              {isDetailLoading || !customer ? (
                <div className="mt-2 max-w-sm">
                  <SkeletonList count={1} lines={2} />
                </div>
              ) : (
                <>
                  <div className="mt-1 flex min-w-0 items-center gap-2">
                    <h2 className="pos-customer-name min-w-0 truncate text-xl font-black text-nexoraText sm:text-2xl">{customerName}</h2>
                    {canEditCustomer ? (
                      <button
                        ref={editButtonRef}
                        type="button"
                        onClick={() => {
                          editedFromDetailViewRef.current = true
                          setIsEditing(true)
                        }}
                        aria-label={t(p + 'editCustomer')}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-nexoraBrand/30 bg-white px-2.5 text-xs font-semibold text-nexoraBrand transition hover:border-nexoraBrand hover:bg-nexoraBrand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40 focus-visible:ring-offset-2"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('components.dashboard.views.BookingHubView.customers.editAction')}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraBrandDark ring-1 ring-inset ring-nexoraBrand/20">
                      {customerType}
                    </span>
                    <span
                      className={
                        'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ring-1 ring-inset ' +
                        (CUSTOMER_STATUS_STYLES[customer.status] ??
                          'bg-nexoraCanvas text-nexoraMuted ring-nexoraBorder')
                      }
                    >
                      {customerStatus}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraMuted ring-1 ring-inset ring-nexoraBorder">
                      {customerSource}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={t(p + 'viewDetailCloseAria')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-nexoraMuted shadow-sm transition hover:border-nexoraBrand/40 hover:text-nexoraText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div
          role="region"
          aria-label={t(p + 'viewDetailContentLabel')}
          className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5"
        >
          {isDetailLoading || !customer ? (
            <SkeletonList count={3} lines={2} />
          ) : (
            <>
              <section
                role="region"
                aria-label={t(p + 'viewDetailOverviewTitle')}
              >
                <dl className="grid divide-y divide-nexoraBorder overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraCanvas/40 sm:grid-cols-[0.7fr_1fr_1fr] sm:divide-x sm:divide-y-0">
                  <div className="grid min-w-0 grid-cols-[1fr_1.5fr] items-center gap-x-3 px-3 py-2 sm:block">
                    <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                      <Footprints className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden="true" />
                      <span>{t(p + 'viewDetailTotalVisit')}</span>
                    </dt>
                    <dd className="text-right text-sm font-bold tabular-nums text-nexoraText sm:mt-1 sm:text-left">{customer.totalVisit}</dd>
                  </div>

                  <div className="grid min-w-0 grid-cols-[1fr_1.5fr] items-center gap-x-3 px-3 py-2 sm:block">
                    <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                      <Clock3 className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden="true" />
                      <span>{t(p + 'viewDetailLastVisit')}</span>
                    </dt>
                    <dd className="break-words text-right text-xs font-semibold leading-5 text-nexoraText sm:mt-1 sm:text-left">{formatDateTime(customer.lastVisit)}</dd>
                  </div>

                  <div className="grid min-w-0 grid-cols-[1fr_1.5fr] items-center gap-x-3 px-3 py-2 sm:block">
                    <dt className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden="true" />
                      <span>{t(p + 'viewDetailCustomerSince')}</span>
                    </dt>
                    <dd className="break-words text-right text-xs font-semibold leading-5 text-nexoraText sm:mt-1 sm:text-left">{formatDateTime(customer.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              <section
                aria-label={t(p + 'viewDetailProfileTitle')}
                className="rounded-2xl border border-nexoraBorder bg-white p-4 shadow-sm"
              >
                <h3 className="flex items-center gap-2 text-sm font-black text-nexoraText">
                  <UserRound className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
                  {t(p + 'viewDetailProfileTitle')}
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DetailRow
                    icon={<Phone className="h-4 w-4" aria-hidden="true" />}
                    label={t(p + 'viewDetailPhone')}
                    value={customerPhone}
                  />
                  <DetailRow
                    icon={<Mail className="h-4 w-4" aria-hidden="true" />}
                    label={t(p + 'viewDetailEmail')}
                    value={customer.email || notProvided}
                  />
                  <DetailRow
                    icon={<Cake className="h-4 w-4" aria-hidden="true" />}
                    label={t(p + 'viewDetailDateOfBirth')}
                    value={
                      customer.dateOfBirth
                        ? formatProfileDate(customer.dateOfBirth, currentLanguage)
                        : notProvided
                    }
                  />
                  <DetailRow
                    icon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}
                    label={t(p + 'viewDetailSource')}
                    value={customerSource}
                  />
                  <div className="sm:col-span-2">
                    <DetailRow
                      icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
                      label={t(p + 'viewDetailAddress')}
                      value={customer.address || notProvided}
                    />
                  </div>
                </div>
              </section>
            </>
          )}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
              <h3 className="text-sm font-black text-nexoraText">{t(p + 'viewDetailHistoryTitle')}</h3>
              {historyPage ? (
                <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-black tabular-nums text-nexoraMuted">
                  {historyPage.totalCount}
                </span>
              ) : null}
            </div>

            {isHistoryLoading ? (
              <SkeletonList count={3} lines={2} />
            ) : historyItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-nexoraBorder bg-nexoraCanvas/60 p-6 text-center text-sm font-semibold text-nexoraMuted">
                {t(p + 'viewDetailHistoryEmpty')}
              </div>
            ) : (
              <div
                className={'grid gap-3 sm:grid-cols-2 ' + (isHistoryFetching ? 'opacity-60' : '')}
              >
                {historyItems.map((item) => (
                  <article
                    key={item.id}
                    aria-label={'Ticket #' + item.orderNumber}
                    className="rounded-2xl border border-nexoraBorder bg-white p-3.5 shadow-sm transition hover:border-nexoraBrand/30 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-nexoraText">#{item.orderNumber}</span>
                        <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                          {t(p + (item.isBooking ? 'historyBadgeBooking' : 'historyBadgeWalkin'))}
                        </span>
                        <span
                          className={
                            'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ring-1 ring-inset ' +
                            (HISTORY_STATUS_STYLES[item.status] ??
                              'bg-nexoraLavender/20 text-nexoraBrandDark ring-nexoraBrand/20')
                          }
                        >
                          {t(
                            'components.dashboard.views.pos.BookingTab.' +
                              statusLabelKey(item.status),
                          )}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm font-black tabular-nums text-nexoraText">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-nexoraMuted">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatDateTime(item.occurredAt)}
                    </p>

                    {item.serviceNames.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.serviceNames.map((serviceName, index) => (
                          <span
                            key={serviceName + '-' + index}
                            className="rounded-full bg-nexoraLavender/20 px-2 py-1 text-[10px] font-bold text-nexoraBrandDark"
                          >
                            {serviceName}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-3 flex items-center gap-1.5 border-t border-nexoraBorder pt-2.5 text-xs font-semibold text-nexoraText">
                      <UserRound className="h-3.5 w-3.5 text-nexoraBrand" aria-hidden="true" />
                      {item.technicianNames.length > 0
                        ? item.technicianNames.join(', ')
                        : t(p + 'viewDetailUnassigned')}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {historyPage && historyPage.totalPages > 1 ? (
              <Pagination
                variant="simple"
                pageNumber={historyPage.pageNumber}
                pageSize={pageSize}
                totalPages={historyPage.totalPages}
                totalCount={historyPage.totalCount}
                hasNextPage={historyPage.hasNextPage}
                hasPreviousPage={historyPage.hasPreviousPage}
                onPageChange={setPage}
                className="mt-3"
              />
            ) : null}
          </section>
        </div>
      </section>
    </div>
  )
}
