import React from 'react'
import { Upload, Loader2, CheckCircle2, XCircle, QrCode, HelpCircle, X } from 'lucide-react'
import CountryCodeSelect from '../../CountryCodeSelect'
import { renderLabel } from '../../../contexts/LanguageContext'


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
          {currentLanguage === 'vi' ? '2. Tài khoản cá nhân' : '2. Personal Account'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Avatar section */}
        <div>
          <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Choose Profile Avatar</label>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative">
              {avatar ? (
                <>
                  <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-nexoraBorder ring-2 ring-nexoraBrand/20" />
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition shadow duration-150 cursor-pointer"
                    title={currentLanguage === 'vi' ? 'Xóa ảnh' : 'Remove photo'}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="h-16 w-16 rounded-full bg-nexoraSurfaceMuted flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                  {nickname.charAt(0) || 'N'}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                {/* Device upload option */}
                <label className="h-9 px-4 rounded-xl bg-nexoraBrand hover:bg-nexoraBrandDark text-white flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold transition shadow-sm" title={currentLanguage === 'vi' ? 'Tải lên từ thiết bị' : 'Upload from device'}>
                  <Upload className="h-3.5 w-3.5" />
                  <span>{currentLanguage === 'vi' ? 'Tải ảnh lên' : 'Upload photo'}</span>
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
              <span className="text-[10px] text-nexoraSubtle">
                {currentLanguage === 'vi'
                  ? 'Chấp nhận định dạng JPG, PNG. Dung lượng tối đa 5MB.'
                  : 'Accepted formats: JPG, PNG. Max size: 5MB.'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider h-4">
              {renderLabel(currentLanguage === 'vi' ? 'Họ và tên *' : 'Full Name *')}
            </label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all"
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
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider gap-1 h-4">
              <span>{renderLabel(currentLanguage === 'vi' ? 'Tên hiển thị (Nickname) *' : 'Display Nickname *')}</span>
              <div className="relative group inline-flex items-center normal-case font-normal text-nexoraSubtle">
                <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                  {currentLanguage === 'vi'
                    ? 'Tên này sẽ hiển thị cho khách hàng tại tiệm khi họ quét mã và gửi tip.'
                    : 'This nickname is visible to customers at the salon when they scan and tip.'}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all"
              placeholder="Lisa T."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans h-4">
              {renderLabel(currentLanguage === 'vi' ? 'Số điện thoại *' : 'Phone Number *')}
            </label>
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
                className={`h-10 w-full rounded-r-lg border border-l-0 border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all min-w-0 ${!isSelfServe ? 'bg-nexoraSurfaceMuted text-nexoraMuted' : 'bg-white text-nexoraText'}`}
                value={phoneParsed.nationalNumber}
                onChange={(e) => setPhone(`${phoneParsed.countryCode} ${e.target.value}`.trim())}
                disabled={!isSelfServe}
                placeholder="e.g. 408-555-1234"
                required
              />
            </div>
          </div>
          <div>
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans h-4">
              {renderLabel(currentLanguage === 'vi' ? 'Địa chỉ Email *' : 'Email Address *')}
            </label>
            <input
              type="email"
              className={`mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all ${isSelfServe ? 'bg-white text-nexoraText' : 'bg-nexoraSurfaceMuted text-nexoraMuted'}`}
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
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider h-4">Role / Speciality</label>
            <input
              type="text"
              className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all"
              placeholder="e.g. Acrylic Specialist"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center text-[10px] font-black uppercase text-nexoraSubtle tracking-wider h-4">Staff ID (Auto-Generated)</label>
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
            className="mt-1.5 w-full rounded-lg border border-nexoraBorder p-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all min-h-[70px]"
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
