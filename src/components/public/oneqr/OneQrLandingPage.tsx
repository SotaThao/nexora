/**
 * `/o/:businessSlug` — what a scanner sees after scanning the master QR.
 *
 * Same URL, different grid per role: the backend resolves Customer / Staff /
 * Owner from the session and only ever sends that role's modules, so there is
 * nothing to hide client-side. Three states matter here and are deliberately
 * distinct: paused (HTTP 200 + a polite notice, never an error page — the QR is
 * printed and in the wild), not found (404), and sign-in required.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Clock, Loader2, LogIn, MapPin, PauseCircle, Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  usePublicOneQrLanding,
  useTrackOneQrModuleClick,
} from '../../../data/hooks/usePublicOneQr'
import OneQrModuleIcon from '../../oneqr/OneQrModuleIcon'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import { resolveOneQrModuleLabel } from '../../oneqr/oneQrModuleLabel'
import { resolveOneQrModuleIconColor } from '../../oneqr/oneQrModuleIconColor'
import { resolveOneQrModuleHref } from './oneQrModuleHref'
import {
  ONEQR_ROUTE,
  OneQrAudience,
  OneQrModuleKey,
  buildOneQrPath,
} from '../../../constants/oneQr'
import type {
  OneQrLandingBusiness,
  OneQrLandingModule,
} from '../../../types/oneQr'
import {
  rememberOneQrReturnAudience,
  withOneQrReturnAudience,
} from '../../../utils/oneQrReturnAudience'

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
  // Forwarded verbatim: a printed code may carry `?as=staff`, and only the
  // backend can say whether this scanner is entitled to that view.
  const viewAs = searchParams.get(ONEQR_ROUTE.asQuery)
  const [showAllModules, setShowAllModules] = useState(false)

  useEffect(() => {
    setShowAllModules(false)
  }, [businessSlug, viewAs])

  const { data, isPending, isError } = usePublicOneQrLanding({
    businessSlug,
    sessionId,
    viewAs,
  })
  const trackClick = useTrackOneQrModuleClick()
  const landingAudience = data?.audience

  useEffect(() => {
    if (landingAudience) rememberOneQrReturnAudience(landingAudience)
  }, [landingAudience])

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

  // No slug means there is nothing to look up — a real dead end, and the only
  // case where the query stays disabled forever. Checked before the pending
  // branch so it cannot spin indefinitely.
  if (!businessSlug) {
    return (
      <Shell>
        <StatusCard
          title={t('oneqr.landing.not_found_title')}
          description={t('oneqr.landing.not_found_desc')}
        />
      </Shell>
    )
  }

  /*
   * `isPending`, not `isLoading`.
   *
   * The query is disabled until auth finishes restoring (a stored token decides
   * Customer vs Staff vs Owner). While disabled, TanStack v5 reports
   * `isPending: true` but `isFetching: false` — and `isLoading` is
   * `isPending && isFetching`, so it is **false**. Keying the spinner off
   * `isLoading` therefore fell straight through to the `!data` branch and
   * flashed "QR code not found" on every cold open, before any request was even
   * made. `isPending` covers both waiting-to-start and in-flight.
   */
  if (isPending) {
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

  // The backend decides who may switch views; the query value only hides the
  // button once the switch has already been taken. AI Voice replaces that
  // switch with a local expand: the API list is already complete, so the page
  // shows the first four in server order (ascending) until "View more".
  const isAiVoice = data.audience === OneQrAudience.AIVoice
  const showViewAsCustomer =
    !isAiVoice && viewAs !== ONEQR_ROUTE.asCustomerValue && data.canViewAsCustomer
  const visibleModules =
    isAiVoice && !showAllModules ? data.modules.slice(0, 4) : data.modules
  const showViewMore = isAiVoice && !showAllModules && data.modules.length > 4
  const welcomeMessage = data.welcomeMessage?.trim().toLowerCase() === 'welcome to merchant'
    ? t('oneqr.landing.visit_message')
    : data.welcomeMessage

  return (
    <Shell business={data.business}>
      {welcomeMessage ? (
        <div className="mx-3 mb-1 mt-3 flex items-center gap-2 rounded-lg bg-nexoraBrandSoft/40 px-3 py-2 text-xs font-medium leading-relaxed text-nexoraBrand sm:mx-5">
          <span className="grid h-5 w-5 shrink-0 place-items-center">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <p className="min-w-0 break-words">{welcomeMessage}</p>
        </div>
      ) : null}

      {visibleModules.length > 0 ? (
        <div className="px-3 pb-3 pt-3 sm:px-5">
          <h2 className="text-sm font-bold tracking-tight text-nexoraText">
            {t('oneqr.landing.actions_title')}
          </h2>
        </div>
      ) : null}

      {visibleModules.length === 0 ? (
        <p className="px-5 py-12 text-center text-xs font-medium text-nexoraMuted">
          {t('oneqr.landing.no_modules')}
        </p>
      ) : (
        <nav
          aria-label={t('oneqr.landing.menu_label', {
            business: data.business.name,
          })}
          className="grid grid-cols-2 gap-2.5 px-3 pb-3 sm:px-5"
        >
          {visibleModules.map((module, index) => (
            <ModuleTile
              // CustomLink may repeat, so the key needs the position too.
              key={`${module.moduleKey}-${index}`}
              module={module}
              audience={data.audience}
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

      {showViewMore ? (
        <div className="px-3 pb-3 sm:px-5">
          <button
            type="button"
            onClick={() => setShowAllModules(true)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraMuted transition hover:text-nexoraText"
          >
            {t('oneqr.landing.view_more')}
          </button>
        </div>
      ) : null}

      {showViewAsCustomer ? (
        <div className="px-3 pb-3 sm:px-5">
          <Link
            to={`${buildOneQrPath(businessSlug)}?${ONEQR_ROUTE.asQuery}=${ONEQR_ROUTE.asCustomerValue}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraMuted transition hover:text-nexoraText"
          >
            {t('oneqr.landing.view_as_customer')}
          </Link>
        </div>
      ) : null}

      <BusinessFooter business={data.business} />
    </Shell>
  )
}

/**
 * Address + opening hours under the tile grid, per the landing mockup.
 *
 * Renders nothing when the backend sends neither, so the page never ends in an
 * empty rule line — `OneQrLandingBusinessDto` does not carry these fields yet.
 */
function BusinessFooter({ business }: { business: OneQrLandingBusiness }) {
  const { t } = useTranslation()
  const hasAddress = Boolean(business.address)
  const hasHours = business.hours.length > 0
  if (!hasAddress && !hasHours) return null

  return (
    <footer className="mx-3 mb-3 flex flex-col gap-2.5 rounded-xl bg-nexoraCanvas px-3 py-3 sm:mx-5">
      {hasAddress ? (
        <p className="flex items-start gap-2 text-xs font-medium leading-relaxed text-nexoraMuted">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-nexoraBrand"
            aria-hidden
          />
          <span className="min-w-0 break-words">
            <span className="sr-only">{t('oneqr.landing.address_label')} </span>
            {business.address}
          </span>
        </p>
      ) : null}
      {hasHours ? (
        <p className="flex items-start gap-2 text-xs font-medium leading-relaxed text-nexoraMuted">
          <Clock
            className="mt-0.5 h-4 w-4 shrink-0 text-nexoraBrand"
            aria-hidden
          />
          <span className="min-w-0 break-words">
            <span className="sr-only">{t('oneqr.landing.hours_label')} </span>
            {business.hours.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        </p>
      ) : null}
    </footer>
  )
}

function ModuleTile({
  module,
  audience,
  label,
  onClick,
}: {
  module: OneQrLandingModule
  audience: OneQrAudience
  /** Resolved from the locale files, not `module.label` — see oneQrModuleLabel. */
  label: string
  onClick: () => void
}) {
  // Destinations come from the backend registry and may be either an in-app
  // path or an external CustomLink, so this is a plain anchor rather than a
  // react-router <Link>; external targets additionally get noopener.
  const url = withOneQrReturnAudience(resolveOneQrModuleHref(module), audience)
  const isExternal = /^https?:\/\//i.test(url)
  const isInternal = url.startsWith('/')
  const safeHref = isExternal || isInternal ? url : '#'
  const iconColor = resolveOneQrModuleIconColor(module.moduleKey)

  return (
    <a
      href={safeHref}
      onClick={(event) => {
        if (safeHref === '#') event.preventDefault()
        onClick()
      }}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex min-h-[90px] flex-col items-start justify-between gap-2 rounded-xl border border-nexoraBorder/80 bg-white px-3 py-3 text-left shadow-sm transition duration-200 hover:border-nexoraLavender hover:bg-nexoraBrandSoft/20 hover:shadow-nexora-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <span className="flex w-full items-start justify-between gap-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${iconColor}`}>
          <OneQrModuleIcon name={module.icon} iconUrl={module.iconUrl} className="h-4 w-4" />
        </span>
        <ArrowUpRight className="mt-1 h-4 w-4 text-nexoraSubtle transition group-hover:text-nexoraBrand motion-reduce:transition-none" aria-hidden />
      </span>
      <span className="min-w-0 w-full break-words text-[13px] font-semibold leading-snug text-nexoraText">
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
  const { t } = useTranslation()
  const businessName = business?.name ?? ''
  const businessLogoUrl = business?.logoUrl ?? null

  return (
    <main className="min-h-screen bg-white sm:bg-nexoraCanvas sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[480px] bg-white sm:overflow-hidden sm:rounded-2xl sm:border sm:border-nexoraBorder/70 sm:shadow-nexora-card">
        <header className="relative z-10 flex items-center gap-3 border-b border-nexoraBorder/50 bg-gradient-to-br from-nexoraBrandSoft/80 via-nexoraCanvas to-white px-3 py-4 sm:px-5">
          {businessName ? (
            <>
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-white/80 bg-white shadow-sm">
              {businessLogoUrl ? (
                <img
                  src={businessLogoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-nexoraBrand">
                  {businessName.trim().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-nexoraBrand">
                {t('oneqr.landing.welcome_label')}
              </p>
              <h1 className="break-words text-lg font-bold leading-snug tracking-tight text-nexoraText sm:text-xl">
                {businessName}
              </h1>
            </div>
            </>
          ) : <div className="flex-1" />}
          <LanguageSwitcher className="shrink-0 [&>button]:h-11 [&>button]:min-w-11" />
        </header>
        {children}
      </div>
      <p className="mx-auto flex flex-wrap items-center justify-center gap-x-1 px-3 pb-2 text-[11px] font-medium text-nexoraMuted">
        {t('oneqr.landing.powered_by')}
        <a
          href="https://nexoratouch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-semibold text-nexoraBrand underline decoration-nexoraBrand/30 underline-offset-4 transition hover:text-nexoraBrandDark hover:decoration-nexoraBrand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2"
        >
          {t('oneqr.landing.brand_name')}
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      </p>
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
