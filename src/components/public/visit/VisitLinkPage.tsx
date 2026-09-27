import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Clock, FileText, Loader2, MessageCircle, Star, Wallet } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePublicPosVisit } from '../../../data/hooks/usePublicPosVisit'
import OneQrLandingPage from '../oneqr/OneQrLandingPage'
import { OneQrModuleKey, buildOneQrPath } from '../../../constants/oneQr'
import { PosOrderStatus } from '../../../constants/posOrderStatus'
import { PosVisitLandingMode, PosVisitSection } from '../../../constants/posSmsSettings'
import type { PosVisitApiDto } from '../../../types/posSms'

const K = 'public.posVisit'

const SECTION_MODULE: Record<PosVisitSection, OneQrModuleKey> = {
  [PosVisitSection.Review]: OneQrModuleKey.Review,
  [PosVisitSection.Tip]: OneQrModuleKey.TipAndPay,
  [PosVisitSection.Feedback]: OneQrModuleKey.Review,
}

const isPosVisitSection = (value?: string): value is PosVisitSection =>
  Object.values(PosVisitSection).includes(value as PosVisitSection)

const SAFE_HREF_PATTERN = /^(?:https?:\/\/|\/(?!\/))/i

const isSafeHref = (href: string | null): href is string => Boolean(href) && SAFE_HREF_PATTERN.test(href as string)

export default function VisitLinkPage() {
  const { t } = useTranslation()
  const { token, section } = useParams<{ token: string; section?: string }>()
  const { data, isPending, isError } = usePublicPosVisit(token)

  if (isPending && token) {
    return (
      <CenteredMessage>
        <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" aria-hidden />
        <p className="text-xs font-medium text-nexoraMuted">{t('common.loading')}</p>
      </CenteredMessage>
    )
  }

  if (isError || !data) {
    return (
      <CenteredMessage>
        <h1 className="text-base font-black text-nexoraText">{t(`${K}.notFoundTitle`)}</h1>
        <p className="text-xs font-medium text-nexoraMuted">{t(`${K}.notFoundDesc`)}</p>
      </CenteredMessage>
    )
  }

  const isExpired = data.mode === PosVisitLandingMode.Expired
  const hasSection = isPosVisitSection(section)

  if (hasSection && isExpired) {
    return (
      <CenteredMessage>
        <h1 className="text-base font-black text-nexoraText">{t(`${K}.expiredTitle`)}</h1>
        <p className="text-xs font-medium text-nexoraMuted">
          {t(`${K}.expiredSectionDesc`, { business: data.businessName })}
        </p>
        <Link
          to={buildOneQrPath(data.businessSlug)}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-nexoraBrand px-5 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
        >
          {t(`${K}.openSalonPage`)}
        </Link>
      </CenteredMessage>
    )
  }

  const autoOpenModuleKey =
    hasSection && data.mode === PosVisitLandingMode.AfterVisit ? SECTION_MODULE[section] : undefined

  return (
    <OneQrLandingPage
      businessSlugOverride={data.businessSlug}
      autoOpenModuleKey={autoOpenModuleKey}
      topSlot={
        isExpired ? (
          <p className="mx-3 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 sm:mx-5">
            {t(`${K}.expiredNotice`)}
          </p>
        ) : data.visit ? (
          <VisitBlock visit={data.visit} isAfterVisit={data.mode === PosVisitLandingMode.AfterVisit} />
        ) : null
      }
    />
  )
}

function VisitBlock({ visit, isAfterVisit }: { visit: PosVisitApiDto; isAfterVisit: boolean }) {
  const { t } = useTranslation()

  if (isAfterVisit) {
    const shortcuts = [
      { href: visit.reviewUrl, label: t(`${K}.leaveReview`), Icon: Star },
      { href: visit.tipUrl, label: t(`${K}.addTip`), Icon: Wallet },
      { href: visit.feedbackUrl, label: t(`${K}.privateFeedback`), Icon: MessageCircle },
      { href: visit.receiptUrl, label: t(`${K}.receipt`), Icon: FileText },
    ].filter((shortcut): shortcut is typeof shortcut & { href: string } => isSafeHref(shortcut.href))

    return (
      <section className="mx-3 mt-3 rounded-xl border border-nexoraBorder bg-nexoraBrandSoft/20 px-3 py-3 sm:mx-5">
        <h2 className="text-sm font-bold text-nexoraText">
          {t(`${K}.thanks`, { name: visit.customerFirstName })}
        </h2>
        <p className="mb-2 text-[11px] text-nexoraMuted">{t(`${K}.ticket`, { number: visit.orderNumber })}</p>
        <div className="grid grid-cols-2 gap-2">
          {shortcuts.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-semibold text-nexoraText transition hover:border-nexoraLavender"
            >
              <Icon className="h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden />
              <span className="min-w-0 break-words">{label}</span>
            </a>
          ))}
        </div>
      </section>
    )
  }

  const statusKey = visit.status === PosOrderStatus.InService ? 'statusInService' : 'statusWaiting'

  return (
    <section className="mx-3 mt-3 rounded-xl border border-nexoraBorder bg-nexoraBrandSoft/20 px-3 py-3 sm:mx-5">
      <h2 className="text-sm font-bold text-nexoraText">
        {t(`${K}.checkedIn`, { name: visit.customerFirstName })}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-nexoraBrand">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {t(`${K}.${statusKey}`)}
      </p>
      {visit.services.length > 0 ? (
        <p className="mt-1 break-words text-[11px] text-nexoraMuted">
          {t(`${K}.services`, { services: visit.services.join(', ') })}
        </p>
      ) : null}
    </section>
  )
}

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-nexoraCanvas px-4">
      <div
        role="status"
        className="flex w-full max-w-[420px] flex-col items-center gap-3 rounded-2xl border border-nexoraBorder bg-white px-5 py-10 text-center shadow-nexora-card"
      >
        {children}
      </div>
    </main>
  )
}
