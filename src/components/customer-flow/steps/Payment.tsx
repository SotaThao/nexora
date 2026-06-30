import React from 'react'
import { Bitcoin } from 'lucide-react'
import { PAYOUT_UI_LABELS } from '../../../data/paymentMethodTypes'

export const WalletLogos = {
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY" className="h-[18px] w-[18px] object-contain" />
  ),
  crypto: (
    <Bitcoin className="h-[18px] w-[18px] text-white" />
  ),
}

const WALLET_CATALOG = {
  zelle: { name: 'Zelle', key: 'zelle', color: 'bg-walletZelle hover:bg-walletZelleDark text-white', logo: WalletLogos.zelle },
  bankwire: { name: 'Bank Wire', key: 'bankwire', color: 'bg-slate-600 hover:bg-slate-700 text-white', logo: WalletLogos.bankwire },
  paypal: { name: 'PayPal', key: 'paypal', color: 'bg-walletPaypal hover:bg-walletPaypalDark text-white', logo: WalletLogos.paypal },
  venmo: { name: 'Venmo', key: 'venmo', color: 'bg-walletVenmo hover:bg-walletVenmoDark text-white', logo: WalletLogos.venmo },
  cashapp: { name: 'Cash App', key: 'cashapp', color: 'bg-walletCashapp hover:bg-walletCashappDark text-white', logo: WalletLogos.cashapp },
  applecash: {
    name: 'Apple Cash',
    key: 'applecash',
    color: 'bg-nexoraCanvas border border-nexoraBorder text-nexoraText',
    logo: WalletLogos.applecash
  },
  vlinkpay: {
    name: 'VLINKPAY Wallet',
    key: 'vlinkpay',
    color: 'bg-nexoraCanvas border border-nexoraBorder text-nexoraText',
    logo: WalletLogos.vlinkpay
  },
  crypto: { name: 'Crypto Wallet', key: 'crypto', color: 'bg-amber-500 hover:bg-amber-600 text-white', logo: WalletLogos.crypto },
}

function normalizeWalletKeys(availablePaymentWalletKeys) {
  if (Array.isArray(availablePaymentWalletKeys)) return availablePaymentWalletKeys
  if (availablePaymentWalletKeys instanceof Set) return Array.from(availablePaymentWalletKeys)
  return []
}

export function getWalletOptions(availablePaymentWalletKeys) {
  return normalizeWalletKeys(availablePaymentWalletKeys).map((key) => {
    const catalog = WALLET_CATALOG[key]
    if (catalog) return catalog
    const label = PAYOUT_UI_LABELS[key] || key
    return {
      name: label,
      key,
      color: 'bg-slate-600 hover:bg-slate-700 text-white',
      logo: WalletLogos[key] || WalletLogos.crypto,
    }
  })
}

export default function Payment({
  t,
  availablePaymentWalletKeys,
  isPaymentMethodsLoading,
  multiStaffPaymentBlocked,
  setSelectedWalletObj,
  setSelectedWallet,
  setTipRefNumber,
  setStep,
  isApiMode,
  handlePay,
}) {
  const walletOptions = getWalletOptions(availablePaymentWalletKeys)

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h3 className="font-extrabold text-lg text-nexoraText">{t('customer.payment_title')}</h3>
        <p className="text-xs text-nexoraMuted">{t('customer.payment_desc')}</p>
      </div>

      {isPaymentMethodsLoading && walletOptions.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <div className="h-8 w-8 border-4 border-nexoraBrand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-nexoraMuted font-medium">{t('common.loading')}</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {walletOptions.map(wallet => {
          return (
            <button
              key={wallet.key}
              onClick={() => {
                setSelectedWalletObj(wallet)
                setSelectedWallet(wallet.name)
                setTipRefNumber(Math.floor(1000 + Math.random() * 9000).toString())
                if (isApiMode && typeof handlePay === 'function') {
                  // API mode: create the tip on the backend (POST /touch/tip)
                  // and fetch the payment link before showing wallet details.
                  handlePay(wallet.name, wallet.key)
                } else {
                  setStep('wallet_details')
                }
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm bg-white border border-nexoraBorder text-nexoraText shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${wallet.color}`}>
                  {wallet.logo}
                </span>
                <span>{wallet.name}</span>
              </div>
              <span className="text-xs text-nexoraSubtle font-medium">{t('customer.choose_chevron')}</span>
            </button>
          )
        })}
      </div>

      {!isPaymentMethodsLoading && walletOptions.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
          <p className="text-sm font-bold text-amber-900">
            {multiStaffPaymentBlocked === 'missing_business'
              ? t('customer.multi_staff_missing_business')
              : multiStaffPaymentBlocked === 'missing_payment_methods'
                ? t('customer.multi_staff_missing_payment_method')
                : t('customer.payment_empty_title')}
          </p>
          {multiStaffPaymentBlocked ? null : (
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{t('customer.payment_empty_desc')}</p>
          )}
        </div>
      ) : null}

      <button
        onClick={() => setStep('tip_amount')}
        className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
      >
        {t('common.back')}
      </button>
    </div>
  )
}
