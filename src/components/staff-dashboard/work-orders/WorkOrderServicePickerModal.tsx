import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Inbox, Search } from 'lucide-react'
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
  /** Catalog service ids already on this work order — shown with a check in their category. */
  existingServiceIds?: string[]
  categories: WorkOrderCatalogCategory[]
  isLoading?: boolean
  onConfirm: (services: WorkOrderCatalogService[]) => void
  onClose: () => void
}

export default function WorkOrderServicePickerModal({
  mode,
  initialServiceId = '',
  existingServiceIds = [],
  categories: catalog,
  isLoading = false,
  onConfirm,
  onClose,
}: WorkOrderServicePickerModalProps) {
  const { t } = useTranslation()
  const isEdit = mode === WORK_ORDER_PICKER_MODE.edit
  const [query, setQuery] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const existingIds = useMemo(() => new Set(existingServiceIds.filter(Boolean)), [existingServiceIds])
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    setOpenCategoryIds((current) => {
      const next = new Set(current)
      let changed = false
      for (const category of catalog) {
        if (category.services.some((service) => existingIds.has(service.id)) && !next.has(category.id)) {
          next.add(category.id)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [catalog, existingIds])
  const categories = useMemo(() => filterWorkOrderCatalogCategories(query, catalog), [query, catalog])
  const initialKey = firstWorkOrderCatalogOptionKey(catalog, initialServiceId)
  const activeKey = selectedKeys[0] || initialKey
  const selectedServices = useMemo(
    () => selectedKeys
      .map((key) => isEdit
        ? findWorkOrderCatalogOption(catalog, key)
        : catalog.flatMap((category) => category.services).find((service) => service.id === key))
      .filter((service): service is WorkOrderCatalogService => Boolean(service)),
    [catalog, isEdit, selectedKeys],
  )
  const selected = findWorkOrderCatalogOption(catalog, activeKey)
  const selectedCount = isEdit ? (selected ? 1 : 0) : selectedServices.length

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
            disabled={selectedCount === 0}
            onClick={() => {
              if (selectedCount > 0) onConfirm(isEdit ? [selected as WorkOrderCatalogService] : selectedServices)
            }}
          >
            {isEdit
              ? t(WORK_ORDERS_I18N.pickerConfirmEdit)
              : t(
                  pickerConfirmAddKey(selectedCount),
                  selectedCount > 0 ? { count: selectedCount } : undefined,
                )}
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
          {categories.map((category) => {
            const isOpen = Boolean(query.trim()) || openCategoryIds.has(category.id)
            const panelId = `work-order-picker-panel-${category.id}`
            return (
            <div
              key={category.id}
              className={`${WORK_ORDERS_LAYOUT_CLASS.pickerGroup} ${isOpen ? WORK_ORDERS_LAYOUT_CLASS.pickerGroupOpen : WORK_ORDERS_LAYOUT_CLASS.pickerGroupClosed}`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  if (query.trim()) return
                  setOpenCategoryIds((current) => {
                    const next = new Set(current)
                    if (next.has(category.id)) next.delete(category.id)
                    else next.add(category.id)
                    return next
                  })
                }}
                className={`${WORK_ORDERS_LAYOUT_CLASS.pickerCategoryHead} ${isOpen ? WORK_ORDERS_LAYOUT_CLASS.pickerCategoryHeadOpen : ''}`}
              >
                <span className={WORK_ORDERS_LAYOUT_CLASS.pickerCategory}>{category.name}</span>
                <span className={WORK_ORDERS_LAYOUT_CLASS.pickerCategoryCount}>{category.services.length}</span>
                <ChevronDown
                  className={`${WORK_ORDERS_LAYOUT_CLASS.pickerCategoryChevron} ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={panelId}
                role="region"
                aria-hidden={!isOpen}
                ref={(node) => setPickerPanelInert(node, isOpen)}
                className={`${WORK_ORDERS_LAYOUT_CLASS.pickerCategoryPanel} ${isOpen ? WORK_ORDERS_LAYOUT_CLASS.pickerCategoryPanelOpen : ''}`}
              >
                <div className={`${WORK_ORDERS_LAYOUT_CLASS.pickerCategoryPanelInner} ${isOpen ? WORK_ORDERS_LAYOUT_CLASS.pickerCategoryPanelInnerOpen : ''}`}>
                  {category.services.length === 0 ? (
                    <div className={WORK_ORDERS_LAYOUT_CLASS.pickerCategoryEmpty}>
                      <Inbox className={WORK_ORDERS_LAYOUT_CLASS.pickerCategoryEmptyIcon} aria-hidden="true" />
                      <span>{t(WORK_ORDERS_I18N.pickerCategoryEmpty)}</span>
                    </div>
                  ) : (
                  <div className={WORK_ORDERS_LAYOUT_CLASS.pickerOptions}>
                {category.services.map((service) => {
                  const optionKey = workOrderCatalogOptionKey(category.id, service.id)
                  const isSelected = isEdit ? optionKey === activeKey : selectedKeys.includes(service.id)
                  const isAlreadyOnTicket = existingIds.has(service.id)
                  return (
                    <button
                      key={optionKey}
                      type="button"
                      tabIndex={isOpen ? undefined : -1}
                      aria-pressed={isSelected}
                      className={workOrderPickerOptionClass(isSelected)}
                      onClick={() => {
                        if (!isOpen) return
                        if (isEdit) {
                          setSelectedKeys([optionKey])
                        } else {
                          setSelectedKeys((current) => current.includes(service.id)
                            ? current.filter((key) => key !== service.id)
                            : [...current, service.id])
                        }
                      }}
                    >
                      <span
                        className={isEdit
                          ? workOrderPickerRadioClass(isSelected)
                          : `${WORK_ORDERS_LAYOUT_CLASS.pickerCheckbox} ${isSelected ? WORK_ORDERS_LAYOUT_CLASS.pickerCheckboxSelected : ''}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={WORK_ORDERS_LAYOUT_CLASS.pickerOptionNameRow}>
                          <span className={WORK_ORDERS_LAYOUT_CLASS.pickerOptionName}>{service.name}</span>
                          {isAlreadyOnTicket ? (
                            <span
                              className={WORK_ORDERS_LAYOUT_CLASS.pickerAlreadyOnTicket}
                              title={t(WORK_ORDERS_I18N.pickerAlreadyOnTicket)}
                            >
                              <Check className="h-3 w-3" aria-hidden="true" />
                              {t(WORK_ORDERS_I18N.pickerAlreadyOnTicket)}
                            </span>
                          ) : null}
                        </span>
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
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </WorkOrderModalFrame>
  )
}

// "No match" vs "the salon menu itself is empty". Empty category groups still count as a
// catalog, so this only fires when there is nothing to group at all.
function pickerEmptyKey(isLoading: boolean, catalogSize: number, query: string): string {
  if (isLoading) return WORK_ORDERS_I18N.pickerLoading
  if (catalogSize === 0) return WORK_ORDERS_I18N.pickerNoneAssignable
  return query.trim() ? WORK_ORDERS_I18N.pickerEmpty : WORK_ORDERS_I18N.pickerNoneAssignable
}

function pickerConfirmAddKey(selectedCount: number): string {
  if (selectedCount <= 0) return WORK_ORDERS_I18N.pickerConfirmAdd
  if (selectedCount === 1) return WORK_ORDERS_I18N.pickerConfirmAddCountOne
  return WORK_ORDERS_I18N.pickerConfirmAddCount
}

function setPickerPanelInert(node: HTMLDivElement | null, isOpen: boolean) {
  if (!node) return
  if (isOpen) node.removeAttribute('inert')
  else node.setAttribute('inert', '')
}
