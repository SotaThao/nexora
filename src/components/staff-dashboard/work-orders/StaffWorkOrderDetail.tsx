import { useState, type ReactNode } from 'react'
import { Check, ChevronLeft, LayoutGrid, Play, Radio } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCompleteStaffWorkOrderService,
  useStaffWorkOrderDetail,
  useStartStaffWorkOrderService,
} from '../../../data/hooks/useStaffWorkOrders'
import type { TFunction } from '../../../types/contexts'
import { getApiErrorCode } from '../../../types/domain'
import {
  WORK_ORDER_LIST_QUERY,
  WORK_ORDER_STATUS_BADGE_VARIANT,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDER_TOAST_DURATION_MS,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  parseWorkOrderTicketFilter,
  workOrderStatusClass,
  type WorkOrderDetail,
  type WorkOrderTicketFilter,
} from './constants'
import WorkOrderCompleteServiceModal from './WorkOrderCompleteServiceModal'
import WorkOrderServiceLines from './WorkOrderServiceLines'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderDetailSkeleton } from './WorkOrderSkeletons'
import {
  formatWorkOrderNumber,
  listFilterAfterWorkOrderComplete,
  listFilterAfterWorkOrderStart,
  workOrderBeeperChipText,
  workOrderCustomerInitials,
  workOrderStationChipText,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'
import type { PosOrderStatus } from '../../../constants/posOrderStatus'

interface StaffWorkOrderDetailProps {
  orderId: string
  onBack: () => void
}

export default function StaffWorkOrderDetail({ orderId, onBack }: StaffWorkOrderDetailProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [searchParams, setSearchParams] = useSearchParams()
  const detailQuery = useStaffWorkOrderDetail(orderId)
  const startService = useStartStaffWorkOrderService(orderId)
  const completeService = useCompleteStaffWorkOrderService(orderId)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const ticket = detailQuery.data ?? null
  const isMutating = startService.isPending || completeService.isPending
  const listFilter = parseWorkOrderTicketFilter(searchParams.get(WORK_ORDER_LIST_QUERY.filter))

  const rememberListFilter = (nextFilter: WorkOrderTicketFilter) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set(WORK_ORDER_LIST_QUERY.filter, nextFilter)
      return next
    }, { replace: true })
  }

  if (detailQuery.isPending) return <WorkOrderDetailSkeleton />

  const runAction = async (
    mutate: () => Promise<unknown>,
    successKey: string,
  ) => {
    try {
      await mutate()
      showToast(t(successKey), 'success', WORK_ORDER_TOAST_DURATION_MS)
      return true
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error', WORK_ORDER_TOAST_DURATION_MS)
      return false
    }
  }

  const handleConfirmCompletion = async (note: string | null) => {
    if (!note) return
    const succeeded = await runAction(
      () => completeService.mutateAsync(note),
      WORK_ORDERS_I18N.completeServiceSuccess,
    )
    if (!succeeded) return
    rememberListFilter(listFilterAfterWorkOrderComplete(listFilter))
    setIsCompleteModalOpen(false)
  }

  const handleStart = async () => {
    const succeeded = await runAction(
      () => startService.mutateAsync(),
      WORK_ORDERS_I18N.startServiceSuccess,
    )
    if (succeeded) rememberListFilter(listFilterAfterWorkOrderStart(listFilter))
  }

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailPage}>
      <WorkOrderDetailHeader
        onBack={onBack}
        orderNumber={ticket?.orderNumber}
        status={ticket?.status}
      />
      <WorkOrderDetailBody
        isError={detailQuery.isError}
        errorMessage={detailQuery.isError ? t(getErrorI18nKey(getApiErrorCode(detailQuery.error))) : undefined}
        ticket={ticket}
        isMutating={isMutating}
        onRetry={() => void detailQuery.refetch()}
        onBack={onBack}
        onStart={() => void handleStart()}
        onComplete={() => setIsCompleteModalOpen(true)}
      />
      {isCompleteModalOpen && ticket ? (
        <WorkOrderCompleteServiceModal
          customerName={workOrderTextOrPlaceholder(ticket.customerName)}
          isPending={completeService.isPending}
          onConfirm={(note) => void handleConfirmCompletion(note)}
          onClose={() => {
            if (!completeService.isPending) setIsCompleteModalOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function WorkOrderDetailBody({
  isError,
  errorMessage,
  ticket,
  isMutating,
  onRetry,
  onBack,
  onStart,
  onComplete,
}: {
  isError: boolean
  errorMessage?: string
  ticket: WorkOrderDetail | null
  isMutating: boolean
  onRetry: () => void
  onBack: () => void
  onStart: () => void
  onComplete: () => void
}) {
  const { t } = useTranslation()

  if (isError) {
    return (
      <div className={WORK_ORDERS_LAYOUT_CLASS.paddedBlock}>
        <WorkOrderErrorCard message={errorMessage} onAction={onRetry} />
      </div>
    )
  }
  if (!ticket) {
    return (
      <div className={WORK_ORDERS_LAYOUT_CLASS.paddedBlock}>
        <WorkOrderErrorCard
          actionLabel={t(WORK_ORDERS_I18N.back)}
          onAction={onBack}
        />
      </div>
    )
  }

  const station = workOrderStationChipText(ticket.stationNumber, t)
  const beeper = workOrderBeeperChipText(ticket.beeper, t)

  return (
    <>
      <div className={WORK_ORDERS_LAYOUT_CLASS.customerCard}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.customerRow}>
          <span className={WORK_ORDERS_LAYOUT_CLASS.avatar}>
            {workOrderCustomerInitials(ticket.customerName)}
          </span>
          <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
            <p className={WORK_ORDERS_LAYOUT_CLASS.customerLabel}>
              {t(WORK_ORDERS_I18N.customer)}
            </p>
            <p className={WORK_ORDERS_LAYOUT_CLASS.customerName}>
              {workOrderTextOrPlaceholder(ticket.customerName)}
            </p>
            <span className={WORK_ORDERS_LAYOUT_CLASS.ticketMeta}>
              <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
                <LayoutGrid className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
                <span>{station}</span>
              </span>
              <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
                <Radio className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
                <span>{beeper}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <WorkOrderServiceLines items={ticket.items} serviceTotal={ticket.serviceTotal} />

      {ticket.customerNotes ? (
        <aside className={WORK_ORDERS_LAYOUT_CLASS.notesCard}>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesKicker}>{t(WORK_ORDERS_I18N.notesImportant)}</p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesTitle}>{t(WORK_ORDERS_I18N.customerNotes)}</p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesBody}>{ticket.customerNotes}</p>
        </aside>
      ) : null}

      {workOrderPrimaryActions(ticket, t, onStart, onComplete).map((action) => (
        <WorkOrderPrimaryAction
          key={action.key}
          disabled={isMutating}
          onClick={action.onClick}
          icon={action.icon}
          label={action.label}
        />
      ))}
    </>
  )
}

