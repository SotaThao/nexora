// CategoryManageSheet — Tablet / Mobile Sheet to manage, rename, reorder & delete categories.
import { useState, type FormEvent } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
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
import { Check, Edit2, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import {
  useCreatePosCategory,
  useDeletePosCategory,
  useReorderPosCategories,
  useUpdatePosCategory,
} from '../../../../../data/hooks/usePosCategories'
import type { PosCategoryApiDto } from '../../../../../types/repositories'
import IconButton from '../../../../ui/IconButton'

export default function CategoryManageSheet({
  open,
  onClose,
  categories,
  onCategoriesChange,
}: {
  open: boolean
  onClose: () => void
  categories: PosCategoryApiDto[]
  onCategoriesChange?: () => void
}) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const createCategory = useCreatePosCategory()
  const updateCategory = useUpdatePosCategory()
  const deleteCategory = useDeletePosCategory()
  const reorderCategories = useReorderPosCategories()

  const [isAdding, setIsAdding] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  if (!open) return null

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(categories, oldIndex, newIndex)
    reorderCategories.mutate(
      reordered.map((c, index) => ({ categoryId: c.id, sortOrder: index })),
      {
        onSuccess: () => onCategoriesChange?.(),
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosCategoriesView.reorderFailed'), 'error')
        },
      },
    )
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newCatName.trim()
    if (!trimmed) return
    try {
      await createCategory.mutateAsync(trimmed)
      setNewCatName('')
      setIsAdding(false)
      onCategoriesChange?.()
      showToast('Đã thêm danh mục mới!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleUpdate = async (categoryId: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    try {
      await updateCategory.mutateAsync({ categoryId, name: trimmed })
      setEditingId(null)
      onCategoriesChange?.()
      showToast('Đã cập nhật danh mục!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDelete = async (cat: PosCategoryApiDto) => {
    const confirmed = await showConfirm(
      `Bạn có chắc muốn xóa danh mục "${cat.name}" không?`,
      'Xác nhận xóa danh mục',
    )
    if (!confirmed) return
    try {
      await deleteCategory.mutateAsync(cat.id)
      onCategoriesChange?.()
      showToast('Đã xóa danh mục thành công!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-nexoraBorder pb-3">
          <div>
            <h2 className="text-base font-bold text-nexoraText">Quản lý Danh mục (Categories)</h2>
            <p className="text-xs text-nexoraMuted">Kéo thả để sắp xếp thứ tự hoặc đổi tên, xóa danh mục</p>
          </div>
          <IconButton label="Đóng" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="my-3 flex items-center justify-between">
          <span className="text-xs font-bold text-nexoraMuted">Tổng số: {categories.length} danh mục</span>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-nexoraBrand px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-nexoraBrandDark transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm mới</span>
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreate} className="mb-3 flex items-center gap-2 rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/20 p-2.5">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Tên danh mục mới..."
              className="flex-1 rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-xs font-medium text-nexoraText outline-none focus:border-nexoraBrand"
              autoFocus
            />
            <button
              type="submit"
              disabled={createCategory.isPending || !newCatName.trim()}
              className="rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg px-2.5 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted"
            >
              Hủy
            </button>
          </form>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {categories.map((cat) => (
                <SortableSheetCategoryRow
                  key={cat.id}
                  category={cat}
                  isEditing={editingId === cat.id}
                  editingName={editingName}
                  onStartEdit={() => {
                    setEditingId(cat.id)
                    setEditingName(cat.name)
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={() => handleUpdate(cat.id)}
                  onEditingNameChange={setEditingName}
                  onDelete={() => handleDelete(cat)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="mt-4 border-t border-nexoraBorder pt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-nexoraSurfaceMuted px-5 py-2.5 text-xs font-bold text-nexoraText hover:bg-slate-200 transition"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  )
}

function SortableSheetCategoryRow({
  category,
  isEditing,
  editingName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditingNameChange,
  onDelete,
}: {
  category: PosCategoryApiDto
  isEditing: boolean
  editingName: string
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditingNameChange: (val: string) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 rounded-xl border border-nexoraBrand bg-white p-2.5 shadow-sm"
      >
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          className="flex-1 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText outline-none focus:border-nexoraBrand"
          autoFocus
        />
        <button
          type="button"
          onClick={onSaveEdit}
          className="rounded-lg p-2 text-nexoraSuccess hover:bg-emerald-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded-lg p-2 text-nexoraSubtle hover:bg-nexoraSurfaceMuted min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-xl border border-nexoraBorder bg-white px-3.5 py-3 text-xs transition shadow-sm ${
        isDragging ? 'opacity-40 shadow-lg border-nexoraBrand' : ''
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-nexoraSubtle hover:text-nexoraText rounded-lg touch-none min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Kéo thả để sắp xếp"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="font-bold text-nexoraText truncate">{category.name}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onStartEdit}
          className="p-2 rounded-lg text-nexoraSubtle hover:bg-nexoraSurfaceMuted hover:text-nexoraText min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Sửa tên"
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-lg text-nexoraSubtle hover:bg-rose-50 hover:text-nexoraDanger min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Xóa danh mục"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
