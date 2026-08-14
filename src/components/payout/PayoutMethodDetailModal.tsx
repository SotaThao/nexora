import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  getPayoutAccountDisplayLabel,
  getPayoutAccountHolderDisplayLabel,
  getPaymentMethodDisplayName,
  payoutTypeToUiKey,
} from '../../data/paymentMethodTypes'
import type { PaymentMethodDto } from '../../types/domain'
import {
  formatPaymentMethodAccountDisplay,
  parseBankWireAccount,
} from './bankWireAccount'

interface PayoutMethodDetailModalProps {
  method: PaymentMethodDto | null
  logo?: ReactNode
  onClose: () => void
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
  const isBankWire = uiKey === 'bankwire'
  const accountDisplayLabel = getPayoutAccountDisplayLabel(uiKey, t)
  const accountHolderDisplayLabel = getPayoutAccountHolderDisplayLabel(uiKey, t)
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
  const accountDisplay = formatPaymentMethodAccountDisplay(uiKey, method.accountInfo)
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
        className="max-h-[calc(100dvh-1rem)] w-full max-w-[340px] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/80 bg-white text-center shadow-2xl animate-scaleIn"
      >
        <div className="relative px-4 pb-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute right-2 top-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraCanvas">
            {logo}
          </div>
          <h3 id={dialogTitleId} className="mt-2 text-xl font-black leading-tight text-nexoraText">
            {label}
          </h3>

          <div className="mt-3">
            {hasQrCode ? (
              <>
                <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t('components.settings.tabs.ProfileTab.scanToPay')}
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
                {t('components.settings.tabs.ProfileTab.noQrCode')}
              </div>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100 text-left">
            {hasAccountName && (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {accountHolderDisplayLabel}
                </div>
                <div className="mt-0.5 break-words text-xs font-black text-nexoraText">
                  {accountName}
                </div>
              </div>
            )}
            {isBankWire ? (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {accountDisplayLabel}
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
                    {t('components.settings.tabs.ProfileTab.notConfigured')}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2">
                <div className="text-[9px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {accountDisplayLabel}
                </div>
                <div className="mt-0.5 break-words font-mono text-xs font-black text-nexoraText">
                  {hasAccountInfo
                    ? accountDisplay
                    : t('components.settings.tabs.ProfileTab.notConfigured')}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl bg-nexoraBrand px-4 py-2.5 text-xs font-extrabold uppercase text-white transition hover:bg-nexoraBrandDark"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
