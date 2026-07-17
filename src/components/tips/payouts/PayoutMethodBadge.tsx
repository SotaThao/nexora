import { CreditCard } from 'lucide-react'
import { WalletLogos } from '../../dashboard/constants'
import { payoutMethodToUiKey } from '../../../utils/payoutDisplay'

export default function PayoutMethodBadge({
  method,
  variant = 'compact',
}: {
  method: string
  variant?: 'compact' | 'featured'
}) {
  const uiKey = payoutMethodToUiKey(method)
  const logo = WalletLogos[uiKey as keyof typeof WalletLogos]
  const variantClass = variant === 'featured'
    ? 'gap-2 rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs shadow-sm'
    : 'gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px]'

  return (
    <span
      data-variant={variant}
      className={`inline-flex items-center font-bold text-violet-700 ${variantClass}`}
    >
      {logo ?? <CreditCard className="h-3 w-3" />}
      {method}
    </span>
  )
}
