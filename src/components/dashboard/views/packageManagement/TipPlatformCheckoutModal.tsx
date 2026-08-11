import SubscriptionPaymentModal from '../../modals/SubscriptionPaymentModal'
import type {
  PurchasableSubscriptionPlan,
  SubscriptionBillingCycle,
} from '../../../../data/repositories/subscriptionPayments'

type TipPlatformCheckoutModalProps = {
  paymentPlan: PurchasableSubscriptionPlan | null
  selectedPackage: { id: string } | undefined
  paymentPlanPrice: number
  billingCycle?: SubscriptionBillingCycle
  onClose: () => void
}

/** Billing fields are filled inside the modal from GET /userprofile/me. */
export default function TipPlatformCheckoutModal({
  paymentPlan,
  selectedPackage,
  paymentPlanPrice,
  billingCycle,
  onClose,
}: TipPlatformCheckoutModalProps) {
  if (!paymentPlan || !selectedPackage) return null

  return (
    <SubscriptionPaymentModal
      isOpen
      plan={paymentPlan}
      packageId={selectedPackage.id}
      price={paymentPlanPrice}
      billingCycle={billingCycle}
      onClose={onClose}
      onSuccess={onClose}
    />
  )
}
