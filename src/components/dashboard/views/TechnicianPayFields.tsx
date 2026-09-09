import { useTranslation } from '../../../contexts/LanguageContext'

export type TechnicianPayStructure = 'Commission' | 'WeeklySalary' | 'AgreedAmount'
export interface TechnicianPayDraft {
  roleId: string
  staffLevelId?: string
  payStructureType: TechnicianPayStructure
  commissionPercent: string
  weeklySalaryAmount: string
  agreedAmount: string
  tipsEnabled: boolean
}
export default function TechnicianPayFields({ draft, roles, levels = [], onChange, error, onClearError }: {
  draft: TechnicianPayDraft
  roles: Array<{ id: string; name: string }>
  levels?: Array<{ id: string; name: string }>
  onChange: (patch: Partial<TechnicianPayDraft>) => void
  error?: string
  onClearError?: () => void
}) {
  const { t } = useTranslation()
  const POS_TK = 'components.dashboard.views.pos.PosStaffProfileView'
  type PosPayStructureType = TechnicianPayStructure
  const { roleId: selectedPosRoleId, staffLevelId = '', payStructureType: draftPayStructureType, commissionPercent: draftCommissionPercent, weeklySalaryAmount: draftWeeklySalaryAmount, agreedAmount: draftAgreedAmount, tipsEnabled: draftTipsEnabled } = draft
  const posRoles = roles
  const formErrors = { posPay: error }
  const posRoleHasError = Boolean(error && !selectedPosRoleId)
  const posPayValueHasError = Boolean(error && selectedPosRoleId)
  const setDraftPosRoleId = (roleId: string) => onChange({ roleId })
  const setDraftPayStructureType = (payStructureType: TechnicianPayStructure) => onChange({ payStructureType })
  const setDraftCommissionPercent = (commissionPercent: string) => onChange({ commissionPercent })
  const setDraftWeeklySalaryAmount = (weeklySalaryAmount: string) => onChange({ weeklySalaryAmount })
  const setDraftAgreedAmount = (agreedAmount: string) => onChange({ agreedAmount })
  const setDraftTipsEnabled = (tipsEnabled: boolean) => onChange({ tipsEnabled })
  return <>
    <div
      className="tech-pos-pay-grid"
      style={{ alignItems: "start" }}
    >
      <label className="settings-field">
        <span className="settings-label">
          {t(`${POS_TK}.roleLabel`)}
        </span>
        <select
          className="settings-input"
          aria-label={t(`${POS_TK}.roleLabel`)}
          aria-invalid={posRoleHasError}
          aria-describedby={
            posRoleHasError ? "tech-pos-pay-error" : undefined
          }
          value={selectedPosRoleId}
          onChange={(event) => {
            setDraftPosRoleId(event.target.value);
            onClearError?.();
          }}
        >
          {!selectedPosRoleId ? (
            <option value="" disabled>
              —
            </option>
          ) : null}
          {posRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        {posRoleHasError ? (
          <span
            className="tech-pos-pay-field-error"
            id="tech-pos-pay-error"
            role="alert"
          >
            {formErrors.posPay}
          </span>
        ) : null}
      </label>

      {levels.length > 0 ? (
        <label className="settings-field">
          <span className="settings-label">
            {t(`${POS_TK}.staffLevelLabel`)}
          </span>
          <select
            className="settings-input"
            aria-label={t(`${POS_TK}.staffLevelLabel`)}
            value={staffLevelId}
            onChange={(event) => onChange({ staffLevelId: event.target.value })}
          >
            <option value="">{t(`${POS_TK}.staffLevelNoneOption`)}</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="settings-field">
        <span className="settings-label">
          {t(`${POS_TK}.payStructureLabel`)}
        </span>
        <select
          className="settings-input"
          aria-label={t(`${POS_TK}.payStructureLabel`)}
          value={draftPayStructureType}
          onChange={(event) => {
            setDraftPayStructureType(
              event.target.value as PosPayStructureType,
            );
            onClearError?.();
          }}
        >
          {(
            [
              "Commission",
              "WeeklySalary",
              "AgreedAmount",
            ] as const
          ).map((type) => (
            <option key={type} value={type}>
              {t(`${POS_TK}.payStructureTypes.${type}`)}
            </option>
          ))}
        </select>
      </label>

      {draftPayStructureType === "Commission" ? (
        <label className="settings-field">
          <span className="settings-label">
            {t(`${POS_TK}.commissionPercentLabel`)}
          </span>
          <input
            className="settings-input"
            type="number"
            min="0"
            max="100"
            step="0.01"
            aria-label={t(`${POS_TK}.commissionPercentLabel`)}
            aria-invalid={posPayValueHasError}
            aria-describedby={
              posPayValueHasError
                ? "tech-pos-pay-error"
                : undefined
            }
            value={draftCommissionPercent}
            onChange={(event) => {
              setDraftCommissionPercent(event.target.value);
              onClearError?.();
            }}
          />
          {posPayValueHasError ? (
            <span
              className="tech-pos-pay-field-error"
              id="tech-pos-pay-error"
              role="alert"
            >
              {formErrors.posPay}
            </span>
          ) : null}
        </label>
      ) : null}

      {draftPayStructureType === "WeeklySalary" ? (
        <label className="settings-field">
          <span className="settings-label">
            {t(`${POS_TK}.weeklySalaryAmountLabel`)}
          </span>
          <input
            className="settings-input"
            type="number"
            min="0"
            step="0.01"
            aria-label={t(`${POS_TK}.weeklySalaryAmountLabel`)}
            aria-invalid={posPayValueHasError}
            aria-describedby={
              posPayValueHasError
                ? "tech-pos-pay-error"
                : undefined
            }
            value={draftWeeklySalaryAmount}
            onChange={(event) => {
              setDraftWeeklySalaryAmount(event.target.value);
              onClearError?.();
            }}
          />
          {posPayValueHasError ? (
            <span
              className="tech-pos-pay-field-error"
              id="tech-pos-pay-error"
              role="alert"
            >
              {formErrors.posPay}
            </span>
          ) : null}
        </label>
      ) : null}

      {draftPayStructureType === "AgreedAmount" ? (
        <label className="settings-field">
          <span className="settings-label">
            {t(`${POS_TK}.agreedAmountLabel`)}
          </span>
          <input
            className="settings-input"
            type="number"
            min="0"
            step="0.01"
            aria-label={t(`${POS_TK}.agreedAmountLabel`)}
            aria-invalid={posPayValueHasError}
            aria-describedby={
              posPayValueHasError
                ? "tech-pos-pay-error"
                : undefined
            }
            value={draftAgreedAmount}
            onChange={(event) => {
              setDraftAgreedAmount(event.target.value);
              onClearError?.();
            }}
          />
          {posPayValueHasError ? (
            <span
              className="tech-pos-pay-field-error"
              id="tech-pos-pay-error"
              role="alert"
            >
              {formErrors.posPay}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>

    <label className="tech-pos-tips-row">
      <input
        className="tech-pos-tips-input"
        type="checkbox"
        aria-label={t(`${POS_TK}.tipsEnabledLabel`)}
        checked={draftTipsEnabled}
        onChange={(event) =>
          setDraftTipsEnabled(event.target.checked)
        }
      />
      <span className="tech-pos-tips-switch" aria-hidden="true">
        <span />
      </span>
      <span>{t(`${POS_TK}.tipsEnabledLabel`)}</span>
    </label>

  </>
}
