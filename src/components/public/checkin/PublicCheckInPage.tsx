// PublicCheckInPage — the third check-in surface: the customer scans the QR at the door and
// checks in from their own phone (POS-Public-Check-In-Technical.md).
//
// It mounts the same CheckInSurface the kiosk and the front desk mount, wired to a public data
// source. That is the whole point: the questions asked — who you are, which technician you would
// like, which services — are the salon's questions, and they must not differ because of which
// screen the guest happens to be looking at. The design doc justified a standalone page by the
// shared check-in module not existing yet; it does now, so that reason is gone.
//
// What is genuinely public-only lives here, not in the shared module: the dark landing chrome
// (logo + salon name sit on the keypad card), and the "see my place in line" link, which exists
// only because this guest is not standing in the salon and cannot simply ask.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ListOrdered, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInSurface from '../../checkin/CheckInSurface'
import createPublicCheckInSource from '../../checkin/sources/usePublicCheckInSource'
import { PosCheckInLayout } from '../../../constants/posCheckInLayout'
import { usePublicCheckInPage } from '../../../data/hooks/usePublicCheckIn'
import PublicCheckInShell from './PublicCheckInShell'
import { rememberPublicCheckInSlug } from './publicCheckInUtils'
import BackToOneQrMenuButton from '../BackToOneQrMenuButton'

/** The one thing a guest away from the salon needs and a guest inside it does not. */
function QueuePositionLink({
  receiptToken,
  businessSlug,
  children,
}: {
  receiptToken: string
  businessSlug: string
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-full max-w-md space-y-2 text-center">
      <Link
        to={`/checkin/status/${receiptToken}`}
        state={{ businessSlug }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4d6fff] to-[#7c5cff] text-base font-bold text-white hover:opacity-90"
      >
        <ListOrdered className="h-4 w-4" />
        {t('public.checkIn.viewQueueButton')}
      </Link>
      {children}
      <p className="text-xs text-white/60">{t('public.checkIn.saveLinkHint')}</p>
    </div>
  )
}

export default function PublicCheckInPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data, isLoading, isError } = usePublicCheckInPage(businessSlug)
  const useSource = useMemo(() => createPublicCheckInSource(businessSlug as string), [businessSlug])

  // The status page has no slug in its URL (token alone identifies the visit). Remember this
  // one so "Check in again" can still find the keypad after a refresh of that page.
  useEffect(() => {
    if (businessSlug && data) rememberPublicCheckInSlug(businessSlug)
  }, [businessSlug, data])

  // Captured off the submit result so the thank-you screen can offer the status page. Cleared on
  // Done, which drops the guest back on the keypad for the next person on the same phone.
  const [receiptToken, setReceiptToken] = useState<string | null>(null)

  if (isLoading) {
    return (
      <PublicCheckInShell>
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </PublicCheckInShell>
    )
  }

  // Wrong slug, business not public, and PublicCheckInEnabled = false all arrive here as the same
  // 404 — the server deliberately does not distinguish them (§6, anti-enumeration).
  if (isError || !data) {
    return (
      <PublicCheckInShell>
        <div className="public-checkin-card">
          <p className="text-sm font-bold text-white">{t('public.checkIn.notFoundTitle')}</p>
          <p className="mt-2 text-xs text-white/60">{t('public.checkIn.notFoundDesc')}</p>
        </div>
      </PublicCheckInShell>
    )
  }

  return (
    <PublicCheckInShell>
      <CheckInSurface
        appearance="public"
        useSource={useSource}
        layout={data.layout ?? PosCheckInLayout.SinglePage}
        businessName={data.businessName}
        promotions={data.promotions}
        // Nobody is waiting to reuse this phone, so the number stays until the guest dismisses it.
        autoReturnSeconds={null}
        onCheckedIn={(_orderNumber, result) => setReceiptToken(result.receiptToken ?? null)}
        onFinished={() => setReceiptToken(null)}
        // "That's me" on the active-visit screen: this guest is already in the queue, so the only
        // useful thing left to show them is where in it — the answer the front desk would give a
        // guest standing at the counter.
        onCancelled={(activeVisitReceiptToken) => {
          if (activeVisitReceiptToken) {
            navigate(`/checkin/status/${activeVisitReceiptToken}`, {
              state: { businessSlug },
            })
          }
        }}
        doneSlot={
          receiptToken ? (
            <QueuePositionLink receiptToken={receiptToken} businessSlug={businessSlug as string}>
              <BackToOneQrMenuButton businessSlug={businessSlug} variant="public" />
            </QueuePositionLink>
          ) : (
            <div className="mx-auto w-full max-w-md">
              <BackToOneQrMenuButton businessSlug={businessSlug} variant="public" />
            </div>
          )
        }
      />
    </PublicCheckInShell>
  )
}
