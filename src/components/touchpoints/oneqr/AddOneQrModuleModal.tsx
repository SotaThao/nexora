import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import OneQrModuleIcon from '../../oneqr/OneQrModuleIcon'
import { resolveOneQrModuleLabel } from '../../oneqr/oneQrModuleLabel'
import {
  OneQrAudience,
  OneQrModuleKey,
  ONEQR_FIELD_LIMITS,
  ONEQR_MODULE_CATALOG_BY_KEY,
  isValidOneQrCustomUrl,
} from '../../../constants/oneQr'
import type { OneQrModuleCatalogItem } from '../../../types/oneQr'
import type { DraftModule } from './oneQrDraft'

type CatalogChoice = {
  moduleKey: string
  icon: string
  label: string
  repeatable: boolean
  alreadyAdded: boolean
  comingSoon: boolean
  requiresTouchPoint: boolean
}

export default function AddOneQrModuleModal({
  audience,
  existingModules,
  catalog,
  onAdd,
  onClose,
}: {
  audience: OneQrAudience
  existingModules: DraftModule[]
  catalog: OneQrModuleCatalogItem[]
  onAdd: (moduleKey: string, customUrl: string | null) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [customUrl, setCustomUrl] = useState('')
  const [customUrlTouched, setCustomUrlTouched] = useState(false)

  // `catalog` is already complete — the repository merges the server registry
  // over the bundled defaults, so there is no empty case to branch on here.
  const choices = useMemo<CatalogChoice[]>(
    () =>
      catalog
        .filter((item) => item.allowedAudiences.includes(audience))
        .map((item) => {
          const bundled = ONEQR_MODULE_CATALOG_BY_KEY[item.moduleKey]
          return {
            moduleKey: item.moduleKey,
            icon: item.defaultIcon ?? bundled?.defaultIcon ?? 'square',
            label: resolveOneQrModuleLabel(
              { moduleKey: item.moduleKey, serverLabel: item.defaultLabel },
              t,
            ),
            repeatable: item.allowsMultiple,
            alreadyAdded: existingModules.some(
              (module) => module.moduleKey === item.moduleKey,
            ),
            comingSoon: item.isComingSoon,
            requiresTouchPoint: item.requiresTouchPoint,
          }
        }),
    [audience, catalog, existingModules, t],
  )

  const isCustomUrlValid = isValidOneQrCustomUrl(customUrl)

  const handlePick = (choice: CatalogChoice) => {
    if (choice.moduleKey === OneQrModuleKey.CustomLink) {
      setCustomUrlTouched(true)
      if (!isCustomUrlValid) return
      onAdd(OneQrModuleKey.CustomLink, customUrl.trim())
      setCustomUrl('')
      setCustomUrlTouched(false)
      return
    }
    if (choice.alreadyAdded && !choice.repeatable) return
    onAdd(choice.moduleKey, null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="oneqr-add-module-title"
    >
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              id="oneqr-add-module-title"
              className="text-base font-black text-nexoraText"
            >
              {t('oneqr.builder.add_module')}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-nexoraMuted">
              {t('oneqr.builder.add_module_desc', {
                audience: t(`oneqr.audience.${audience.toLowerCase()}`),
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-nexoraMuted transition hover:bg-nexoraSurfaceMuted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="-mx-1 flex-1 space-y-2 overflow-y-auto px-1">
          {choices.map((choice) => {
            const isCustomLink = choice.moduleKey === OneQrModuleKey.CustomLink
            const isBlocked = choice.alreadyAdded && !choice.repeatable

            return (
              <div key={choice.moduleKey} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handlePick(choice)}
                  disabled={isBlocked || (isCustomLink && !isCustomUrlValid)}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-left transition hover:border-nexoraLavender hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-nexoraSurfaceMuted text-nexoraBrand">
                    <OneQrModuleIcon name={choice.icon} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-nexoraText">
                      {choice.label}
                    </span>
                    {choice.comingSoon ? (
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-nexoraWarning">
                        {t('oneqr.builder.coming_soon')}
                      </span>
                    ) : null}
                    {choice.requiresTouchPoint ? (
                      <span className="shrink-0 rounded-full bg-nexoraSurfaceMuted px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                        {t('oneqr.builder.needs_station')}
                      </span>
                    ) : null}
                  </span>
                  {isBlocked ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  ) : null}
                </button>

                {isCustomLink ? (
                  <div className="pl-12">
                    <label
                      htmlFor="oneqr-custom-url"
                      className="mb-1 block text-[11px] font-bold text-nexoraText"
                    >
                      {t('oneqr.builder.custom_url_label')}
                    </label>
                    <input
                      id="oneqr-custom-url"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      value={customUrl}
                      maxLength={ONEQR_FIELD_LIMITS.customUrl}
                      onChange={(event) => setCustomUrl(event.target.value)}
                      onBlur={() => setCustomUrlTouched(true)}
                      placeholder={t('oneqr.builder.custom_url_placeholder')}
                      className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none transition focus:border-nexoraBrand"
                    />
                    {customUrlTouched && !isCustomUrlValid ? (
                      <p className="mt-1 text-[11px] font-bold text-nexoraDanger">
                        {t('oneqr.builder.custom_url_invalid')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurface px-4 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted"
        >
          {t('common.close')}
        </button>
      </div>
    </div>
  )
}
