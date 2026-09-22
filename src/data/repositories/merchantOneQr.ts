/**
 * merchantOneQrRepository — Merchant OneQR builder API integration.
 *
 * Contract verified against the live backend Swagger on 2026-08-31
 * (`OneQrConfigDto`). Three things about that DTO drive the shape of this file:
 *
 *  - modules are **nested inside `audiences[]`**, not a flat list at the root;
 *  - the module `catalog` ships **inline** with the config, so the separate
 *    `/module-catalog` endpoint is only a fallback;
 *  - catalog content comes from the admin-managed `OneQrModuleDefinition`
 *    table, so it is runtime data — the server's keys, values and order all
 *    win over the bundled fallback (see `mergeCatalog`).
 *
 * There is no `POST` — `GET /api/v1/merchant/oneqr` is get-or-create, so the
 * client never has to create the record itself.
 */

import httpClient from '../../lib/httpClient'
import {
  OneQrAudience,
  OneQrIdentityPolicy,
  OneQrModuleKey,
  OneQrModuleUnavailableReason,
  ONEQR_AUDIENCE_ORDER,
  ONEQR_MODULE_CATALOG,
  ONEQR_MODULE_CATALOG_BY_KEY,
} from '../../constants/oneQr'
import type {
  OneQr,
  OneQrModule,
  OneQrModuleCatalogItem,
  OneQrRoleConfig,
  SaveOneQrModulesVars,
  SaveOneQrRoleConfigVars,
} from '../../types/oneQr'
import { isApiError } from '../../types/domain'

type HttpClient = typeof httpClient
type Raw = Record<string, unknown>

const BASE = '/api/v1/merchant/oneqr'

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

function nullableStr(value: unknown): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Use the server's boolean whenever it sent one; fall back only when the field
 * is genuinely absent.
 *
 * The obvious-looking `raw.flag === true || bundledDefault` is wrong: a bundled
 * `true` then overrides an explicit `false` from the API, so a module the admin
 * un-flagged in the portal keeps showing its badge forever. A fallback must
 * cover a *missing* value, never contradict a present one.
 */
