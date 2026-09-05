import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
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

export type EditedModuleFields = {
  customLabel: string | null
  customIcon: string | null
  customUrl: string | null
}

export default function EditOneQrModuleModal({
  module,
  catalog,
  onSave,
  onClose,
}: {
  module: DraftModule
  catalog: OneQrModuleCatalogItem[]
  onSave: (fields: EditedModuleFields) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [label, setLabel] = useState(module.customLabel ?? '')
  const [icon, setIcon] = useState(module.customIcon ?? '')
  const [url, setUrl] = useState(module.customUrl ?? '')
  const [urlTouched, setUrlTouched] = useState(false)

  const isCustomLink = module.moduleKey === OneQrModuleKey.CustomLink
  const isUrlValid = !isCustomLink || isValidOneQrCustomUrl(url)
  // Drop only the merchant's override so the placeholder shows what the tile
  // falls back to — the registry's own default still applies.
  const defaultLabel = resolveModuleLabel(
    { ...module, customLabel: null },
    catalog,
    t,
  )
  const previewIcon = icon || resolveModuleIcon({ ...module, customIcon: null }, catalog)

  const handleSubmit = () => {
    setUrlTouched(true)
    if (!isUrlValid) return
    onSave({
      // Empty means "fall back to the registry default", not "blank label".
      customLabel: label.trim() || null,
      customIcon: icon.trim() || null,
      customUrl: isCustomLink ? url.trim() : null,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oneqr-edit-module-title"
    >
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3
            id="oneqr-edit-module-title"
            className="min-w-0 text-base font-black text-nexoraText"
          >
            {t('oneqr.builder.edit_module_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-nexoraMuted transition hover:bg-nexoraSurfaceMuted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="-mx-1 flex-1 space-y-4 overflow-y-auto px-1">
          <div>
            <label
              htmlFor="oneqr-module-label"
              className="mb-1 block text-xs font-bold text-nexoraText"
            >
              {t('oneqr.builder.label_label')}
            </label>
            <input
              id="oneqr-module-label"
              type="text"
              value={label}
              maxLength={ONEQR_FIELD_LIMITS.customLabel}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={defaultLabel}
              className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none transition focus:border-nexoraBrand"
            />
            <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
              {t('oneqr.builder.label_hint')}
            </p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-bold text-nexoraText">
              {t('oneqr.builder.icon_label')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setIcon('')}
                aria-pressed={icon === ''}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[10px] font-bold transition ${
                  icon === ''
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                }`}
              >
                {t('oneqr.builder.icon_default')}
              </button>
              {ONEQR_ICON_CHOICES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  aria-pressed={icon === name}
                  aria-label={name}
                  className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                    icon === name
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                  }`}
                >
                  <OneQrModuleIcon name={name} />
                </button>
              ))}
            </div>
          </div>

          {isCustomLink ? (
            <div>
              <label
                htmlFor="oneqr-module-url"
                className="mb-1 block text-xs font-bold text-nexoraText"
              >
                {t('oneqr.builder.custom_url_label')}
              </label>
              <input
                id="oneqr-module-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                maxLength={ONEQR_FIELD_LIMITS.customUrl}
                onChange={(event) => setUrl(event.target.value)}
                onBlur={() => setUrlTouched(true)}
                placeholder={t('oneqr.builder.custom_url_placeholder')}
                className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none transition focus:border-nexoraBrand"
              />
              {urlTouched && !isUrlValid ? (
                <p className="mt-1 text-[11px] font-bold text-nexoraDanger">
                  {t('oneqr.builder.custom_url_invalid')}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-xl bg-nexoraSurfaceMuted p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-nexoraBrand">
              <OneQrModuleIcon name={previewIcon} />
            </span>
            <span className="min-w-0 truncate text-sm font-bold text-nexoraText">
              {label.trim() || defaultLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