function workOrderPrimaryActions(
  ticket: WorkOrderDetail,
  t: TFunction,
  onStart: () => void,
  onComplete: () => void,
) {
  return [
    ticket.canStartService && {
      key: 'start',
      onClick: onStart,
      icon: <Play className={`${WORK_ORDERS_LAYOUT_CLASS.iconSm} ${WORK_ORDERS_LAYOUT_CLASS.iconFill}`} aria-hidden="true" />,
      label: t(WORK_ORDERS_I18N.startService),
    },
    ticket.canCompleteService && {
      key: 'complete',
      onClick: onComplete,
      icon: (
        <span className={WORK_ORDERS_LAYOUT_CLASS.primaryActionIcon}>
          <Check className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
        </span>
      ),
      label: t(WORK_ORDERS_I18N.completeService),
    },
  ].filter((action): action is Exclude<typeof action, false> => Boolean(action))
}

function WorkOrderPrimaryAction({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={WORK_ORDERS_LAYOUT_CLASS.primaryAction}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  )
}

function WorkOrderDetailHeader({
  onBack,
  orderNumber,
  status,
}: {
  onBack: () => void
  orderNumber?: string
  status?: PosOrderStatus
}) {
  const { t } = useTranslation()

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailHeader}>
      <button
        type="button"
        className={WORK_ORDERS_LAYOUT_CLASS.detailBack}
        aria-label={t(WORK_ORDERS_I18N.back)}
        onClick={onBack}
      >
        <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
      </button>
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailTitleWrap}>
        <h2 className={WORK_ORDERS_LAYOUT_CLASS.detailTitle}>
          {t(WORK_ORDERS_I18N.detailTitle)}
        </h2>
        <p className={WORK_ORDERS_LAYOUT_CLASS.detailCode}>
          {formatWorkOrderNumber(orderNumber)}
        </p>
      </div>
      {status ? (
        <span className={workOrderStatusClass(status, WORK_ORDER_STATUS_BADGE_VARIANT.detail)}>
          {t(WORK_ORDER_STATUS_I18N[status])}
        </span>
      ) : null}
    </div>
  )
}
