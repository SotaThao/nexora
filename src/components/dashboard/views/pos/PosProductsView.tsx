// PosProductsView — POS > Products (US-018). Owner builds the retail product
// catalog: name/price, multi-category + tag assignment (tags upsert into the
// same shared Business PosTag catalog used by Services, server-side),
// optional description/photo, an Active/Inactive toggle (Inactive keeps
// history per BA doc State Lifecycle), and drag-and-drop display order.
// No duration and no inventory/stock tracking — out of scope per BA doc.
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
  useCreatePosProduct,
  useReorderPosProducts,
  usePosProducts,
  useUpdatePosProduct,
} from '../../../../data/hooks/usePosProducts'
import type { PosProductInput } from '../../../../data/repositories/posProducts'
import type { PosProductApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreateEditPosProductModal from './modals/CreateEditPosProductModal'

function toProductInput(product: PosProductApiDto): PosProductInput {
  return {
    name: product.name,
    price: product.price,
    description: product.description ?? undefined,
    categoryIds: product.categoryIds,
    tags: product.tags,
    status: product.status,
  }
}

export default function PosProductsView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: products, isLoading } = usePosProducts()
  const { data: categories } = usePosCategories()
  const { data: tags } = usePosTags()
  const createProduct = useCreatePosProduct()
  const updateProduct = useUpdatePosProduct()
  const reorderProducts = useReorderPosProducts()

  const [items, setItems] = useState<PosProductApiDto[]>([])
  const [modalState, setModalState] = useState<{ open: boolean; product: PosProductApiDto | null }>({
    open: false,
    product: null,
  })

  useEffect(() => {
    setItems(products ?? [])
  }, [products])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const categoryNameById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  )

  const handleCreateOrUpdate = async (input: PosProductInput) => {
    try {
      if (modalState.product) {
        await updateProduct.mutateAsync({ productId: modalState.product.id, input })
        showToast(t('components.dashboard.views.pos.PosProductsView.updatedSuccess'), 'success')
      } else {
        await createProduct.mutateAsync(input)
        showToast(t('components.dashboard.views.pos.PosProductsView.createdSuccess'), 'success')
      }
      setModalState({ open: false, product: null })
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleToggleStatus = async (product: PosProductApiDto) => {
    try {
      await updateProduct.mutateAsync({
        productId: product.id,
        input: { ...toProductInput(product), status: product.status === 'Active' ? 'Inactive' : 'Active' },
      })
      showToast(t('components.dashboard.views.pos.PosProductsView.updatedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((p) => p.id === active.id)
    const newIndex = items.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    reorderProducts.mutate(
      reordered.map((p, index) => ({ productId: p.id, sortOrder: index })),
      {
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosProductsView.reorderFailed'), 'error')
        },
      },
    )
  }

  const productIds = useMemo(() => items.map((p) => p.id), [items])

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-0.5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-nexoraText">
            {t('dashboard.menu.pos_products')}
          </h1>
          <p className="text-sm font-medium text-nexoraMuted">
            {t('components.dashboard.views.pos.PosProductsView.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalState({ open: true, product: null })}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('components.dashboard.views.pos.PosProductsView.addProduct')}
        </button>
      </section>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosProductsView.noProducts')}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((product) => (
                <SortableProductRow
                  key={product.id}
                  product={product}
                  categoryNameById={categoryNameById}
                  onEdit={() => setModalState({ open: true, product })}
                  onToggleStatus={() => handleToggleStatus(product)}
                  isToggling={updateProduct.isPending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <CreateEditPosProductModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, product: null })}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createProduct.isPending || updateProduct.isPending}
        categories={categories ?? []}
        tagSuggestions={tags ?? []}
        product={modalState.product}
      />
    </div>
  )
}

function SortableProductRow({
  product,
  categoryNameById,
  onEdit,
  onToggleStatus,
  isToggling,
}: {
  product: PosProductApiDto
  categoryNameById: Map<string, string>
  onEdit: () => void
  onToggleStatus: () => void
  isToggling: boolean
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const categoryNames = product.categoryIds.map((id) => categoryNameById.get(id)).filter(Boolean)

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
        aria-label={t('components.dashboard.views.pos.PosProductsView.dragHandle')}
        className="cursor-grab touch-none p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nexoraCanvas text-slate-300">
        {product.photoUrl ? (
          <img src={product.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-nexoraText">{product.name}</span>
          <span className="text-[11px] text-nexoraMuted">${product.price.toFixed(2)}</span>
        </div>
        {(categoryNames.length > 0 || product.tags.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {categoryNames.map((name) => (
              <span
                key={name}
                className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-semibold text-nexoraText"
              >
                {name}
              </span>
            ))}
            {product.tags.map((tag) => (
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
            checked={product.status === 'Active'}
            onChange={onToggleStatus}
            className="h-4 w-4 rounded border-nexoraBorder"
          />
        )}
        {product.status === 'Active'
          ? t('components.dashboard.views.pos.PosProductsView.activeBadge')
          : t('components.dashboard.views.pos.PosProductsView.inactiveBadge')}
      </label>

      <button
        type="button"
        onClick={onEdit}
        aria-label={t('components.dashboard.views.pos.PosProductsView.editProduct')}
        className="shrink-0 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraBrand rounded"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
    </li>
  )
}
