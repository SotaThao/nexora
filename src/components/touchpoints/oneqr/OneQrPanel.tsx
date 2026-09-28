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
  isOneQrModuleVisibleForAudience,
} from '../../../constants/oneQr'
import OneQrAudienceTabs from './OneQrAudienceTabs'
import OneQrCodeCard from './OneQrCodeCard'
import OneQrConfigForm from './OneQrConfigForm'
import OneQrModuleList from './OneQrModuleList'
import OneQrPreview from './OneQrPreview'
import AddOneQrModuleModal from './AddOneQrModuleModal'
import {
  buildDraft,
  createDraftModule,
  dirtyAudiences,
  disabledByAdminModules,
  isAudienceDirty,
  prioritizeEnabledModules,
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
  const { showToast, showConfirm } = useNotification()

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
  const visibleModules = audienceDraft.modules.filter((module) => {
    const definition = catalog.find(
      (item) => item.moduleKey === module.moduleKey,
    )
    return isOneQrModuleVisibleForAudience(
      module.moduleKey,
      audience,
      definition?.primaryAudience,
    )
  })
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
    updateAudienceDraft((current) => ({
      ...current,
      modules: (() => {
        const orderedVisible = prioritizeEnabledModules(modules)
        let visibleIndex = 0
        return current.modules.map((module) => {
          const definition = catalog.find(
            (item) => item.moduleKey === module.moduleKey,
          )
          return isOneQrModuleVisibleForAudience(
            module.moduleKey,
            audience,
            definition?.primaryAudience,
          )
            ? orderedVisible[visibleIndex++]
            : module
        })
      })(),
    }))
  }

  const handleToggleModule = (localId: string) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: prioritizeEnabledModules(
        current.modules.map((module) =>
          module.localId === localId
            ? { ...module, isEnabled: !module.isEnabled }
            : module,
        ),
      ),
    }))
  }

  /**
   * Removing a tile is the one destructive edit in the builder, so it asks
   * first and then commits immediately instead of waiting for Save — a row that
   * silently reappears after a refresh (because the merchant never pressed
   * Save) reads as a broken delete.
   *
   * `PUT /modules` replaces the audience's whole list, so this necessarily
   * commits the rest of that role's pending edits too; the confirm text says so.
   */
  const handleRemoveModule = async (localId: string) => {
    const target = audienceDraft.modules.find(
      (module) => module.localId === localId,
    )
    if (!target) return

    const confirmed = await showConfirm(
      t('oneqr.builder.remove_module_confirm', {
        module: resolveModuleLabel(target, catalog, t),
        audience: t(`oneqr.audience.${audience.toLowerCase()}`),
      }),
      t('oneqr.builder.remove_module_confirm_title'),
    )
    if (!confirmed) return

    const nextDraft: OneQrDraft = {
      ...draft,
      byAudience: {
        ...draft.byAudience,
        [audience]: {
          ...audienceDraft,
          modules: audienceDraft.modules.filter(
            (module) => module.localId !== localId,
          ),
        },
      },
    }
    setDraft(nextDraft)
    await persistDraft(nextDraft)
  }

  const handleAddModule = (moduleKey: string, customUrl: string | null) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: prioritizeEnabledModules([
        ...current.modules,
        createDraftModule(audience, moduleKey, current.modules.length, customUrl),
      ]),
    }))
    setAddingModule(false)
  }

  const handleUpdateModule = (
    localId: string,
    fields: Partial<Pick<DraftModule, 'customLabel' | 'customIcon' | 'customUrl'>>,
  ) => {
    updateAudienceDraft((current) => ({
      ...current,
      modules: current.modules.map((module) =>
        module.localId === localId ? { ...module, ...fields } : module,
      ),
    }))
  }

  /**
   * Commits the active audience of an explicit draft.
   *
   * Takes the draft as an argument rather than reading state so a caller that
   * has just computed the next draft (delete) commits *that* value — React has
   * not re-rendered yet, so `audienceDraft` would still be the pre-edit list.
   */
  const persistDraft = async (next: OneQrDraft): Promise<boolean> => {
    if (!oneQr) return false
    const nextAudience = next.byAudience[audience]
    try {
      if (next.name !== baseline.name) {
        await updateName.mutateAsync(next.name.trim())
      }
      await saveRoleConfig.mutateAsync({
        audience,
        welcomeMessage: nextAudience.welcomeMessage.trim() || null,
        identityPolicy: nextAudience.identityPolicy,
      })
      await saveModules.mutateAsync(
        toSaveModulesVars(audience, nextAudience.modules),
      )
      // Clear the guard before the invalidation-driven refetch lands, so the
      // effect above re-seeds from the freshly saved server state.
      isDirtyRef.current = false
      setBaseline(next)
      showToast(t('oneqr.toast.saved'), 'success')
      return true
    } catch {
      // Each mutation already surfaces its own error toast.
      return false
    }
  }

  const handleSave = () => persistDraft(draft)

  const isSaving =
    updateName.isPending || saveRoleConfig.isPending || saveModules.isPending

  const hasEnabledModules = visibleModules.some(
    (module) => module.isEnabled,
  )
  // `hasActiveTouchPoint` is computed by the backend and shipped with the
  // config — no need to cross-read the touchpoint list from here. Both TipAndPay
  // and Review resolve through a TouchPoint, so either one triggers the warning.
  const touchPointDependentEnabled = visibleModules
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
  const disabledModules = disabledByAdminModules(visibleModules)

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
        previewAudience={audience}
        onPreviewAudienceChange={setAudience}
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

      {/* 3-up only from xl — with the sidebar, lg is too narrow for module rows + 4 audience tabs. */}
      <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.75fr)_minmax(0,300px)]">
        <section className="nexora-card min-w-0 space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="min-w-0 text-sm font-black text-nexoraText">
              {t('oneqr.builder.modules_title')}
            </h3>
            <span className="shrink-0 rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
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
            modules={visibleModules}
            catalog={catalog}
            onReorder={handleReorder}
            onToggle={handleToggleModule}
            onUpdate={handleUpdateModule}
            onRemove={handleRemoveModule}
            onAdd={() => setAddingModule(true)}
            onAddCustomLink={(url) =>
              handleAddModule(OneQrModuleKey.CustomLink, url)
            }
          />
        </section>

        <section className="nexora-card min-w-0 space-y-3 p-3 sm:p-4">
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

        <section className="nexora-card min-w-0 space-y-3 p-3 sm:p-4 md:col-span-2 xl:col-span-1">
          <h3 className="text-sm font-black text-nexoraText">
            {t('oneqr.builder.preview_title')}
          </h3>
          <OneQrPreview
            businessName={businessName}
            businessLogoUrl={businessLogoUrl}
            audienceDraft={{ ...audienceDraft, modules: visibleModules }}
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

    </div>
  )
}
