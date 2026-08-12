import { Settings, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  STORE_SETUP_GATE_DOM_ID,
  STORE_SETUP_ONBOARDING_PATH,
  subscriptionModalKey,
} from './subscriptionPaymentConstants'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Blocks package checkout until the merchant completes store setup
 * (GET /api/v1/merchant/business → same `hasSetup` as the dashboard banner).
 */
export default function CompleteStoreSetupGateModal({ open, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (!open) return null

  const handleSetup = () => {
    onClose()
    navigate(STORE_SETUP_ONBOARDING_PATH)
  }

  return (
    <div
      className="fixed inset-0 z-[160] flex items-end justify-center bg-slate-900/55 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={STORE_SETUP_GATE_DOM_ID.title}
        aria-describedby={STORE_SETUP_GATE_DOM_ID.description}
        className="relative w-full max-w-md rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-nexoraMuted transition hover:bg-slate-100 hover:text-nexoraText"
          aria-label={t('common.close')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-nexoraBrand/10 text-nexoraBrand">
          <Settings className="h-5 w-5" />
        </div>

        <h2
          id={STORE_SETUP_GATE_DOM_ID.title}
          className="mt-4 text-lg font-extrabold text-nexoraText"
        >
          {t(subscriptionModalKey('purchaseNeedsStoreSetupTitle'))}
        </h2>
        <p
          id={STORE_SETUP_GATE_DOM_ID.description}
          className="mt-2 text-sm leading-relaxed text-nexoraMuted"
        >
          {t(subscriptionModalKey('purchaseNeedsStoreSetupBody'))}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-nexoraBorder bg-white px-4 text-sm font-bold text-nexoraMuted transition hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSetup}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90"
          >
            <span>{t(subscriptionModalKey('purchaseNeedsStoreSetupCta'))}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
