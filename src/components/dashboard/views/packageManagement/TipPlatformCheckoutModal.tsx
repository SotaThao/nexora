import SubscriptionPaymentModal from '../../modals/SubscriptionPaymentModal'
import type { PurchasableSubscriptionPlan } from '../../../../data/repositories/subscriptionPayments'

type TipPlatformCheckoutModalProps = {
  paymentPlan: PurchasableSubscriptionPlan | null
  selectedPackage: { id: string } | undefined
  paymentPlanPrice: number
  onClose: () => void
}

/** Billing fields are filled inside the modal from GET /userprofile/me. */
export default function TipPlatformCheckoutModal({
  paymentPlan,
  selectedPackage,
  paymentPlanPrice,
  onClose,
}: TipPlatformCheckoutModalProps) {
  if (!paymentPlan || !selectedPackage) return null

  return (
    <div className="nx-campaign-root">
      <SubscriptionPaymentModal
        isOpen
        plan={paymentPlan}
        packageId={selectedPackage.id}
        price={paymentPlanPrice}
        onClose={onClose}
        onSuccess={onClose}
      />
    </div>
  )
}
