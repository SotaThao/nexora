import React from 'react'
import { Upload, Loader2, CheckCircle2, XCircle, QrCode } from 'lucide-react'
import CountryCodeSelect from '../../CountryCodeSelect'

const AVATAR_PRESETS = [
  { id: '1', name: 'Anna', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '2', name: 'Lisa', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '3', name: 'Hanna', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '4', name: 'David', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '5', name: 'Sophia', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200' },
]

export default function StepProfile({
  fullName, setFullName,
  nickname, setNickname,
  position, setPosition,
  phone, setPhone,
  email, setEmail,
  avatar, setAvatar,
  bio, setBio,
  staffId,
  vlinkpayId,
  phoneParsed,
  vlinkpayStatus,
  isSelfServe,
  currentLanguage, t,
  handleVlinkpayIdChange,
  handleScanQr,
  setStep,
}) {
  return (
    <div className="space-y-5 py-2">
      <div className="border-b border-nexoraRule pb-2">
        <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
          {currentLanguage === 'vi' ? '2. Thông tin cá nhân' : '2. Personal Profile'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Avatar section */}
        <div>
          <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Choose Profile Avatar</label>
          <div className="mt-2 flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-nexoraBorder ring-2 ring-[#4648D8]/20" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-nexoraSurfaceMuted flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                {nickname.charAt(0) || 'N'}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Avatar presets selection */}
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAvatar(p.url)}
                    className={`h-9 w-9 rounded-full overflow-hidden border-2 transition hover:scale-105 shrink-0 ${
                      avatar === p.url ? 'border-[#4648D8] ring-2 ring-[#4648D8]/20' : 'border-nexoraBorder'
                    }`}
                  >
                    <img src={p.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}

                {/* Device upload option */}
                <label className="h-9 w-9 rounded-full bg-nexoraSurfaceMuted border-2 border-dashed border-nexoraBorder flex items-center justify-center cursor-pointer hover:bg-nexoraSurfaceMuted hover:border-[#4648D8] text-nexoraMuted hover:text-[#4648D8] transition shrink-0" title={currentLanguage === 'vi' ? 'Tải lên từ thiết bị' : 'Upload from device'}>
                  <Upload className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          setAvatar(reader.result)
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              </div>
              <span className="text-[9px] text-nexoraSubtle">
                {currentLanguage === 'vi'
                  ? 'Chọn ảnh đại diện có sẵn, hoặc tải lên ảnh mới từ thiết bị'
                  : 'Click to choose a preset photo, or upload custom one from device'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Full Name</label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
              placeholder="Lisa Marie Tran"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (!nickname) setNickname(e.target.value.split(' ')[0] + '.')
              }}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Display Nickname</label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
              placeholder="Lisa T."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">Phone Number</label>
            <div className="mt-1.5 flex rounded-lg shadow-sm">
              <CountryCodeSelect
                value={phoneParsed.countryCode}
                onChange={(newCode) => {
                  setPhone(`${newCode} ${phoneParsed.nationalNumber}`.trim())
                }}
                disabled={!isSelfServe}
              />
              <input
                type="text"
                className={`h-10 w-full rounded-r-lg border border-l-0 border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all min-w-0 ${!isSelfServe ? 'bg-nexoraSurfaceMuted text-nexoraMuted' : 'bg-white text-nexoraText'}`}
                value={phoneParsed.nationalNumber}
                onChange={(e) => setPhone(`${phoneParsed.countryCode} ${e.target.value}`.trim())}
                disabled={!isSelfServe}
                placeholder="e.g. 408-555-1234"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">Email Address</label>
            <input
              type="email"
              className={`mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all ${isSelfServe ? 'bg-white text-nexoraText' : 'bg-nexoraSurfaceMuted text-nexoraMuted'}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isSelfServe}
              placeholder="e.g. name@example.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Role / Speciality</label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
              placeholder="e.g. Acrylic Specialist"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">
              {currentLanguage === 'vi' ? 'Ví VLINKPAY ID' : 'VLINKPAY ID'}
            </label>
            <div className="relative mt-1.5">
              <input
                type="text"
                className={`h-10 w-full rounded-lg border pl-3 pr-20 text-xs outline-none font-mono font-bold transition-all ${
                  vlinkpayStatus === 'success' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold' :
                  vlinkpayStatus === 'error' ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 animate-shake font-bold' :
                  vlinkpayStatus === 'checking' ? 'border-amber-400 focus:border-amber-400 font-bold' :
                  'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 font-bold'
                }`}
                placeholder="e.g. VLP-8893-VL"
                value={vlinkpayId}
                onChange={(e) => handleVlinkpayIdChange(e.target.value)}
                required
              />
              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 font-sans">
                {vlinkpayStatus === 'checking' && (
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                )}
                {vlinkpayStatus === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-scaleUp" />
                )}
                {vlinkpayStatus === 'error' && (
                  <XCircle className="h-4 w-4 text-rose-500 animate-scaleUp" />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleScanQr('vlinkpay')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-[#4648D8] transition-colors p-1 rounded-md hover:bg-slate-100"
                title={currentLanguage === 'vi' ? 'Quét mã QR VLINKPAY' : 'Scan VLINKPAY QR Code'}
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Staff ID (Auto-Generated)</label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none bg-nexoraSurfaceMuted text-nexoraSubtle font-mono font-bold"
              value={staffId}
              disabled
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Short Bio (Shows on customer tip screen)</label>
          <textarea
            className="mt-1.5 w-full rounded-lg border border-nexoraBorder p-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all min-h-[70px]"
            placeholder="Welcome to my chair! I specialize in luxury nail art, acrylic extensions, and hot stone spa treatments..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3 border-t border-nexoraRule">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
        >
          {t('common.back') || 'Back'}
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={!fullName.trim()}
          className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50"
        >
          {t('common.next') || 'Next: Payout Configuration'}
        </button>
      </div>
    </div>
  )
}
