import { useState } from 'react'
import { Loader2, Upload, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import OneQrModuleIcon, {
  ONEQR_ICON_CHOICES,
} from '../../oneqr/OneQrModuleIcon'
import ImageFileInput from '../../ui/ImageFileInput'
import {
  OneQrModuleKey,
  ONEQR_FIELD_LIMITS,
  ONEQR_ICON_UPLOAD_MAX_DIMENSION_PX,
  ONEQR_ICON_UPLOAD_MAX_BYTES,
  isValidOneQrCustomUrl,
} from '../../../constants/oneQr'
import type { OneQrModuleCatalogItem } from '../../../types/oneQr'
import { compressImageFile, normalizeAllowedImageFile } from '../../../utils/imageFile'
import { imagesRepository } from '../../../data/repositories/images'
import {
  resolveModuleIcon,
  resolveModuleLabel,
  type DraftModule,
} from './oneQrDraft'

export type EditedModuleFields = {
  customLabel: string | null
  customIcon: string | null
  customIconUrl: string | null
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
  const [iconUrl, setIconUrl] = useState(module.customIconUrl ?? '')
  const [iconUploading, setIconUploading] = useState(false)
  const [iconUploadError, setIconUploadError] = useState<string | null>(null)
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

  // A library icon and an uploaded image are mutually exclusive — picking one clears the other.
  const pickLibraryIcon = (name: string) => {
    setIcon(name)
    setIconUrl('')
    setIconUploadError(null)
  }

  const handleIconFilePick = async (file: File) => {
    setIconUploadError(null)
    const normalized = normalizeAllowedImageFile(file)
    if (!normalized) {
      setIconUploadError(t('oneqr.builder.icon_upload_invalid'))
      return
    }
    setIconUploading(true)
    try {
      const compressed = await compressImageFile(normalized, {
        maxDimension: ONEQR_ICON_UPLOAD_MAX_DIMENSION_PX,
        maxBytes: ONEQR_ICON_UPLOAD_MAX_BYTES,
      })
      const uploadedUrl = await imagesRepository.uploadAndGetUrl(compressed)
      setIconUrl(uploadedUrl)
      setIcon('')
    } catch {
      setIconUploadError(t('oneqr.builder.icon_upload_error'))
    } finally {
      setIconUploading(false)
    }
  }

  const handleSubmit = () => {
    setUrlTouched(true)
    if (!isUrlValid || iconUploading) return
    onSave({
      // Empty means "fall back to the registry default", not "blank label".
      customLabel: label.trim() || null,
      customIcon: icon.trim() || null,
      customIconUrl: iconUrl.trim() || null,
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
                onClick={() => {
                  setIcon('')
                  setIconUrl('')
                  setIconUploadError(null)
                }}
                aria-pressed={icon === '' && iconUrl === ''}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-[10px] font-bold transition ${
                  icon === '' && iconUrl === ''
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                }`}
              >
                {t('oneqr.builder.icon_default')}
              </button>

              {iconUrl ? (
                <div className="relative">
                  <span
                    aria-label={t('oneqr.builder.icon_uploaded')}
                    className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg border-2 border-nexoraBrand"
                  >
                    <img src={iconUrl} alt="" className="h-full w-full object-cover" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setIconUrl('')}
                    aria-label={t('oneqr.builder.icon_remove')}
                    className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-nexoraDanger text-white"
                  >
                    <X className="h-2.5 w-2.5" aria-hidden />
                  </button>
                </div>
              ) : (
                <ImageFileInput
                  as="label"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={iconUploading}
                  inputAriaLabel={t('oneqr.builder.icon_upload')}
                  onPickFile={handleIconFilePick}
                  className={`grid h-9 w-9 place-items-center rounded-lg border border-dashed border-nexoraBorder text-nexoraMuted transition ${
                    iconUploading
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-nexoraSurfaceMuted'
                  }`}
                >
                  {iconUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Upload className="h-4 w-4" aria-hidden />
                  )}
                </ImageFileInput>
              )}

              {ONEQR_ICON_CHOICES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => pickLibraryIcon(name)}
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
            {iconUploadError ? (
              <p className="mt-1 text-[11px] font-bold text-nexoraDanger">
                {iconUploadError}
              </p>
            ) : (
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
                {t('oneqr.builder.icon_upload_hint')}
              </p>
            )}
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
              <OneQrModuleIcon name={previewIcon} iconUrl={iconUrl || null} />
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
            disabled={iconUploading}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
