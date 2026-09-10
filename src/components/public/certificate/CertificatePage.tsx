// CertificatePage — the page a NEXORA TOUCH certificate's QR code leads to. Given a certificate
// code in the URL, it shows that certificate.
//
// Anonymous and read-only: the code in the URL is the only credential. The certificate is drawn on
// the brand artwork by the shared canvas renderer, the same one My Certifications uses, so there is
// one certificate rendering in the app rather than two that can drift apart.
//
// Two things it still has to get right, both inherited from how the endpoint behaves:
//
//  - A revoked or expired certificate is marked as such. That is the certificate's own status, not
//    a verdict this page adds: rendering a withdrawn certificate as a pristine one would let the
//    link stand in as proof of something that is no longer true.
//  - A code that does not exist is an answer, not an error. The backend hides drafts behind the
//    same not-found as a made-up code, so "no certificate with this ID" is the whole story, and a
//    request that was rate limited or never reached the server must not be reported as that.
import { useParams } from 'react-router-dom'
import { Loader2, SearchX, Timer, WifiOff } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePublicCertificate } from '../../../data/hooks/usePublicCertificate'
import { CertificateStatus, type CertificateStatusValue } from '../../../constants/certificate'
import { isApiError } from '../../../types/domain'
import CertificateCanvasPreview from '../../certificate/CertificateCanvasPreview'
import CertificateStatusNote from '../../certificate/CertificateStatusNote'

const K = 'public.certificate'

const RATE_LIMIT_STATUS = 429
/** httpClient reports a request that never reached the server as status 0. */
const NETWORK_STATUS = 0

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-4">{children}</div>
    </div>
  )
}

/** Nothing to show: no such code, rate limited, or the server unreachable. */
function OutcomeCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="nexora-card space-y-3 p-8 text-center">
      <img
        src="/assets/nexora-logo.png"
        alt=""
        width={210}
        height={210}
        className="mx-auto h-9 w-9 object-contain"
      />
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-nexoraSurfaceMuted text-nexoraMuted">
        {icon}
      </span>
      <h1 className="text-base font-black text-nexoraText">{title}</h1>
      <p className="mx-auto max-w-md text-xs text-nexoraMuted">{body}</p>
    </div>
  )
}

export default function CertificatePage() {
  const { t } = useTranslation()
  const { certificateId } = useParams<{ certificateId: string }>()

  // Uppercased so /certificate/nxt-cs-2026-0001 and the printed form share one cache entry rather
  // than spending two of the ten requests a minute the endpoint allows.
  const code = certificateId?.trim().toUpperCase()
  const { data, isLoading, isError, error } = usePublicCertificate(code)

  const notFound = (
    <Shell>
      <OutcomeCard
        icon={<SearchX className="h-5 w-5" />}
        title={t(`${K}.notFoundTitle`)}
        body={t(`${K}.notFoundBody`, { code: code ?? '' })}
      />
    </Shell>
  )

  // The route always carries a code, so an empty one means a hand-mangled URL.
  if (!code) return notFound

  if (isLoading) {
    return (
      <Shell>
        <div className="nexora-card flex flex-col items-center justify-center gap-3 p-12">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          <p className="text-xs font-bold text-nexoraMuted">{t(`${K}.loading`, { code })}</p>
        </div>
      </Shell>
    )
  }

  if (isError || !data) {
    // httpClient rejects with a plain ApiError object rather than an Error subclass, so the guard
    // does the narrowing that a cast would only paper over.
    const apiError = isApiError(error) ? error : null

    // Rate limited. Kept separate from not-found on purpose: telling someone their certificate does
    // not exist when the server simply stopped answering them is the one wrong answer this page
    // must never give.
    if (apiError?.status === RATE_LIMIT_STATUS) {
      // Retry-After is honoured when the server sends it, but the copy never depends on it — a
      // fixed-window limiter is not obliged to include the header.
      const retryAfterSeconds = Number(apiError.retryAfter)
      const waitIsKnown = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      return (
        <Shell>
          <OutcomeCard
            icon={<Timer className="h-5 w-5" />}
            title={t(`${K}.rateLimitTitle`)}
            body={
              waitIsKnown
                ? t(`${K}.rateLimitBodyWait`, { seconds: Math.ceil(retryAfterSeconds) })
                : t(`${K}.rateLimitBody`)
            }
          />
        </Shell>
      )
    }

    if (apiError?.status === NETWORK_STATUS) {
      return (
        <Shell>
          <OutcomeCard
            icon={<WifiOff className="h-5 w-5" />}
            title={t(`${K}.networkTitle`)}
            body={t(`${K}.networkBody`)}
          />
        </Shell>
      )
    }

    // Everything else is one screen. A code that was never issued, a code that never existed and a
    // draft all land here, which is what keeps this endpoint from being used to discover which
    // certificates are being prepared.
    return notFound
  }

  const status = data.status as CertificateStatusValue

  // A draft should never get this far — the backend filters it out — but rendering a certificate
  // document for something that was never issued is the one mistake worth guarding twice.
  if (
    status !== CertificateStatus.Active &&
    status !== CertificateStatus.Revoked &&
    status !== CertificateStatus.Expired
  ) {
    return notFound
  }

  return (
    <Shell>
      <CertificateStatusNote certificate={data} />
      <CertificateCanvasPreview certificate={data} />
    </Shell>
  )
}
