import React from 'react'
import { AlertTriangle } from 'lucide-react'
import StepProfileSetup from '../register/steps/StepProfileSetup'
import LanguageSwitcher from '../ui/LanguageSwitcher'

export default function PersonalSetupWizard({ wizard }) {
  const { t, errors } = wizard

  return (
    <div className="relative min-h-dvh bg-nexoraCanvas text-nexoraText font-sans overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-12 print:bg-transparent print:p-0 print:pb-0 print:m-0">
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96 no-print"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px] no-print"></div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 relative z-10 flex flex-col min-h-dvh justify-between no-print">
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-nexoraBorder pb-6 mb-8 gap-4">
          <div className="flex min-w-0 items-center">
            <img src="/assets/logo-nexora.png" alt="Nexora Logo" className="h-11 w-auto max-w-[200px] object-contain" />
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-grow py-4">
          <div className="w-full bg-white rounded-2xl border border-nexoraBorder shadow-premium relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {errors.submit && (
              <div className="px-6 pt-6 sm:px-10 sm:pt-10">
                <div className="p-4 rounded-flox-cards bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>{t(errors.submit)}</span>
                </div>
              </div>
            )}

            <StepProfileSetup {...wizard} showBackButton={false} />
          </div>
        </main>

      </div>
    </div>
  )
}
