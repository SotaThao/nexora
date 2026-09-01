/**
 * `/o/:businessSlug` — what a scanner sees after scanning the master QR.
 *
 * Same URL, different grid per role: the backend resolves Customer / Staff /
 * Owner from the session and only ever sends that role's modules, so there is
 * nothing to hide client-side. Three states matter here and are deliberately
 * distinct: paused (HTTP 200 + a polite notice, never an error page — the QR is
 * printed and in the wild), not found (404), and sign-in required.
 */
import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Loader2, LogIn, PauseCircle, Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  usePublicOneQrLanding,
  useTrackOneQrModuleClick,
} from '../../../data/hooks/usePublicOneQr'
import OneQrModuleIcon from '../../oneqr/OneQrModuleIcon'
import { resolveOneQrModuleLabel } from '../../oneqr/oneQrModuleLabel'
import {
  ONEQR_ROUTE,
  OneQrModuleKey,
  buildOneQrPath,
} from '../../../constants/oneQr'
import type {
  OneQrLandingBusiness,
  OneQrLandingModule,
} from '../../../types/oneQr'

/**
 * The session id identifies one scan for analytics dedupe. It is generated in
 * the browser and never embedded in the QR itself (same contract as the touch
 * page) — a printed QR carrying a session id would collapse every scan into one.
 */
function useScanSessionId(): string {
  const [searchParams] = useSearchParams()
  const fromUrl = searchParams.get('sessionId')
  return useMemo(() => {
    if (fromUrl) return fromUrl
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `oneqr-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }, [fromUrl])
}

export default function OneQrLandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const businessSlug = params[ONEQR_ROUTE.param] ?? ''
  const sessionId = useScanSessionId()
  const asCustomer =
    searchParams.get(ONEQR_ROUTE.asQuery) === ONEQR_ROUTE.asCustomerValue

  const { data, isLoading, isError } = usePublicOneQrLanding({
    businessSlug,
    sessionId,
    asCustomer,
  })
  const trackClick = useTrackOneQrModuleClick()

  useEffect(() => {
    document.body.classList.add('oneqr-landing-active')
    return () => document.body.classList.remove('oneqr-landing-active')
  }, [])

  const handleModuleClick = useCallback(
    (module: OneQrLandingModule) => {
      if (!data) return
      // Fire-and-forget: navigation must not wait on the beacon.
      trackClick.mutate({
        businessSlug,
        moduleKey: module.moduleKey,
        sessionId,
        audience: data.audience,
      })
    },
    [businessSlug, data, sessionId, trackClick],
  )

  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-24" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" aria-hidden />
          <p className="text-xs font-medium text-nexoraMuted">
            {t('common.loading')}
          </p>
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    return (
      <Shell>
        <StatusCard
          title={t('oneqr.landing.not_found_title')}
          description={t('oneqr.landing.not_found_desc')}
        />
      </Shell>
    )
  }

  if (data.status === 'notFound') {
    return (
      <Shell>
        <StatusCard
          title={t('oneqr.landing.not_found_title')}
          description={t('oneqr.landing.not_found_desc')}
        />
      </Shell>
    )
  }

  if (data.status === 'paused') {
    return (
      <Shell business={data.business}>
        <StatusCard
          icon={<PauseCircle className="h-7 w-7 text-nexoraWarning" aria-hidden />}
          title={t('oneqr.landing.paused_title')}
          description={t('oneqr.landing.paused_desc', {
            business: data.business.name,
          })}
        />
      </Shell>
    )
  }

  if (data.requiresAuth) {
    return (
      <Shell business={data.business}>
        <StatusCard
          icon={<LogIn className="h-7 w-7 text-nexoraBrand" aria-hidden />}
          title={t('oneqr.landing.sign_in_title')}
          description={t('oneqr.landing.sign_in_desc')}
          action={
            <button
              type="button"
              onClick={() =>
                // `returnPath` is the app-wide convention (see RequireAuth) —
                // sign-in lands the scanner back on this same OneQR page.
                navigate(
                  `/login?returnPath=${encodeURIComponent(buildOneQrPath(businessSlug))}`,
                )
              }
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-nexoraBrand px-5 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
            >
              {t('oneqr.landing.sign_in_cta')}
            </button>
          }
        />
      </Shell>
    )
  }

  // The backend decides who may switch views; `asCustomer` only hides the
  // button once the switch has already been taken.
  const showViewAsCustomer = !asCustomer && data.canViewAsCustomer

  return (
    <Shell business={data.business}>
      {data.welcomeMessage ? (
        <div className="mx-5 mb-3.5 flex items-center gap-2.5 rounded-2xl bg-nexoraSurfaceMuted px-3.5 py-3 text-[13px] font-bold text-nexoraBrand">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="min-w-0 break-words">{data.welcomeMessage}</p>
        </div>
      ) : null}

      {data.modules.length === 0 ? (
        <p className="px-5 py-12 text-center text-xs font-medium text-nexoraMuted">
          {t('oneqr.landing.no_modules')}
        </p>
      ) : (
        <nav
          aria-label={t('oneqr.landing.menu_label', {
            business: data.business.name,
          })}
          className="grid grid-cols-2 gap-3 px-5 pb-6 pt-1"
        >
          {data.modules.map((module, index) => (
            <ModuleTile
              // CustomLink may repeat, so the key needs the position too.
              key={`${module.moduleKey}-${index}`}
              module={module}
              label={resolveOneQrModuleLabel(
                // The landing DTO ships one merged `label`. For a CustomLink
                // that string is the merchant's own wording — there is no
                // system label to translate — so it is passed as the override.
                module.moduleKey === OneQrModuleKey.CustomLink
                  ? { moduleKey: module.moduleKey, customLabel: module.label }
                  : { moduleKey: module.moduleKey, serverLabel: module.label },
                t,
              )}
              onClick={() => handleModuleClick(module)}
            />
          ))}
        </nav>
      )}

      {showViewAsCustomer ? (
        <div className="px-5 pb-6">
          <Link
            to={`${buildOneQrPath(businessSlug)}?${ONEQR_ROUTE.asQuery}=${ONEQR_ROUTE.asCustomerValue}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraMuted transition hover:text-nexoraText"
          >
            {t('oneqr.landing.view_as_customer')}
          </Link>
        </div>
      ) : null}

      {/*
        The mockup's address + opening-hours footer is intentionally absent:
        `OneQrLandingBusinessDto` carries only id/name/slug/logoUrl, so there is
        no data to render. Re-add it if the backend starts sending them.
      */}
    </Shell>
  )
}

