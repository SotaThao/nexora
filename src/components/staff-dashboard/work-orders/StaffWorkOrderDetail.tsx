import { useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, CheckCircle2, ChevronLeft, NotebookPen, Play } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { PosOrderItemStatus } from '../../../constants/posOrderItemStatus'
import { PosOrderStatus } from '../../../constants/posOrderStatus'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey, getErrorMessage } from '../../../data/errorCodes'
import {
    useAcceptServiceLine,
    useMarkServiceLineDone,
    useRejectServiceLine,
    useStartServiceLine,
} from '../../../data/hooks/usePosOrders'
import {
    useCompleteStaffWorkOrderService,
    useSaveMyWorkOrderServiceLines,
    useStaffWorkOrderDetail,
    useStaffWorkOrderServiceCatalog,
    useStartStaffWorkOrderService,
} from '../../../data/hooks/useStaffWorkOrders'
import { qk } from '../../../data/queryKeys'
import { getApiErrorCode } from '../../../types/domain'
import { formatDateIsoInTimeZone } from '../../../utils/localDate'
import WorkOrderCompleteServiceModal from './WorkOrderCompleteServiceModal'
import WorkOrderCustomServiceModal from './WorkOrderCustomServiceModal'
import WorkOrderCustomerApproval from './WorkOrderCustomerApproval'
import { WorkOrderErrorCard } from './WorkOrderQueryFeedback'
import WorkOrderServiceLines, {
    type LineStatusActionKind,
    type WorkOrderLineActions,
} from './WorkOrderServiceLines'
import WorkOrderServicePickerModal from './WorkOrderServicePickerModal'
import { WorkOrderDetailSkeleton } from './WorkOrderSkeletons'
import {
    WORK_ORDER_STATUS_BADGE_VARIANT,
    WORK_ORDER_STATUS_I18N,
    WORK_ORDER_TOAST_TYPE,
    WORK_ORDERS_I18N,
    WORK_ORDERS_LAYOUT_CLASS,
    workOrderStatusClass,
    type WorkOrderDetail,
} from './constants'
import {
    addWorkOrderCatalogService,
    addWorkOrderCustomService,
    applyWorkOrderAssignedLinesStarted,
    applyWorkOrderLineStatus,
    applyWorkOrderStartedLinesCompleted,
    buildWorkOrderCatalogCategories,
    canEditWorkOrderServices,
    removeWorkOrderServiceLine,
    replaceWorkOrderCatalogService,
    toSaveWorkOrderServiceLinesPayload,
    toWorkOrderEditableLines,
    WORK_ORDER_PICKER_MODE,
    WORK_ORDER_SERVICE_APPROVAL,
    WORK_ORDER_TICKET_FOOTER_ACTION,
    workOrderCallerWorkDone,
    workOrderEditableServiceTotal,
    workOrderPendingServiceLines,
    workOrderRemovedServiceLines,
    workOrderTicketFooterAction,
    type WorkOrderCatalogService,
    type WorkOrderEditableLine,
    type WorkOrderPickerMode,
} from './workOrderServiceCatalog'
import {
    canStartWorkOrderNow,
    formatWorkOrderNumber,
    isWorkOrderCompletedStatus,
    workOrderCompletionNoteText,
    workOrderCustomerInitials,
    workOrderTextOrPlaceholder,
} from './workOrderTickets'

interface StaffWorkOrderDetailProps {
  orderId: string
  /** Salon IANA zone — the appointment day is the salon's calendar day, not the device's. */
  timeZone?: string | null
  onBack: () => void
}

const LINE_STATUS_I18N = 'components.dashboard.views.pos.serviceLineStatus'

function lineStatusAfterAction(kind: LineStatusActionKind): PosOrderItemStatus {
  if (kind === 'accept') return PosOrderItemStatus.Assigned
  if (kind === 'start') return PosOrderItemStatus.Started
  if (kind === 'complete') return PosOrderItemStatus.Completed
  return PosOrderItemStatus.Unassigned
}

