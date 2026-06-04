import React from 'react'
import { Download, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function Step3Download({
  t,
  currentLanguage,
  businessInfo,
  staffList,
  touchPoints,
  isConsentChecked,
  setIsConsentChecked
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-nexoraRule pb-4 mb-4">
        <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
          <Download className="text-nexoraBrand w-6 h-6" />
          {t('setup.title_step_3')}
        </h2>
        <p className="text-nexoraSubtle text-sm mt-1">
          {t('setup.desc_step_3')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

        {/* Stand design template preview */}
        <div className="md:col-span-5 flex justify-center">
          <div className="mx-auto flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
            {/* Nexora Branding Header inside Card */}
            <div className="flex items-center gap-1 justify-center qr-print-brand-header">
              <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
              <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
            </div>

            <div className="w-full text-center">
              <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">General Lobby QR</div>
              <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">{businessInfo.name || 'Your Spa Salon'}</div>
            </div>

            {/* Real generated QR code scan preview */}
            <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Golden Glow Nail Spa & Salon')}`
                )}`}
                alt="QR Preview"
                className="h-full w-full object-contain qr-print-qr-image"
              />
            </div>

            <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
              {t('customer.scan_to_tip_review') || 'Scan to Tip & Review'}
            </div>

            <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
              <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
              <span>Secure redirect by VLINKPAY</span>
            </div>
          </div>
        </div>

        {/* Summary & downloads */}
        <div className="md:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 animate-pulse">
            <CheckCircle2 className="w-4 h-4" /> {t('common.success')}
          </div>

          <h3 className="text-xl font-bold text-nexoraText">{t('setup.config_checklist_title')}</h3>
          <p className="text-sm text-nexoraMuted leading-relaxed">
            {t('setup.chk_business', { name: businessInfo.name, industry: businessInfo.industry })}
          </p>
          <p className="text-sm text-nexoraMuted leading-relaxed">
            {t('setup.chk_routing')}
          </p>
          <p className="text-sm text-nexoraMuted leading-relaxed">
            {t('setup.chk_staff', { count: staffList.length })}
          </p>
          <p className="text-sm text-nexoraMuted leading-relaxed">
            {t('setup.chk_touchpoints', { count: touchPoints.length })}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-nexoraBorder bg-white hover:bg-nexoraCanvas transition text-left shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-8 w-8 rounded-lg bg-nexoraBrandSoft flex items-center justify-center shrink-0"><Download className="h-[18px] w-[18px] text-nexoraBrand" /></span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-nexoraText truncate">{t('setup.download_btn')}</div>
                  <div className="text-[10px] text-nexoraSubtle truncate sm:whitespace-normal">{t('setup.download_explain')}</div>
                </div>
              </div>
              <span className="text-xs text-nexoraSubtle font-bold shrink-0 whitespace-nowrap ml-4">Print ›</span>
            </button>
          </div>

          {/* Merchant Consent Checkbox */}
          <div className="pt-4 border-t border-nexoraRule">
            <label className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-nexoraBorder text-nexoraBrand focus:ring-nexoraBrand cursor-pointer shrink-0"
                checked={isConsentChecked}
                onChange={(e) => setIsConsentChecked(e.target.checked)}
              />
              <span className="text-xs text-nexoraMuted leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tôi đồng ý với Điều khoản dịch vụ người bán của VLINKPAY, yêu cầu báo cáo thuế IRS 1099-K và chính sách thẩm định của doanh nghiệp. Tôi xác nhận rằng tất cả thông tin đăng ký là chính xác.'
                  : 'I hereby consent to the VLINKPAY Merchant Terms of Service, IRS 1099-K tax reporting requirements, and corporate compliance underwriting policies. I certify that all registration and business details provided are true and accurate.'}
              </span>
            </label>
          </div>
        </div>

      </div>
    </div>
  )
}
