// PosPublicCheckInView — POS > Public Check-In. The Owner prints a QR for the door so
// customers check in from their own phone (POS-Public-Check-In-Technical.md §1/§3).
import { useTranslation } from '../../../../contexts/LanguageContext'
import PublicCheckInQrPanel from './PublicCheckInQrPanel'

const K = 'components.dashboard.views.pos.PosPublicCheckInView'

export default function PosPublicCheckInView({
  businessId,
  businessSlug,
  businessName,
}: {
  businessId?: string
  businessSlug?: string
  businessName?: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <section className="shrink-0 space-y-1 px-0.5">
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">
          {t('dashboard.menu.pos_public_checkin')}
        </h1>
        <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.description`)}</p>
      </section>

      <PublicCheckInQrPanel
        businessId={businessId}
        businessSlug={businessSlug}
        businessName={businessName}
      />
    </div>
  )
}
