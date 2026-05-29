import React, { useState } from 'react'
import {
  HelpCircle,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Ticket,
  Clock,
  Activity
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

function Panel({ children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 rounded-flox-cards shadow-premium ${className}`}>
      {children}
    </section>
  )
}

export default function SupportView() {
  const { t } = useTranslation()

  // Form State
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Accordion State (stores the index of the open item, or null if all closed)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  // Handle support form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!subject.trim() || !description.trim()) {
      setErrorMsg(t('dashboard.support.form.error_msg') || 'Please fill in all fields.')
      return
    }

    // Success flow
    setSuccessMsg(t('dashboard.support.form.success_msg') || 'Ticket submitted successfully! Our team will contact you shortly.')
    setSubject('')
    setDescription('')
  }

  // FAQ items translations and contents
  const faqItems = [
    {
      question: t('dashboard.support.faq.q1') || 'How to generate QR codes?',
      answer: t('dashboard.support.faq.a1') || 'Go to the Touchpoint Manager tab, click "+ Add New Touch Point", enter the station name, and assign a staff member if needed. The QR code is generated instantly and can be printed or simulated.'
    },
    {
      question: t('dashboard.support.faq.q2') || 'How direct tips work?',
      answer: t('dashboard.support.faq.a2') || 'Nexora touch points route tips directly to the technician\'s connected Venmo, Zelle, Cash App, or VLINKPAY address. Funds go straight to their account without processing delays or owner intervention.'
    },
    {
      question: t('dashboard.support.faq.q3') || 'How to set up VLINKPAY Wallet?',
      answer: t('dashboard.support.faq.a3') || 'Navigate to Settings -> Profile tab, scroll down to Payout Methods, and enter your VLINKPAY Wallet identifier. Once verified, customers will see VLINKPAY as a direct tipping option.'
    },
    {
      question: t('dashboard.support.faq.q4') || 'How to order NFC stands?',
      answer: t('dashboard.support.faq.a4') || 'You can order custom laser-engraved NFC wooden stands or tabletop cards directly from the Manage Plan / Subscriptions tab, or by contacting our support team with your salon station count.'
    }
  ]

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-nexoraBrand dark:text-luxuryGold" />
          <span>{t('dashboard.menu.support') || 'Support'}</span>
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.support.subtitle') || 'Get assistance with your QR/NFC terminals or account configuration.'}
        </p>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Open Tickets KPI */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-nexoraBrand relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.support.kpi.open_tickets') || 'Open Tickets'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">3</p>
          </div>
          <div className="p-2.5 bg-nexoraBrandSoft dark:bg-nexoraBrand/10 text-nexoraBrand rounded-flox-buttons">
            <Ticket className="h-5 w-5" />
          </div>
        </Panel>

        {/* Resolved KPI */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.support.kpi.resolved_tickets') || 'Resolved'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">18</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-flox-buttons">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Panel>

        {/* Avg Response KPI */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-luxuryGold relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.support.kpi.avg_response') || 'Avg Response'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">2h</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-luxuryGold/10 text-luxuryGold rounded-flox-buttons">
            <Clock className="h-5 w-5" />
          </div>
        </Panel>

        {/* System Status KPI */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.support.kpi.system_status') || 'System Status'}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-full bg-nexoraSuccess animate-pulse" />
              <p className="text-base font-extrabold text-nexoraSuccess uppercase tracking-wider">Online</p>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-flox-buttons">
            <Activity className="h-5 w-5" />
          </div>
        </Panel>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Submit Support Ticket Form */}
        <Panel className="p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-nexoraText border-b border-nexoraRule pb-2">
              {t('dashboard.support.form.title') || 'Submit Support Ticket'}
            </h3>

            {errorMsg && (
              <div className="p-3.5 bg-nexoraDanger/10 border border-nexoraDanger/20 text-nexoraDanger text-xs font-semibold rounded-lg">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-nexoraSuccess/10 border border-nexoraSuccess/20 text-nexoraSuccess text-xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-nexoraSuccess shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.subject_label') || 'Subject'}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t('dashboard.support.form.subject_placeholder') || 'e.g., NFC Terminal not responding'}
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                />
              </div>

              {/* Describe Issue Textarea */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.support.form.description_label') || 'Describe Issue'}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('dashboard.support.form.description_placeholder') || 'Provide details about the issue you are experiencing...'}
                  rows={4}
                  className="w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white p-3 text-base text-nexoraText outline-none focus:border-nexoraBrand resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold hover:bg-nexoraBrandDark dark:hover:bg-luxuryGoldLight text-white dark:text-luxuryBlack font-bold text-xs transition-all shadow-md mt-2"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{t('dashboard.support.form.submit_btn') || 'Submit Ticket'}</span>
              </button>
            </form>
          </div>
        </Panel>

        {/* Right Column: FAQ Accordion */}
        <Panel className="p-6 space-y-4">
          <h3 className="text-base font-extrabold text-nexoraText border-b border-nexoraRule pb-2">
            {t('dashboard.support.faq.title') || 'Frequently Asked Questions'}
          </h3>

          <div className="space-y-3">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index
              return (
                <div
                  key={index}
                  className="border border-nexoraBorder dark:border-luxuryGold/18 rounded-lg overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-nexoraText hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
                  >
                    <span>{item.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4.5 w-4.5 text-nexoraSubtle shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-nexoraSubtle shrink-0 ml-2" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs sm:text-sm text-nexoraMuted leading-relaxed border-t border-nexoraRule bg-nexoraSurfaceMuted/30">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}
