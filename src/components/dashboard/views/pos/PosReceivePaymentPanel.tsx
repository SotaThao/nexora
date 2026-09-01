import { useMemo, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { payoutTypeToUiKey } from '../../../../data/paymentMethodTypes'
import { buildPublicQrImageUrl } from '../../../../data/repositories/publicQr'
import type { PaymentMethodDto } from '../../../../types/domain'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import { buildDirectPaymentPageUrl } from '../../../../utils/merchantBusinessId'
import PayoutMethodDetailModal from '../../../payout/PayoutMethodDetailModal'
import DirectPaymentQrPreviewModal from '../../../settings/DirectPaymentQrPreviewModal'
import { WalletLogos } from '../../constants'

export default function PosReceivePaymentPanel({
  method,
  amount,
  businessId,
  businessName,
  onMarkReceived,
  disabled = false,
}: {
  method: PaymentMethodDto
  amount: number
  businessId: string
  businessName?: string
  onMarkReceived: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const [enlarged, setEnlarged] = useState(false)
  const methodName = method.name || method.type
  const methodUiKey = method.uiKey || payoutTypeToUiKey(method.type)
  const methodLogoGraphic = WalletLogos[methodUiKey as keyof typeof WalletLogos]
  const methodLogo = (
    <span
      role="img"
      aria-label={`${methodName} logo`}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas text-[10px] font-black uppercase text-nexoraBrand"
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {methodLogoGraphic || methodName.slice(0, 2)}
      </span>
    </span>
  )
  const fallbackPaymentUrl = useMemo(() => buildDirectPaymentPageUrl(businessId), [businessId])
  const methodQrUrl = method.imageUrl?.trim()
  const qrSrc = methodQrUrl || buildPublicQrImageUrl(fallbackPaymentUrl, 320)
  const accountName = method.accountName?.trim()
  const accountInfo = method.accountInfo?.trim()
  const cryptoAddresses = (method.cryptoAddresses ?? []).filter((entry) => entry.symbol && entry.address)
  const fallbackRecipient = businessName?.trim() || '—'

  return (
    <>
      <div className="grid gap-3 rounded-xl border border-nexoraBrand/25 bg-nexoraBrandSoft/25 p-3 sm:grid-cols-[112px_minmax(0,1fr)]">
        <div className="rounded-lg bg-white p-2 text-center shadow-sm">
          <img src={qrSrc} alt={`${methodName} payment QR`} className="mx-auto aspect-square w-full object-contain" />
          <button
            type="button"
            onClick={() => setEnlarged(true)}
            className="mt-1 text-[10px] font-semibold text-nexoraBrand underline underline-offset-2"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.enlargeQr')}
          </button>
        </div>
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.payWith', { method: methodName })}
            </p>
            <p className="text-sm font-semibold text-nexoraText">
              {t('components.dashboard.views.pos.PosOrderWorkspace.scanToPay', { amount: formatUsdAmount(amount) })}
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-white/80 px-3 py-2 text-xs">
            <div>
              <span className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.sendPaymentTo')}</span>{' '}
              <span className="font-bold text-nexoraText">
                {accountName || (!accountInfo && cryptoAddresses.length === 0 ? fallbackRecipient : null)}
              </span>
              {accountName && accountInfo ? <span className="text-nexoraMuted"> · </span> : null}
              {accountInfo ? <span className="break-all font-bold text-nexoraBrandDark">{accountInfo}</span> : null}
            </div>
            {cryptoAddresses.map((entry) => (
              <div key={`${entry.network}:${entry.symbol}:${entry.address}`} className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-semibold text-nexoraText">{entry.symbol} · {entry.network}</span>
                <span className="min-w-0 break-all font-bold text-nexoraBrandDark">{entry.address}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onMarkReceived}
            disabled={disabled}
            className="inline-flex h-8 min-w-[140px] items-center justify-center rounded-lg bg-nexoraBrand px-4 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.markAsReceived')}
          </button>
        </div>
      </div>
      {methodQrUrl ? (
        <PayoutMethodDetailModal
          method={enlarged ? method : null}
          logo={methodLogo}
          onClose={() => setEnlarged(false)}
        />
      ) : (
        <DirectPaymentQrPreviewModal
          open={enlarged}
          onClose={() => setEnlarged(false)}
          title={`${methodName} payment QR`}
          businessName={businessName}
          previewQrUrl={qrSrc}
          paymentPageUrl={fallbackPaymentUrl}
          scanCaption={t('components.dashboard.views.pos.PosOrderWorkspace.scanToPay', {
            amount: formatUsdAmount(amount),
          })}
        />
      )}
    </>
  )
}
