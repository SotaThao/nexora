import React from 'react'
import { Edit2 } from 'lucide-react'

const PayoutLogos = {
  zelle: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-walletZelle" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-slate-600" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-walletPaypal" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  venmo: (
    <svg viewBox="0 0 448 512" className="h-4.5 w-4.5 fill-walletVenmo" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-walletCashapp" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32c1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  )
}

const payoutMethodsList = [
  { key: 'zelle', label: 'Zelle', placeholder: 'Enter Zelle email/phone...' },
  { key: 'bankwire', label: 'Bank Wire', placeholder: 'Enter Bank Wire routing - account...' },
  { key: 'paypal', label: 'PayPal', placeholder: 'Enter PayPal email...' },
  { key: 'venmo', label: 'Venmo', placeholder: 'Enter Venmo @username...' },
  { key: 'cashapp', label: 'Cash App', placeholder: 'Enter Cash App $cashtag...' },
  { key: 'applecash', label: 'Apple Cash', placeholder: 'Enter Apple Cash phone number...' }
]

export default function StepPayments({
  payouts,
  staffId,
  currentLanguage, t,
  autoFillPayments,
  handleToggleMethod,
  handleEditPayoutAccount,
  handleActivateProfile,
  setStep,
  isDemoToolsEnabled = false,
}) {
  return (
    <div className="space-y-5 py-2 animate-fadeIn">
      <div className="border-b border-nexoraRule pb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
          {currentLanguage === 'vi' ? '3. Cấu hình Ví nhận tiền tip' : '3. Payout Configurations'}
        </h3>

        {isDemoToolsEnabled && (
          <button
            type="button"
            onClick={autoFillPayments}
            className="px-2 py-1 bg-nexoraBrandSoft hover:bg-opacity-90 text-nexoraBrand border border-nexoraBrand/20 rounded text-[9px] font-black uppercase tracking-wider transition"
          >
            ⚡ Auto-Fill Mock Handles
          </button>
        )}
      </div>

      <p className="text-xs text-nexoraMuted leading-relaxed font-medium">
        {currentLanguage === 'vi'
          ? 'Bật các kênh thanh toán bạn muốn nhận tiền. Khi khách hàng quét mã QR của bạn, họ sẽ thanh toán trực tiếp vào các tài khoản này.'
          : 'Toggle the payment channels you want to receive money. When customers scan your QR, they pay you directly to these accounts.'}
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 divide-y divide-nexoraRule">
        {payoutMethodsList.map(method => {
          const cfg = payouts[method.key] || { enabled: false, value: '' }
          return (
            <div key={method.key} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Toggle Switch on Left */}
                <button
                  type="button"
                  onClick={() => handleToggleMethod(method.key)}
                  aria-label={`Toggle ${method.label}`}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cfg.enabled ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      cfg.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Logo + Label in Middle */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-7 w-7 rounded-lg bg-nexoraSurfaceMuted border border-nexoraRule flex items-center justify-center shrink-0">
                    {PayoutLogos[method.key]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                    {cfg.value ? (
                      <div className="text-[10px] text-nexoraMuted font-mono mt-0.5 truncate max-w-28 sm:max-w-36">
                        {cfg.value}
                      </div>
                    ) : (
                      <div className="text-[10px] text-nexoraSubtle italic font-medium mt-0.5">
                        {currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Not Configured'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Button on Right */}
              <button
                type="button"
                onClick={() => handleEditPayoutAccount(method.key)}
                aria-label={`Edit ${method.label} Payout Account`}
                className="flex items-center gap-1 text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrandDark transition shrink-0 ml-2"
              >
                <Edit2 className="h-3 w-3" />
                <span>{currentLanguage === 'vi' ? 'Tài khoản' : 'Payout account'}</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* NEXORA Staff ID display at the bottom */}
      <div className="mt-4 pt-3 border-t border-nexoraRule flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-nexoraBrandSoft border border-nexoraBrand/20 flex items-center justify-center shrink-0">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-4 w-4 object-contain" />
          </span>
          <span className="text-nexoraMuted font-bold">NEXORA Staff ID</span>
        </div>
        <span className="text-nexoraText font-extrabold font-mono bg-nexoraSurfaceMuted border border-nexoraBorder px-2 py-0.5 rounded">
          {staffId || 'Pending Register'}
        </span>
      </div>

      <div className="pt-4 flex gap-3 border-t border-nexoraRule">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
        >
          {t('common.back') || 'Back'}
        </button>
        <button
          type="button"
          onClick={handleActivateProfile}
          className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
        >
          {currentLanguage === 'vi' ? 'Lưu & Kích hoạt' : 'Save & Activate'}
        </button>
      </div>
    </div>
  )
}
