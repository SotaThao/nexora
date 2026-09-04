// PosGeneralSettingsView — lets the Owner view/update the salon's Business
// Information and Business Hours from inside the POS section, without leaving
// it to go to the general Settings page. Reuses BusinessInfoCard/
// useBusinessInfoForm so Business Info is the same data and save logic as
// Settings > Profile > Business Information. Business Hours was previously
// its own POS screen/route (US-014); merged back into this single General
// Settings screen per TL decision — reuses useBusinessHoursForm unchanged.
import type { FormEvent } from 'react'
import { Clock, Edit2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useMerchantSetup } from '../../../../data/hooks/useMerchantSetup'
import useBusinessInfoForm from '../../../settings/hooks/useBusinessInfoForm'
import BusinessInfoCard from '../../../settings/BusinessInfoCard'
import ToggleSwitch from '../../../ui/ToggleSwitch'
import useBusinessHoursForm from './hooks/useBusinessHoursForm'
import PosBookingSettingsPanel from './PosBookingSettingsPanel'
import PosCheckInSettingsPanel from './PosCheckInSettingsPanel'
import PosOrderSettingsPanel from './PosOrderSettingsPanel'
import HolidayClosuresCard from '../HolidayClosuresCard'
import { formatPosClockTime } from './posDateTime'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../constants/timeFormat'

type SettingsFormErrors = Record<string, string>

