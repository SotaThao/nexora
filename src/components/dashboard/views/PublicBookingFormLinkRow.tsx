import { useCallback, useMemo } from 'react'
import { Copy } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useMerchantVoiceTenantIdentity } from '../../../data/hooks/useMerchantVoiceBookings'
import { copyTextToClipboard } from '../../../utils/clipboard'
import { buildPublicBookingFormUrl } from '../../../utils/publicBookingUrl'

const TK = 'components.dashboard.views.BookingHubView'

/** Row under AI Hub tabs: public booking form URL + copy. */
export default function PublicBookingFormLinkRow() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: tenant } = useMerchantVoiceTenantIdentity()

  const bookingUrl = useMemo(
    () => buildPublicBookingFormUrl(tenant?.businessKey),
    [tenant?.businessKey],
  )

  const handleCopy = useCallback(async () => {
    if (!bookingUrl) return
    try {
      await copyTextToClipboard(bookingUrl)
      showToast(t(`${TK}.publicBookingFormCopied`), 'success')
    } catch {
      showToast(t(`${TK}.publicBookingFormCopyFailed`), 'error')
    }
  }, [bookingUrl, showToast, t])

  if (!bookingUrl) return null

  return (
    <div className="public-booking-form-link" data-public-booking-form-link>
      <div className="public-booking-form-link-copy">
        <span className="public-booking-form-link-label">
          {t(`${TK}.publicBookingForm`)}
        </span>
        <a
          className="public-booking-form-link-url"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={bookingUrl}
        >
          {bookingUrl}
        </a>
      </div>
      <button
        type="button"
        className="public-booking-form-link-copy-btn"
        onClick={() => {
          void handleCopy()
        }}
        aria-label={t(`${TK}.publicBookingFormCopyAria`)}
      >
        <Copy aria-hidden="true" />
        <span>{t(`${TK}.publicBookingFormCopy`)}</span>
      </button>
    </div>
  )
}
