import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderPickerOptionClass,
  workOrderPickerRadioClass,
} from './constants'
import {
  WORK_ORDER_PICKER_MODE,
  filterWorkOrderCatalogCategories,
  type WorkOrderCatalogService,
  type WorkOrderPickerMode,
} from './workOrderServiceCatalog'
import WorkOrderModalFrame from './WorkOrderModalFrame'
import { formatWorkOrderDurationMinutes, formatWorkOrderMoney } from './workOrderTickets'

interface WorkOrderServicePickerModalProps {
  mode: WorkOrderPickerMode
  initialServiceId?: string
  onConfirm: (service: WorkOrderCatalogService) => void
  onClose: () => void
}

export default function WorkOrderServicePickerModal({
  mode,
  initialServiceId = '',
  onConfirm,
  onClose,
}: WorkOrderServicePickerModalProps) {
  const { t } = useTranslation()
  const isEdit = mode === WORK_ORDER_PICKER_MODE.edit
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(initialServiceId)
  const categories = useMemo(() => filterWorkOrderCatalogCategories(query), [query])
  const selected = useMemo(
    () => categories.flatMap((category) => category.services).find((service) => service.id === selectedId),
    [categories, selectedId],
  )

  return (
    <WorkOrderModalFrame
      wide
      titleId="work-order-service-picker-title"
      title={t(isEdit ? WORK_ORDERS_I18N.pickerEditTitle : WORK_ORDERS_I18N.pickerAddTitle)}
      subtitle={t(isEdit ? WORK_ORDERS_I18N.pickerEditSubtitle : WORK_ORDERS_I18N.pickerAddSubtitle)}
      closeLabel={t(WORK_ORDERS_I18N.pickerClose)}
      onClose={onClose}
      footer={(
        <>
          <button type="button" className={WORK_ORDERS_LAYOUT_CLASS.modalCancel} onClick={onClose}>
            {t(WORK_ORDERS_I18N.cancel)}
          </button>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalConfirm}
            disabled={!selected}
            onClick={() => {
              if (selected) onConfirm(selected)
            }}
          >
            {t(isEdit ? WORK_ORDERS_I18N.pickerConfirmEdit : WORK_ORDERS_I18N.pickerConfirmAdd)}
          </button>
        </>
      )}
    >
      <label className={WORK_ORDERS_LAYOUT_CLASS.pickerSearchWrap}>
        <Search className={WORK_ORDERS_LAYOUT_CLASS.pickerSearchIcon} aria-hidden="true" />
        <input
          type="search"
          value={query}
          aria-label={t(WORK_ORDERS_I18N.pickerSearchAria)}
          placeholder={t(WORK_ORDERS_I18N.pickerSearchPlaceholder)}
          className={WORK_ORDERS_LAYOUT_CLASS.pickerSearchInput}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {categories.length === 0 ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.pickerEmpty}>{t(WORK_ORDERS_I18N.pickerEmpty)}</p>
      ) : (
        <div className={WORK_ORDERS_LAYOUT_CLASS.pickerList}>
          {categories.map((category) => (
            <section key={category.id}>
              <h3 className={WORK_ORDERS_LAYOUT_CLASS.pickerCategory}>{category.name}</h3>
              <div className={WORK_ORDERS_LAYOUT_CLASS.pickerOptions}>
                {category.services.map((service) => {
                  const isSelected = service.id === selectedId
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={isSelected}
                      className={workOrderPickerOptionClass(isSelected)}
                      onClick={() => setSelectedId(service.id)}
                    >
                      <span className={workOrderPickerRadioClass(isSelected)} aria-hidden="true" />
                      <span>
                        <span className={WORK_ORDERS_LAYOUT_CLASS.pickerOptionName}>{service.name}</span>
                        <span className={WORK_ORDERS_LAYOUT_CLASS.pickerOptionMeta}>
                          {formatWorkOrderDurationMinutes(service.durationMin, t)}
                          {` · ${category.name}`}
                        </span>
                      </span>
                      <span className={WORK_ORDERS_LAYOUT_CLASS.pickerOptionPrice}>
                        {formatWorkOrderMoney(service.price)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </WorkOrderModalFrame>
  )
}
