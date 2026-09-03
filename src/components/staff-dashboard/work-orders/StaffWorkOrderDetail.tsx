import { useState, type ReactNode } from 'react'
import { Check, ChevronLeft, LayoutGrid, Play, Radio } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCompleteStaffWorkOrderService,
  useStaffWorkOrderDetail,
  useStartStaffWorkOrderService,
} from '../../../data/hooks/useStaffWorkOrders'
import { getApiErrorCode } from '../../../types/domain'
import {
  WORK_ORDER_STATUS_BADGE_VARIANT,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderStatusClass,
  type WorkOrderDetail,
  type WorkOrderItem,
} from './constants'
import WorkOrderCompleteServiceModal from './WorkOrderCompleteServiceModal'
import WorkOrderServiceLines, { type WorkOrderLineActions } from './WorkOrderServiceLines'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderDetailSkeleton } from './WorkOrderSkeletons'
import {
  canStartWorkOrderNow,
  formatWorkOrderNumber,
  formatWorkOrderStationValue,
  workOrderCustomerInitials,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'
import type { PosOrderStatus } from '../../../constants/posOrderStatus'
import {
  useAcceptServiceLine,
  useMarkServiceLineDone,
  useRejectServiceLine,
  useStartServiceLine,
} from '../../../data/hooks/usePosOrders'
import { formatLocalDateIso } from '../../../utils/localDate'

interface StaffWorkOrderDetailProps {
  orderId: string
  onBack: () => void
}

const LINE_STATUS_I18N = 'components.dashboard.views.pos.serviceLineStatus'

export default function StaffWorkOrderDetail({ orderId, onBack }: StaffWorkOrderDetailProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const detailQuery = useStaffWorkOrderDetail(orderId)
  const startService = useStartStaffWorkOrderService(orderId)
  const completeService = useCompleteStaffWorkOrderService(orderId)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const ticket = detailQuery.data ?? null

  // Line-level actions live on the merchant endpoints: the same handler serves the front desk and
  // the technician, and decides which of the two is calling. Hence businessId from the ticket.
  const businessId = ticket?.businessId
  const acceptLine = useAcceptServiceLine(businessId)
  const rejectLine = useRejectServiceLine(businessId)
  const startLine = useStartServiceLine(businessId)
  const completeLine = useMarkServiceLineDone(businessId)
  const [declineTarget, setDeclineTarget] = useState<WorkOrderItem | null>(null)

  const isMutating =
    startService.isPending
    || completeService.isPending
    || acceptLine.isPending
    || rejectLine.isPending
    || startLine.isPending
    || completeLine.isPending

  if (detailQuery.isPending) return <WorkOrderDetailSkeleton />

  const runAction = async (
    mutate: () => Promise<unknown>,
    successKey: string,
  ) => {
    try {
      await mutate()
      showToast(t(successKey), 'success')
      return true
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
      return false
    }
  }

  const runLineAction = (
    mutation: { mutateAsync: (vars: { orderId: string; serviceLineId: string }) => Promise<unknown> },
    line: WorkOrderItem,
    successKey: string,
  ) => {
    if (!line.id) return
    void runAction(() => mutation.mutateAsync({ orderId, serviceLineId: line.id }), successKey)
  }

  const handleConfirmCompletion = async (note: string | null) => {
    const succeeded = await runAction(
      () => completeService.mutateAsync(note),
      WORK_ORDERS_I18N.completeServiceSuccess,
    )
    if (succeeded) setIsCompleteModalOpen(false)
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
        onStart={() => void runAction(() => startService.mutateAsync(), WORK_ORDERS_I18N.startServiceSuccess)}
        onComplete={() => setIsCompleteModalOpen(true)}
        lineActions={{
          onAccept: (line) => runLineAction(acceptLine, line, `${LINE_STATUS_I18N}.acceptSuccess`),
          onDecline: (line) => setDeclineTarget(line),
          onStart: (line) => runLineAction(startLine, line, `${LINE_STATUS_I18N}.startSuccess`),
          onComplete: (line) => runLineAction(completeLine, line, WORK_ORDERS_I18N.completeServiceSuccess),
          isBusy: isMutating,
        }}
      />
      {declineTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-sm font-black text-nexoraText">
              {t(`${LINE_STATUS_I18N}.declineConfirmTitle`)}
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-nexoraMuted">
              {t(`${LINE_STATUS_I18N}.declineConfirmBody`)}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeclineTarget(null)}
                className="h-10 rounded-lg border border-nexoraBorder px-3 text-[11px] font-extrabold text-nexoraText"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  const target = declineTarget
                  setDeclineTarget(null)
                  runLineAction(rejectLine, target, `${LINE_STATUS_I18N}.declineSuccess`)
                }}
                className="h-10 rounded-lg bg-rose-500 px-3 text-[11px] font-extrabold text-white disabled:opacity-60"
              >
                {t(`${LINE_STATUS_I18N}.declineAction`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  lineActions,
}: {
  isError: boolean
  errorMessage?: string
  ticket: WorkOrderDetail | null
  isMutating: boolean
  onRetry: () => void
  onBack: () => void
  onStart: () => void
  onComplete: () => void
  lineActions: WorkOrderLineActions
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

  const todayIso = formatLocalDateIso(new Date())

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
                <span>
                  {t(WORK_ORDERS_I18N.station, {
                    number: formatWorkOrderStationValue(ticket.stationNumber),
                  })}
                </span>
              </span>
              <span className={WORK_ORDERS_LAYOUT_CLASS.metaChip}>
                <Radio className={WORK_ORDERS_LAYOUT_CLASS.ticketMetaIcon} aria-hidden="true" />
                <span>{t(WORK_ORDERS_I18N.beeper, { code: workOrderTextOrPlaceholder(ticket.beeper) })}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <WorkOrderServiceLines
        items={ticket.items}
        serviceTotal={ticket.serviceTotal}
        actions={lineActions}
      />

      {ticket.customerNotes ? (
        <aside className={WORK_ORDERS_LAYOUT_CLASS.notesCard}>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesKicker}>{t(WORK_ORDERS_I18N.notesImportant)}</p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesTitle}>{t(WORK_ORDERS_I18N.customerNotes)}</p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.notesBody}>{ticket.customerNotes}</p>
        </aside>
      ) : null}

      {ticket.canStartService ? (
        <WorkOrderPrimaryAction
          disabled={isMutating || !canStartWorkOrderNow(ticket, todayIso)}
          onClick={onStart}
          icon={<Play className={`${WORK_ORDERS_LAYOUT_CLASS.iconSm} ${WORK_ORDERS_LAYOUT_CLASS.iconFill}`} aria-hidden="true" />}
          label={t(WORK_ORDERS_I18N.startService)}
        />
      ) : null}

      {ticket.canCompleteService ? (
        <WorkOrderPrimaryAction
          disabled={isMutating}
          onClick={onComplete}
          icon={(
            <span className={WORK_ORDERS_LAYOUT_CLASS.primaryActionIcon}>
              <Check className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
            </span>
          )}
          label={t(WORK_ORDERS_I18N.completeService)}
        />
      ) : null}
    </>
  )
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
