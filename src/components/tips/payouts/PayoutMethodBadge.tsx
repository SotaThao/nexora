import { CreditCard } from 'lucide-react'
import { WalletLogos } from '../../dashboard/constants'
import { payoutMethodToUiKey } from '../../../utils/payoutDisplay'

export default function PayoutMethodBadge({ method }: { method: string }) {
  const uiKey = payoutMethodToUiKey(method)
  const logo = WalletLogos[uiKey as keyof typeof WalletLogos]

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">
      {logo ?? <CreditCard className="h-3 w-3" />}
      {method}
    </span>
  )
}
