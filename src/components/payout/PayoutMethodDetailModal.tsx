import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  getPaymentMethodDisplayName,
  payoutTypeToUiKey,
} from '../../data/paymentMethodTypes'
import { PayoutUiKey } from '../../data/payoutUiKeys'
import type { PaymentMethodDto } from '../../types/domain'
import {
  formatPaymentMethodAccountDisplay,
  parseBankWireAccount,
} from './bankWireAccount'
import {
  emptyVlinkpayAddresses,
  parseVlinkpayAddressesFromMethod,
  VLINKPAY_COINS,
  VLINKPAY_NETWORK,
  VLINKPAY_WALLET_LABEL,
  type VlinkpayAddresses,
  type VlinkpayCoinKey,
} from './vlinkpayWallet'

const SETUP_TK = 'components.dashboard.modals.PayoutSetupModal'
const PAY_TK = 'components.customer_flow.steps.WalletDetails'
const PROFILE_TK = 'components.settings.tabs.ProfileTab'

interface PayoutMethodDetailModalProps {
  method: PaymentMethodDto | null
  logo?: ReactNode
  onClose: () => void
}

const ADDRESS_COPY_BTN_WIDTH = 92
const ADDRESS_ROW_GAP = 8

function VlinkpayAddressCopyRow({
  address,
  copied,
  onCopy,
  copyLabel,
}: {
  address: string
  copied: boolean
  onCopy: () => void
  copyLabel: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [stackCopy, setStackCopy] = useState(false)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const measure = () => {
      const probe = document.createElement('span')
      probe.textContent = address
      probe.style.cssText = [
        'position:absolute',
        'visibility:hidden',
        'white-space:nowrap',
        'font: 500 11px/20px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      ].join(';')
      host.appendChild(probe)
      const available = host.clientWidth - ADDRESS_COPY_BTN_WIDTH - ADDRESS_ROW_GAP
      setStackCopy(probe.offsetWidth > available)
      host.removeChild(probe)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [address])

  return (
    <div
      ref={hostRef}
      className={stackCopy ? 'mt-1.5 flex flex-col gap-2' : 'mt-1.5 flex items-center gap-2'}
    >
      <p
        className={`min-w-0 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 font-mono text-[11px] font-medium leading-5 text-nexoraText sm:text-xs sm:leading-5 ${
          stackCopy ? 'break-all' : 'flex-1 truncate'
        }`}
      >
        {address}
      </p>
      <button
        type="button"
        onClick={onCopy}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-nexoraBrand/30 bg-white text-xs font-bold text-nexoraBrand transition hover:bg-nexoraBrandSoft ${
          stackCopy ? 'min-h-10 w-full' : 'h-10 min-w-[84px] px-2.5'
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Copy className="h-3.5 w-3.5" />}
        {copyLabel}
      </button>
    </div>
  )
}

function VlinkpayAddressCards({ addresses }: { addresses: VlinkpayAddresses }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [copiedKey, setCopiedKey] = useState<VlinkpayCoinKey | null>(null)

  const copyAddress = async (coin: VlinkpayCoinKey, address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedKey(coin)
      showToast(t('common.copied'), 'success')
    } catch {
      showToast(t('errors.generic'), 'error')
    }
  }

  useEffect(() => {
    if (!copiedKey) return undefined
    const timer = window.setTimeout(() => setCopiedKey(null), 1800)
    return () => window.clearTimeout(timer)
  }, [copiedKey])

  const configuredCoins = VLINKPAY_COINS.filter((coin) => addresses[coin.key].trim())

  if (!configuredCoins.length) {
    return (
      <p className="text-sm font-semibold text-nexoraText">
        {t(`${PROFILE_TK}.notConfigured`)}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {configuredCoins.map((coin) => {
        const address = addresses[coin.key].trim()
        const copied = copiedKey === coin.key
        return (
          <div
            key={coin.key}
            className="rounded-2xl border border-nexoraBorder bg-nexoraCanvas/60 p-3 text-left sm:p-3.5"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={coin.asset}
                alt={coin.symbol}
                className="h-9 w-9 shrink-0 rounded-full object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold leading-5 text-nexoraText">{coin.symbol}</div>
                <div className="text-[11px] font-medium text-nexoraMuted">{coin.name}</div>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-nexoraBrand ring-1 ring-nexoraBrand/20">
                {VLINKPAY_NETWORK}
              </span>
            </div>

            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t(`${SETUP_TK}.vlinkpayWalletAddressLabel`)}
            </p>
            <VlinkpayAddressCopyRow
              address={address}
              copied={copied}
              onCopy={() => copyAddress(coin.key, address)}
              copyLabel={t(copied ? 'common.copied' : 'common.copy')}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function PayoutMethodDetailModal({
  method,
  logo,
  onClose,
}: PayoutMethodDetailModalProps) {
  const { t } = useTranslation()

  if (!method || typeof document === 'undefined') return null

  const uiKey = method.uiKey || payoutTypeToUiKey(method.type || '')
  const label = method.name || getPaymentMethodDisplayName(method.type || '')
  const isBankWire = uiKey === PayoutUiKey.BankWire
  const isVlinkpay = uiKey === PayoutUiKey.VlinkPay
  const vlinkpayAddresses = isVlinkpay ? parseVlinkpayAddressesFromMethod(method) : null
  const bankWireDetails = isBankWire ? parseBankWireAccount(method.accountInfo) : null
  const accountName = isBankWire
    ? bankWireDetails?.beneficiaryName.trim() || method.accountName?.trim() || ''
    : method.accountName?.trim() || ''
  const bankWireRows = bankWireDetails
    ? [
        ['components.payout.bankWireForm.bankName', bankWireDetails.bankName, ''],
        ['components.payout.bankWireForm.routingNumber', bankWireDetails.routingNumber, ''],
        ['components.payout.bankWireForm.accountNumber', bankWireDetails.accountNumber, ''],
        ['components.payout.bankWireForm.bankAddress', bankWireDetails.bankAddress, 'col-span-2'],
        ['components.payout.bankWireForm.city', bankWireDetails.city, ''],
        ['components.payout.bankWireForm.state', bankWireDetails.state, ''],
        ['components.payout.bankWireForm.zipCode', bankWireDetails.zipCode, ''],
        ['components.payout.bankWireForm.country', bankWireDetails.country, ''],
      ].filter(([, value]) => Boolean(value.trim()))
    : []
  const accountDisplay = formatPaymentMethodAccountDisplay(
    uiKey,
    method.accountInfo,
    method.cryptoAddresses,
  )
  const hasAccountInfo = Boolean(accountDisplay?.trim())
  const hasAccountName = Boolean(accountName)
  const qrImageUrl = method.imageUrl?.trim() || ''
  const hasQrCode = Boolean(qrImageUrl)
  const dialogTitleId = 'payout-method-detail-title'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-dvh items-center justify-center overflow-hidden bg-slate-950/70 p-2 backdrop-blur-sm sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className={`max-h-[calc(100dvh-1rem)] w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-white/80 bg-white text-center shadow-2xl animate-scaleIn ${
          isVlinkpay ? 'max-w-[400px] sm:max-w-[420px]' : 'max-w-[340px]'
        }`}
      >
        <div className={`relative ${isVlinkpay ? 'px-4 pb-5 pt-5 sm:px-5 sm:pb-6 sm:pt-6' : 'px-4 pb-4 pt-4'}`}>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute right-2 top-2 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className={`mx-auto flex items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraCanvas ${
            isVlinkpay ? 'h-11 w-11' : 'h-10 w-10'
          }`}>
            {logo}
          </div>
          <h3
            id={dialogTitleId}
            className={`mt-2 font-black leading-tight text-nexoraText ${
              isVlinkpay ? 'text-lg sm:text-xl' : 'text-xl'
            }`}
          >
            {isVlinkpay ? VLINKPAY_WALLET_LABEL : label}
          </h3>
          {isVlinkpay && (
            <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
              {t(`${PAY_TK}.vlinkpayFixedNetwork`, { network: VLINKPAY_NETWORK })}
            </p>
          )}

          {!isVlinkpay && (
          <div className="mt-3">
            {hasQrCode ? (
              <>
                <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(`${PROFILE_TK}.scanToPay`)}
                </div>
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                  <img
                    src={qrImageUrl}
                    alt={`${label} QR code`}
                    className="h-full w-full rounded-lg object-contain"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-xs font-semibold text-nexoraMuted">
                {t(`${PROFILE_TK}.noQrCode`)}
              </div>
            )}
          </div>
          )}

          <div className={`mt-4 text-left ${isVlinkpay ? '' : 'divide-y divide-slate-100 border-y border-slate-100'}`}>
            {hasAccountName && (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(`${PROFILE_TK}.payTo`)}
                </div>
                <div className="mt-0.5 break-words text-xs font-black text-nexoraText">
                  {accountName}
                </div>
              </div>
            )}
            {isBankWire ? (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(`${PROFILE_TK}.accountDetails`)}
                </div>
                {bankWireRows.length > 0 ? (
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    {bankWireRows.map(([labelKey, value, className]) => (
                      <div key={labelKey} className={className}>
                        <div className="text-[8px] font-bold uppercase tracking-wide text-nexoraMuted">
                          {t(labelKey)}
                        </div>
                        <div className="mt-0.5 break-words font-mono text-[11px] font-black text-nexoraText">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-0.5 text-xs font-black text-nexoraText">
                    {t(`${PROFILE_TK}.notConfigured`)}
                  </div>
                )}
              </div>
            ) : isVlinkpay ? (
              <div className="pt-1">
                <div className="mb-2.5 text-xs font-extrabold uppercase tracking-wide text-nexoraMuted sm:text-sm">
                  {t(`${SETUP_TK}.vlinkpayAddressSectionTitle`)}
                </div>
                <VlinkpayAddressCards addresses={vlinkpayAddresses || emptyVlinkpayAddresses()} />
              </div>
            ) : (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(`${PROFILE_TK}.accountDetails`)}
                </div>
                <div className="mt-0.5 break-words font-mono text-xs font-black text-nexoraText">
                  {hasAccountInfo
                    ? accountDisplay
                    : t(`${PROFILE_TK}.notConfigured`)}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`mt-4 w-full rounded-xl bg-nexoraBrand px-4 font-extrabold uppercase text-white transition hover:bg-nexoraBrandDark ${
              isVlinkpay ? 'min-h-11 py-3 text-sm' : 'py-2.5 text-xs'
            }`}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
