import { useEffect, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function TechnicianTinFields({
  ssn,
  ein,
  staffKey,
  disabled,
  onDraftChange,
}: {
  ssn: string | null | undefined
  ein: string | null | undefined
  staffKey: string
  disabled: boolean
  onDraftChange: (draft: { field: 'ssn' | 'ein'; value: string }) => void
}) {
  const { t } = useTranslation()
  const [field, setField] = useState<'ssn' | 'ein'>(ssn || !ein ? 'ssn' : 'ein')
  const [drafts, setDrafts] = useState({ ssn: '', ein: '' })
  const inputValue = drafts[field]
  const setInputValue = (value: string) => setDrafts((previous) => ({ ...previous, [field]: value }))
  const value = field === 'ssn' ? ssn : ein
  const label = t(`components.dashboard.views.pos.PosStaffProfileView.${field}FullLabel`)

  useEffect(() => {
    onDraftChange({ field, value: value ? '' : inputValue })
  }, [field, inputValue, value, onDraftChange])

  return (
    <div className="flex flex-wrap items-end gap-3">
      <fieldset className="min-w-0" disabled={disabled}>
        <legend className="settings-label mb-2">
          {t('components.dashboard.views.pos.PosStaffProfileView.tinTypeLabel')}
        </legend>
        <div className="flex gap-2">
          {(['ssn', 'ein'] as const).map((type) => (
            <label
              key={type}
              className={`inline-flex h-10 w-auto shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 ${field === type ? 'border-nexoraBrand bg-nexoraBrand/5 ring-1 ring-nexoraBrand' : 'border-nexoraBorder'}`}
            >
              <input
                type="radio"
                name={`tin-type-${staffKey}`}
                value={type}
                checked={field === type}
                onChange={() => setField(type)}
                className="accent-nexoraBrand"
              />
              <span>
                <span className="block text-xs font-bold text-nexoraText">
                  {t(`components.dashboard.views.pos.PosStaffProfileView.${type}Label`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="w-full min-w-0 sm:w-64">
      <label className="settings-label mb-2 block" htmlFor={`staff-tin-${staffKey}`}>{label}</label>
      {value ? (
        <div className="font-mono text-sm text-nexoraText">{value}</div>
      ) : (
        <div className="flex min-h-10 items-center gap-2">
          <input
            id={`staff-tin-${staffKey}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={inputValue}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 9)
              const formatted = field === 'ssn'
                ? [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5)].filter(Boolean).join('-')
                : [digits.slice(0, 2), digits.slice(2)].filter(Boolean).join('-')
              setInputValue(formatted)
            }}
            placeholder={t(`components.dashboard.views.pos.PosStaffProfileView.${field}InputPlaceholder`)}
            className="settings-input min-w-0 flex-1"
          />
        </div>
      )}
      </div>
    </div>
  )
}
