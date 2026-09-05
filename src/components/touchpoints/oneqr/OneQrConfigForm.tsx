import { AlertTriangle, Loader2, Save } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  OneQrAudience,
  OneQrIdentityPolicy,
  ONEQR_FIELD_LIMITS,
  ONEQR_IDENTITY_POLICY_OPTIONS,
} from '../../../constants/oneQr'
import type { AudienceDraft } from './oneQrDraft'

const POLICY_LABEL_KEY: Record<OneQrIdentityPolicy, string> = {
  [OneQrIdentityPolicy.PublicFirst]: 'oneqr.identity.public_first',
  [OneQrIdentityPolicy.AlwaysSignIn]: 'oneqr.identity.always_sign_in',
}

export default function OneQrConfigForm({
  name,
  audience,
  audienceDraft,
  onNameChange,
  onWelcomeChange,
  onIdentityPolicyChange,
  onSave,
  isSaving,
  isDirty,
  showNoEnabledModulesWarning,
}: {
  name: string
  audience: OneQrAudience
  audienceDraft: AudienceDraft
  onNameChange: (value: string) => void
  onWelcomeChange: (value: string) => void
  onIdentityPolicyChange: (value: OneQrIdentityPolicy) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
  showNoEnabledModulesWarning: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="oneqr-name"
          className="mb-1 block text-xs font-bold text-nexoraText"
        >
          {t('oneqr.builder.name_label')}
        </label>
        <input
          id="oneqr-name"
          type="text"
          value={name}
          maxLength={ONEQR_FIELD_LIMITS.name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t('oneqr.builder.name_placeholder')}
          className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none transition focus:border-nexoraBrand"
        />
        <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
          {t('oneqr.builder.name_hint')}
        </p>
      </div>

      <div>
        <label
          htmlFor="oneqr-welcome"
          className="mb-1 block text-xs font-bold text-nexoraText"
        >
          {t('oneqr.builder.welcome_label')}
        </label>
        <input
          id="oneqr-welcome"
          type="text"
          value={audienceDraft.welcomeMessage}
          maxLength={ONEQR_FIELD_LIMITS.welcomeMessage}
          onChange={(event) => onWelcomeChange(event.target.value)}
          placeholder={t('oneqr.builder.welcome_placeholder')}
          className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none transition focus:border-nexoraBrand"
        />
        <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
          {t('oneqr.builder.role_specific_hint', {
            audience: t(`oneqr.audience.${audience.toLowerCase()}`),
          })}
        </p>
      </div>

      <div>
        <label
          htmlFor="oneqr-identity"
          className="mb-1 block text-xs font-bold text-nexoraText"
        >
          {t('oneqr.builder.identity_label')}
        </label>
        <select
          id="oneqr-identity"
          value={audienceDraft.identityPolicy}
          onChange={(event) =>
            onIdentityPolicyChange(event.target.value as OneQrIdentityPolicy)
          }
          className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-medium text-nexoraText outline-none transition focus:border-nexoraBrand"
        >
          {ONEQR_IDENTITY_POLICY_OPTIONS.map((policy) => (
            <option key={policy} value={policy}>
              {t(POLICY_LABEL_KEY[policy])}
            </option>
          ))}
        </select>
      </div>

      {showNoEnabledModulesWarning ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-[11px] font-bold leading-relaxed text-nexoraWarning"
        >
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('oneqr.builder.no_enabled_modules_warning')}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving || !isDirty}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        {t('oneqr.builder.save')}
      </button>

      <p className="text-center text-[11px] font-medium text-nexoraMuted">
        {t('oneqr.builder.save_hint')}
      </p>
    </div>
  )
}
