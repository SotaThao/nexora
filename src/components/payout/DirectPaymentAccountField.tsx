import {
  resolveDirectPaymentAccountDisplay,
  type VlinkpayCryptoAddressDto,
} from './vlinkpayWallet'
import VlinkpayCryptoWalletSummary from './VlinkpayCryptoWalletSummary'

type DirectPaymentAccountFieldProps = {
  accountLabel: string
  assetLabel: string
  accountInfo?: string | null
  cryptoWallet?: Pick<VlinkpayCryptoAddressDto, 'network' | 'symbol' | 'address'> | null
}

export default function DirectPaymentAccountField({
  accountLabel,
  assetLabel,
  accountInfo,
  cryptoWallet,
}: DirectPaymentAccountFieldProps) {
  if (cryptoWallet?.address) {
    return (
      <div className="col-span-2">
        <span className="block text-[10px] font-bold text-nexoraMuted">{assetLabel}</span>
        <div className="mt-1">
          <VlinkpayCryptoWalletSummary wallet={cryptoWallet} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <span className="block text-[10px] font-bold text-nexoraMuted">{accountLabel}</span>
      <span className="mt-0.5 block break-all font-semibold text-nexoraText">
        {resolveDirectPaymentAccountDisplay({ accountInfo, cryptoWallet }) || '—'}
      </span>
    </div>
  )
}