function boolOrFallback(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/**
 * Swagger declares every OneQR enum as a JSON string, but tolerate an ordinal
 * too: a `JsonStringEnumConverter` regression on the BE side would otherwise
 * silently blank the builder instead of failing loudly.
 */
function toEnum<T extends string>(
  value: unknown,
  members: readonly T[],
  fallback: T,
): T {
  if (typeof value === 'number' && members[value] !== undefined) {
    return members[value]
  }
  const raw = str(value).trim()
  if (!raw) return fallback
  const match = members.find((member) => member.toLowerCase() === raw.toLowerCase())
  return match ?? fallback
}

const AUDIENCE_MEMBERS = [
  OneQrAudience.Customer,
  OneQrAudience.Staff,
  OneQrAudience.Owner,
  OneQrAudience.AIVoice,
] as const

const IDENTITY_POLICY_MEMBERS = [
  OneQrIdentityPolicy.PublicFirst,
  OneQrIdentityPolicy.AlwaysSignIn,
] as const

export function toOneQrAudience(value: unknown): OneQrAudience {
  return toEnum(value, AUDIENCE_MEMBERS, OneQrAudience.Customer)
}

export function toOneQrIdentityPolicy(value: unknown): OneQrIdentityPolicy {
  return toEnum(value, IDENTITY_POLICY_MEMBERS, OneQrIdentityPolicy.PublicFirst)
}

/**
 * `moduleKey` is a free-form string on the wire — an admin can add modules
 * through the portal without a deploy — so it is passed through untouched.
 *
 * It deliberately does NOT coerce to a member of `OneQrModuleKey`: mapping an
 * admin-authored key onto `CustomLink` (as an earlier version did) would render
 * the wrong tile and then, on Save, replace the merchant's module with an empty
 * CustomLink. Casing is preserved because the key round-trips back to the API.
 */
export function toOneQrModuleKey(value: unknown): string {
  return str(value).trim()
}

/**
 * Null when the module resolves fine, or when the backend sent a reason this
 * build does not recognise — a new reason string must not be shown raw to a
 * merchant, and `isAvailable` already carries the important bit.
 */
export function toOneQrUnavailableReason(
  value: unknown,
): OneQrModuleUnavailableReason | null {
  const raw = str(value).trim()
  if (!raw) return null
  const match = Object.values(OneQrModuleUnavailableReason).find(
    (reason) => reason.toLowerCase() === raw.toLowerCase(),
  )
  return match ?? null
}

/** `audience` is not on the module DTO — it comes from the group that owns it. */
function normalizeModule(
  raw: Raw,
  audience: OneQrAudience,
  index: number,
): OneQrModule {
  const sortOrder = Number(raw.sortOrder)
  return {
    id: str(raw.id),
    audience,
    moduleKey: toOneQrModuleKey(raw.moduleKey),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : index,
    isEnabled: raw.isEnabled !== false,
    customLabel: nullableStr(raw.customLabel),
    customIcon: nullableStr(raw.customIcon),
    customIconUrl: nullableStr(raw.customIconUrl),
    customUrl: nullableStr(raw.customUrl),
    defaultLabel: nullableStr(raw.defaultLabel),
    defaultIcon: nullableStr(raw.defaultIcon),
    // Admin's router with placeholders intact, e.g. `/booking/{businessSlug}`.
    urlTemplate: nullableStr(raw.urlTemplate),
    resolvedUrl: nullableStr(raw.resolvedUrl),
    isAvailable: raw.isAvailable !== false,
    unavailableReason: toOneQrUnavailableReason(raw.unavailableReason),
    isComingSoon: raw.isComingSoon === true,
  }
}

function normalizeAudienceConfig(raw: Raw): OneQrRoleConfig {
  const audience = toOneQrAudience(raw.audience)
  const modules = Array.isArray(raw.modules)
    ? (raw.modules as Raw[])
        .map((module, index) => normalizeModule(module, audience, index))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  return {
    audience,
    welcomeMessage: nullableStr(raw.welcomeMessage),
    identityPolicy: toOneQrIdentityPolicy(raw.identityPolicy),
    modules,
  }
}

/**
 * The backend seeds every audience at create time, but backfill anyway so
 * the builder never renders a blank form for a role the server omitted.
 */
function withAllAudiences(configs: OneQrRoleConfig[]): OneQrRoleConfig[] {
  return ONEQR_AUDIENCE_ORDER.map(
    (audience) =>
      configs.find((config) => config.audience === audience) ?? {
        audience,
        welcomeMessage: null,
        identityPolicy: OneQrIdentityPolicy.PublicFirst,
        modules: [],
      },
  )
}

function normalizeCatalogItem(raw: Raw): OneQrModuleCatalogItem {
  const moduleKey = toOneQrModuleKey(raw.moduleKey)
  const bundled = ONEQR_MODULE_CATALOG_BY_KEY[moduleKey]
  const allowed = Array.isArray(raw.allowedAudiences)
    ? (raw.allowedAudiences as unknown[]).map(toOneQrAudience)
    : (bundled?.allowedAudiences ?? [...ONEQR_AUDIENCE_ORDER])

  return {
    moduleKey,
    defaultLabel: nullableStr(raw.defaultLabel),
    defaultIcon: nullableStr(raw.defaultIcon) ?? bundled?.defaultIcon ?? null,
    urlTemplate: nullableStr(raw.urlTemplate),
    allowedAudiences: allowed,
    requiresTouchPoint: boolOrFallback(
      raw.requiresTouchPoint,
      Boolean(bundled?.requiresTouchPoint),
    ),
    // Both flags are derived server-side from `moduleKey === CustomLink` and
    // deliberately never became columns, so the same rule applies as a fallback.
    requiresCustomUrl: boolOrFallback(
      raw.requiresCustomUrl,
      moduleKey === OneQrModuleKey.CustomLink,
    ),
    allowsMultiple: boolOrFallback(
      raw.allowsMultiple,
      moduleKey === OneQrModuleKey.CustomLink,
    ),
    isComingSoon: boolOrFallback(raw.isComingSoon, Boolean(bundled?.comingSoon)),
  }
}

/**
 * The bundled registry as catalog items.
 *
 * `defaultLabel` stays null on purpose: the bundled label is an i18n *key*, not
 * a display string, so consumers must fall through to `t('oneqr.modules.*')`.
 * Emitting an English label here would break the Vietnamese builder.
 */
export function buildOneQrFallbackCatalog(): OneQrModuleCatalogItem[] {
  return ONEQR_MODULE_CATALOG.map((entry) => ({
    moduleKey: entry.moduleKey,
    defaultLabel: null,
    defaultIcon: entry.defaultIcon,
    // Routers live in the admin table; the bundle never guesses one.
    urlTemplate: null,
    allowedAudiences: [...entry.allowedAudiences],
    requiresTouchPoint: Boolean(entry.requiresTouchPoint),
    requiresCustomUrl: entry.moduleKey === OneQrModuleKey.CustomLink,
    allowsMultiple: Boolean(entry.repeatable),
    isComingSoon: Boolean(entry.comingSoon),
  }))
}

/** Pulls the array out of a bare list, an `items` page, or a `data` envelope. */
function readCatalogArray(raw: unknown): Raw[] {
  if (Array.isArray(raw)) return raw as Raw[]
  if (!raw || typeof raw !== 'object') return []
  const source = raw as Raw
  for (const key of ['items', 'data', 'modules'] as const) {
    const value = source[key]
    if (Array.isArray(value)) return value as Raw[]
    if (value && typeof value === 'object' && Array.isArray((value as Raw).items)) {
      return (value as Raw).items as Raw[]
    }
  }
  return []
}

/**
 * Merges the server catalog with the bundled fallback.
 *
 * Module metadata lives in the admin-managed `OneQrModuleDefinition` table, so
 * when the server sends a catalog it is authoritative in three ways:
 *
 *  1. **Which keys exist** — a key the admin deactivated is absent, and adding
 *     it back from the bundle would offer the merchant a module that cannot
 *     resolve. (It also used to risk a 400 when the FE knew keys the API enum
 *     did not; both sides now agree on 20.)
 *  2. **Field values** — label, icon, audiences and flags are admin-edited.
 *  3. **Order** — the sequence reflects the admin's `sortOrder`, so it is
 *     preserved as-is rather than re-sorted into the bundled order.
 *
 * The bundle only fills a field the payload left empty, and only stands in
 * wholesale when the server sends no catalog at all.
 */
function mergeCatalog(serverItems: OneQrModuleCatalogItem[]): OneQrModuleCatalogItem[] {
  if (serverItems.length === 0) return buildOneQrFallbackCatalog()

  const bundledByKey = new Map(
    buildOneQrFallbackCatalog().map((item) => [item.moduleKey, item]),
  )

  return serverItems.map((server) => {
    const bundled = bundledByKey.get(server.moduleKey)
    if (!bundled) return server
    return {
      ...bundled,
      ...server,
      defaultIcon: server.defaultIcon ?? bundled.defaultIcon,
      allowedAudiences: server.allowedAudiences.length
        ? server.allowedAudiences
        : bundled.allowedAudiences,
    }
  })
}

export function normalizeOneQr(raw: unknown): OneQr | null {
  if (!raw || typeof raw !== 'object') return null
  const source =
    (raw as Raw).data && typeof (raw as Raw).data === 'object'
      ? ((raw as Raw).data as Raw)
      : (raw as Raw)

  if (!source.id) return null

  const audiences = Array.isArray(source.audiences)
    ? (source.audiences as Raw[]).map(normalizeAudienceConfig)
    : []

  return {
    id: str(source.id),
    name: str(source.name),
    url: str(source.url),
    qrImageUrl: nullableStr(source.qrImageUrl),
    isActive: source.isActive !== false,
    createdAt: nullableStr(source.createdAt),
    hasActiveTouchPoint: source.hasActiveTouchPoint !== false,
    audiences: withAllAudiences(audiences),
    catalog: mergeCatalog(readCatalogArray(source.catalog).map(normalizeCatalogItem)),
  }
}

export function createMerchantOneQrRepository(client: HttpClient = httpClient) {
  return {
    /**
     * Get-or-create on the backend, so a fresh business still gets a seeded
     * OneQR here. `null` only means the endpoint itself is missing (404).
     */
    async getOneQr(): Promise<OneQr | null> {
      try {
        const raw = await client.get<Raw>(BASE)
        return normalizeOneQr(raw)
      } catch (err: unknown) {
        if (isApiError(err) && err.status === 404) return null
        throw err
      }
    },

    /** `Name` is the one global (non role-specific) field. */
    async updateOneQrName(name: string): Promise<void> {
      await client.put(BASE, { name })
    },

    async saveRoleConfig({
      audience,
      welcomeMessage,
      identityPolicy,
    }: SaveOneQrRoleConfigVars): Promise<void> {
      await client.put(`${BASE}/role-config`, {
        audience,
        welcomeMessage,
        identityPolicy,
      })
    },

    /**
     * Replaces one audience's whole module list. `OneQrModuleInput` carries
     * neither `id` nor `sortOrder`: array position *is* the sort order, and
     * rows are matched by `moduleKey`, so send them already ordered.
     */
    async saveModules({ audience, modules }: SaveOneQrModulesVars): Promise<void> {
      await client.put(`${BASE}/modules`, {
        audience,
        modules: modules.map((module) => ({
          moduleKey: module.moduleKey,
          isEnabled: module.isEnabled,
          customLabel: module.customLabel ?? null,
          customIcon: module.customIcon ?? null,
          customIconUrl: module.customIconUrl ?? null,
          customUrl: module.customUrl ?? null,
        })),
      })
    },

    /**
     * Active ⇄ Inactive. Never deletes; the printed QR must keep resolving.
     * Returns the resulting state so the caller reports what actually happened
     * instead of inferring it from the pre-toggle value.
     */
    async toggleOneQr(): Promise<boolean | null> {
      const raw = await client.put<Raw>(`${BASE}/toggle`)
      const source =
        raw?.data && typeof raw.data === 'object' ? (raw.data as Raw) : raw
      if (!source || typeof source.isActive !== 'boolean') return null
      return source.isActive
    },

    async deleteOneQr(): Promise<void> {
      await client.del(BASE)
    },

    async downloadQr(format: 'png' | 'pdf' = 'png'): Promise<Blob> {
      return client.getBlob(`${BASE}/download`, { params: { format } })
    },

    /**
     * Standalone registry read. Normally unnecessary — `getOneQr()` already
     * carries `catalog` — so this exists for callers that need the catalog
     * without the config. Never resolves to an empty list: a 404/501 means
     * "no registry endpoint", not "no modules".
     */
    async getModuleCatalog(
      audience?: OneQrAudience,
    ): Promise<OneQrModuleCatalogItem[]> {
      try {
        const raw = await client.get<Raw[] | Raw>(`${BASE}/module-catalog`, {
          // The endpoint takes a PascalCase `Audience` filter.
          params: audience ? { Audience: audience } : undefined,
        })
        return mergeCatalog(readCatalogArray(raw).map(normalizeCatalogItem))
      } catch (err: unknown) {
        if (isApiError(err) && (err.status === 404 || err.status === 501)) {
          return buildOneQrFallbackCatalog()
        }
        throw err
      }
    },
  }
}

export const merchantOneQrRepository = createMerchantOneQrRepository()
export default merchantOneQrRepository
