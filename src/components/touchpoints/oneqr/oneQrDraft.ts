/**
 * Draft model for the OneQR builder.
 *
 * The builder is edit-then-Save (one Save commits the active audience's module
 * list *and* its role config), so the component tree works on a local draft
 * rather than the server object. Everything that turns server state into a
 * draft — and back into a save payload — lives here so the three panels
 * (module list, config form, preview) all read one shape.
 */
import {
  OneQrAudience,
  OneQrIdentityPolicy,
  OneQrModuleKey,
  OneQrModuleUnavailableReason,
  ONEQR_AUDIENCE_ORDER,
  ONEQR_MODULE_CATALOG_BY_KEY,
  getDefaultOneQrIdentityPolicy,
} from '../../../constants/oneQr'
import type {
  OneQr,
  OneQrModule,
  OneQrModuleCatalogItem,
  SaveOneQrModulesVars,
} from '../../../types/oneQr'
import { resolveOneQrModuleLabel } from '../../oneqr/oneQrModuleLabel'

export interface DraftModule extends OneQrModule {
  /** Stable dnd-kit id — server id, or a synthetic one for unsaved rows. */
  localId: string
}

export interface AudienceDraft {
  modules: DraftModule[]
  welcomeMessage: string
  identityPolicy: OneQrIdentityPolicy
}

export type OneQrDraft = {
  /** Global — names the single master QR, not a role view. */
  name: string
  byAudience: Record<OneQrAudience, AudienceDraft>
}

let localIdCounter = 0

export function nextLocalId(): string {
  localIdCounter += 1
  return `oneqr-new-${localIdCounter}`
}

/**
 * `OneQrConfigDto` nests modules inside `audiences[]`, so each audience's list
 * is read straight from its own group — there is no flat module array to filter.
 */
export function buildDraft(oneQr: OneQr | null): OneQrDraft {
  const byAudience = {} as Record<OneQrAudience, AudienceDraft>

  for (const audience of ONEQR_AUDIENCE_ORDER) {
    const config = oneQr?.audiences.find((item) => item.audience === audience)
    byAudience[audience] = {
      welcomeMessage: config?.welcomeMessage ?? '',
      identityPolicy:
        config?.identityPolicy ?? getDefaultOneQrIdentityPolicy(audience),
      modules: prioritizeEnabledModules(
        (config?.modules ?? []).map((module) => ({
          ...module,
          localId: module.id || nextLocalId(),
        })),
      ),
    }
  }

  return { name: oneQr?.name ?? '', byAudience }
}

/** Stable partition: enabled rows first, preserving order within both groups. */
export function prioritizeEnabledModules(modules: DraftModule[]): DraftModule[] {
  return [
    ...modules.filter((module) => module.isEnabled),
    ...modules.filter((module) => !module.isEnabled),
  ]
}

export function createDraftModule(
  audience: OneQrAudience,
  moduleKey: string,
  sortOrder: number,
  customUrl: string | null = null,
): DraftModule {
  return {
    id: '',
    localId: nextLocalId(),
    audience,
    moduleKey,
    sortOrder,
    isEnabled: true,
    customLabel: null,
    customIcon: null,
    customUrl,
    defaultLabel: null,
    defaultIcon: null,
    urlTemplate: null,
    resolvedUrl: null,
    // A row added client-side has not been through the registry yet; the
    // definition's real flags arrive with the refetch after Save.
    isAvailable: true,
    unavailableReason: null,
    isComingSoon: false,
  }
}

/**
 * A module the platform admin deactivated system-wide. The builder still shows
 * the row (so the merchant does not think data vanished), but the API rejects
 * any save that includes it with 400 `ONEQR_MODULE_DISABLED`.
 */
export function isDisabledByAdmin(module: DraftModule): boolean {
  return (
    !module.isAvailable &&
    module.unavailableReason === OneQrModuleUnavailableReason.Disabled
  )
}

export function disabledByAdminModules(modules: DraftModule[]): DraftModule[] {
  return modules.filter(isDisabledByAdmin)
}

/**
 * `OneQrModuleInput` has neither `id` nor `sortOrder` — array position is the
 * sort order — so the payload is just the ordered list of settings.
 *
 * Admin-disabled rows are dropped, which is what the API expects of an
 * up-to-date client; the panel warns the merchant beforehand so the removal is
 * never a surprise.
 */
export function toSaveModulesVars(
  audience: OneQrAudience,
  modules: DraftModule[],
): SaveOneQrModulesVars {
  return {
    audience,
    modules: modules
      .filter((module) => !isDisabledByAdmin(module))
      .map((module) => ({
        moduleKey: module.moduleKey,
        isEnabled: module.isEnabled,
        customLabel: module.customLabel,
        customIcon: module.customIcon,
        customUrl:
          module.moduleKey === OneQrModuleKey.CustomLink ? module.customUrl : null,
      })),
  }
}

/**
 * Presentation defaults, most specific first: the merchant's override, then the
 * registry value the module DTO carries, then the catalog, then the bundle.
 */
export function resolveModuleIcon(
  module: Pick<DraftModule, 'moduleKey' | 'customIcon' | 'defaultIcon'>,
  catalog: OneQrModuleCatalogItem[],
): string {
  if (module.customIcon) return module.customIcon
  if (module.defaultIcon) return module.defaultIcon
  const fromCatalog = catalog.find((item) => item.moduleKey === module.moduleKey)
  return (
    fromCatalog?.defaultIcon ??
    ONEQR_MODULE_CATALOG_BY_KEY[module.moduleKey]?.defaultIcon ??
    'square'
  )
}

/**
 * Labels come from the FE locale files keyed by `moduleKey` — see
 * `oneQrModuleLabel.ts` for why the server's label is only a fallback.
 */
export function resolveModuleLabel(
  module: Pick<DraftModule, 'moduleKey' | 'customLabel' | 'defaultLabel'>,
  catalog: OneQrModuleCatalogItem[],
  t: (key: string) => string,
): string {
  const fromCatalog = catalog.find((item) => item.moduleKey === module.moduleKey)
  return resolveOneQrModuleLabel(
    {
      moduleKey: module.moduleKey,
      customLabel: module.customLabel,
      serverLabel: module.defaultLabel ?? fromCatalog?.defaultLabel,
    },
    t,
  )
}

function sameModules(a: DraftModule[], b: DraftModule[]): boolean {
  if (a.length !== b.length) return false
  return a.every((module, index) => {
    const other = b[index]
    return (
      module.moduleKey === other.moduleKey &&
      module.isEnabled === other.isEnabled &&
      module.customLabel === other.customLabel &&
      module.customIcon === other.customIcon &&
      module.customUrl === other.customUrl
    )
  })
}

export function isAudienceDirty(
  draft: AudienceDraft,
  baseline: AudienceDraft,
): boolean {
  return (
    draft.welcomeMessage !== baseline.welcomeMessage ||
    draft.identityPolicy !== baseline.identityPolicy ||
    !sameModules(draft.modules, baseline.modules)
  )
}

export function dirtyAudiences(
  draft: OneQrDraft,
  baseline: OneQrDraft,
): OneQrAudience[] {
  return ONEQR_AUDIENCE_ORDER.filter((audience) =>
    isAudienceDirty(draft.byAudience[audience], baseline.byAudience[audience]),
  )
}
