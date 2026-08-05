// PosBookingSettingsPanel — POS Booking, Ticket 2. Owner/Staff (Operations permission)
// view + update the per-business booking rules: Auto-Confirm, minimum notice, maximum
// advance, and reminder timing. Mirrors the Business Hours card's edit/save UX in
// PosGeneralSettingsView (same card shell, toggle-to-edit pattern). Named with the
// Pos prefix (unlike the sibling Nexora Voice BookingSettingsPanel under
// dashboard/views/) to avoid a same-basename collision between the two features.
import { useState } from 'react'
import { CalendarClock, Edit2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useBookingSettings, useUpdateBookingSettings } from '../../../../data/hooks/usePosBookingSettings'
import ToggleSwitch from '../../../ui/ToggleSwitch'
import type { PosBookingSettingsApiDto } from '../../../../types/repositories'
import BookingLinkShare from './booking/BookingLinkShare'

const DEFAULT_SETTINGS: PosBookingSettingsApiDto = {
  autoConfirmEnabled: true,
  minLeadTimeMinutes: 15,
  maxAdvanceDays: 7,
  reminderHoursBefore: 12,
  notifyCustomerSmsEnabled: true,
  notifyBusinessSmsEnabled: true,
  notifyAssignedStaffSmsEnabled: true,
}

