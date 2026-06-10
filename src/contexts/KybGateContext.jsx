import React, { createContext, useContext, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from './LanguageContext'

const KybGateContext = createContext(null)

export function KybGateProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { currentLanguage } = useTranslation()

  const requireKyb = () => setIsOpen(true)
  const dismiss = () => setIsOpen(false)

  return (
    <KybGateContext.Provider value={{ requireKyb, isOpen, dismiss }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 bg-nexoraText/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-nexoraBorder max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexoraBrandSoft text-nexoraWarning mx-auto shrink-0 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-nexoraText uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'Yêu cầu xác thực KYB' : 'KYB Verification Required'}
              </h3>
              <p className="text-xs text-nexoraMuted font-medium leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tính năng này yêu cầu hồ sơ doanh nghiệp đã được xác thực KYB bởi VLINKPAY. Nhấp vào nút bên dưới để chuyển hướng đến trang Cài đặt > KYB để gửi thông tin doanh nghiệp của bạn.'
                  : 'This feature requires your business profile to be KYB verified by VLINKPAY. Click below to navigate to Settings > KYB tab and submit your compliance information.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={dismiss}
                className="px-5 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraMuted text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {currentLanguage === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  dismiss()
                  navigate('/dashboard/settings/kyb')
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </KybGateContext.Provider>
  )
}

export function useKybGate() {
  const context = useContext(KybGateContext)
  if (!context) {
    throw new Error('useKybGate must be used within a KybGateProvider')
  }
  return context
}
