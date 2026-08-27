// PosServicesView — POS > Services (US-017). Owner builds the priced services
// menu: name/price/duration (duration required for future booking per BA
// doc), multi-category + tag assignment (tags upsert into the Business's
// PosTag catalog automatically, server-side), optional description/photo, an
// Active/Inactive toggle (Inactive keeps history, just hides from
// checkout/staff assignment per BA doc State Lifecycle), and drag-and-drop
// display order.
import { useEffect, useMemo, useState } from 'react'
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
import { Edit2, GripVertical, ImageOff, Loader2, Plus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { usePosCategories } from '../../../../data/hooks/usePosCategories'
import { usePosTags } from '../../../../data/hooks/usePosTags'
import {
  useCreatePosService,
  useReorderPosServices,
  usePosServices,
  useUpdatePosService,
} from '../../../../data/hooks/usePosServices'
import type { PosServiceInput } from '../../../../data/repositories/posServices'
import type { PosServiceApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreateEditPosServiceModal from './modals/CreateEditPosServiceModal'

function toServiceInput(service: PosServiceApiDto): PosServiceInput {
  return {
    name: service.name,
    price: service.price,
    durationMinutes: service.durationMinutes,
    description: service.description ?? undefined,
    categoryIds: service.categoryIds,
    tags: service.tags,
    status: service.status,
  }
}

export default function PosServicesView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: services, isLoading } = usePosServices()
  const { data: categories } = usePosCategories()
  const { data: tags } = usePosTags()
  const createService = useCreatePosService()
  const updateService = useUpdatePosService()
  const reorderServices = useReorderPosServices()

  const [items, setItems] = useState<PosServiceApiDto[]>([])
  const [modalState, setModalState] = useState<{ open: boolean; service: PosServiceApiDto | null }>({
    open: false,
    service: null,
  })

  useEffect(() => {
    setItems(services ?? [])
  }, [services])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  )

  const handleCreateOrUpdate = async (input: PosServiceInput) => {
    try {
      if (modalState.service) {
        await updateService.mutateAsync({ serviceId: modalState.service.id, input })
        showToast(t('components.dashboard.views.pos.PosServicesView.updatedSuccess'), 'success')
      } else {
        await createService.mutateAsync(input)
        const successMessage =
          input.categoryIds.length > 0
            ? `${t('components.dashboard.views.pos.PosServicesView.createdSuccess')} ${t('components.dashboard.views.pos.PosServicesView.revisitAssignmentNudge')}`
            : t('components.dashboard.views.pos.PosServicesView.createdSuccess')
        showToast(successMessage, 'success')
      }
      setModalState({ open: false, service: null })
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleToggleStatus = async (service: PosServiceApiDto) => {
    try {
      await updateService.mutateAsync({
        serviceId: service.id,
        input: { ...toServiceInput(service), status: service.status === 'Active' ? 'Inactive' : 'Active' },
      })
      showToast(t('components.dashboard.views.pos.PosServicesView.updatedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    reorderServices.mutate(
      reordered.map((s, index) => ({ serviceId: s.id, sortOrder: index })),
      {
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosServicesView.reorderFailed'), 'error')
        },
      },
    )
  }

  const serviceIds = useMemo(() => items.map((s) => s.id), [items])

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-0.5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-nexoraText">
            {t('dashboard.menu.pos_services')}
          </h1>
          <p className="text-sm font-medium text-nexoraMuted">
            {t('components.dashboard.views.pos.PosServicesView.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalState({ open: true, service: null })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('components.dashboard.views.pos.PosServicesView.addService')}
        </button>
      </section>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosServicesView.noServices')}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={serviceIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((service) => (
                <SortableServiceRow
                  key={service.id}
                  service={service}
                  categoryNameById={categoryNameById}
                  onEdit={() => setModalState({ open: true, service })}
                  onToggleStatus={() => handleToggleStatus(service)}
                  isToggling={updateService.isPending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <CreateEditPosServiceModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, service: null })}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createService.isPending || updateService.isPending}
        categories={categories ?? []}
        tagSuggestions={tags ?? []}
        service={modalState.service}
      />
    </div>
  )
}

function SortableServiceRow({
  service,
  categoryNameById,
  onEdit,
  onToggleStatus,
  isToggling,
}: {
  service: PosServiceApiDto
  categoryNameById: Map<string, string>
  onEdit: () => void
  onToggleStatus: () => void
  isToggling: boolean
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const categoryNames = service.categoryIds.map((id) => categoryNameById.get(id)).filter(Boolean)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button
        type="button"
        aria-label={t('components.dashboard.views.pos.PosServicesView.dragHandle')}
        className="cursor-grab touch-none p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nexoraCanvas text-slate-300">
        {service.photoUrl ? (
          <img src={service.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-nexoraText">{service.name}</span>
          <span className="text-[11px] text-nexoraMuted">
            ${service.price.toFixed(2)} · {service.durationMinutes}{' '}
            {t('components.dashboard.views.pos.PosServicesView.minutesSuffix')}
          </span>
        </div>
        {(categoryNames.length > 0 || service.tags.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {categoryNames.map((name) => (
              <span
                key={name}
                className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-semibold text-nexoraText"
              >
                {name}
              </span>
            ))}
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-nexoraMuted">
        {isToggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <input
            type="checkbox"
            checked={service.status === 'Active'}
            onChange={onToggleStatus}
            className="h-4 w-4 rounded border-nexoraBorder"
          />
        )}
        {service.status === 'Active'
          ? t('components.dashboard.views.pos.PosServicesView.activeBadge')
          : t('components.dashboard.views.pos.PosServicesView.inactiveBadge')}
      </label>

      <button
        type="button"
        onClick={onEdit}
        aria-label={t('components.dashboard.views.pos.PosServicesView.editService')}
        className="shrink-0 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraBrand rounded"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
