import { useState } from 'react'
import { Clock3, Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS } from './constants'
import {
  WORK_ORDER_APPROVAL_CODE_LENGTH,
  parseWorkOrderLast4,
  type WorkOrderEditableLine,
} from './workOrderServiceCatalog'
import { formatWorkOrderMoney, workOrderTextOrPlaceholder } from './workOrderTickets'

const VERIFICATION_DIGITS = 4

interface WorkOrderCustomerApprovalProps {
  services: WorkOrderEditableLine[]
  removedServices: WorkOrderEditableLine[]
  isSaving: boolean
  errorMessage?: string | null
  onApprove: (customerPhoneLast4: string) => void
  onCancel: () => void
}

export default function WorkOrderCustomerApproval({
  services,
  removedServices,
  isSaving,
  errorMessage,
  onApprove,
  onCancel,
}: WorkOrderCustomerApprovalProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const canApprove = code.length === WORK_ORDER_APPROVAL_CODE_LENGTH

  if (services.length === 0 && removedServices.length === 0) return null

  return (
    <section className={WORK_ORDERS_LAYOUT_CLASS.approvalCard}>
      <div className={WORK_ORDERS_LAYOUT_CLASS.approvalHead}>
        <strong className={WORK_ORDERS_LAYOUT_CLASS.approvalTitle}>
          <Clock3 className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
          {t(WORK_ORDERS_I18N.approvalTitle)}
        </strong>
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.approvalCancel}
          disabled={isSaving}
          onClick={onCancel}
        >
          {t(WORK_ORDERS_I18N.approvalCancel)}
        </button>
      </div>
      <p className={WORK_ORDERS_LAYOUT_CLASS.approvalCopy}>{t(WORK_ORDERS_I18N.approvalCopy)}</p>
      <div className={WORK_ORDERS_LAYOUT_CLASS.approvalServices}>
        {services.map((service) => (
          <span key={service.key} className={WORK_ORDERS_LAYOUT_CLASS.approvalChip}>
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {workOrderTextOrPlaceholder(service.serviceName)}
            </span>
            <span>{formatWorkOrderMoney(service.unitPrice)}</span>
          </span>
        ))}
        {removedServices.map((service) => (
          <span key={service.key} className={WORK_ORDERS_LAYOUT_CLASS.approvalChip}>
            <span className={WORK_ORDERS_LAYOUT_CLASS.truncate}>
              {`${t(WORK_ORDERS_I18N.approvalRemovedLabel)} · ${workOrderTextOrPlaceholder(service.serviceName)}`}
            </span>
            <span>{formatWorkOrderMoney(service.unitPrice)}</span>
          </span>
        ))}
      </div>
      <p className={WORK_ORDERS_LAYOUT_CLASS.approvalHelp}>{t(WORK_ORDERS_I18N.approvalHelp)}</p>
      <div className={WORK_ORDERS_LAYOUT_CLASS.approvalForm}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={VERIFICATION_DIGITS}
          value={code}
          disabled={isSaving}
          aria-label={t(WORK_ORDERS_I18N.approvalCodeAria)}
          placeholder={t(WORK_ORDERS_I18N.approvalCodePlaceholder)}
          className={WORK_ORDERS_LAYOUT_CLASS.approvalInput}
          onChange={(event) => setCode(parseWorkOrderLast4(event.target.value))}
        />
        {/* The digits are checked by the server against the phone captured at check-in — this
            screen never sees the number, so it can only refuse an obviously incomplete code. */}
        <button
          type="button"
          className={WORK_ORDERS_LAYOUT_CLASS.approvalSubmit}
          disabled={isSaving || code.length !== VERIFICATION_DIGITS}
          onClick={() => onApprove(code)}
        >
          {isSaving ? (
            <Loader2 className={`${WORK_ORDERS_LAYOUT_CLASS.iconSm} animate-spin`} aria-hidden="true" />
          ) : (
            <ShieldCheck className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
          )}
          {t(isSaving ? WORK_ORDERS_I18N.approvalSaving : WORK_ORDERS_I18N.approvalSubmit)}
        </button>
      </div>
      {errorMessage ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.fieldError}>{errorMessage}</p>
      ) : null}
    </section>
  )
}
