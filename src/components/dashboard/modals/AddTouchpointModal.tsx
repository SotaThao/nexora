import { useState, useEffect, useMemo } from 'react'
import { X, Plus, MapPin } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { isApiError } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  isStaffCardTouchpointType,
  buildStaffProfileSelectOptions,
  getAssignableActiveStaff,
} from '../../../utils/touchpointTypes'

const STATION_TYPE_OPTIONS = [
  { value: 'Table QR', label: 'Table QR' },
  { value: 'Front Desk', label: 'Front Desk' },
  { value: 'Receipt QR', label: 'Receipt QR' },
  { value: 'Business Main', label: 'Business Main' },
  { value: 'Staff QR', label: 'Staff QR' },
]

export default function AddTouchpointModal({
  open,
  onClose,
  onAdd,
  initialValues = null,
  activeStaff = [],
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [name, setName] = useState('')
  const [type, setType] = useState('Table QR')
  const [deviceId, setDeviceId] = useState('')
  const [assignedStaffProfileId, setAssignedStaffProfileId] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const staffOptions = useMemo(
    () => buildStaffProfileSelectOptions(
      activeStaff,
      t('dashboard.modals.tp_staff_placeholder'),
    ),
    [activeStaff, t],
  )

  const assignableStaffCount = useMemo(
    () => getAssignableActiveStaff(activeStaff).length,
    [activeStaff],
  )

  const showStaffSelect = isStaffCardTouchpointType(type)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name || '')
      setType(initialValues?.type || 'Table QR')
      setDeviceId(initialValues?.deviceId || '')
      setAssignedStaffProfileId(initialValues?.assignedStaffProfileId || '')
      setError('')
      setIsSubmitting(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!showStaffSelect) {
      setAssignedStaffProfileId('')
    }
  }, [showStaffSelect])

  if (!open) return null

  const handleSubmit = async () => {
    if (isSubmitting) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError(t('dashboard.modals.tp_name_required'))
      return
    }
    if (showStaffSelect && !assignedStaffProfileId) {
      setError(t('dashboard.modals.tp_staff_required'))
      return
    }
    if (!onAdd) return

    try {
      setIsSubmitting(true)
      await onAdd(
        trimmedName,
        type,
        deviceId.trim(),
        showStaffSelect ? assignedStaffProfileId : undefined,
      )
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
                error && !name.trim()
                  ? 'border-nexoraDanger focus:border-nexoraDanger'
                  : 'border-nexoraBorder focus:border-nexoraBrand'
              }`}
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted block mb-1">
              {t('dashboard.modals.tp_type_label')}
            </label>
            <CustomSelect
              buttonClass="h-11 text-sm focus:border-nexoraBrand"
              value={type}
              onChange={(event) => {
                setType(event.target.value)
                if (error) setError('')
              }}
              options={STATION_TYPE_OPTIONS}
            />
          </div>

          {showStaffSelect && (
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted block mb-1">
                {t('dashboard.modals.assign_staff')}
              </label>
              <CustomSelect
                buttonClass="h-11 text-sm focus:border-nexoraBrand"
                value={assignedStaffProfileId}
                onChange={(event) => {
                  setAssignedStaffProfileId(event.target.value)
                  if (error) setError('')
                }}
                options={staffOptions}
              />
              {assignableStaffCount === 0 && (
                <p className="mt-1 text-[10px] font-bold text-nexoraMuted">
                  {t('dashboard.modals.tp_staff_empty')}
                </p>
              )}
            </div>
          )}
 
          {error && <p className="text-[10px] font-bold text-nexoraDanger">{error}</p>}
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
            disabled={isSubmitting || (showStaffSelect && assignableStaffCount === 0)}
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
