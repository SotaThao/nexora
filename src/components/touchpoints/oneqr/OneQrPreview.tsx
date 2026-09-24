import { useState } from 'react'
import { Lock, Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import OneQrModuleIcon from '../../oneqr/OneQrModuleIcon'
import { OneQrIdentityPolicy } from '../../../constants/oneQr'
import type { OneQrModuleCatalogItem } from '../../../types/oneQr'
import {
  resolveModuleIcon,
  resolveModuleIconUrl,
  resolveModuleLabel,
  type AudienceDraft,
} from './oneQrDraft'

const COLLAPSED_TILE_LIMIT = 6

export default function OneQrPreview({
  businessName,
  businessLogoUrl,
  audienceDraft,
  catalog,
  isPaused,
}: {
  businessName: string
  businessLogoUrl?: string | null
  audienceDraft: AudienceDraft
  catalog: OneQrModuleCatalogItem[]
  isPaused: boolean
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const enabled = audienceDraft.modules.filter((module) => module.isEnabled)
  const visible = expanded ? enabled : enabled.slice(0, COLLAPSED_TILE_LIMIT)
  const canExpand = enabled.length > COLLAPSED_TILE_LIMIT
  const requiresSignIn =
    audienceDraft.identityPolicy === OneQrIdentityPolicy.AlwaysSignIn

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-[2rem] border-[6px] border-nexoraText bg-white shadow-nexora-card">
        <div className="flex items-center gap-2 border-b border-nexoraBorder px-4 py-3">
          {businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-nexoraBrand text-xs font-black text-white">
              {(businessName || '?').trim().charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 truncate text-sm font-black text-nexoraText">
            {businessName || t('oneqr.preview.business_fallback')}
          </span>
        </div>

        <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
          {isPaused ? (
            <div className="rounded-xl bg-amber-50 px-3 py-4 text-center text-[11px] font-bold leading-relaxed text-nexoraWarning">
              {t('oneqr.landing.paused_title')}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-nexoraSurfaceMuted px-3 py-2.5 text-[11px] font-bold text-nexoraBrand">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white">
                  {requiresSignIn ? (
                    <Lock className="h-3 w-3" aria-hidden />
                  ) : (
                    <Sparkles className="h-3 w-3" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 break-words">
                  {requiresSignIn
                    ? t('oneqr.preview.sign_in_required')
                    : audienceDraft.welcomeMessage ||
                      t('oneqr.preview.welcome_fallback')}
                </span>
              </div>

              {visible.length === 0 ? (
                <p className="py-6 text-center text-[11px] font-medium text-nexoraMuted">
                  {t('oneqr.preview.no_modules')}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {visible.map((module) => (
                    <div
                      key={module.localId}
                      className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-nexoraBorder bg-white px-2 py-3 text-center"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-nexoraSurfaceMuted text-nexoraBrand">
                        <OneQrModuleIcon
                          name={resolveModuleIcon(module, catalog)}
                          iconUrl={resolveModuleIconUrl(module)}
                        />
                      </span>
                      <span className="line-clamp-2 text-[10px] font-black leading-tight text-nexoraText">
                        {resolveModuleLabel(module, catalog, t)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {canExpand ? (
                <button
                  type="button"
                  onClick={() => setExpanded((current) => !current)}
                  aria-expanded={expanded}
                  className="w-full rounded-full border border-nexoraBorder py-2 text-[11px] font-bold text-nexoraMuted transition hover:text-nexoraText"
                >
                  {expanded
                    ? t('oneqr.preview.view_less')
                    : t('oneqr.preview.view_all')}
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
