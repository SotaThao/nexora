import React from 'react'
import { Check, AlertCircle, Building, Copy } from 'lucide-react'
import { useNotification } from '../../../contexts/NotificationContext'

export default function StepSuccess({
  staffId,
  position,
  inviteData,
  currentLanguage, t,
  onReturnToMerchant,
}) {
  const { showToast } = useNotification()

  return (
    <div className="space-y-6 py-4 text-center animate-scaleIn">
      <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
        <Check className="h-9 w-9 stroke-[3px]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-nexoraText tracking-tight font-sans">
          {t('components.staff_registration.steps.StepSuccess.joinRequestSubmitted')}
        </h3>
        <p className="text-xs text-nexoraMuted max-w-md mx-auto leading-relaxed">
          {currentLanguage === 'vi'
            ? `Mã thợ NEXORA của bạn là ${staffId}. Yêu cầu liên kết với ${inviteData?.biz || ''} đã được gửi thành công. Vui lòng chờ chủ tiệm duyệt để kích hoạt QR nhận tiền tip.`
            : `Your NEXORA Staff ID is ${staffId}. Your request to link with ${inviteData?.biz || ''} has been successfully submitted. Please ask the salon owner to approve your request to activate your tipping QR.`
          }
        </p>
      </div>

      {/* Connection dashboard list */}
      <div className="max-w-md mx-auto bg-nexoraSurfaceMuted border border-nexoraBorder rounded-xl p-4 text-left text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-nexoraBorder pb-1.5">
          <span className="font-extrabold text-nexoraText uppercase text-[9px] tracking-wider flex items-center gap-1.5 font-sans">
            <Building className="h-3.5 w-3.5 text-nexoraWarning" />
            {t('staff_invite.linked_businesses')}
          </span>
          <span className="px-1.5 py-0.5 rounded font-extrabold text-[8px] uppercase font-sans bg-nexoraWarning/10 text-nexoraWarning">
            {t('components.staff_registration.steps.StepSuccess.pending')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <strong className="text-nexoraText block font-sans">{inviteData?.biz || ''}</strong>
            <span className="text-[9px] text-nexoraSubtle mt-0.5 block">Joined: Today • Role: {position}</span>
          </div>
          <span className="text-xs font-bold text-nexoraWarning flex items-center gap-1 font-sans">
            <AlertCircle className="h-3.5 w-3.5 text-nexoraWarning animate-pulse" /> {t('components.staff_registration.steps.StepSuccess.pendingApproval')}
          </span>
        </div>
      </div>

      {/* Copy link option */}
      <div className="max-w-md mx-auto p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-sm">
        <div className="text-left">
          <strong className="text-xs text-slate-800 font-extrabold block">Personal Payout ID</strong>
          <span className="text-[11px] text-slate-500 font-bold select-all mt-1 block">{staffId}</span>
        </div>

        <button
          onClick={() => {
            const link = `https://touch.nexora.com/staff/${staffId}`
            navigator.clipboard.writeText(link)
            showToast(t('components.staff_registration.steps.StepSuccess.staffLinkCopiedTo'))
          }}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">COPY STAFF LINK</span>
        </button>
      </div>

      <div className="pt-4 border-t border-nexoraRule">
        <button
          onClick={onReturnToMerchant}
          className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
        >
          {t('staff_invite.return_merchant')}
        </button>
      </div>
    </div>
  )
}
