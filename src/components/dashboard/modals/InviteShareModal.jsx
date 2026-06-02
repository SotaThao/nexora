import { useState, useEffect } from 'react'
import { X, QrCode, Send, Copy } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'

function InviteShareModal({ open, businessName, defaultName, defaultContact, onClose, onSendInvite }) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState('Nail Technician')
  const [inviteMethod, setInviteMethod] = useState('SMS') // 'SMS' | 'Email'
  const [errors, setErrors] = useState({})
  const [largeQrOpen, setLargeQrOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(defaultName || '')
      setContact(defaultContact || '')
      setErrors({})
      if (defaultContact && defaultContact.includes('@')) {
        setInviteMethod('Email')
      } else {
        setInviteMethod('SMS')
      }
    }
  }, [open, defaultName, defaultContact])

  if (!open) return null

  const joinLink = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Technician name is required.'
    if (!contact.trim()) nextErrors.contact = 'Contact information (email or phone) is required.'

    if (inviteMethod === 'Email' && contact.trim() && !/\S+@\S+\.\S+/.test(contact.trim())) {
      nextErrors.contact = 'Invalid email format.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSendInvite(name, contact, role)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all relative">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider font-sans">
            {currentLanguage === 'vi' ? 'Chia sẻ liên kết & QR mời thợ' : 'Share Invitation Link & QR'}
          </h2>
          <IconButton label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mt-4 space-y-5">
          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider font-sans">
              {currentLanguage === 'vi' ? 'QUÉT QR ĐỂ GIA NHẬP' : 'SCAN QR TO JOIN'}
            </span>
            <div
              onClick={() => setLargeQrOpen(true)}
              className="h-32 w-32 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-inner bg-white cursor-zoom-in transition hover:scale-105 duration-200 group relative"
              title={currentLanguage === 'vi' ? 'Click để phóng to' : 'Click to enlarge'}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinLink)}`}
                alt="Join QR"
                className="h-full w-full object-contain"
              />
              {/* Magnifier icon overlay on hover */}
              <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
              </div>
            </div>

            <div className="w-full space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase font-sans">
                {currentLanguage === 'vi' ? 'LIÊN KẾT GIA NHẬP' : 'JOIN LINK'}
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={joinLink}
                  className="h-8 flex-grow bg-white border border-slate-200 rounded px-2.5 text-[10px] text-slate-500 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(joinLink)
                    showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!', 'success')
                  }}
                  className="h-8 px-3 bg-slate-800 text-white rounded text-[10px] font-black uppercase hover:bg-slate-700 transition font-sans"
                >
                  {currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white pr-3 text-[9px] text-slate-400 font-black uppercase tracking-wider font-sans">
              {currentLanguage === 'vi' ? 'HOẶC GỬI TRỰC TIẾP' : 'OR SEND DIRECTLY'}
            </span>
          </div>

          {/* Send Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {currentLanguage === 'vi' ? 'Tên thợ' : 'Technician Name'}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand"
                placeholder="e.g. Mia Tran"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {errors.name && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setInviteMethod('SMS')
                  setErrors({})
                }}
                className={`h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 font-sans ${
                  inviteMethod === 'SMS'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                SMS
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteMethod('Email')
                  setErrors({})
                }}
                className={`h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 font-sans ${
                  inviteMethod === 'Email'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Email
              </button>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {inviteMethod === 'SMS' ? (currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone Number') : 'Email Address'}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand font-mono"
                placeholder={inviteMethod === 'SMS' ? 'e.g. 407-555-0123' : 'e.g. mia.tran@gmail.com'}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
              {errors.contact && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.contact}</p>}
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {currentLanguage === 'vi' ? 'Vai trò / Chức danh' : 'Role / Position'}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand"
                placeholder="e.g. Nail Tech"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5 font-sans"
            >
              <Send className="h-4 w-4" />
              {currentLanguage === 'vi' ? 'Gửi liên kết mời thợ' : 'Send Invite Link'}
            </button>
          </form>
        </div>
      </div>

      {/* Large Join QR Modal inside InviteShareModal */}
      {largeQrOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setLargeQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-sans">
                {currentLanguage === 'vi' ? 'MÃ QR GIA NHẬP' : 'JOIN QR CODE'}
              </h3>
              <button
                type="button"
                onClick={() => setLargeQrOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-64 w-64 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner bg-white mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinLink)}`}
                alt="Scan to Join"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4 font-sans">
              {currentLanguage === 'vi'
                ? 'Cho thợ quét mã này bằng camera điện thoại để tự đăng ký hoặc liên kết tài khoản vào tiệm.'
                : 'Have technicians scan this QR code with their mobile camera to self-register or link accounts.'}
            </p>

            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {joinLink}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(joinLink)
                  showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!', 'success')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 font-sans"
              >
                <Copy className="h-3 w-3" />
                <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InviteShareModal
