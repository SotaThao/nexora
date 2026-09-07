import { useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS } from './constants'
import {
  canSubmitCustomWorkOrderService,
  clampWorkOrderDurationInput,
  clampWorkOrderPriceInput,
  isValidCustomWorkOrderService,
  type WorkOrderCustomServiceInput,
} from './workOrderServiceCatalog'
import WorkOrderModalFrame from './WorkOrderModalFrame'

interface WorkOrderCustomServiceModalProps {
  onConfirm: (input: WorkOrderCustomServiceInput) => void
  onClose: () => void
}

export default function WorkOrderCustomServiceModal({
  onConfirm,
  onClose,
}: WorkOrderCustomServiceModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [showError, setShowError] = useState(false)

  const parsed: WorkOrderCustomServiceInput = {
    name: name.trim(),
    price: Number(price),
    durationMinutes: durationMinutes.trim() ? Number(durationMinutes) : 0,
  }
  const canSubmit = canSubmitCustomWorkOrderService({ name, price, durationMinutes })

  const handleConfirm = () => {
    if (!canSubmit || !isValidCustomWorkOrderService(parsed)) {
      setShowError(true)
      return
    }
    onConfirm(parsed)
  }

  return (
    <WorkOrderModalFrame
      titleId="work-order-custom-service-title"
      title={t(WORK_ORDERS_I18N.customTitle)}
      subtitle={t(WORK_ORDERS_I18N.customSubtitle)}
      closeLabel={t(WORK_ORDERS_I18N.customClose)}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.modalCancel} onClick={onClose}>
            {t(WORK_ORDERS_I18N.cancel)}
          </button>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalConfirm}
            disabled={!canSubmit}
            onClick={handleConfirm}
          >
            {t(WORK_ORDERS_I18N.customConfirm)}
          </button>
        </>
      )}
    >
      <div className={WORK_ORDERS_LAYOUT_CLASS.customFields}>
        <div className={WORK_ORDERS_LAYOUT_CLASS.customFieldFull}>
          <label htmlFor="work-order-custom-name" className={WORK_ORDERS_LAYOUT_CLASS.customLabel}>
            {t(WORK_ORDERS_I18N.customNameLabel)}
          </label>
          <input
            id="work-order-custom-name"
            type="text"
            autoComplete="off"
            maxLength={200}
            value={name}
            placeholder={t(WORK_ORDERS_I18N.customNamePlaceholder)}
            className={WORK_ORDERS_LAYOUT_CLASS.customInput}
            onChange={(event) => {
              setName(event.target.value)
              setShowError(false)
            }}
          />
        </div>
        <div>
          <label htmlFor="work-order-custom-price" className={WORK_ORDERS_LAYOUT_CLASS.customLabel}>
            {t(WORK_ORDERS_I18N.customPriceLabel)}
          </label>
          <input
            id="work-order-custom-price"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={price}
            placeholder={t(WORK_ORDERS_I18N.customPricePlaceholder)}
            className={WORK_ORDERS_LAYOUT_CLASS.customInput}
            onChange={(event) => {
              setPrice(clampWorkOrderPriceInput(event.target.value))
              setShowError(false)
            }}
          />
        </div>
        <div>
          <label htmlFor="work-order-custom-duration" className={WORK_ORDERS_LAYOUT_CLASS.customLabel}>
            {t(WORK_ORDERS_I18N.customDurationLabel)}
          </label>
          <input
            id="work-order-custom-duration"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={durationMinutes}
            placeholder={t(WORK_ORDERS_I18N.customDurationPlaceholder)}
            className={WORK_ORDERS_LAYOUT_CLASS.customInput}
            onChange={(event) => {
              setDurationMinutes(clampWorkOrderDurationInput(event.target.value))
              setShowError(false)
            }}
          />
        </div>
      </div>
      {showError ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.fieldError}>{t(WORK_ORDERS_I18N.customError)}</p>
      ) : null}
    </WorkOrderModalFrame>
  )
}
