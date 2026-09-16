import type { ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, GripVertical } from 'lucide-react'
import {
  CheckCircleFillIcon,
  FolderTreeIcon,
  PlusLgIcon,
  XLgIcon,
} from '../BookingHubIcons'
import '../booking-hub.css'

export interface ServicesPricingAdapter<TSection> {
  getId: (section: TSection) => string
  getName: (section: TSection) => string
  getCount: (section: TSection) => number
}

export interface ServicesPricingController {
  isOpen: (sectionId: string) => boolean
  onToggleSection: (sectionId: string) => void
  onAddService: (sectionId: string | null) => void
  onManageCategories: () => void
  isBusy?: boolean
}

export interface ServicesPricingLabels {
  manageCategories: string
  addService: string
  empty: string
  emptyAction: string
  formatCount: (count: number) => string
}

interface ServicesPricingPanelProps<TSection> {
  sections: readonly TSection[]
  adapter: ServicesPricingAdapter<TSection>
  controller: ServicesPricingController
  labels: ServicesPricingLabels
  toolbarActions?: ReactNode
  renderSection: (section: TSection) => ReactNode
}

interface ServicesPricingSortableListProps<TItem> {
  items: readonly TItem[]
  getId: (item: TItem) => string
  onReorder: (items: TItem[]) => void | Promise<void>
  dragHandleLabel: string
  disabled?: boolean
  renderItem: (item: TItem, dragHandle: ReactNode) => ReactNode
}

export interface ServicesPricingServiceSectionLabels {
  service: string
  price: string
  duration: string
  status?: string
  approval?: string
  empty: string
}

export interface ServicesPricingCategoryAdapter<TCategory> {
  getKey: (category: TCategory, index: number) => string
  getId: (category: TCategory) => string | null
  getName: (category: TCategory) => string
  getCount: (category: TCategory) => number
  isSystem: (category: TCategory) => boolean
  isNew: (category: TCategory) => boolean
}

export interface ServicesPricingCategoryController<TCategory> {
  onClose: () => void
  onAdd: () => void
  onNameChange: (index: number, name: string) => void
  onDelete: (index: number) => void | Promise<void>
  onSave: () => void | Promise<void>
  onReorder: (categories: TCategory[]) => void
  isBusy?: boolean
}

export interface ServicesPricingCategoryLabels {
  title: string
  subtitle: string
  categories: string
  categoriesSubtitle: string
  addCategory: string
  close: string
  cancel: string
  save: string
  empty: string
  namePlaceholder: string
  nameAriaLabel: string
  deleteAriaLabel: string
  dragHandle: string
  formatCount: (count: number) => string
}

interface ServicesPricingCategoryManagerProps<TCategory> {
  open: boolean
  categories: readonly TCategory[]
  adapter: ServicesPricingCategoryAdapter<TCategory>
  controller: ServicesPricingCategoryController<TCategory>
  labels: ServicesPricingCategoryLabels
  error?: string
  errorIndex?: number | null
}

/**
 * Shared Services & Pricing presentation. Each product supplies an adapter for
 * its API model and a controller for its own mutations/state transitions.
 */