export default function StaffWorkOrderDetail({ orderId, timeZone, onBack }: StaffWorkOrderDetailProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const detailQuery = useStaffWorkOrderDetail(orderId)
  const startService = useStartStaffWorkOrderService(orderId)
  const completeService = useCompleteStaffWorkOrderService(orderId)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [lines, setLines] = useState<WorkOrderEditableLine[]>([])
  const [seededOrderId, setSeededOrderId] = useState('')
  const [seededStamp, setSeededStamp] = useState('')
  const [picker, setPicker] = useState<{ mode: WorkOrderPickerMode; lineKey?: string } | null>(null)
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [approvalError, setApprovalError] = useState<string | null>(null)
  const [completedSession, setCompletedSession] = useState<{ orderId: string; note: string | null } | null>(null)
  const ticket = detailQuery.data ?? null
  const saveServiceLines = useSaveMyWorkOrderServiceLines(orderId)
  const catalogQuery = useStaffWorkOrderServiceCatalog(picker ? orderId : undefined)
  const catalogCategories = useMemo(
    () => buildWorkOrderCatalogCategories(
      catalogQuery.data ?? [],
      t(WORK_ORDERS_I18N.pickerUncategorized),
    ),
    [catalogQuery.data, t],
  )

  // Line-level actions live on the merchant endpoints: the same handler serves the front desk and
  // the technician, and decides which of the two is calling. Hence businessId from the ticket.
  const businessId = ticket?.businessId
  const acceptLine = useAcceptServiceLine(businessId)
  const rejectLine = useRejectServiceLine(businessId)
  const startLine = useStartServiceLine(businessId)
  const completeLine = useMarkServiceLineDone(businessId)
  const queryClient = useQueryClient()
  const [declineTarget, setDeclineTarget] = useState<WorkOrderEditableLine | null>(null)

  // Which line's button is mid-flight, so the spinner stays on that button instead of putting the
  // whole ticket into a pending state. The ref covers the gap before React re-renders.
  const [pendingLineAction, setPendingLineAction] =
    useState<{ lineId: string; kind: LineStatusActionKind } | null>(null)
  const lineActionLockRef = useRef(false)

  const isMutating =
    saveServiceLines.isPending
    || startService.isPending
    || completeService.isPending
    || acceptLine.isPending
    || rejectLine.isPending
    || startLine.isPending
    || completeLine.isPending

  if (detailQuery.isPending) return <WorkOrderDetailSkeleton />

  const ticketStamp = ticket
    ? `${ticket.status}:${ticket.items.map((item) => `${item.id}:${item.lineStatus}`).join(',')}`
    : ''
  const hasPendingLineEdits = lines.some((line) => (
    Boolean(line.pendingRemoval) || line.approval === WORK_ORDER_SERVICE_APPROVAL.pending
  ))

  if (ticket && seededOrderId !== ticket.id) {
    setSeededOrderId(ticket.id)
    setSeededStamp(ticketStamp)
    setLines(toWorkOrderEditableLines(ticket.items))
    setApprovalError(null)
  } else if (ticket && seededStamp !== ticketStamp && !hasPendingLineEdits) {
    // After ticket/line start-complete, refetch must redraw badges even when the order id is unchanged.
    setSeededStamp(ticketStamp)
    setLines(toWorkOrderEditableLines(ticket.items))
  }

  const displayStatus = ticket?.status
  const localCompletionNote = completedSession?.orderId === orderId
    ? completedSession.note
    : null

  const refreshWorkOrder = async () => {
    await queryClient.invalidateQueries({ queryKey: qk.staffWorkOrdersRoot() })
    await queryClient.invalidateQueries({ queryKey: qk.staffPosPendingAcceptanceCount() })
  }

  const runAction = async (
    mutate: () => Promise<unknown>,
    successKey: string,
  ) => {
    try {
      await mutate()
      showToast(t(successKey), WORK_ORDER_TOAST_TYPE.success)
      return true
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), WORK_ORDER_TOAST_TYPE.error)
      return false
    }
  }

  // Same treatment as the front desk's ticket detail: success is silent (the line's own badge
  // changes, and a technician taps these once per service), only the pressed button shows a
  // spinner, and failures still raise a toast.
  const runLineAction = (
    mutation: { mutateAsync: (vars: { orderId: string; serviceLineId: string }) => Promise<unknown> },
    line: WorkOrderEditableLine,
    kind: LineStatusActionKind,
  ) => {
    if (!line.id) return
    if (isMutating || lineActionLockRef.current) return

    const serviceLineId = line.id
    lineActionLockRef.current = true
    setPendingLineAction({ lineId: serviceLineId, kind })

    void mutation
      .mutateAsync({ orderId, serviceLineId })
      .then(async () => {
        setLines((current) => applyWorkOrderLineStatus(
          current,
          serviceLineId,
          lineStatusAfterAction(kind),
        ))
        // The line-action hooks live on the merchant side and only invalidate merchant keys, so
        // without this the technician's own screen keeps showing the status they just changed.
        // The badge in the shell is derived from the same change, hence the count key too.
        await refreshWorkOrder()
      })
      .catch((err) => {
        showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
      })
      .finally(() => {
        lineActionLockRef.current = false
        setPendingLineAction(null)
      })
  }

  // One request for the whole basket, with the customer's digits attached: the server decides
  // whether they match, and answers with the ticket as it now stands.
  const handleApproveChanges = (customerPhoneLast4: string) => {
    setApprovalError(null)
    saveServiceLines.mutate(
      { customerPhoneLast4, lines: toSaveWorkOrderServiceLinesPayload(lines) },
      {
        // Silent on success, like the line-status actions: the ticket redraws from the saved
        // response, so a popup would only add a dismiss step between the technician and the chair.
        onSuccess: (saved) => {
          if (saved) setLines(toWorkOrderEditableLines(saved.items))
        },
        onError: (err) => setApprovalError(getErrorMessage(err, t)),
      },
    )
  }

  const handleDiscardChanges = () => {
    setLines(ticket ? toWorkOrderEditableLines(ticket.items) : [])
    setApprovalError(null)
  }
  
  const handleStartTicket = async () => {
    const succeeded = await runAction(
      () => startService.mutateAsync(),
      WORK_ORDERS_I18N.startServiceSuccess,
    )
    if (!succeeded) return
    setLines((current) => applyWorkOrderAssignedLinesStarted(current))
    await refreshWorkOrder()
  }

  const handleConfirmCompletion = async (note: string | null) => {
    const succeeded = await runAction(
      () => completeService.mutateAsync(note),
      WORK_ORDERS_I18N.completeServiceSuccess,
    )
    if (!succeeded) return
    const nextLines = applyWorkOrderStartedLinesCompleted(lines)
    setLines(nextLines)
    setCompletedSession({ orderId, note })
    setIsCompleteModalOpen(false)
    // Keep the open detail in sync before/while the list+detail refetch lands. The order status is
    // deliberately untouched: only the front desk checkout closes a ticket.
    queryClient.setQueryData(
      qk.staffWorkOrderDetail(orderId),
      (current: WorkOrderDetail | null | undefined) => (
        current
          ? {
              ...current,
              canStartService: false,
              canCompleteService: false,
              completionNote: note ?? current.completionNote,
              items: current.items.map((item) => (
                item.isAddOn || item.isMine === false || item.lineStatus !== PosOrderItemStatus.Started
                  ? item
                  : {
                      ...item,
                      lineStatus: PosOrderItemStatus.Completed,
                      completedAt: item.completedAt ?? new Date().toISOString(),
                    }
              )),
            }
          : current
      ),
    )
    await refreshWorkOrder()
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
        timeZone={timeZone}
        displayStatus={displayStatus}
        localCompletionNote={localCompletionNote}
        lines={lines}
        isMutating={isMutating}
        onRetry={() => void detailQuery.refetch()}
        onBack={onBack}
        onStart={() => void handleStartTicket()}
        onComplete={() => setIsCompleteModalOpen(true)}
        onAddService={() => setPicker({ mode: WORK_ORDER_PICKER_MODE.add })}
        onAddCustomService={() => setIsCustomOpen(true)}
        onChangeService={(key) => setPicker({ mode: WORK_ORDER_PICKER_MODE.edit, lineKey: key })}
        onRemoveService={(key) => {
          setLines((current) => removeWorkOrderServiceLine(current, key))
          setApprovalError(null)
        }}
        isSaving={saveServiceLines.isPending}
        approvalError={approvalError}
        onApprovePending={handleApproveChanges}
        onCancelPending={handleDiscardChanges}
        lineActions={{
          onAccept: (line) => runLineAction(acceptLine, line, 'accept'),
          onDecline: (line) => setDeclineTarget(line),
          onStart: (line) => runLineAction(startLine, line, 'start'),
          onComplete: (line) => runLineAction(completeLine, line, 'complete'),
          isBusy: isMutating,
          pendingLineId: pendingLineAction?.lineId ?? null,
          pendingKind: pendingLineAction?.kind ?? null,
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
                  runLineAction(rejectLine, target, 'decline')
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
      {picker ? (
        <WorkOrderServicePickerModal
          mode={picker.mode}
          categories={catalogCategories}
          isLoading={catalogQuery.isPending}
          initialServiceId={
            picker.lineKey
              ? lines.find((line) => line.key === picker.lineKey)?.posServiceId ?? ''
              : ''
          }
          onConfirm={(services: WorkOrderCatalogService[]) => {
            setApprovalError(null)
            setLines((current) => {
              if (picker.mode === WORK_ORDER_PICKER_MODE.edit && picker.lineKey) {
                return replaceWorkOrderCatalogService(current, picker.lineKey, services[0])
              }
              return services.reduce(addWorkOrderCatalogService, current)
            })
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
      {isCustomOpen ? (
        <WorkOrderCustomServiceModal
          onConfirm={(input) => {
            setApprovalError(null)
            setLines((current) => addWorkOrderCustomService(current, input))
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
  timeZone,
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
  onRemoveService,
  isSaving,
  approvalError,
  onApprovePending,
  onCancelPending,
  lineActions,
}: {
  isError: boolean
  errorMessage?: string
  ticket: WorkOrderDetail | null
  timeZone?: string | null
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
  onRemoveService: (key: string) => void
  isSaving: boolean
  approvalError: string | null
  onApprovePending: (customerPhoneLast4: string) => void
  onCancelPending: () => void
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
  // Reached from a notification the technician may be tapping days later: the ticket can be gone,
  // or still there with their line handed to someone else. Both are answered here rather than by
  // vetting every row in the bell, which cannot be right at the moment of the tap anyway.
  if (!ticket) {
    return (
      <div className={WORK_ORDERS_LAYOUT_CLASS.paddedBlock}>
        <WorkOrderErrorCard
          message={t(WORK_ORDERS_I18N.detailUnavailable)}
          actionLabel={t(WORK_ORDERS_I18N.back)}
          onAction={onBack}
        />
      </div>
    )
  }
  if (ticket.items.every((item) => !item.isMine)) {
    return (
      <div className={WORK_ORDERS_LAYOUT_CLASS.paddedBlock}>
        <WorkOrderErrorCard
          message={t(WORK_ORDERS_I18N.notAssignedToYou)}
          actionLabel={t(WORK_ORDERS_I18N.back)}
          onAction={onBack}
        />
      </div>
    )
  }

  const todayIso = formatDateIsoInTimeZone(new Date(), timeZone)
  const status = displayStatus ?? ticket.status
  const isCompleted = isWorkOrderCompletedStatus(status)
  // The ticket stays In Service until the front desk checks out, so the technician's wrap-up view
  // follows their own service lines rather than the order status.
  const isCallerWorkDone = isCompleted || workOrderCallerWorkDone(lines)
  const canEdit = canEditWorkOrderServices(status)
  const pendingServices = workOrderPendingServiceLines(lines)
  const removedLines = workOrderRemovedServiceLines(lines)
  const customerNotes = ticket.customerNotes?.trim() ?? ''
  const notesCard = customerNotes ? (
    <aside className={WORK_ORDERS_LAYOUT_CLASS.notesCard}>
      <NotebookPen className={WORK_ORDERS_LAYOUT_CLASS.notesIcon} aria-hidden="true" />
      <span>
        <span className={WORK_ORDERS_LAYOUT_CLASS.notesKicker}>{t(WORK_ORDERS_I18N.notesImportant)}</span>
        <strong className={WORK_ORDERS_LAYOUT_CLASS.notesTitle}>{t(WORK_ORDERS_I18N.customerNotes)}</strong>
        {customerNotes}
      </span>
    </aside>
  ) : null
  const completedNotes = isCallerWorkDone ? (
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
  const footerAction = isCallerWorkDone ? null : workOrderTicketFooterAction(lines)
  const showStart = footerAction === WORK_ORDER_TICKET_FOOTER_ACTION.start
  const showComplete = footerAction === WORK_ORDER_TICKET_FOOTER_ACTION.complete
  const actions = (
    <div className={WORK_ORDERS_LAYOUT_CLASS.detailActions}>
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
          icon={<CheckCircle2 className={WORK_ORDERS_LAYOUT_CLASS.primaryActionGlyph} aria-hidden="true" />}
          label={t(WORK_ORDERS_I18N.completeService)}
        />
      ) : null}
    </div>
  )

  return (
    <>
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailBody}>
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
        onRemoveService={onRemoveService}
        actions={lineActions}
      />

      {!isCompleted && (pendingServices.length > 0 || removedLines.length > 0) ? (
        <WorkOrderCustomerApproval
          services={pendingServices}
          removedServices={removedLines}
          isSaving={isSaving}
          errorMessage={approvalError}
          onApprove={onApprovePending}
          onCancel={onCancelPending}
        />
      ) : null}

      {isCallerWorkDone ? completedNotes : actions}
      {notesCard}
      </div>
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
      <div className={WORK_ORDERS_LAYOUT_CLASS.detailHeadMain}>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.detailBack}
          aria-label={t(WORK_ORDERS_I18N.back)}
          onClick={onBack}
        >
          <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.detailBackIcon} aria-hidden="true" />
        </button>
        <div className={WORK_ORDERS_LAYOUT_CLASS.detailTitleWrap}>
          <h2 className={WORK_ORDERS_LAYOUT_CLASS.detailTitle}>
            {t(WORK_ORDERS_I18N.detailTitle)}
          </h2>
          <p className={WORK_ORDERS_LAYOUT_CLASS.detailCode}>
            {formatWorkOrderNumber(orderNumber)}
          </p>
        </div>
      </div>
      {status ? (
        <span className={workOrderStatusClass(status, WORK_ORDER_STATUS_BADGE_VARIANT.detail)}>
          {t(WORK_ORDER_STATUS_I18N[status])}
        </span>
      ) : null}
    </div>
  )
}
