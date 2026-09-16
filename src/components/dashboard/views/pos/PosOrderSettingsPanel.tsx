// Salon-wide rules for how a ticket's services move from assigned to done: whether a technician
// has to accept work before it counts as theirs, and whether the front desk is warned when a
// ticket action runs ahead of its services.
//
// Same card shell and toggle-to-edit UX as the Check-In and Booking Settings panels beside it.
import { useState } from 'react'
import { Edit2, ListChecks } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useOrderSettings, useUpdateOrderSettings } from '../../../../data/hooks/usePosOrderSettings'
import type { PosOrderSettingsApiDto } from '../../../../types/repositories'
import { TOAST_SNACK_DURATION_MS } from '../../../../constants/toast'

const K = 'components.dashboard.views.pos.PosOrderSettingsPanel'

const DEFAULT_SETTINGS: PosOrderSettingsApiDto = {
  requireStaffAcceptance: false,
  warnOnServiceLineStatusMismatch: true,
  allowStaffManageOwnServiceLines: true,
}

export default function PosOrderSettingsPanel({ businessId }: { businessId?: string }) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const settingsQuery = useOrderSettings(businessId)
  const updateSettings = useUpdateOrderSettings(businessId)

  const settings = settingsQuery.data ?? DEFAULT_SETTINGS

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PosOrderSettingsApiDto>(DEFAULT_SETTINGS)

  const startEdit = () => {
    setForm(settings)
    setIsEditing(true)
  }

  const save = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    updateSettings.mutate(form, {
      onSuccess: () => {
        notify(t(`${K}.saveSuccess`), 'success', TOAST_SNACK_DURATION_MS)
        setIsEditing(false)
      },
      onError: () => notify(t(`${K}.saveFailed`), 'error'),
    })
  }

  const renderToggle = (field: keyof PosOrderSettingsApiDto) => {
    const value = isEditing ? form[field] : settings[field]
    return (
      <div className="py-3 border-t border-slate-50 first:border-t-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-nexoraText">{t(`${K}.${field}Label`)}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-nexoraMuted">
              {t(`${K}.${field}Description`)}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value}
            aria-label={t(`${K}.${field}Label`)}
            disabled={!isEditing}
            onClick={() => setForm((prev) => ({ ...prev, [field]: !prev[field] }))}
            className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
              value ? 'bg-nexoraBrand' : 'bg-slate-200'
            } ${isEditing ? '' : 'opacity-60'}`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                value ? 'translate-x-[22px]' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
      <div className="flex justify-between items-center border-b border-nexoraBorder pb-3 mb-2">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-amber-500" />
          {t(`${K}.title`)}
        </h4>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label={t(`${K}.title`)}
            className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="mb-1 text-[11px] text-nexoraMuted">{t(`${K}.description`)}</p>

      <form onSubmit={save} noValidate>
        {renderToggle('requireStaffAcceptance')}
        {renderToggle('warnOnServiceLineStatusMismatch')}
        {renderToggle('allowStaffManageOwnServiceLines')}

        {isEditing ? (
          <div className="flex gap-2 pt-3 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
            >
              {t('components.settings.tabs.ProfileTab.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold disabled:opacity-60"
            >
              {t('components.settings.tabs.ProfileTab.save')}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  )
}