export default function ServicesPricingPanel<TSection>({
  sections,
  adapter,
  controller,
  labels,
  toolbarActions,
  renderSection,
}: ServicesPricingPanelProps<TSection>) {
  return (
    <div className="booking-hub-view services-pricing-panel">
      <div className="settings-actions settings-service-actions">
        <button
          className="booking-secondary-button settings-category-manager-open"
          type="button"
          onClick={controller.onManageCategories}
          disabled={controller.isBusy}
        >
          <FolderTreeIcon />
          {labels.manageCategories}
        </button>
        {toolbarActions}
      </div>

      <div className="settings-service-list settings-service-body">
        {sections.length === 0 ? (
          <div className="settings-service-catalog-state">
            <p>{labels.empty}</p>
            <button
              className="booking-primary-button"
              type="button"
              onClick={() => controller.onAddService(null)}
              disabled={controller.isBusy}
            >
              <PlusLgIcon />
              {labels.emptyAction}
            </button>
          </div>
        ) : (
          sections.map((section) => {
            const sectionId = adapter.getId(section)
            const sectionName = adapter.getName(section)
            const isOpen = controller.isOpen(sectionId)
            const panelId = `services-pricing-panel-${sectionId}`

            return (
              <div
                key={sectionId}
                className={`settings-service-category${isOpen ? ' is-open' : ''}`}
              >
                <div className="settings-service-category-head">
                  <button
                    type="button"
                    className="settings-service-category-toggle"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => controller.onToggleSection(sectionId)}
                  >
                    <span className="settings-service-category-name">{sectionName}</span>
                    <span className="settings-service-category-count">
                      {labels.formatCount(adapter.getCount(section))}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="settings-service-category-add"
                    disabled={controller.isBusy}
                    onClick={() => controller.onAddService(sectionId)}
                  >
                    <PlusLgIcon />
                    {labels.addService}
                  </button>
                  <button
                    type="button"
                    className="settings-service-category-chevron-btn"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={sectionName}
                    onClick={() => controller.onToggleSection(sectionId)}
                  >
                    <ChevronDown className="settings-service-category-chevron" aria-hidden="true" />
                  </button>
                </div>
                <div
                  className="settings-service-category-panel"
                  id={panelId}
                  role="region"
                  aria-hidden={!isOpen}
                >
                  <div className="settings-service-category-panel-inner">
                    {renderSection(section)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function ServicesPricingSortableList<TItem>({
  items,
  getId,
  onReorder,
  dragHandleLabel,
  disabled = false,
  renderItem,
}: ServicesPricingSortableListProps<TItem>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = items.map(getId)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (disabled || !over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    void onReorder(arrayMove([...items], oldIndex, newIndex))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableServiceItem
            key={getId(item)}
            id={getId(item)}
            disabled={disabled}
            dragHandleLabel={dragHandleLabel}
            render={(dragHandle) => renderItem(item, dragHandle)}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}

export function ServicesPricingServiceSection<TItem>({
  items,
  getId,
  onReorder,
  dragHandleLabel,
  labels,
  renderItem,
  extensionRows,
  disabled = false,
}: ServicesPricingSortableListProps<TItem> & {
  labels: ServicesPricingServiceSectionLabels
  extensionRows?: ReactNode
}) {
  return (
    <div
      className={`settings-service-category-body${labels.status ? ' has-status-column' : ''}${labels.approval ? ' has-approval-column' : ''}`}
    >
      <div className="settings-service-header" aria-hidden="true">
        <span />
        <span />
        <span>{labels.service}</span>
        <span>{labels.price}</span>
        <span>{labels.duration}</span>
        {labels.status ? <span>{labels.status}</span> : null}
        {labels.approval ? (
          <span className="settings-service-header-approval">{labels.approval}</span>
        ) : null}
        <span />
      </div>
      {items.length === 0 && !extensionRows ? (
        <div className="settings-category-empty">{labels.empty}</div>
      ) : (
        <>
          {items.length > 0 ? (
            <ServicesPricingSortableList
              items={items}
              getId={getId}
              onReorder={onReorder}
              dragHandleLabel={dragHandleLabel}
              disabled={disabled}
              renderItem={renderItem}
            />
          ) : null}
          {extensionRows}
        </>
      )}
    </div>
  )
}

function SortableServiceItem({
  id,
  disabled,
  dragHandleLabel,
  render,
}: {
  id: string
  disabled: boolean
  dragHandleLabel: string
  render: (dragHandle: ReactNode) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled })

  return (
    <div
      ref={setNodeRef}
      className={`settings-service-sort-item${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {render(
        <button
          ref={setActivatorNodeRef}
          type="button"
          className="settings-service-drag-handle"
          aria-label={dragHandleLabel}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" />
        </button>,
      )}
    </div>
  )
}

export function ServicesPricingCategoryManager<TCategory>({
  open,
  categories,
  adapter,
  controller,
  labels,
  error,
  errorIndex,
}: ServicesPricingCategoryManagerProps<TCategory>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const keys = categories.map(adapter.getKey)

  if (!open) return null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (controller.isBusy || !over || active.id === over.id) return
    const oldIndex = keys.indexOf(String(active.id))
    const newIndex = keys.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    controller.onReorder(arrayMove([...categories], oldIndex, newIndex))
  }

  return (
    <div className="booking-hub-view settings-service-modal" role="presentation">
      <div
        className="settings-service-dialog settings-category-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-services-category-modal-title"
      >
        <div className="settings-service-modal-head">
          <div>
            <div className="settings-service-modal-title" id="shared-services-category-modal-title">
              {labels.title}
            </div>
            <div className="settings-service-modal-sub">{labels.subtitle}</div>
          </div>
          <button
            className="settings-service-modal-close"
            type="button"
            aria-label={labels.close}
            onClick={controller.onClose}
          >
            <XLgIcon />
          </button>
        </div>

        <div className="settings-service-modal-body settings-category-modal-body">
          <div className="settings-category-manager">
            <div className="settings-category-manager-head">
              <div>
                <div className="settings-category-manager-title">
                  <FolderTreeIcon className="settings-category-manager-icon" />
                  {labels.categories}
                </div>
                <div className="settings-category-manager-sub">{labels.categoriesSubtitle}</div>
              </div>
              <button
                className="settings-category-manager-add"
                type="button"
                disabled={controller.isBusy}
                onClick={controller.onAdd}
              >
                <PlusLgIcon className="settings-category-manager-add-icon" />
                {labels.addCategory}
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="settings-category-empty">{labels.empty}</div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={keys} strategy={verticalListSortingStrategy}>
                  <div className="settings-category-list">
                    {categories.map((category, index) => (
                      <SortableCategoryRow
                        key={adapter.getKey(category, index)}
                        itemKey={adapter.getKey(category, index)}
                        category={category}
                        index={index}
                        adapter={adapter}
                        controller={controller}
                        labels={labels}
                        invalid={errorIndex === index}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          {error ? <div className="settings-service-modal-error" role="alert">{error}</div> : null}
        </div>

        <div className="settings-service-modal-actions">
          <button
            className="booking-secondary-button"
            type="button"
            disabled={controller.isBusy}
            onClick={controller.onClose}
          >
            {labels.cancel}
          </button>
          <button
            className="booking-primary-button"
            type="button"
            disabled={controller.isBusy}
            onClick={() => void controller.onSave()}
          >
            <CheckCircleFillIcon className="settings-action-icon" />
            {labels.save}
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableCategoryRow<TCategory>({
  itemKey,
  category,
  index,
  adapter,
  controller,
  labels,
  invalid,
}: {
  itemKey: string
  category: TCategory
  index: number
  adapter: ServicesPricingCategoryAdapter<TCategory>
  controller: ServicesPricingCategoryController<TCategory>
  labels: ServicesPricingCategoryLabels
  invalid: boolean
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: itemKey, disabled: controller.isBusy })
  const isSystem = adapter.isSystem(category)
  const isNew = adapter.isNew(category)

  return (
    <div
      ref={setNodeRef}
      className={`settings-category-row${isNew ? ' is-new' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="settings-category-row-main">
        <button
          ref={setActivatorNodeRef}
          className="settings-category-drag-handle"
          type="button"
          aria-label={labels.dragHandle}
          disabled={controller.isBusy}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="settings-category-row-icon" aria-hidden="true" />
        </button>
        <div className="settings-category-row-label">
          <input
            className="settings-category-name-input"
            type="text"
            value={adapter.getName(category)}
            disabled={isSystem || controller.isBusy}
            autoFocus={isNew}
            placeholder={isNew ? labels.namePlaceholder : undefined}
            aria-label={labels.nameAriaLabel}
            aria-invalid={invalid ? 'true' : undefined}
            onChange={(event) => controller.onNameChange(index, event.target.value)}
          />
          {!isNew ? (
            <span className="settings-category-count" title={labels.formatCount(adapter.getCount(category))}>
              {labels.formatCount(adapter.getCount(category))}
            </span>
          ) : null}
        </div>
      </div>
      <div className="settings-category-row-actions">
        {!isSystem ? (
          <button
            className="settings-category-row-action is-danger"
            type="button"
            aria-label={labels.deleteAriaLabel}
            disabled={controller.isBusy}
            onClick={() => void controller.onDelete(index)}
          >
            <XLgIcon className="settings-row-remove-icon" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
