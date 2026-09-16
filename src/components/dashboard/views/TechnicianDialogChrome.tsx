import { useTranslation } from '../../../contexts/LanguageContext'
import { SpinnerIcon } from './BookingHubIcons'
import { CheckIcon, CloseIcon, PersonPlusIcon } from './TechnicianFormControls'

export function TechnicianDialogHeader({ title, subtitle, titleId, isSaving, onClose }: {
  title: string; subtitle: string; titleId: string; isSaving: boolean; onClose: () => void
}) {
  const { t } = useTranslation()
  return <div className="tech-modal-head">
    <div className="tech-modal-heading">
      <span className="tech-title-mark"><PersonPlusIcon /></span>
      <div>
        <div className="tech-modal-title" id={titleId}>{title}</div>
        <div className="tech-modal-sub">{subtitle}</div>
      </div>
    </div>
    <button className="tech-modal-close" type="button" aria-label={t('components.dashboard.views.BookingHubView.team.close')} onClick={onClose} disabled={isSaving}>
      <CloseIcon />
    </button>
  </div>
}

export function TechnicianDialogActions({ isSaving, saveDisabled = false, onClose, onSave }: {
  isSaving: boolean; saveDisabled?: boolean; onClose: () => void; onSave: () => void
}) {
  const { t } = useTranslation()
  return <div className="tech-modal-actions">
    <button className="booking-secondary-button" type="button" onClick={onClose} disabled={isSaving}>
      {t('components.dashboard.views.BookingHubView.team.close')}
    </button>
    <button className="booking-primary-button" type="button" disabled={isSaving || saveDisabled} onClick={onSave}>
      {isSaving ? <SpinnerIcon className="booking-inline-spinner" /> : <CheckIcon />}
      <span>{t('components.dashboard.views.BookingHubView.team.saveTech')}</span>
    </button>
  </div>
}
