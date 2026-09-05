import type { KeyboardEvent } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { OneQrAudience, ONEQR_AUDIENCE_ORDER } from '../../../constants/oneQr'

const AUDIENCE_LABEL_KEY: Record<OneQrAudience, string> = {
  [OneQrAudience.Customer]: 'oneqr.audience.customer',
  [OneQrAudience.Staff]: 'oneqr.audience.staff',
  [OneQrAudience.Owner]: 'oneqr.audience.owner',
}

export default function OneQrAudienceTabs({
  activeAudience,
  onAudienceChange,
  idPrefix,
  ariaLabel,
  dirtyAudiences = [],
}: {
  activeAudience: OneQrAudience
  onAudienceChange: (audience: OneQrAudience) => void
  idPrefix: string
  ariaLabel: string
  /** Audiences with unsaved edits get a dot so switching away is not silent. */
  dirtyAudiences?: OneQrAudience[]
}) {
  const { t } = useTranslation()

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex =
      (index + direction + ONEQR_AUDIENCE_ORDER.length) % ONEQR_AUDIENCE_ORDER.length
    const next = ONEQR_AUDIENCE_ORDER[nextIndex]
    onAudienceChange(next)
    document.getElementById(`${idPrefix}-${next}`)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex w-full gap-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted p-1"
    >
      {ONEQR_AUDIENCE_ORDER.map((audience, index) => {
        const isActive = audience === activeAudience
        return (
          <button
            key={audience}
            type="button"
            role="tab"
            id={`${idPrefix}-${audience}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onAudienceChange(audience)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={[
              'inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition',
              isActive
                ? 'bg-nexoraBrand text-white shadow-nexora-soft'
                : 'text-nexoraMuted hover:text-nexoraText',
            ].join(' ')}
          >
            <span className="truncate">{t(AUDIENCE_LABEL_KEY[audience])}</span>
            {dirtyAudiences.includes(audience) ? (
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  isActive ? 'bg-white' : 'bg-nexoraWarning'
                }`}
              />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