export default function PosGeneralSettingsView({
  verificationStatus,
  businessId,
}: {
  verificationStatus?: string
  businessId?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const { data: setupData } = useMerchantSetup()
  const businessSlug = setupData?.businessInfo?.slug
  const businessInfoForm = useBusinessInfoForm({ setupData, verificationStatus, includeReviewLinks: true })
  const {
    businessHours,
    isEditingHours,
    setIsEditingHours,
    hoursForm,
    hoursErrors,
    startEditHours,
    updateHoursDay,
    saveHours,
  } = useBusinessHoursForm({ verificationStatus })

  const saveBusiness = (e: FormEvent) => {
    businessInfoForm.saveBusiness(e)
  }

  const inputClass = (error?: string) =>
    `mt-1 h-10 w-full rounded-lg border bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
      error
        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
        : 'border-nexoraBorder focus:border-nexoraBrand'
    }`
  const validationMessage = (error: string) =>
    t(`components.settings.tabs.ProfileTab.validation.${error}`)
  const FieldError = ({ id, error }: { id: string; error?: string }) =>
    error ? (
      <p id={id} role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
        {validationMessage(error)}
      </p>
    ) : null

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">
          {t('dashboard.menu.pos_settings')}
        </h1>
        <p className="text-sm font-medium text-nexoraMuted">
          {t('components.dashboard.views.pos.PosGeneralSettingsView.description')}
        </p>
      </section>

      {/* Plain vertical stack, not a grid — BusinessInfoCard carries a `md:col-span-2`
          meant for its original 2-column parent (ProfileTab.tsx). Wrapping it in a
          grid-cols-1 container here made that span spill into an implicit second
          column, leaving this card wider than the Business Hours card below it. */}
      <div className="space-y-6">
        <BusinessInfoCard
          businessName={businessInfoForm.businessInfo.businessName}
          businessPhone={businessInfoForm.businessInfo.businessPhone}
          businessEmail={businessInfoForm.businessInfo.businessEmail}
          businessWebsite={businessInfoForm.businessInfo.businessWebsite}
          bookingNotificationPhone={businessInfoForm.businessInfo.bookingNotificationPhone}
          salesTaxRatePercent={businessInfoForm.businessInfo.salesTaxRatePercent}
          showReviewLinks
          googleReview={businessInfoForm.businessInfo.googleReview}
          yelpReview={businessInfoForm.businessInfo.yelpReview}
          facebookReview={businessInfoForm.businessInfo.facebookReview}
          instagramReview={businessInfoForm.businessInfo.instagramReview}
          logoUrl={businessInfoForm.logoUrl}
          onLogoChange={businessInfoForm.handleLogoChange}
          isUploadingLogo={businessInfoForm.isUploadingLogo}
          isEditingBusiness={businessInfoForm.isEditingBusiness}
          setIsEditingBusiness={businessInfoForm.setIsEditingBusiness}
          businessForm={businessInfoForm.businessForm}
          setBusinessForm={businessInfoForm.setBusinessForm}
          businessErrors={businessInfoForm.businessErrors}
          setBusinessErrors={businessInfoForm.setBusinessErrors}
          canEdit={businessInfoForm.canEditProfile}
          startEditBusiness={businessInfoForm.startEditBusiness}
          saveBusiness={saveBusiness}
        />

        <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
          <div className="flex justify-between items-center border-b border-nexoraBorder pb-3 mb-4">
            <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {t('components.settings.tabs.ProfileTab.businessHours.title')}
            </h4>
            {!isEditingHours && (
              <button
                type="button"
                onClick={startEditHours}
                aria-label="Edit Business Hours"
                className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isEditingHours ? (
            <form onSubmit={saveHours} noValidate className="space-y-3">
              {hoursForm.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-t border-slate-50 first:border-t-0"
                >
                  <div className="flex items-center gap-2 sm:w-32 shrink-0">
                    <ToggleSwitch
                      checked={day.isOpen}
                      onChange={() => updateHoursDay(day.dayOfWeek, { isOpen: !day.isOpen })}
                      ariaLabel={`Toggle ${day.dayOfWeek} open`}
                      activeColor="bg-emerald-500"
                      inactiveColor="bg-slate-300"
                    />
                    <span className="text-xs font-bold text-nexoraText">
                      {t(`components.settings.tabs.ProfileTab.businessHours.days.${day.dayOfWeek.toLowerCase()}`)}
                    </span>
                  </div>
                  {day.isOpen ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        lang={TWELVE_HOUR_INPUT_LANG}
                        aria-label={`${day.dayOfWeek} open time`}
                        className={inputClass((hoursErrors as SettingsFormErrors)[day.dayOfWeek])}
                        value={day.openTime || ''}
                        onChange={(e) => updateHoursDay(day.dayOfWeek, { openTime: e.target.value })}
                      />
                      <span className="text-nexoraMuted text-xs">–</span>
                      <input
                        type="time"
                        lang={TWELVE_HOUR_INPUT_LANG}
                        aria-label={`${day.dayOfWeek} close time`}
                        className={inputClass((hoursErrors as SettingsFormErrors)[day.dayOfWeek])}
                        value={day.closeTime || ''}
                        onChange={(e) => updateHoursDay(day.dayOfWeek, { closeTime: e.target.value })}
                      />
                    </div>
                  ) : (
                    <span className="text-[11px] font-medium italic text-nexoraMuted">
                      {t('components.settings.tabs.ProfileTab.businessHours.closed')}
                    </span>
                  )}
                  <FieldError id={`hours-${day.dayOfWeek}-error`} error={(hoursErrors as SettingsFormErrors)[day.dayOfWeek]} />
                </div>
              ))}
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingHours(false)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                >
                  {t('components.settings.tabs.ProfileTab.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                >
                  {t('components.settings.tabs.ProfileTab.save')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-xs">
              {businessHours.map((day) => (
                <div
                  key={day.dayOfWeek}
                  className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50 first:border-t-0"
                >
                  <span className="text-nexoraMuted font-bold">
                    {t(`components.settings.tabs.ProfileTab.businessHours.days.${day.dayOfWeek.toLowerCase()}`)}
                  </span>
                  <span className="text-nexoraText font-extrabold">
                    {day.isOpen
                      ? `${formatPosClockTime(day.openTime, currentLanguage)} – ${formatPosClockTime(day.closeTime, currentLanguage)}`
                      : t('components.settings.tabs.ProfileTab.businessHours.closed')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <HolidayClosuresCard />

        <PosCheckInSettingsPanel businessId={businessId} />

        <PosOrderSettingsPanel businessId={businessId} />

        <PosBookingSettingsPanel businessId={businessId} businessSlug={businessSlug} />
      </div>
    </div>
  )
}
