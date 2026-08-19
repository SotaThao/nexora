import { useTranslation } from '../../contexts/LanguageContext'
import {
  VLINKPAY_NETWORK,
  getVlinkpayCoinBySymbol,
  normalizeVlinkpayCryptoSymbol,
  type VlinkpayCryptoAddressDto,
} from './vlinkpayWallet'

const ADDRESS_LABEL_KEY = 'components.dashboard.modals.PayoutSetupModal.vlinkpayWalletAddressLabel'

type VlinkpayCryptoWalletSummaryProps = {
  wallet?: Pick<VlinkpayCryptoAddressDto, 'network' | 'symbol' | 'address'> | null
}

export default function VlinkpayCryptoWalletSummary({ wallet }: VlinkpayCryptoWalletSummaryProps) {
  const { t } = useTranslation()
  const address = String(wallet?.address || '').trim()
  if (!address) return null

  const coin = getVlinkpayCoinBySymbol(wallet?.symbol)
  const symbol = normalizeVlinkpayCryptoSymbol(wallet?.symbol) || coin?.symbol || ''
  const network = String(wallet?.network || '').trim() || VLINKPAY_NETWORK

  return (
    <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/60 p-2.5 text-left">
      <div className="flex items-center gap-2">
        {coin ? (
          <img
            src={coin.asset}
            alt={coin.symbol}
            className="h-8 w-8 shrink-0 rounded-full object-contain"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          {symbol ? (
            <div className="text-xs font-extrabold leading-4 text-nexoraText">{symbol}</div>
          ) : null}
          {coin?.name ? (
            <div className="text-[10px] font-medium text-nexoraMuted">{coin.name}</div>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-nexoraBrand ring-1 ring-nexoraBrand/20">
          {network}
        </span>
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
        {t(ADDRESS_LABEL_KEY)}
      </p>
      <p className="mt-0.5 break-all font-mono text-[11px] font-semibold leading-snug text-nexoraText">
        {address}
      </p>
    </div>
  )
}
