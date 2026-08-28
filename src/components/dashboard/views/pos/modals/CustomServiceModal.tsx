// CustomServiceModal — rings up a service the salon's menu does not contain, and corrects one that
// was already added.
//
// One modal for both because the fields are identical and the correction path is the point: a
// mistyped price must be fixable without deleting the line, which would throw away the technician
// and the note. Nothing is computed here — the backend snapshots the typed price onto the line.
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import {
  MAX_CUSTOM_SERVICE_NAME_LENGTH,
  MAX_CUSTOM_SERVICE_PRICE,
  MAX_SERVICE_LINE_NOTE_LENGTH,
} from '../../../../../constants/posCustomService'
import { sanitizeDecimalInput } from '../../../../../utils/currencyInput'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export interface CustomServiceTarget {
  // Set when correcting an existing line; absent when adding a new one.
  serviceLineId?: string
  customServiceName?: string
  unitPrice?: number
  note?: string | null
}

export interface CustomServiceSubmit {
  customServiceName: string
  price: number
  note: string | null
}

export default function CustomServiceModal({
  target,
  isSaving,
  onSubmit,
  onPickFromMenu,
  onClose,
}: {
  target: CustomServiceTarget | null
  isSaving: boolean
  onSubmit: (payload: CustomServiceSubmit) => void
  // Only passed when correcting an existing line: hands the line over to the menu picker, which is
  // how work that turned out to be on the menu after all stops being a one-off.
  onPickFromMenu?: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [note, setNote] = useState('')

  // Re-seeded per target rather than once on mount: the same instance opens for "add" and then for
  // a correction on some other line without unmounting in between.
  useEffect(() => {
    if (!target) return
    setName(target.customServiceName ?? '')
    setPriceInput(target.unitPrice != null ? String(target.unitPrice) : '')
    setNote(target.note ?? '')
  }, [target])

  if (!target) return null

  const isEditing = target.serviceLineId !== undefined
  const trimmedName = name.trim()
  const parsedPrice = Number(priceInput)
  const hasNumber = priceInput.trim() !== '' && Number.isFinite(parsedPrice)
  const isOverCap = hasNumber && parsedPrice > MAX_CUSTOM_SERVICE_PRICE
  const hasValidPrice = hasNumber && parsedPrice > 0 && !isOverCap
  const canSubmit = trimmedName !== '' && hasValidPrice && !isSaving

  // Only once something has actually been typed — an empty field is "not filled in yet", not wrong.
  const priceError = !hasNumber
    ? null
    : isOverCap
      ? t(`${K}.customServicePriceTooHigh`, { max: MAX_CUSTOM_SERVICE_PRICE.toLocaleString('en-US') })
      : parsedPrice <= 0
        ? t(`${K}.customServicePriceMustBePositive`)
        : null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(isEditing ? `${K}.customServiceEditTitle` : `${K}.customServiceAddTitle`)}
          </h2>
          <IconButton label={t(`${K}.customServiceModalClose`)} onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="relative flex-1 space-y-4 overflow-y-auto">
          <p className="text-[11px] text-nexoraMuted">{t(`${K}.customServiceHint`)}</p>

          <div className="space-y-1.5">
            <label
              htmlFor="custom-service-name"
              className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted"
            >
              {t(`${K}.customServiceNameLabel`)}
            </label>
            <input
              id="custom-service-name"
              type="text"
              autoComplete="off"
              maxLength={MAX_CUSTOM_SERVICE_NAME_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSaving}
              placeholder={t(`${K}.customServiceNamePlaceholder`)}
              className="h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm font-semibold text-nexoraText focus:border-nexoraBrand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="custom-service-price"
              className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted"
            >
              {t(`${K}.customServicePriceLabel`)}
            </label>
            {/* Deliberately a text input: type="number" accepts "e"/"E"/"+"/"-" as valid keystrokes
                regardless of min/max. inputMode still brings up the numeric keypad on the iPad. */}
            <input
              id="custom-service-price"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={priceInput}
              onChange={(event) => setPriceInput(sanitizeDecimalInput(event.target.value))}
              disabled={isSaving}
              placeholder={t(`${K}.customServicePricePlaceholder`)}
              aria-invalid={priceError !== null}
              aria-describedby={priceError ? 'custom-service-price-error' : undefined}
              className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-nexoraText focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                priceError
                  ? 'border-nexoraDanger focus:border-nexoraDanger'
                  : 'border-nexoraBorder focus:border-nexoraBrand'
              }`}
            />
            {priceError ? (
              <p id="custom-service-price-error" role="alert" className="text-[11px] font-bold text-nexoraDanger">
                {priceError}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="custom-service-note"
              className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted"
            >
              {t(`${K}.customServiceNoteLabel`)}
            </label>
            <input
              id="custom-service-note"
              type="text"
              maxLength={MAX_SERVICE_LINE_NOTE_LENGTH}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isSaving}
              placeholder={t(`${K}.customServiceNotePlaceholder`)}
              className="h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm text-nexoraText focus:border-nexoraBrand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
          {onPickFromMenu ? (
            <button
              type="button"
              onClick={onPickFromMenu}
              disabled={isSaving}
              className="h-10 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
            >
              {t(`${K}.customServicePickFromMenu`)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              onSubmit({
                customServiceName: trimmedName,
                price: parsedPrice,
                note: note.trim() === '' ? null : note.trim(),
              })
            }
            disabled={!canSubmit}
            className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(isEditing ? `${K}.customServiceSaveButton` : `${K}.customServiceAddButton`)}
          </button>
        </div>
      </div>
    </div>
  )
}