export default function PosBookingSettingsPanel({
  businessId,
  businessSlug,
}: {
  businessId?: string
  businessSlug?: string
}) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const settingsQuery = useBookingSettings(businessId)
  const updateSettingsMutation = useUpdateBookingSettings(businessId)

  const settings = settingsQuery.data ?? DEFAULT_SETTINGS

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PosBookingSettingsApiDto>(DEFAULT_SETTINGS)

  const startEdit = () => {
    setForm(settings)
    setIsEditing(true)
  }

  const save = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    updateSettingsMutation.mutate(form, {
      onSuccess: () => {
        notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
        setIsEditing(false)
      },
    })
  }

  const numberInputClass =
    'mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white focus:border-nexoraBrand px-3.5 text-xs text-nexoraText outline-none transition-all'

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
      <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-amber-500" />
          {t('components.dashboard.views.pos.PosBookingSettingsPanel.title')}
        </h4>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit Booking Settings"
            className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-xs text-nexoraMuted mb-4">
        {t('components.dashboard.views.pos.PosBookingSettingsPanel.description')}
      </p>

      <div className="mb-4">
        <BookingLinkShare businessSlug={businessSlug} />
      </div>

      {isEditing ? (
        <form onSubmit={save} noValidate className="space-y-4">
          <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-50 first:border-t-0">
            <div>
              <p className="text-xs font-bold text-nexoraText">
                {t('components.dashboard.views.pos.PosBookingSettingsPanel.autoConfirmLabel')}
              </p>
              <p className="text-[11px] text-nexoraMuted mt-0.5">
                {t('components.dashboard.views.pos.PosBookingSettingsPanel.autoConfirmDescription')}
              </p>
            </div>
            <ToggleSwitch
              checked={form.autoConfirmEnabled}
              onChange={() => setForm((current) => ({ ...current, autoConfirmEnabled: !current.autoConfirmEnabled }))}
              ariaLabel="Toggle Auto-Confirm"
              activeColor="bg-emerald-500"
              inactiveColor="bg-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold text-nexoraMuted">
                {t('components.dashboard.views.pos.PosBookingSettingsPanel.minLeadTimeLabel')}
              </span>
              <input
                type="number"
                min={0}
                className={numberInputClass}
                value={form.minLeadTimeMinutes}
                onChange={(e) =>
                  setForm((current) => ({ ...current, minLeadTimeMinutes: Number(e.target.value) }))
                }
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-nexoraMuted">
                {t('components.dashboard.views.pos.PosBookingSettingsPanel.maxAdvanceLabel')}
              </span>
              <input
                type="number"
                min={1}
                className={numberInputClass}
                value={form.maxAdvanceDays}
                onChange={(e) => setForm((current) => ({ ...current, maxAdvanceDays: Number(e.target.value) }))}
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-nexoraMuted">
                {t('components.dashboard.views.pos.PosBookingSettingsPanel.reminderHoursLabel')}
              </span>
              <input
                type="number"
                min={0}
                className={numberInputClass}
                value={form.reminderHoursBefore}
                onChange={(e) =>
                  setForm((current) => ({ ...current, reminderHoursBefore: Number(e.target.value) }))
                }
              />
            </label>
          </div>

          <div className="pt-2 border-t border-slate-50">
            <p className="text-xs font-bold text-nexoraText mb-1">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.smsSectionTitle')}
            </p>
            <p className="text-[11px] text-nexoraMuted mb-3">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.smsSectionDescription')}
            </p>

            <div className="flex items-center justify-between gap-2 py-2">
              <div>
                <p className="text-xs font-bold text-nexoraText">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyCustomerSmsLabel')}
                </p>
                <p className="text-[11px] text-nexoraMuted mt-0.5">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyCustomerSmsDescription')}
                </p>
              </div>
              <ToggleSwitch
                checked={form.notifyCustomerSmsEnabled}
                onChange={() =>
                  setForm((current) => ({ ...current, notifyCustomerSmsEnabled: !current.notifyCustomerSmsEnabled }))
                }
                ariaLabel="Toggle customer booking SMS"
                activeColor="bg-emerald-500"
                inactiveColor="bg-slate-300"
              />
            </div>

            <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-50">
              <div>
                <p className="text-xs font-bold text-nexoraText">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyBusinessSmsLabel')}
                </p>
                <p className="text-[11px] text-nexoraMuted mt-0.5">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyBusinessSmsDescription')}
                </p>
              </div>
              <ToggleSwitch
                checked={form.notifyBusinessSmsEnabled}
                onChange={() =>
                  setForm((current) => ({ ...current, notifyBusinessSmsEnabled: !current.notifyBusinessSmsEnabled }))
                }
                ariaLabel="Toggle business booking SMS"
                activeColor="bg-emerald-500"
                inactiveColor="bg-slate-300"
              />
            </div>

            <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-50">
              <div>
                <p className="text-xs font-bold text-nexoraText">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyAssignedStaffSmsLabel')}
                </p>
                <p className="text-[11px] text-nexoraMuted mt-0.5">
                  {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyAssignedStaffSmsDescription')}
                </p>
              </div>
              <ToggleSwitch
                checked={form.notifyAssignedStaffSmsEnabled}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    notifyAssignedStaffSmsEnabled: !current.notifyAssignedStaffSmsEnabled,
                  }))
                }
                ariaLabel="Toggle assigned staff booking SMS"
                activeColor="bg-emerald-500"
                inactiveColor="bg-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
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
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50 first:border-t-0">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.autoConfirmLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">{settings.autoConfirmEnabled ? 'On' : 'Off'}</span>
          </div>
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.minLeadTimeLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">{settings.minLeadTimeMinutes}</span>
          </div>
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.maxAdvanceLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">{settings.maxAdvanceDays}</span>
          </div>
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.reminderHoursLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">{settings.reminderHoursBefore}</span>
          </div>

          <p className="text-xs font-bold text-nexoraText pt-3 border-t border-slate-50">
            {t('components.dashboard.views.pos.PosBookingSettingsPanel.smsSectionTitle')}
          </p>
          <div className="flex flex-row justify-between items-center py-1.5">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyCustomerSmsLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">
              {settings.notifyCustomerSmsEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyBusinessSmsLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">
              {settings.notifyBusinessSmsEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex flex-row justify-between items-center py-1.5 border-t border-slate-50">
            <span className="text-nexoraMuted font-bold">
              {t('components.dashboard.views.pos.PosBookingSettingsPanel.notifyAssignedStaffSmsLabel')}
            </span>
            <span className="text-nexoraText font-extrabold">
              {settings.notifyAssignedStaffSmsEnabled ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
