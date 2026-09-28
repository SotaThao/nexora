import { useEffect, useState } from 'react'
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
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  GripVertical,
  Link2,
  Plus,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import ToggleSwitch from '../../ui/ToggleSwitch'
import OneQrModuleIcon, {
  ONEQR_ICON_CHOICES,
} from '../../oneqr/OneQrModuleIcon'
import {
  OneQrModuleKey,
  ONEQR_FIELD_LIMITS,
  isValidOneQrCustomUrl,
} from '../../../constants/oneQr'
import type { OneQrModuleCatalogItem } from '../../../types/oneQr'
import {
  resolveModuleIcon,
  resolveModuleLabel,
  type DraftModule,
} from './oneQrDraft'

type ModuleListProps = {
  modules: DraftModule[]
  catalog: OneQrModuleCatalogItem[]
  onReorder: (modules: DraftModule[]) => void
  onToggle: (localId: string) => void
  onUpdate: (
    localId: string,
    fields: Partial<Pick<DraftModule, 'customLabel' | 'customIcon' | 'customUrl'>>,
  ) => void
  onRemove: (localId: string) => void
  onAdd: () => void
  onAddCustomLink: (url: string) => void
}

export default function OneQrModuleList({
  modules,
  catalog,
  onReorder,
  onToggle,
  onUpdate,
  onRemove,
  onAdd,
  onAddCustomLink,
}: ModuleListProps) {
  const { t } = useTranslation()
  const [quickUrl, setQuickUrl] = useState('')
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
      <form
        className="space-y-1"
        onSubmit={(event) => {
          event.preventDefault()
          if (!isValidOneQrCustomUrl(quickUrl)) return
          onAddCustomLink(quickUrl.trim())
          setQuickUrl('')
        }}
      >
        <div className="grid min-h-10 grid-cols-1 gap-1.5 rounded-lg border border-nexoraLavender bg-nexoraSurface p-1 shadow-sm focus-within:border-nexoraBrand focus-within:ring-2 focus-within:ring-nexoraBrand/10 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-1.5 px-1.5 sm:px-0 sm:pl-1.5">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden />
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              value={quickUrl}
              maxLength={ONEQR_FIELD_LIMITS.customUrl}
              onChange={(event) => setQuickUrl(event.target.value)}
              aria-label={t('oneqr.builder.quick_link_aria')}
              placeholder={t('oneqr.builder.quick_link_placeholder')}
              className="h-8 min-w-0 flex-1 bg-transparent text-xs text-nexoraText outline-none placeholder:text-nexoraMuted"
            />
          </div>
          <button
            type="submit"
            disabled={!isValidOneQrCustomUrl(quickUrl)}
            className="inline-flex h-8 w-full shrink-0 items-center justify-center rounded-md bg-nexoraBrand px-3 text-[11px] font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {t('oneqr.builder.quick_link_add')}
          </button>
        </div>
        <p className="px-1 text-[10px] font-medium text-nexoraMuted">
          {t('oneqr.builder.quick_link_hint')}
        </p>
      </form>

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
                  onUpdate={(fields) => onUpdate(module.localId, fields)}
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
  onUpdate,
  onRemove,
}: {
  module: DraftModule
  catalog: OneQrModuleCatalogItem[]
  onToggle: () => void
  onUpdate: (
    fields: Partial<Pick<DraftModule, 'customLabel' | 'customIcon' | 'customUrl'>>,
  ) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const [showIcons, setShowIcons] = useState(false)
  const [urlValue, setUrlValue] = useState(module.customUrl ?? '')
  const [urlTouched, setUrlTouched] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: module.localId })

  const label = resolveModuleLabel(module, catalog, t)
  const icon = resolveModuleIcon(module, catalog)
  const isCustomLink = module.moduleKey === OneQrModuleKey.CustomLink
  const readOnlyUrl = module.resolvedUrl ?? module.urlTemplate
  const isUrlValid = !isCustomLink || isValidOneQrCustomUrl(urlValue)

  useEffect(() => {
    setUrlValue(module.customUrl ?? '')
  }, [module.customUrl])
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
      className={`relative flex min-w-0 flex-col gap-2 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-2 sm:grid sm:grid-cols-[36px_68px_minmax(0,1fr)_auto] sm:items-start sm:gap-2 sm:p-3 ${
        isDragging ? 'z-10 shadow-nexora-card' : ''
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2 sm:contents">
        <div className="flex items-start gap-1 sm:contents">
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted active:cursor-grabbing sm:col-start-1 sm:row-start-1 sm:h-9 sm:w-9"
            aria-label={t('oneqr.builder.drag_handle', { module: label })}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>

          <div className="flex w-[64px] shrink-0 flex-col items-center gap-0.5 sm:col-start-2 sm:row-start-1 sm:w-[68px] sm:gap-1">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-nexoraSurfaceMuted text-nexoraBrand sm:h-9 sm:w-9">
              <OneQrModuleIcon name={icon} />
            </span>
            <button
              type="button"
              onClick={() => setShowIcons(true)}
              className="w-full rounded-md border border-nexoraBorder bg-nexoraSurface px-1 py-0.5 text-[10px] font-bold leading-none text-nexoraMuted transition hover:border-nexoraLavender hover:text-nexoraBrand sm:leading-tight"
            >
              {t('oneqr.builder.change_icon_action')}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-1.5 sm:col-start-4 sm:row-start-1 sm:gap-2.5">
          <ToggleSwitch
            checked={module.isEnabled}
            onChange={onToggle}
            activeColor="bg-nexoraBrand"
            inactiveColor="bg-nexoraBorder"
            ariaLabel={t('oneqr.builder.toggle_module', { module: label })}
          />
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-nexoraBorder bg-nexoraSurface px-2 py-0.5 text-[10px] font-bold leading-tight text-nexoraMuted transition-colors hover:border-nexoraDanger hover:bg-red-50 hover:text-nexoraDanger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraDanger/20"
            aria-label={t('oneqr.builder.remove_module', { module: label })}
          >
            {t('oneqr.builder.remove_action')}
          </button>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-1.5 sm:col-span-1 sm:col-start-3 sm:row-start-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <input
            type="text"
            value={module.customLabel ?? label}
            maxLength={ONEQR_FIELD_LIMITS.customLabel}
            onChange={(event) =>
              onUpdate({ customLabel: event.target.value.trimStart() || null })
            }
            aria-label={t('oneqr.builder.tile_label_aria', { module: label })}
            className="h-8 min-w-0 flex-1 rounded-lg border border-nexoraBorder bg-nexoraSurface px-2.5 text-sm font-bold text-nexoraText outline-none transition focus:border-nexoraBrand"
          />
          {comingSoon ? (
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-nexoraWarning">
              {t('oneqr.builder.coming_soon')}
            </span>
          ) : null}
        </div>
        {isCustomLink ? (
          <div>
            <div className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-2.5 focus-within:border-nexoraBrand">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-nexoraMuted" aria-hidden />
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={urlValue}
                maxLength={ONEQR_FIELD_LIMITS.customUrl}
                onChange={(event) => {
                  const value = event.target.value
                  setUrlValue(value)
                  if (isValidOneQrCustomUrl(value)) {
                    onUpdate({ customUrl: value.trim() })
                  }
                }}
                onBlur={() => setUrlTouched(true)}
                aria-label={t('oneqr.builder.custom_url_label')}
                className="min-w-0 flex-1 bg-transparent text-xs text-nexoraText outline-none"
              />
              <ModuleLinkActions
                url={isUrlValid ? urlValue.trim() : ''}
                copyLabel={t('oneqr.builder.copy_link')}
                openLabel={t('oneqr.builder.open_link')}
              />
            </div>
            {urlTouched && !isUrlValid ? (
              <p className="mt-1 text-[11px] font-bold text-nexoraDanger">
                {t('oneqr.builder.custom_url_invalid')}
              </p>
            ) : null}
          </div>
        ) : readOnlyUrl ? (
          <div
            aria-label={t('oneqr.builder.custom_url_label')}
            className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2.5 text-nexoraMuted"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-xs" title={readOnlyUrl}>
              {readOnlyUrl}
            </span>
            <ModuleLinkActions
              url={readOnlyUrl}
              copyLabel={t('oneqr.builder.copy_link')}
              openLabel={t('oneqr.builder.open_link')}
            />
          </div>
        ) : null}
        {unavailableText ? (
          <p className="mt-0.5 flex items-start gap-1 text-[11px] font-bold leading-snug text-nexoraWarning">
            <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
            <span className="min-w-0 break-words">{unavailableText}</span>
          </p>
        ) : null}
      </div>

      {showIcons ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`oneqr-icon-picker-${module.localId}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowIcons(false)
          }}
        >
          <div className="nexora-modal-card max-w-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3
                id={`oneqr-icon-picker-${module.localId}`}
                className="text-base font-black text-nexoraText"
              >
                {t('oneqr.builder.choose_icon_title')}
              </h3>
              <button
                type="button"
                onClick={() => setShowIcons(false)}
                aria-label={t('common.close')}
                className="grid h-9 w-9 place-items-center rounded-lg text-nexoraMuted transition hover:bg-nexoraSurfaceMuted"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="grid max-h-[60vh] grid-cols-6 gap-2 overflow-y-auto p-1 sm:grid-cols-8">
              <button
                type="button"
                onClick={() => {
                  onUpdate({ customIcon: null })
                  setShowIcons(false)
                }}
                aria-label={t('oneqr.builder.icon_default')}
                aria-pressed={module.customIcon === null}
                className={`grid h-10 place-items-center rounded-lg border px-1 text-[9px] font-bold transition ${
                  module.customIcon === null
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                }`}
              >
                {t('oneqr.builder.icon_default')}
              </button>

              {ONEQR_ICON_CHOICES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onUpdate({ customIcon: name })
                    setShowIcons(false)
                  }}
                  aria-label={name}
                  aria-pressed={icon === name}
                  className={`grid h-10 place-items-center rounded-lg border transition ${
                    icon === name
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText'
                  }`}
                >
                  <OneQrModuleIcon name={name} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </li>
  )
}

function ModuleLinkActions({
  url,
  copyLabel,
  openLabel,
}: {
  url: string
  copyLabel: string
  openLabel: string
}) {
  const isDisabled = !url

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (!url || !navigator.clipboard?.writeText) return
          void navigator.clipboard.writeText(url).catch(() => undefined)
        }}
        aria-label={copyLabel}
        title={copyLabel}
        className="grid h-7 w-7 place-items-center rounded-md text-nexoraMuted transition hover:bg-nexoraSurface hover:text-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden />
      </button>
      <a
        href={url || undefined}
        target="_blank"
        rel="noreferrer"
        aria-label={openLabel}
        title={openLabel}
        aria-disabled={isDisabled}
        className={`grid h-7 w-7 place-items-center rounded-md text-nexoraMuted transition hover:bg-nexoraSurface hover:text-nexoraBrand ${
          isDisabled ? 'pointer-events-none opacity-40' : ''
        }`}
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </span>
  )
}
