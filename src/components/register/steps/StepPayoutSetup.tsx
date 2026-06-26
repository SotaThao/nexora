import React from 'react'
import { ArrowLeft, ArrowRight, Edit2 } from 'lucide-react'
import { PayoutLogos, payoutMethodsList } from '../constants'

export default function StepPayoutSetup({
  payouts,
  handleToggleMethod,
  handleEditPayoutAccount,
  generatedStaffId,
  setCurrentStep,
  handlePersonalRegisterSubmit,
  currentLanguage,
  t,
  errors,
}) {
  const methods = payoutMethodsList.filter((method) => method.key !== 'bankwire')

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn max-w-xl mx-auto w-full">
      <div className="border-b border-nexoraBorder pb-4">
        <h3 className="text-lg font-bold text-nexoraText">
          {t('components.register.steps.StepPayoutSetup.payoutConfiguration')}
        </h3>
        <p className="text-xs text-nexoraSubtle mt-1">
          {t('components.register.steps.StepPayoutSetup.enableAndConfigureYour')}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <div className="divide-y divide-nexoraBorder">
          {methods.map((method) => {
            const cfg = payouts[method.key] || { enabled: false, value: '' }

            return (
              <div
                key={method.key}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleMethod(method.key)}
                    aria-label={`Toggle ${method.label}`}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cfg.enabled ? 'bg-nexoraBrand' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        cfg.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
                      {PayoutLogos[method.key]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                      {cfg.value ? (
                        <div className="mt-0.5 max-w-[180px] truncate font-mono text-[10px] text-nexoraMuted sm:max-w-[220px]">
                          {cfg.value}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[10px] italic text-nexoraSubtle">
                          {t('components.register.steps.StepPayoutSetup.notConfigured')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleEditPayoutAccount(method.key)}
                  className="ml-2 flex shrink-0 items-center gap-1 text-[10px] font-bold text-nexoraBrand transition hover:text-nexoraBrandDark"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>{t('components.register.steps.StepPayoutSetup.configure')}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {generatedStaffId && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-nexoraBorder bg-slate-50 p-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBrand/20 bg-nexoraBrand/10">
              <img src="/assets/nexora-logo.png" alt="Nexora" className="h-4 w-4 object-contain" />
            </span>
            <span className="font-bold text-nexoraSubtle">
              {t('components.register.steps.StepPayoutSetup.nexoraId')}
            </span>
          </div>
          <span className="rounded-lg border border-nexoraBorder bg-white px-2.5 py-1 font-mono font-extrabold text-nexoraText">
            {generatedStaffId}
          </span>
        </div>
      )}

      {errors?.payout && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600">
          {errors.payout}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder py-2.5 text-xs font-semibold uppercase tracking-wider text-nexoraSubtle transition-all hover:bg-nexoraCanvas hover:text-nexoraText"
        >
          <ArrowLeft className="h-4 w-4" /> {t('common.back')}
        </button>
        <button
          type="button"
          onClick={handlePersonalRegisterSubmit}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all hover:opacity-90"
        >
          {t('components.register.steps.StepPayoutSetup.saveAndActivate')}{' '}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
