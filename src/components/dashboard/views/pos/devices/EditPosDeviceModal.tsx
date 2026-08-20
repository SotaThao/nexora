// EditPosDeviceModal — rename a paired tablet and/or replace its Access PIN.
//
// One modal for both because they share a row and the server takes them on one endpoint. Changing
// the PIN here is also the answer to a forgotten PIN: there is no recovery path on the tablet
// itself, by design.
import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'

const K = 'components.dashboard.views.pos.devices.PosDevicesView'

const PIN_PATTERN = /^\d{4,6}$/

export default function EditPosDeviceModal({
  open,
  currentName,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  currentName: string
  onClose: () => void
  onSubmit: (payload: { name?: string; pin?: string }) => void
  isSubmitting: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  useEffect(() => {
    if (!open) return
    setName(currentName)
    setPin('')
    setConfirmPin('')
  }, [open, currentName])

  if (!open) return null

  const trimmedName = name.trim()
  const nameChanged = trimmedName.length > 0 && trimmedName !== currentName
  const pinTouched = pin.length > 0 || confirmPin.length > 0
  const pinValid = PIN_PATTERN.test(pin) && pin === confirmPin
  const pinError = pinTouched && !pinValid
  const canSubmit = !isSubmitting && (nameChanged || (pinTouched && pinValid))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      name: nameChanged ? trimmedName : undefined,
      pin: pinTouched ? pin : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t(`${K}.editModalTitle`)}</h2>
          <IconButton label={t(`${K}.cancel`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t(`${K}.deviceName`)}
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder={t(`${K}.deviceNamePlaceholder`)}
              className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t(`${K}.newPin`)}
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t(`${K}.pinPlaceholder`)}
              className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
            <input
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t(`${K}.confirmPinPlaceholder`)}
              className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
            <p className={`text-[11px] ${pinError ? 'text-nexoraDanger' : 'text-nexoraMuted'}`}>
              {pinError ? t(`${K}.pinMismatch`) : t(`${K}.pinHint`)}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-nexoraBorder px-3.5 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraCanvas"
            >
              {t(`${K}.cancel`)}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t(`${K}.save`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
