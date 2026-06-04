import React from 'react'
import { Upload, X, ArrowLeft, ArrowRight } from 'lucide-react'
import CountryCodeSelect from '../../CountryCodeSelect'

export default function StepProfileSetup({
  nickname, setNickname,
  fullName, setFullName,
  phone, setPhone,
  phoneParsed,
  bio, setBio,
  avatar, setAvatar,
  position, setPosition,
  email,
  generatedStaffId,
  setCurrentStep,
  t,
  currentLanguage,
  renderLabel,
}) {
  return (
    <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-lg font-bold text-nexoraText">
          {currentLanguage === 'vi' ? 'Cấu hình hồ sơ cá nhân' : 'Personal Profile Setup'}
        </h3>
        <p className="text-xs text-nexoraSubtle mt-1">
          {currentLanguage === 'vi' ? 'Thiết lập thông tin hiển thị của bạn trên màn hình nhận tiền tip.' : 'Configure your display details for the customer tip screen.'}
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }} className="space-y-4 max-w-xl mx-auto">
        {/* Avatar section */}
        <div className="flex items-center gap-4 border-b border-nexoraBorder pb-4">
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
              <div className="h-16 w-16 rounded-full bg-nexoraCanvas flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                {nickname.charAt(0) || 'N'}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label className="h-9 px-4 rounded-lg bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold transition shadow-sm">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(currentLanguage === 'vi' ? 'Họ và tên *' : 'Full Name *')}
            </label>
            <input
              type="text"
              placeholder="e.g. Lisa Marie Tran"
              required
              className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (!nickname) setNickname(e.target.value.split(' ')[0] + '.')
              }}
            />
          </div>

          {/* Display Nickname */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(currentLanguage === 'vi' ? 'Tên hiển thị (Nickname) *' : 'Display Nickname *')}
            </label>
            <input
              type="text"
              placeholder="e.g. Lisa T."
              required
              className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Number */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(currentLanguage === 'vi' ? 'Số điện thoại *' : 'Phone Number *')}
            </label>
            <div className="flex rounded-lg shadow-sm">
              <CountryCodeSelect
                value={phoneParsed.countryCode}
                onChange={(newCode) => {
                  setPhone(`${newCode} ${phoneParsed.nationalNumber}`.trim())
                }}
              />
              <input
                type="text"
                className="h-10 w-full bg-nexoraCanvas border border-l-0 border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-r-lg px-4 text-sm text-nexoraText focus:outline-none transition-all min-w-0"
                value={phoneParsed.nationalNumber}
                onChange={(e) => setPhone(`${phoneParsed.countryCode} ${e.target.value}`.trim())}
                placeholder="e.g. 408-555-1234"
                required
              />
            </div>
          </div>

          {/* Email Address (View-Only) */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
            </label>
            <input
              type="email"
              disabled
              className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg px-4 py-2.5 text-sm text-nexoraSubtle cursor-not-allowed"
              value={email}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Role / Specialty */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'Chuyên môn / Vai trò' : 'Role / Speciality'}
            </label>
            <input
              type="text"
              placeholder="e.g. Acrylic Specialist"
              className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          {/* Staff ID */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'Mã thợ NEXORA' : 'NEXORA Staff ID'}
            </label>
            <input
              type="text"
              disabled
              className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg px-4 py-2.5 text-sm text-nexoraSubtle font-mono font-bold cursor-not-allowed"
              value={generatedStaffId || 'Pending'}
            />
          </div>
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
            {currentLanguage === 'vi' ? 'Lời chào / Tiểu sử ngắn (Hiển thị cho khách hàng gửi tip)' : 'Short Bio (Shows on customer tip screen)'}
          </label>
          <textarea
            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg p-3 text-sm text-nexoraText focus:outline-none transition-all min-h-[70px]"
            placeholder="Welcome to my chair! I specialize in luxury nail art..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={!fullName.trim() || !nickname.trim() || !phone.trim()}
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-50"
          >
            {t('common.next')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
