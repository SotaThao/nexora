import SubscriptionPaymentModal from '../../modals/SubscriptionPaymentModal'
import type {
  PurchasableSubscriptionPlan,
  SubscriptionBillingCycle,
  SubscriptionPackage,
} from '../../../../data/repositories/subscriptionPayments'
import type { UserSubscription } from '../../../../types/domain'

type TipPlatformCheckoutModalProps = {
  paymentPlan: PurchasableSubscriptionPlan | null
  selectedPackage: { id: string } | undefined
  paymentPlanPrice: number
  billingCycle?: SubscriptionBillingCycle
  currentSubscription?: UserSubscription | null
  /** Billing-cycle length (months) of the current subscription — from my-packages. */
  currentPeriodInMonths?: number | null
  /** Catalog rows, used to resolve the current plan's price for the credit estimate. */
  catalogPackages?: SubscriptionPackage[]
  onClose: () => void
}

/** Billing fields are filled inside the modal from GET /userprofile/me. */
export default function TipPlatformCheckoutModal({
  paymentPlan,
  selectedPackage,
  paymentPlanPrice,
  billingCycle,
  currentSubscription,
  currentPeriodInMonths,
  catalogPackages,
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
        billingCycle={billingCycle}
        currentSubscription={currentSubscription}
        currentPeriodInMonths={currentPeriodInMonths}
        catalogPackages={catalogPackages}
        onClose={onClose}
        onSuccess={onClose}
      />
    </div>
  )
}
