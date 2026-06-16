import { useState, useEffect } from 'react'
import { X, Plus, MapPin } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { isApiError } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'

const STATION_TYPE_OPTIONS = [
  { value: 'Table QR', label: 'Table QR' },
  { value: 'Front Desk', label: 'Front Desk' },
  { value: 'Receipt QR', label: 'Receipt QR' },
  { value: 'Business Main', label: 'Business Main' },
  { value: 'Staff QR', label: 'Staff QR' }
]

export default function AddTouchpointModal({ open, onClose, onAdd, initialValues = null }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [name, setName] = useState('')
  const [type, setType] = useState('Table QR')
  const [deviceId, setDeviceId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset the form whenever the modal is (re)opened, seeding any prefill values
  // (e.g. text already typed into the inline banner before clicking "Add").
  useEffect(() => {
    if (open) {
      setName(initialValues?.name || '')
      setType(initialValues?.type || 'Table QR')
      setDeviceId(initialValues?.deviceId || '')
      setError('')
      setIsSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (isSubmitting) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('dashboard.modals.tp_name_required'))
      return
    }
    if (!onAdd) return

    try {
      setIsSubmitting(true)
      await onAdd(trimmedName, type, deviceId.trim())
      showToast(t('dashboard.modals.tp_added_success', { name: trimmedName }), 'success')
      onClose()
    } catch (err) {
      const fallbackMessage = t('dashboard.modals.tp_add_failed')
      let message = fallbackMessage
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallbackMessage)
      }
      setError(message)
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <style>{`
        @keyframes scaleUp {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all animate-scaleUp">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-lg font-extrabold text-nexoraText">
              {t('dashboard.modals.add_tp_title')}
            </h2>
          </div>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mt-5 space-y-4">
          {/* Touch Point Name */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted block">
              {t('dashboard.modals.tp_name_label')}
            </label>
            <input
              autoFocus
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (error) setError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSubmit()
              }}
              placeholder={t('dashboard.modals.tp_name_placeholder')}
              className={`mt-1 h-11 w-full rounded-lg border px-3 text-sm text-nexoraText outline-none transition-colors ${
                error
                  ? 'border-nexoraDanger focus:border-nexoraDanger'
                  : 'border-nexoraBorder focus:border-nexoraBrand'
              }`}
            />
            {error && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{error}</p>}
          </div>

          {/* Station Type */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted block mb-1">
              {t('dashboard.modals.tp_type_label')}
            </label>
            <CustomSelect
              buttonClass="h-11 text-sm focus:border-nexoraBrand"
              value={type}
              onChange={(event) => setType(event.target.value)}
              options={STATION_TYPE_OPTIONS}
            />
          </div>

          {/* Device ID (optional) */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted block">
              {t('dashboard.modals.device_id_label')}
            </label>
            <input
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSubmit()
              }}
              placeholder={t('dashboard.modals.device_id_placeholder')}
              className="mt-1 h-11 w-full rounded-lg border border-nexoraBorder px-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand font-mono"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark transition min-h-[44px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? t('common.loading') : t('dashboard.modals.add_btn')}
          </button>
        </div>
      </div>
    </div>
  )
}
