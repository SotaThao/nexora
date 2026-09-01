/**
 * OneQR builder — the "OneQR" section of the Stations & QR screen.
 *
 * Owns the edit-then-Save draft: the module list, config form and phone preview
 * all read `draft`, and one Save commits the active audience's role config plus
 * its module list (`oneqr-technical.md`: saving is live immediately, there is no
 * publish step). `GET /api/v1/merchant/oneqr` is get-or-create server-side, so
 * this component never shows an "empty / create it" state.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useOneQr,
  useSaveOneQrModules,
  useSaveOneQrRoleConfig,
  useToggleOneQr,
  useUpdateOneQrName,
} from '../../../data/hooks/useMerchantOneQr'
import {
  OneQrAudience,
  OneQrIdentityPolicy,
  OneQrModuleKey,
} from '../../../constants/oneQr'
import OneQrAudienceTabs from './OneQrAudienceTabs'
import OneQrCodeCard from './OneQrCodeCard'
import OneQrConfigForm from './OneQrConfigForm'
import OneQrModuleList from './OneQrModuleList'
import OneQrPreview from './OneQrPreview'
import AddOneQrModuleModal from './AddOneQrModuleModal'
import EditOneQrModuleModal, {
  type EditedModuleFields,
} from './EditOneQrModuleModal'
import {
  buildDraft,
  createDraftModule,
  dirtyAudiences,
  disabledByAdminModules,
  isAudienceDirty,
  resolveModuleLabel,
  toSaveModulesVars,
  type DraftModule,
  type OneQrDraft,
} from './oneQrDraft'

export default function OneQrPanel({
  businessName = '',
  businessLogoUrl = null,
}: {
  businessName?: string
  businessLogoUrl?: string | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const {
    data: oneQr,
    isLoading,
    isError,
    refetch,
  } = useOneQr()
  // `OneQrConfigDto` ships the registry catalog inline, so the builder needs no
  // second request for it.
  const catalog = oneQr?.catalog ?? []

  const updateName = useUpdateOneQrName()
  const saveRoleConfig = useSaveOneQrRoleConfig()
  const saveModules = useSaveOneQrModules()
  const toggleOneQr = useToggleOneQr()

  const [audience, setAudience] = useState<OneQrAudience>(OneQrAudience.Customer)
  const [draft, setDraft] = useState<OneQrDraft>(() => buildDraft(null))
  const [baseline, setBaseline] = useState<OneQrDraft>(() => buildDraft(null))
  const [addingModule, setAddingModule] = useState(false)
  const [editingModule, setEditingModule] = useState<DraftModule | null>(null)

  const isDirtyRef = useRef(false)

  // Re-seed from the server on load and after every save. A background refetch
  // must not silently discard in-progress edits, so skip the reset while the
  // draft differs from its baseline.
  useEffect(() => {
    if (!oneQr) return
    if (isDirtyRef.current) return
    const next = buildDraft(oneQr)
    setDraft(next)
    setBaseline(buildDraft(oneQr))
  }, [oneQr])

  const dirtyList = useMemo(
    () => dirtyAudiences(draft, baseline),
    [draft, baseline],
  )
  const isNameDirty = draft.name !== baseline.name
  // Written during render on purpose: the reset effect below runs only when
  // `oneQr` changes, and at that moment it needs the dirty flag as of the last
  // render the user actually edited in.
  isDirtyRef.current = dirtyList.length > 0 || isNameDirty

  const audienceDraft = draft.byAudience[audience]
  const isAudienceEdited =
    isAudienceDirty(audienceDraft, baseline.byAudience[audience]) || isNameDirty

  const updateAudienceDraft = (
    updater: (current: OneQrDraft['byAudience'][OneQrAudience]) => OneQrDraft['byAudience'][OneQrAudience],
  ) => {
    setDraft((current) => ({
      ...current,
      byAudience: {
        ...current.byAudience,
        [audience]: updater(current.byAudience[audience]),
      },
    }))
  }

  const handleReorder = (modules: DraftModule[]) => {
    updateAudienceDraft((current) => ({ ...current, modules }))
  }

  const handleToggleModule = (localId: string) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.localId === localId
          ? { ...module, isEnabled: !module.isEnabled }
          : module,
      ),
    }))
  }

  const handleRemoveModule = (localId: string) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: current.modules.filter((module) => module.localId !== localId),
    }))
  }

  const handleAddModule = (moduleKey: string, customUrl: string | null) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: [
        ...current.modules,
        createDraftModule(audience, moduleKey, current.modules.length, customUrl),
      ],
    }))
    setAddingModule(false)
  }

  const handleEditModule = (fields: EditedModuleFields) => {
    const target = editingModule
    if (!target) return
    updateAudienceDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.localId === target.localId ? { ...module, ...fields } : module,
      ),
    }))
    setEditingModule(null)
  }

  const handleSave = async () => {
    if (!oneQr) return
    try {
      if (isNameDirty) {
        await updateName.mutateAsync(draft.name.trim())
      }
      await saveRoleConfig.mutateAsync({
        audience,
        welcomeMessage: audienceDraft.welcomeMessage.trim() || null,
        identityPolicy: audienceDraft.identityPolicy,
      })
      await saveModules.mutateAsync(
        toSaveModulesVars(audience, audienceDraft.modules),
      )
      // Clear the guard before the invalidation-driven refetch lands, so the
      // effect above re-seeds from the freshly saved server state.
      isDirtyRef.current = false
      setBaseline(draft)
      showToast(t('oneqr.toast.saved'), 'success')
    } catch {
      // Each mutation already surfaces its own error toast.
    }
  }

  const isSaving =
    updateName.isPending || saveRoleConfig.isPending || saveModules.isPending

  const hasEnabledModules = audienceDraft.modules.some(
    (module) => module.isEnabled,
  )
  // `hasActiveTouchPoint` is computed by the backend and shipped with the
  // config — no need to cross-read the touchpoint list from here. Both TipAndPay
  // and Review resolve through a TouchPoint, so either one triggers the warning.
  const touchPointDependentEnabled = audienceDraft.modules
    .filter((module) => module.isEnabled)
    .map((module) => module.moduleKey)
    .filter(
      (key) =>
        catalog.find((item) => item.moduleKey === key)?.requiresTouchPoint ??
        false,
    )
  const touchPointWarning =
    oneQr?.hasActiveTouchPoint === false && touchPointDependentEnabled.length > 0

  // Rows the platform admin turned off system-wide. They stay visible, but the
  // API rejects a save that still contains them, so `toSaveModulesVars` drops
  // them — warn first rather than letting a row disappear silently.
  const disabledModules = disabledByAdminModules(audienceDraft.modules)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-xs font-medium text-nexoraMuted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t('common.loading')}
      </div>
    )
  }

  if (isError || !oneQr) {
    return (
      <div className="nexora-card space-y-3 p-6 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-nexoraWarning" aria-hidden />
        <p className="text-sm font-bold text-nexoraText">
          {t('oneqr.builder.load_error_title')}
        </p>
        <p className="text-xs font-medium text-nexoraMuted">
          {t('oneqr.builder.load_error_desc')}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t('oneqr.builder.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <OneQrCodeCard
        oneQr={oneQr}
        onToggleActive={() => toggleOneQr.mutate()}
        isToggling={toggleOneQr.isPending}
      />

      {touchPointWarning ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-relaxed text-nexoraWarning"
        >
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          {t('oneqr.builder.needs_station_warning', {
            modules: touchPointDependentEnabled
              .map((key) =>
                resolveModuleLabel({ moduleKey: key, customLabel: null, defaultLabel: null }, catalog, t),
              )
              .join(', '),
          })}
        </p>
      ) : null}

      {disabledModules.length > 0 ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-relaxed text-nexoraWarning"
        >
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          {t('oneqr.builder.disabled_modules_warning', {
            modules: disabledModules
              .map((module) => resolveModuleLabel(module, catalog, t))
              .join(', '),
          })}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,320px)]">
        <section className="nexora-card space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-nexoraText">
              {t('oneqr.builder.modules_title')}
            </h3>
            <span className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t('oneqr.builder.drag_drop_pill')}
            </span>
          </div>

          <OneQrAudienceTabs
            activeAudience={audience}
            onAudienceChange={setAudience}
            idPrefix="oneqr-modules-audience"
            ariaLabel={t('oneqr.builder.audience_tabs_label')}
            dirtyAudiences={dirtyList}
          />

          <OneQrModuleList
            modules={audienceDraft.modules}
            catalog={catalog}
            onReorder={handleReorder}
            onToggle={handleToggleModule}
            onEdit={setEditingModule}
            onRemove={handleRemoveModule}
            onAdd={() => setAddingModule(true)}
          />
        </section>

        <section className="nexora-card space-y-3 p-4">
          <h3 className="text-sm font-black text-nexoraText">
            {t('oneqr.builder.config_title')}
          </h3>
          <OneQrConfigForm
            name={draft.name}
            audience={audience}
            audienceDraft={audienceDraft}
            onNameChange={(value) =>
              setDraft((current) => ({ ...current, name: value }))
            }
            onWelcomeChange={(value) =>
              updateAudienceDraft((current) => ({
                ...current,
                welcomeMessage: value,
              }))
            }
            onIdentityPolicyChange={(value: OneQrIdentityPolicy) =>
              updateAudienceDraft((current) => ({
                ...current,
                identityPolicy: value,
              }))
            }
            onSave={handleSave}
            isSaving={isSaving}
            isDirty={isAudienceEdited}
            showNoEnabledModulesWarning={!hasEnabledModules}
          />
        </section>

        <section className="nexora-card space-y-3 p-4">
          <h3 className="text-sm font-black text-nexoraText">
            {t('oneqr.builder.preview_title')}
          </h3>
          <OneQrPreview
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            audienceDraft={audienceDraft}
            catalog={catalog}
            isPaused={!oneQr.isActive}
          />
        </section>
      </div>

      {addingModule ? (
        <AddOneQrModuleModal
          audience={audience}
          existingModules={audienceDraft.modules}
          catalog={catalog}
          onAdd={handleAddModule}
          onClose={() => setAddingModule(false)}
        />
      ) : null}

      {editingModule ? (
        <EditOneQrModuleModal
          module={editingModule}
          catalog={catalog}
          onSave={handleEditModule}
          onClose={() => setEditingModule(null)}
        />
      ) : null}
    </div>
  )
}
