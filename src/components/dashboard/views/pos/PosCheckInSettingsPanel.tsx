// Which layout each check-in surface renders — the tablet by the door and the front desk tab,
// chosen independently.
//
// Two choices rather than one because a salon may want the one-page form facing customers while
// its staff keep the step flow they trained on. Same card shell and toggle-to-edit UX as the
// Booking Settings panel beside it.
import { useState } from 'react'
import { ClipboardCheck, Edit2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useCheckInSettings, useUpdateCheckInSettings } from '../../../../data/hooks/usePosCheckIn'
import type { PosCheckInLayout, PosCheckInSettingsApiDto } from '../../../../types/repositories'

const K = 'components.dashboard.views.pos.PosCheckInSettingsPanel'

const DEFAULT_SETTINGS: PosCheckInSettingsApiDto = {
  kioskCheckInLayout: 'SinglePage',
  frontDeskCheckInLayout: 'SinglePage',
}

const LAYOUTS: PosCheckInLayout[] = ['SinglePage', 'Wizard']

export default function PosCheckInSettingsPanel({ businessId }: { businessId?: string }) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const settingsQuery = useCheckInSettings(businessId)
  const updateSettings = useUpdateCheckInSettings(businessId)

  const settings = settingsQuery.data ?? DEFAULT_SETTINGS

  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<PosCheckInSettingsApiDto>(DEFAULT_SETTINGS)

  const startEdit = () => {
    setForm(settings)
    setIsEditing(true)
  }

  const save = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    updateSettings.mutate(form, {
      onSuccess: () => {
        notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
        setIsEditing(false)
      },
    })
  }

  const renderChoice = (
    surface: 'kioskCheckInLayout' | 'frontDeskCheckInLayout',
  ) => (
    <div className="py-2 border-t border-slate-50 first:border-t-0">
      <p className="text-xs font-bold text-nexoraText">{t(`${K}.surface.${surface}`)}</p>
      <p className="mb-2 text-[11px] text-nexoraMuted">{t(`${K}.surfaceHint.${surface}`)}</p>
      {isEditing ? (
        <div className="flex flex-wrap gap-2">
          {LAYOUTS.map((layout) => (
            <button
              key={layout}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, [surface]: layout }))}
              className={`rounded-full px-3.5 py-2 text-xs font-bold ${
                form[surface] === layout
                  ? 'bg-nexoraBrand text-white'
                  : 'border border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
              }`}
            >
              {t(`${K}.layout.${layout}`)}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs font-extrabold text-nexoraText">{t(`${K}.layout.${settings[surface]}`)}</p>
      )}
    </div>
  )

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
      <div className="flex justify-between items-center border-b border-nexoraBorder pb-3 mb-4">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-amber-500" />
          {t(`${K}.title`)}
        </h4>
        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label={t(`${K}.editAriaLabel`)}
            className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <form onSubmit={save} noValidate>
        {renderChoice('frontDeskCheckInLayout')}
        {renderChoice('kioskCheckInLayout')}

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
