import { Settings, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { SUBSCRIPTION_PAYMENT_MODAL_TK } from './subscriptionPaymentConstants'

type Props = {
  /** Close the checkout modal before navigating to onboarding. */
  onBeforeNavigate?: () => void
  className?: string
}

/**
 * Shown in place of the Stripe card form when the merchant has not completed
 * store setup (same condition as dashboard SetupGuideBanner / `hasSetup`).
 */
export default function CompleteStoreSetupCardPrompt({
  onBeforeNavigate,
  className = '',
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tk = `${SUBSCRIPTION_PAYMENT_MODAL_TK}`

  const handleClick = () => {
    onBeforeNavigate?.()
    navigate('/onboarding')
  }

  return (
    <div
      className={[
        'rounded-xl border border-nexoraBrand/20 bg-nexoraBrand/5 p-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-sm font-semibold text-nexoraText">
        {t(`${tk}.subscription_card_needs_store_setup_title`)}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">
        {t(`${tk}.subscription_card_needs_store_setup_body`)}
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="group mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-sm font-bold text-white transition hover:bg-nexoraBrand/90"
      >
        <Settings className="h-4 w-4 transition-transform group-hover:rotate-90" />
        <span>
          {t('components.dashboard.overview.SetupGuideBanner.completeStoreSetup')}
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  )
}
