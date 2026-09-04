import { useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS } from './constants'
import {
  WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE,
  canSubmitCustomWorkOrderService,
  clampWorkOrderPriceInput,
  isValidCustomWorkOrderService,
} from './workOrderServiceCatalog'
import WorkOrderModalFrame from './WorkOrderModalFrame'

interface WorkOrderCustomServiceModalProps {
  onConfirm: (input: { name: string; price: number }) => void
  onClose: () => void
}

export default function WorkOrderCustomServiceModal({
  onConfirm,
  onClose,
}: WorkOrderCustomServiceModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [showError, setShowError] = useState(false)

  const parsed = {
    name: name.trim(),
    price: Number(price),
  }
  const canSubmit = canSubmitCustomWorkOrderService({ name, price })

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
            type="number"
            min="0"
            max={WORK_ORDER_CUSTOM_SERVICE_MAX_PRICE}
            step="0.01"
            inputMode="decimal"
            value={price}
            placeholder={t(WORK_ORDERS_I18N.customPricePlaceholder)}
            className={WORK_ORDERS_LAYOUT_CLASS.customInput}
            onChange={(event) => {
              setPrice(clampWorkOrderPriceInput(event.target.value))
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
