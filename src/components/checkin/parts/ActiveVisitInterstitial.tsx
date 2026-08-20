// Shown between the keypad and the page when the number typed already has a visit in progress.
//
// A soft stop with two ways forward, never a block: a family or a group of friends routinely check
// in on one phone, so refusing the second person would be wrong far more often than the duplicate
// it prevents. Its own screen rather than a banner on the page, so the choice is made before any
// of the form has been filled in and cannot be scrolled past.
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const K = 'components.checkin.ActiveVisitInterstitial'

export default function ActiveVisitInterstitial({
  orderNumber,
  onExit,
  onContinue,
}: {
  orderNumber: string
  onExit: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-nexoraWarning" />
      <div className="space-y-2">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.title`, { orderNumber })}</h1>
        <p className="text-sm text-nexoraMuted">{t(`${K}.body`)}</p>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={onExit}
          className="h-14 w-full rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark"
        >
          {t(`${K}.exit`)}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="h-14 w-full rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand"
        >
          {t(`${K}.newGuest`)}
        </button>
      </div>
    </div>
  )
}
