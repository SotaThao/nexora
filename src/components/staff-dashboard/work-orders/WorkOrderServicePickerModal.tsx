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
  findWorkOrderCatalogOption,
  firstWorkOrderCatalogOptionKey,
  workOrderCatalogOptionKey,
  type WorkOrderCatalogCategory,
  type WorkOrderCatalogService,
  type WorkOrderPickerMode,
} from './workOrderServiceCatalog'
import WorkOrderModalFrame from './WorkOrderModalFrame'
import { formatWorkOrderDurationMinutes, formatWorkOrderMoney } from './workOrderTickets'

interface WorkOrderServicePickerModalProps {
  mode: WorkOrderPickerMode
  initialServiceId?: string
  categories: WorkOrderCatalogCategory[]
  isLoading?: boolean
  onConfirm: (service: WorkOrderCatalogService) => void
  onClose: () => void
}

export default function WorkOrderServicePickerModal({
  mode,
  initialServiceId = '',
  categories: catalog,
  isLoading = false,
  onConfirm,
  onClose,
}: WorkOrderServicePickerModalProps) {
  const { t } = useTranslation()
  const isEdit = mode === WORK_ORDER_PICKER_MODE.edit
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const categories = useMemo(() => filterWorkOrderCatalogCategories(query, catalog), [query, catalog])
  const activeKey = selectedKey || firstWorkOrderCatalogOptionKey(catalog, initialServiceId)
  const selected = useMemo(
    () => findWorkOrderCatalogOption(catalog, activeKey),
    [activeKey, catalog],
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
      {isEdit ? (
        <p className={WORK_ORDERS_LAYOUT_CLASS.approvalHelp}>
          {t(WORK_ORDERS_I18N.removeAddOnWarning)}
        </p>
      ) : null}

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
        <p className={WORK_ORDERS_LAYOUT_CLASS.pickerEmpty}>
          {t(pickerEmptyKey(isLoading, catalog.length, query))}
        </p>
      ) : (
        <div className={WORK_ORDERS_LAYOUT_CLASS.pickerList}>
          {categories.map((category) => (
            <section key={category.id}>
              <h3 className={WORK_ORDERS_LAYOUT_CLASS.pickerCategory}>{category.name}</h3>
              <div className={WORK_ORDERS_LAYOUT_CLASS.pickerOptions}>
                {category.services.map((service) => {
                  const optionKey = workOrderCatalogOptionKey(category.id, service.id)
                  const isSelected = optionKey === activeKey
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      aria-pressed={isSelected}
                      className={workOrderPickerOptionClass(isSelected)}
                      onClick={() => setSelectedKey(optionKey)}
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

// "No match" and "nothing to offer at all" are different answers: the second one means the owner
// has not set this technician up for any service yet, which searching harder will never fix.
function pickerEmptyKey(isLoading: boolean, catalogSize: number, query: string): string {
  if (isLoading) return WORK_ORDERS_I18N.pickerLoading
  if (catalogSize === 0) return WORK_ORDERS_I18N.pickerNoneAssignable
  return query.trim() ? WORK_ORDERS_I18N.pickerEmpty : WORK_ORDERS_I18N.pickerNoneAssignable
}
