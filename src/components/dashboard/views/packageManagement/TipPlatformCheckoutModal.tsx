import SubscriptionPaymentModal from '../../modals/SubscriptionPaymentModal'
import type { PurchasableSubscriptionPlan } from '../../../../data/repositories/subscriptionPayments'
import type { SubscriptionBillingDetails } from '../../modals/SubscriptionCardPaymentForm'

type TipPlatformCheckoutModalProps = {
  paymentPlan: PurchasableSubscriptionPlan | null
  selectedPackage: { id: string } | undefined
  paymentPlanPrice: number
  billingDefaults: SubscriptionBillingDetails | undefined
  onClose: () => void
}

export default function TipPlatformCheckoutModal({
  paymentPlan,
  selectedPackage,
  paymentPlanPrice,
  billingDefaults,
  onClose,
}: TipPlatformCheckoutModalProps) {
  if (!paymentPlan || !selectedPackage) return null

  return (
    <SubscriptionPaymentModal
      isOpen
      plan={paymentPlan}
      packageId={selectedPackage.id}
      price={paymentPlanPrice}
      billingDefaults={billingDefaults}
      onClose={onClose}
      onSuccess={onClose}
    />
  )
}