function ModuleTile({
  module,
  label,
  onClick,
}: {
  module: OneQrLandingModule
  /** Resolved from the locale files, not `module.label` — see oneQrModuleLabel. */
  label: string
  onClick: () => void
}) {
  // Destinations come from the backend registry and may be either an in-app
  // path or an external CustomLink, so this is a plain anchor rather than a
  // react-router <Link>; external targets additionally get noopener.
  const isExternal = /^https?:\/\//i.test(module.url)

  return (
    <a
      href={module.url}
      onClick={onClick}
      {...(isExternal
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      className="flex min-h-[92px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-nexoraBorder bg-white px-2.5 py-3.5 text-center transition hover:border-nexoraLavender hover:shadow-nexora-card"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-nexoraSurfaceMuted text-nexoraBrand">
        <OneQrModuleIcon name={module.icon} className="h-4 w-4" />
      </span>
      <span className="text-[13px] font-black leading-tight text-nexoraText">
        {label}
      </span>
    </a>
  )
}

function Shell({
  business,
  children,
}: {
  business?: OneQrLandingBusiness
  children: ReactNode
}) {
  const businessName = business?.name ?? ''
  const businessLogoUrl = business?.logoUrl ?? null

  return (
    <main className="mx-auto min-h-screen w-full max-w-[420px] bg-white">
      {businessName ? (
        <header className="flex items-center gap-2.5 px-5 py-4">
          {businessLogoUrl ? (
            <img
              src={businessLogoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-nexoraBrand text-sm font-black text-white">
              {businessName.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <h1 className="min-w-0 truncate text-base font-black text-nexoraText">
            {businessName}
          </h1>
        </header>
      ) : null}
      {children}
    </main>
  )
}

function StatusCard({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mx-5 my-16 flex flex-col items-center gap-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface px-5 py-10 text-center">
      {icon}
      <h2 className="text-base font-black text-nexoraText">{title}</h2>
      <p className="text-xs font-medium leading-relaxed text-nexoraMuted">
        {description}
      </p>
      {action}
    </div>
  )
}
