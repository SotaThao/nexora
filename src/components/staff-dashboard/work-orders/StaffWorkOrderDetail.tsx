import { useState, type ReactNode } from 'react'
import { BadgeCheck, Check, ChevronLeft, LayoutGrid, Play, Radio } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCompleteStaffWorkOrderService,
  useStaffWorkOrderDetail,
  useStartStaffWorkOrderService,
} from '../../../data/hooks/useStaffWorkOrders'
import { getApiErrorCode } from '../../../types/domain'
import { PosOrderStatus } from '../../../constants/posOrderStatus'
import {
  WORK_ORDER_STATUS_BADGE_VARIANT,
  WORK_ORDER_STATUS_I18N,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderStatusClass,
  type WorkOrderDetail,
} from './constants'
import WorkOrderCompleteServiceModal from './WorkOrderCompleteServiceModal'
import WorkOrderCustomServiceModal from './WorkOrderCustomServiceModal'
import WorkOrderCustomerApproval from './WorkOrderCustomerApproval'
import WorkOrderServiceLines from './WorkOrderServiceLines'
import WorkOrderServicePickerModal from './WorkOrderServicePickerModal'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import { WorkOrderDetailSkeleton } from './WorkOrderSkeletons'
import {
  WORK_ORDER_PICKER_MODE,
  WORK_ORDER_SERVICE_APPROVAL,
  addWorkOrderCatalogService,
  addWorkOrderCustomService,
  canEditWorkOrderServices,
  matchWorkOrderCatalogServiceByName,
  replaceWorkOrderCatalogService,
  setWorkOrderPendingApproval,
  toWorkOrderEditableLines,
  workOrderEditableServiceTotal,
  workOrderPendingServiceLines,
  type WorkOrderCatalogService,
  type WorkOrderEditableLine,
  type WorkOrderPickerMode,
} from './workOrderServiceCatalog'
import {
  canStartWorkOrderNow,
  formatWorkOrderNumber,
  formatWorkOrderStationValue,
  isWorkOrderCompletedStatus,
  workOrderCompletionNoteText,
  workOrderCustomerInitials,
  workOrderTextOrPlaceholder,
} from './workOrderTickets'
import { formatLocalDateIso } from '../../../utils/localDate'

interface StaffWorkOrderDetailProps {
  orderId: string
  onBack: () => void
}

