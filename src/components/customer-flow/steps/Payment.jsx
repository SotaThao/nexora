import React from 'react'

const WalletLogos = {
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
  applepay: (
    <div className="flex items-center gap-[1px] justify-center scale-90 origin-center shrink-0">
      <svg viewBox="0 0 170 170" className="h-[12px] w-[12px] fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.73-7.25-7.28-11.45-13.68-4.73-7.24-8.55-15.53-11.45-24.85-2.9-9.33-4.35-18.21-4.35-26.65 0-14.93 3.94-27.17 11.83-36.73 7.89-9.55 17.58-14.39 29.08-14.5 5.8-.11 11.9 1.67 18.3 5.35 6.4 3.68 11.13 5.52 14.18 5.52 2.34 0 6.81-1.67 13.43-5.02 6.62-3.34 12.52-4.85 17.68-4.52 13.25.67 23.95 5.57 32.09 14.72-11.48 6.91-17.11 16.28-16.89 28.1.22 9.58 3.84 17.6 10.87 24.08 7.02 6.47 15.21 9.94 24.57 10.42-2.12 6.13-4.68 12.26-7.69 18.38zM119.22 35.24c0-7.8-2.79-15.01-8.36-21.62C105.3 7 98 3.32 89.17 3.32c-.11.9-.11 1.78.11 2.68.22 5.58 2.51 11.23 6.85 16.94 4.35 5.71 9.76 9.47 16.23 11.3 1.34-5.36 6.86-9 6.86-9z"/>
      </svg>
      <span className="font-black text-[10px] tracking-tighter ml-[1px] leading-none select-none">Pay</span>
    </div>
  ),
}

export default function Payment({
  t,
  selectedStaffMembers,
  selectedStaffHasAnyPayment,
  businessPaymentAccounts,
  setSelectedWalletObj,
  setSelectedWallet,
  setTipRefNumber,
  setStep,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h3 className="font-extrabold text-lg text-nexoraText">{t('customer.payment_title')}</h3>
        <p className="text-xs text-nexoraMuted">{t('customer.payment_desc')}</p>
      </div>

      <div className="space-y-3">
        {[
          { name: 'Zelle', key: 'zelle', color: 'bg-walletZelle hover:bg-walletZelleDark text-white', logo: WalletLogos.zelle },
          { name: 'Bank Wire', key: 'bankwire', color: 'bg-slate-600 hover:bg-slate-700 text-white', logo: WalletLogos.bankwire },
          { name: 'PayPal', key: 'paypal', color: 'bg-walletPaypal hover:bg-walletPaypalDark text-white', logo: WalletLogos.paypal },
          { name: 'Venmo', key: 'venmo', color: 'bg-walletVenmo hover:bg-walletVenmoDark text-white', logo: WalletLogos.venmo },
          { name: 'Cash App', key: 'cashapp', color: 'bg-walletCashapp hover:bg-walletCashappDark text-white', logo: WalletLogos.cashapp },
          { name: 'Apple Pay', key: 'applecash', color: 'bg-black hover:opacity-90 text-white', logo: WalletLogos.applepay }
        ].filter(wallet => {
          if (selectedStaffMembers.length === 1) {
            const staff = selectedStaffMembers[0]
            if (selectedStaffHasAnyPayment) {
              return !!staff.paymentAccounts?.[wallet.key]
            } else {
              return !!businessPaymentAccounts?.[wallet.key]
            }
          }
          return !!businessPaymentAccounts?.[wallet.key]
        }).map(wallet => {
          return (
            <button
              key={wallet.key}
              onClick={() => {
                setSelectedWalletObj(wallet)
                setSelectedWallet(wallet.name)
                setTipRefNumber(Math.floor(1000 + Math.random() * 9000).toString())
                setStep('wallet_details')
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm bg-white border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm transition"
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

      <button
        onClick={() => setStep('tip_amount')}
        className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
      >
        {t('common.back')}
      </button>
    </div>
  )
}
