import { useId, type Ref } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CountryCodeSelect, { formatNationalNumberPreservingDigits, getNationalPhonePlaceholder, parsePhone } from '../../CountryCodeSelect'

export interface TechnicianContactDraft { name: string; phone: string; email: string }
export default function TechnicianProfileFields({ draft, onChange, readOnly = false, readOnlyFields = {}, errors = {}, onClearError, nameInputRef }: {
  draft: TechnicianContactDraft
  onChange: (patch: Partial<TechnicianContactDraft>) => void
  readOnly?: boolean
  readOnlyFields?: Partial<Record<keyof TechnicianContactDraft, boolean>>
  errors?: Partial<Record<keyof TechnicianContactDraft, string>>
  onClearError?: (field: keyof TechnicianContactDraft) => void
  nameInputRef?: Ref<HTMLInputElement>
}) {
  const { t } = useTranslation()
  const id = useId()
  const TK = 'components.dashboard.views.BookingHubView.team'
  const { name: draftName, phone: draftPhone, email: draftEmail } = draft
  const nameReadOnly = readOnly || Boolean(readOnlyFields.name)
  const phoneReadOnly = readOnly || Boolean(readOnlyFields.phone)
  const emailReadOnly = readOnly || Boolean(readOnlyFields.email)
  const draftPhoneParsed = parsePhone(draftPhone)
  const formErrors = errors
  const setDraftName = (name: string) => onChange({ name })
  const setDraftPhone = (phone: string) => onChange({ phone })
  const setDraftEmail = (email: string) => onChange({ email })
  return (
    <div className="tech-modal-grid">
      <div className="settings-field" data-ai-hub-field="name">
        <label className="settings-label" htmlFor={`${id}-name`}>
          {t(`${TK}.techName`)}
          <small className="tech-required-hint">
            {t(`${TK}.requiredHint`)}
          </small>
        </label>
        <input
          ref={nameInputRef}
          id={`${id}-name`}
          className="settings-input"
          disabled={nameReadOnly}
          readOnly={nameReadOnly}
          type="text"
          value={draftName}
          aria-invalid={Boolean(formErrors.name)}
          placeholder={t(`${TK}.placeholderTechName`)}
          onChange={(event) => {
            setDraftName(event.target.value);
            onClearError?.("name");
          }}
        />
        <span className="field-error-slot" aria-live="polite">
          {formErrors.name ? (
            <span className="field-error">{formErrors.name}</span>
          ) : null}
        </span>
      </div>
      <div className="settings-field">
        <label className="settings-label" htmlFor={`${id}-phone`}>{t(`${TK}.phone`)}</label>
        <span className="phone-input-shell" data-disabled={phoneReadOnly ? 'true' : undefined}>
          <CountryCodeSelect
            value={draftPhoneParsed.countryCode}
            embedded
            disabled={phoneReadOnly}
            onChange={(nextCode) => {
              const formatted = formatNationalNumberPreservingDigits(
                draftPhoneParsed.nationalNumber,
                nextCode,
              );
              setDraftPhone(`${nextCode} ${formatted}`.trim());
              onClearError?.("phone");
            }}
          />
          <input
            id={`${id}-phone`}
            className="settings-input phone-mask-input"
            disabled={phoneReadOnly}
            readOnly={phoneReadOnly}
            type="tel"
            value={formatNationalNumberPreservingDigits(
              draftPhoneParsed.nationalNumber,
              draftPhoneParsed.countryCode,
            )}
            aria-invalid={Boolean(formErrors.phone)}
            placeholder={getNationalPhonePlaceholder(
              draftPhoneParsed.countryCode,
            )}
            inputMode="numeric"
            autoComplete="tel-national"
            onChange={(event) => {
              const formatted = formatNationalNumberPreservingDigits(
                event.target.value,
                draftPhoneParsed.countryCode,
              );
              setDraftPhone(
                `${draftPhoneParsed.countryCode} ${formatted}`.trim(),
              );
              onClearError?.("phone");
            }}
          />
        </span>
        <span className="field-error-slot" aria-live="polite">
          {formErrors.phone ? (
            <span className="field-error">
              {formErrors.phone}
            </span>
          ) : null}
        </span>
      </div>
      <div className="settings-field" data-ai-hub-field="email">
        <label className="settings-label" htmlFor={`${id}-email`}>{t(`${TK}.email`)}</label>
        <input
          className="settings-input"
          disabled={emailReadOnly}
          readOnly={emailReadOnly}
          id={`${id}-email`}
          type="email"
          value={draftEmail}
          aria-invalid={Boolean(formErrors.email)}
          placeholder={t(`${TK}.placeholderEmail`)}
          onChange={(event) => {
            setDraftEmail(event.target.value);
            onClearError?.("email");
          }}
        />
        <span className="field-error-slot" aria-live="polite">
          {formErrors.email ? (
            <span className="field-error">
              {formErrors.email}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}