export default function StaffWorkOrderDetail({ orderId, onBack }: StaffWorkOrderDetailProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const detailQuery = useStaffWorkOrderDetail(orderId)
  const startService = useStartStaffWorkOrderService(orderId)
  const completeService = useCompleteStaffWorkOrderService(orderId)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [lines, setLines] = useState<WorkOrderEditableLine[]>([])
  const [seededOrderId, setSeededOrderId] = useState('')
  const [picker, setPicker] = useState<{ mode: WorkOrderPickerMode; lineKey?: string } | null>(null)
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [completedSession, setCompletedSession] = useState<{ orderId: string; note: string | null } | null>(null)
  const ticket = detailQuery.data ?? null
  const isMutating = startService.isPending || completeService.isPending
  const displayStatus = ticket && (
    isWorkOrderCompletedStatus(ticket.status) || completedSession?.orderId === ticket.id
  )
    ? PosOrderStatus.Completed
    : ticket?.status
  const localCompletionNote = completedSession && ticket && completedSession.orderId === ticket.id
    ? completedSession.note
    : undefined

  if (ticket && ticket.id !== seededOrderId) {
    setSeededOrderId(ticket.id)
    setLines(toWorkOrderEditableLines(ticket.items))
  }

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

  const handleConfirmCompletion = async (note: string | null) => {
    const succeeded = await runAction(
      () => completeService.mutateAsync(note),
      WORK_ORDERS_I18N.completeServiceSuccess,
    )
    if (succeeded) {
      setCompletedSession({ orderId, note })
      setIsCompleteModalOpen(false)
    }
  }

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailPage}>
      <WorkOrderDetailHeader
        onBack={onBack}
        orderNumber={ticket?.orderNumber}
        status={displayStatus}
      />
      <WorkOrderDetailBody
        isError={detailQuery.isError}
        errorMessage={detailQuery.isError ? t(getErrorI18nKey(getApiErrorCode(detailQuery.error))) : undefined}
        ticket={ticket}
        displayStatus={displayStatus}
        localCompletionNote={localCompletionNote}
        lines={lines}
        isMutating={isMutating}
        onRetry={() => void detailQuery.refetch()}
        onBack={onBack}
        onStart={() => void runAction(() => startService.mutateAsync(), WORK_ORDERS_I18N.startServiceSuccess)}
        onComplete={() => setIsCompleteModalOpen(true)}
        onAddService={() => setPicker({ mode: WORK_ORDER_PICKER_MODE.add })}
        onAddCustomService={() => setIsCustomOpen(true)}
        onChangeService={(lineKey) => setPicker({ mode: WORK_ORDER_PICKER_MODE.edit, lineKey })}
        onApprovePending={() => {
          setLines((current) => setWorkOrderPendingApproval(current, WORK_ORDER_SERVICE_APPROVAL.approved))
          showToast(t(WORK_ORDERS_I18N.toastApproved), 'success')
        }}
        onCancelPending={() => {
          setLines((current) => setWorkOrderPendingApproval(current, WORK_ORDER_SERVICE_APPROVAL.rejected))
          showToast(t(WORK_ORDERS_I18N.toastCancelled), 'success')
        }}
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
      {picker ? (
        <WorkOrderServicePickerModal
          mode={picker.mode}
          initialServiceId={
            picker.lineKey
              ? matchWorkOrderCatalogServiceByName(
                  lines.find((line) => line.key === picker.lineKey)?.serviceName ?? '',
                )?.id
              : ''
          }
          onConfirm={(service: WorkOrderCatalogService) => {
            setLines((current) => (
              picker.mode === WORK_ORDER_PICKER_MODE.edit && picker.lineKey
                ? replaceWorkOrderCatalogService(current, picker.lineKey, service)
                : addWorkOrderCatalogService(current, service)
            ))
            showToast(
              t(picker.mode === WORK_ORDER_PICKER_MODE.edit
                ? WORK_ORDERS_I18N.toastChangeService
                : WORK_ORDERS_I18N.toastAddService),
              'success',
            )
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {isCustomOpen ? (
        <WorkOrderCustomServiceModal
          onConfirm={(input) => {
            setLines((current) => addWorkOrderCustomService(current, input))
            showToast(t(WORK_ORDERS_I18N.toastCustomService), 'success')
            setIsCustomOpen(false)
          }}
          onClose={() => setIsCustomOpen(false)}
        />
      ) : null}
    </div>
  )
}

function WorkOrderDetailBody({
  isError,
  errorMessage,
  ticket,
  displayStatus,
  localCompletionNote,
  lines,
  isMutating,
  onRetry,
  onBack,
  onStart,
  onComplete,
  onAddService,
  onAddCustomService,
  onChangeService,
  onApprovePending,
  onCancelPending,
}: {
  isError: boolean
  errorMessage?: string
  ticket: WorkOrderDetail | null
  displayStatus?: PosOrderStatus
  localCompletionNote?: string | null
  lines: WorkOrderEditableLine[]
  isMutating: boolean
  onRetry: () => void
  onBack: () => void
  onStart: () => void
  onComplete: () => void
  onAddService: () => void
  onAddCustomService: () => void
  onChangeService: (key: string) => void
  onApprovePending: () => void
  onCancelPending: () => void
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
  const status = displayStatus ?? ticket.status
  const isCompleted = isWorkOrderCompletedStatus(status)
  const canEdit = canEditWorkOrderServices(status)
  const pendingServices = workOrderPendingServiceLines(lines)
  const notesCard = ticket.customerNotes ? (
    <aside className={WORK_ORDERS_LAYOUT_CLASS.notesCard}>
      <p className={WORK_ORDERS_LAYOUT_CLASS.notesKicker}>{t(WORK_ORDERS_I18N.notesImportant)}</p>
      <p className={WORK_ORDERS_LAYOUT_CLASS.notesTitle}>{t(WORK_ORDERS_I18N.customerNotes)}</p>
      <p className={WORK_ORDERS_LAYOUT_CLASS.notesBody}>{ticket.customerNotes}</p>
    </aside>
  ) : null
  const completedNotes = isCompleted ? (
    <aside className={WORK_ORDERS_LAYOUT_CLASS.completedNote}>
      <strong className={WORK_ORDERS_LAYOUT_CLASS.completedNoteTitle}>
        <BadgeCheck className={WORK_ORDERS_LAYOUT_CLASS.completedNoteIcon} aria-hidden="true" />
        {t(WORK_ORDERS_I18N.completedNotesTitle)}
      </strong>
      <p className={WORK_ORDERS_LAYOUT_CLASS.completedNoteBody}>
        {workOrderCompletionNoteText(
          ticket,
          t(WORK_ORDERS_I18N.completedNotesFallback),
          localCompletionNote,
        )}
      </p>
    </aside>
  ) : null
  const showStart = !isCompleted && ticket.canStartService
  const showComplete = !isCompleted && ticket.status === PosOrderStatus.InService && ticket.canCompleteService
  const actions = (
    <>
      {showStart ? (
        <WorkOrderPrimaryAction
          disabled={isMutating || !canStartWorkOrderNow(ticket, todayIso)}
          onClick={onStart}
          icon={<Play className={`${WORK_ORDERS_LAYOUT_CLASS.iconSm} ${WORK_ORDERS_LAYOUT_CLASS.iconFill}`} aria-hidden="true" />}
          label={t(WORK_ORDERS_I18N.startService)}
        />
      ) : null}
      {showComplete ? (
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
        items={lines}
        serviceTotal={workOrderEditableServiceTotal(lines)}
        canEdit={canEdit}
        onAddService={onAddService}
        onAddCustomService={onAddCustomService}
        onChangeService={onChangeService}
      />

      {isCompleted ? null : (
        <WorkOrderCustomerApproval
          services={pendingServices}
          onApprove={onApprovePending}
          onCancel={onCancelPending}
        />
      )}

      {isCompleted ? (
        <>
          {completedNotes}
          {notesCard}
        </>
      ) : status === PosOrderStatus.InService ? (
        <>
          {notesCard}
          {actions}
        </>
      ) : (
        <>
          {actions}
          {notesCard}
        </>
      )}
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
