import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PayoutLogos, payoutMethodsList } from '../constants'
import ToggleSwitch from '../../ui/ToggleSwitch'

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
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fadeIn max-w-xl mx-auto">
      <div className="flex items-center justify-between border-b border-nexoraBorder pb-3">
        <div>
          <h3 className="text-lg font-bold text-nexoraText">
            {t('components.register.steps.StepPayoutSetup.payoutConfiguration')}
          </h3>
          <p className="text-xs text-nexoraSubtle mt-1">
            {t('components.register.steps.StepPayoutSetup.enableAndConfigureYour')}
          </p>
        </div>
      </div>

      <div className="space-y-1 divide-y divide-nexoraBorder max-h-[300px] overflow-y-auto pr-1">
        {payoutMethodsList.filter(method => method.key !== 'bankwire').map(method => {
          const cfg = payouts[method.key] || { enabled: false, value: '' }
          return (
            <div key={method.key} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 min-w-0">
                <ToggleSwitch
                  checked={cfg.enabled}
                  onChange={() => handleToggleMethod(method.key)}
                  activeColor="bg-nexoraBrand"
                  inactiveColor="bg-slate-200"
                />

                {/* Logo + Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {PayoutLogos[method.key]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                    {cfg.value ? (
                      <div className="text-[10px] text-nexoraMuted font-mono mt-0.5 truncate max-w-[150px]">
                        {cfg.value}
                      </div>
                    ) : (
                      <div className="text-[10px] text-nexoraSubtle italic mt-0.5">
                        {t('components.register.steps.StepPayoutSetup.notConfigured')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <button
                type="button"
                onClick={() => handleEditPayoutAccount(method.key)}
                className="flex items-center gap-1 text-[10px] font-bold text-nexoraBrand hover:underline transition shrink-0 ml-2"
              >
                <span>{t('components.register.steps.StepPayoutSetup.configure')}</span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Staff ID Indicator at Bottom */}
      {generatedStaffId && (
        <div className="p-4 bg-slate-50 rounded-xl border border-nexoraBorder flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-nexoraBrand/10 border border-nexoraBrand/20 flex items-center justify-center shrink-0">
              <img src="/assets/nexora-logo.png" alt="Nexora" className="h-4 w-4 object-contain" />
            </span>
            <span className="text-nexoraSubtle font-bold">{t('components.register.steps.StepPayoutSetup.nexoraId')}</span>
          </div>
          <span className="text-nexoraText font-extrabold font-mono bg-white border border-nexoraBorder px-2.5 py-1 rounded-lg">
            {generatedStaffId}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {errors?.payout && (
        <div className="text-red-500 text-xs text-center pb-2 font-semibold">
          {errors.payout}
        </div>
      )}
      <div className="pt-4 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <button
          type="button"
          onClick={handlePersonalRegisterSubmit}
          className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
        >
          {t('components.register.steps.StepPayoutSetup.saveAndActivate')} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
