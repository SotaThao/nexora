// PosDevicePairPage — the screen a tablet lands on after scanning the pairing QR.
//
// Runs outside the dashboard shell and outside the auth gate: the tablet has no user session and
// is never going to get one. What authorises this page is the signed, single-use, ~30-second token
// in the URL, which the server verifies.
//
// The three failure modes are shown as three different messages on purpose — "expired", "invalid"
// and "already used" call for three different actions from whoever is holding the tablet.
import { useState, useMemo, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, Loader2, TabletSmartphone } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { isPromotionInScheduleNow } from '../dashboard/views/pos/posPromotionDisplay'
import BookingPromotions from '../public/booking/BookingPromotions'
import { bookingLocaleFromLang } from '../public/booking/bookingUtils'
import {
  getPublicBookingCopy,
  parsePublicBookingLang,
} from '../public/booking/constants'
import '../public/booking/public-booking.css'
import posDevicePairingRepository from '../../data/repositories/posDevicePairing'
import { posDeviceToken } from '../../lib/posDeviceHttpClient'
import { isApiError } from '../../types/domain'

const K = 'components.posDevice.PosDevicePairPage'

const PIN_PATTERN = /^\d{4,6}$/

const ERROR_KEYS: Record<string, string> = {
  POS_DEVICE_PAIRING_TOKEN_EXPIRED: 'errorExpired',
  POS_DEVICE_PAIRING_TOKEN_INVALID: 'errorInvalid',
  POS_DEVICE_PAIRING_TOKEN_USED: 'errorUsed',
  NETWORK_ERROR: 'errorNetwork',
}

export default function PosDevicePairPage() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const businessId = searchParams.get('b') ?? ''
  const userProfileId = searchParams.get('u') ?? ''
  const token = searchParams.get('t') ?? ''

  const [deviceName, setDeviceName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const hasValidLink = Boolean(businessId && userProfileId && token)

  const bookingLang = parsePublicBookingLang(currentLanguage)
  const bookingCopy = useMemo(() => getPublicBookingCopy(bookingLang), [bookingLang])
  const bookingLocale = useMemo(() => bookingLocaleFromLang(bookingLang), [bookingLang])

  const promotionsQuery = useQuery({
    queryKey: ['posDevicePairPromotions', businessId, userProfileId, token],
    queryFn: () => posDevicePairingRepository.getPairPromotions(businessId, userProfileId, token),
    enabled: hasValidLink,
    retry: false,
    staleTime: 60_000,
  })

  // Same banner carousel as /b/{slug} booking (dots + autoplay when 2+ offers).
  const promotions = useMemo(() => {
    const list = promotionsQuery.data ?? []
    return list
      .filter((p) => p.isActive && isPromotionInScheduleNow(p))
      .map((p) => ({
        id: p.id,
        name: p.name,
        badgeLabel: p.badgeLabel ?? '',
        discountType: p.discountType,
        discountValue: p.discountValue,
        daysOfWeek: p.daysOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
        primaryBannerColorHex: p.primaryBannerColorHex ?? null,
        primaryBannerImageUrl: p.primaryBannerImageUrl ?? null,
        photoUrl: p.photoUrl ?? null,
      }))
  }, [promotionsQuery.data])

  if (!hasValidLink) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-nexoraCanvas p-6">
        <div className="w-full max-w-md rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight text-nexoraText">
            <TabletSmartphone className="h-6 w-6 text-nexoraBrand" />
            {t(`${K}.title`)}
          </h1>
          <p className="mt-4 flex items-start gap-2 text-sm font-bold text-nexoraDanger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {t(`${K}.errorInvalid`)}
          </p>
        </div>
      </div>
    )
  }

  const trimmedName = deviceName.trim()
  const pinValid = PIN_PATTERN.test(pin) && pin === confirmPin
  const canSubmit = !isSubmitting && trimmedName.length > 0 && pinValid

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    setErrorKey(null)
    try {
      const result = await posDevicePairingRepository.pair({
        businessId,
        userProfileId,
        token,
        deviceName: trimmedName,
        pin,
      })
      // Stored before navigating: the next screen's very first request needs it.
      posDeviceToken.set(result.accessToken)
      navigate('/self-checkin', { replace: true })
    } catch (err) {
      const code = isApiError(err) ? err.errorCode : ''
      setErrorKey(ERROR_KEYS[code] ?? 'errorGeneric')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-nexoraCanvas p-6">
      <div className="flex w-full max-w-md flex-col items-stretch gap-8">
        {promotions.length > 0 ? (
          <div className="public-booking-root pos-device-pair-promotions">
            <BookingPromotions
              promotions={promotions}
              copy={bookingCopy}
              locale={bookingLocale}
            />
          </div>
        ) : null}

        <div className="w-full rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight text-nexoraText">
            <TabletSmartphone className="h-6 w-6 text-nexoraBrand" />
            {t(`${K}.title`)}
          </h1>
          <div className="mt-2">
            <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.subtitle`)}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
                  {t(`${K}.deviceName`)}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  maxLength={100}
                  placeholder={t(`${K}.deviceNamePlaceholder`)}
                  className="h-14 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-4 text-base text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
                />
                <p className="text-[11px] text-nexoraMuted">{t(`${K}.deviceNameHint`)}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
                  {t(`${K}.accessPin`)}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t(`${K}.pinPlaceholder`)}
                  className="h-14 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-4 text-base tracking-[0.4em] text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t(`${K}.confirmPinPlaceholder`)}
                  className="h-14 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-4 text-base tracking-[0.4em] text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
                />
                <p className="text-[11px] text-nexoraMuted">{t(`${K}.pinHint`)}</p>
              </div>

              {errorKey && (
                <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm font-bold text-nexoraDanger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {t(`${K}.${errorKey}`)}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
                {t(`${K}.submit`)}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
