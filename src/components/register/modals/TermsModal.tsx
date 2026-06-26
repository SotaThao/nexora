import React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import enLocale from '../../../locales/en.json'
import viLocale from '../../../locales/vi.json'

export default function TermsModal({ open, onClose, modalType }) {
  const { t, currentLanguage } = useTranslation()
  const dict = currentLanguage === 'vi' ? viLocale : enLocale
  const legalSections = dict.register.legal[modalType as 'privacy' | 'terms']?.sections ?? []

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[85vh] text-left text-slate-800 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {modalType === 'privacy'
              ? t('components.register.modals.TermsModal.privacyPolicy')
              : t('components.register.modals.TermsModal.termsOfService')
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[50vh] scrollbar-thin">
          {Array.isArray(legalSections) && legalSections.map((section) => (
            <React.Fragment key={section.title}>
              <h4 className="font-extrabold text-slate-800">{section.title}</h4>
              <p className="whitespace-pre-line">{section.body}</p>
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            {t('components.register.modals.TermsModal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
