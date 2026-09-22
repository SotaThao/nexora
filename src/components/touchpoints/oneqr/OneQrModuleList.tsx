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
import { AlertTriangle, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import ToggleSwitch from '../../ui/ToggleSwitch'
import OneQrModuleIcon from '../../oneqr/OneQrModuleIcon'
import { OneQrModuleKey } from '../../../constants/oneQr'
import type { OneQrModuleCatalogItem } from '../../../types/oneQr'
import {
  resolveModuleIcon,
  resolveModuleIconUrl,
  resolveModuleLabel,
  type DraftModule,
} from './oneQrDraft'

type ModuleListProps = {
  modules: DraftModule[]
  catalog: OneQrModuleCatalogItem[]
  onReorder: (modules: DraftModule[]) => void
  onToggle: (localId: string) => void
  onEdit: (module: DraftModule) => void
  onRemove: (localId: string) => void
  onAdd: () => void
}

export default function OneQrModuleList({
  modules,
  catalog,
  onReorder,
  onToggle,
  onEdit,
  onRemove,
  onAdd,
}: ModuleListProps) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = modules.findIndex((module) => module.localId === active.id)
    const newIndex = modules.findIndex((module) => module.localId === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorder(arrayMove(modules, oldIndex, newIndex))
  }

  return (
    <div className="space-y-3">
      {modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-nexoraBorder bg-nexoraSurfaceMuted p-6 text-center text-xs font-medium text-nexoraMuted">
          {t('oneqr.builder.modules_empty')}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((module) => module.localId)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {modules.map((module) => (
                <SortableModuleRow
                  key={module.localId}
                  module={module}
                  catalog={catalog}
                  onToggle={() => onToggle(module.localId)}
                  onEdit={() => onEdit(module)}
                  onRemove={() => onRemove(module.localId)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-nexoraBrand bg-nexoraSurface px-4 text-xs font-bold text-nexoraBrand transition hover:bg-nexoraSurfaceMuted"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {t('oneqr.builder.add_module')}
      </button>
    </div>
  )
}

function SortableModuleRow({
  module,
  catalog,
  onToggle,
  onEdit,
  onRemove,
}: {
  module: DraftModule
  catalog: OneQrModuleCatalogItem[]
  onToggle: () => void
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: module.localId })

  const label = resolveModuleLabel(module, catalog, t)
  const icon = resolveModuleIcon(module, catalog)
  const iconUrl = resolveModuleIconUrl(module)
  const isCustomLink = module.moduleKey === OneQrModuleKey.CustomLink
  // `OneQrModuleConfigDto.isComingSoon` is non-nullable and comes from the same
  // response as the catalog, so it is the whole answer. Previously this OR-ed in
  // the bundled table, which pinned the badge on for Rewards / Membership /
  // AIAssistant even after the admin cleared the flag.
  const comingSoon = module.isComingSoon
  // Each reason has a different fix and a different owner (merchant vs platform
  // admin), so name it rather than saying "unavailable".
  const unavailableText = !module.isAvailable
    ? module.unavailableReason
      ? t(`oneqr.builder.unavailable.${module.unavailableReason}`)
      : t('oneqr.builder.module_unavailable')
    : null

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-w-0 items-center gap-1.5 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-2.5 sm:gap-2 sm:p-3 ${
        isDragging ? 'z-10 shadow-nexora-card' : ''
      }`}
    >
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted active:cursor-grabbing sm:h-9 sm:w-9"
        aria-label={t('oneqr.builder.drag_handle', { module: label })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>

      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-nexoraSurfaceMuted text-nexoraBrand sm:h-9 sm:w-9">
        <OneQrModuleIcon name={icon} iconUrl={iconUrl} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-bold text-nexoraText">{label}</p>
          {comingSoon ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-nexoraWarning">
              {t('oneqr.builder.coming_soon')}
            </span>
          ) : null}
        </div>
        {isCustomLink && module.customUrl ? (
          <p className="truncate text-[11px] font-medium text-nexoraMuted">
            {module.customUrl}
          </p>
        ) : null}
        {unavailableText ? (
          <p className="mt-0.5 flex items-start gap-1 text-[11px] font-bold leading-snug text-nexoraWarning">
            <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{unavailableText}</span>
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="grid h-8 w-8 place-items-center rounded-lg text-nexoraMuted transition hover:bg-nexoraSurfaceMuted hover:text-nexoraText sm:h-9 sm:w-9"
          aria-label={t('oneqr.builder.edit_module', { module: label })}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-lg text-nexoraMuted transition hover:bg-red-50 hover:text-nexoraDanger sm:h-9 sm:w-9"
          aria-label={t('oneqr.builder.remove_module', { module: label })}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>

        <ToggleSwitch
          checked={module.isEnabled}
          onChange={onToggle}
          activeColor="bg-nexoraBrand"
          inactiveColor="bg-nexoraBorder"
          ariaLabel={t('oneqr.builder.toggle_module', { module: label })}
        />
      </div>
    </li>
  )
}
