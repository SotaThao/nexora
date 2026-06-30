import type { EcosystemItem } from "../types/domain";

export const BRAND_NAME_ECO = {
  nailhub: "nailhub",
  vmmtravel: "vmmtravel",
  vmmtoken: "vmmtoken",
  moonglemall: "moonglemall",
  cryptomap360: "cryptomap360",
} as const;

/** Display order left → right (matches ecosystem dropdown mockup). */
export const ECOSYSTEM_DISPLAY_ORDER: readonly string[] = [
  BRAND_NAME_ECO.vmmtoken,
  BRAND_NAME_ECO.cryptomap360,
  BRAND_NAME_ECO.nailhub,
  BRAND_NAME_ECO.moonglemall,
  BRAND_NAME_ECO.vmmtravel,
];

const LOGO_MAP: Record<string, string> = {
  [BRAND_NAME_ECO.nailhub]: "/assets/images/ecosystem/nailhub.png",
  [BRAND_NAME_ECO.vmmtravel]: "/assets/images/ecosystem/vmm-travel.png",
  [BRAND_NAME_ECO.vmmtoken]: "/assets/images/ecosystem/vmmToken.png",
  [BRAND_NAME_ECO.moonglemall]: "/assets/images/ecosystem/moonglemall.png",
  [BRAND_NAME_ECO.cryptomap360]: "/assets/images/ecosystem/cryptomap360.png",
  vlinkpay: "/assets/vlinkpay-logo.png",
  merchantportal: "/assets/vlinkpay-logo.png",
};

/** Brands that stay coming-soon regardless of API url. */
const COMING_SOON_BRANDS = new Set<string>([BRAND_NAME_ECO.vmmtravel]);

/** Fallback URLs when API omits an ecosystem row (BE may lag behind catalog). */
const FALLBACK_URL_MAP: Partial<Record<string, string>> = {};

/** API names that differ from brand keys (e.g. nailhub.ai). */
const NAME_ALIASES: Record<string, keyof typeof LOGO_MAP | string> = {
  nailhubai: BRAND_NAME_ECO.nailhub,
  thenailhub: BRAND_NAME_ECO.nailhub,
  vmmtravel: BRAND_NAME_ECO.vmmtravel,
  vmmtoken: BRAND_NAME_ECO.vmmtoken,
  moonglemall: BRAND_NAME_ECO.moonglemall,
  cryptomap360: BRAND_NAME_ECO.cryptomap360,
  vlinkpay: "vlinkpay",
  merchantportal: "merchantportal",
};

function normalizeEcosystemNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_.-]+/g, "");
}

export function resolveEcosystemBrandKey(name: string): string | null {
  const normalized = normalizeEcosystemNameKey(name);
  if (!normalized) return null;
  if (LOGO_MAP[normalized]) return normalized;

  const alias = NAME_ALIASES[normalized];
  if (alias && LOGO_MAP[alias]) return alias;

  if (normalized.includes("nailhub")) return BRAND_NAME_ECO.nailhub;
  if (normalized.includes("vmmtoken")) return BRAND_NAME_ECO.vmmtoken;
  if (normalized.includes("vmmtravel")) return BRAND_NAME_ECO.vmmtravel;
  if (normalized.includes("moonglemall") || normalized.includes("moongle"))
    return BRAND_NAME_ECO.moonglemall;
  if (normalized.includes("cryptomap")) return BRAND_NAME_ECO.cryptomap360;
  if (normalized.includes("vlinkpay") || normalized.includes("merchantportal"))
    return "vlinkpay";

  return null;
}

const ACCENT_MAP: Partial<Record<string, string>> = {
  [BRAND_NAME_ECO.vmmtoken]: "201 167 62",
  [BRAND_NAME_ECO.cryptomap360]: "234 120 56",
  [BRAND_NAME_ECO.nailhub]: "146 117 93",
  [BRAND_NAME_ECO.vmmtravel]: "106 71 217",
  [BRAND_NAME_ECO.moonglemall]: "37 99 235",
};

export interface EcosystemCatalogEntry {
  id: string | null;
  brandKey: string;
  name: string;
  url: string;
  logoUrl: string;
}

/** Catalog built from live VlinkPay API data; active items first, coming soon last. */
export function buildEcosystemCatalog(
  apiItems: EcosystemItem[] = [],
): EcosystemCatalogEntry[] {
  const available: EcosystemCatalogEntry[] = [];
  const comingSoon: EcosystemCatalogEntry[] = [];

  for (const item of apiItems) {
    const brandKey =
      resolveEcosystemBrandKey(item.name) ??
      (normalizeEcosystemNameKey(item.name) || item.id);
    const url = item.url?.trim() || FALLBACK_URL_MAP[brandKey] || "";
    const entry: EcosystemCatalogEntry = {
      id: item.id,
      brandKey,
      name: item.name,
      url,
      logoUrl: LOGO_MAP[brandKey],
    };

    if (isComingSoonEcosystem(entry)) {
      comingSoon.push(entry);
    } else {
      available.push(entry);
    }
  }

  return [...available, ...comingSoon];
}

export function isComingSoonEcosystem(
  ecosystem: Pick<EcosystemItem, "url" | "name"> & { brandKey?: string },
): boolean {
  const brandKey =
    ecosystem.brandKey ?? resolveEcosystemBrandKey(ecosystem.name);
  if (brandKey && COMING_SOON_BRANDS.has(brandKey)) return true;
  return !ecosystem.url?.trim();
}

export function sortEcosystems(list: EcosystemItem[]): EcosystemItem[] {
  const rank = new Map(
    ECOSYSTEM_DISPLAY_ORDER.map((name, index) => [name.toLowerCase(), index]),
  );
  return [...list].sort((a, b) => {
    const soonA = isComingSoonEcosystem(a) ? 1 : 0;
    const soonB = isComingSoonEcosystem(b) ? 1 : 0;
    if (soonA !== soonB) return soonA - soonB;
    const keyA =
      resolveEcosystemBrandKey(a.name) ?? normalizeEcosystemNameKey(a.name);
    const keyB =
      resolveEcosystemBrandKey(b.name) ?? normalizeEcosystemNameKey(b.name);
    const ra = rank.get(keyA) ?? 999;
    const rb = rank.get(keyB) ?? 999;
    return ra - rb || a.name.localeCompare(b.name);
  });
}

export function getEcosystemLogo(ecosystem: EcosystemItem): string {
  const brandKey = resolveEcosystemBrandKey(ecosystem.name);
  if (brandKey && LOGO_MAP[brandKey]) return LOGO_MAP[brandKey];
  if (ecosystem.logoUrl?.trim()) return ecosystem.logoUrl.trim();
  return "/assets/images/default.png";
}

export function getEcosystemAccent(name: string): string {
  const brandKey = resolveEcosystemBrandKey(name);
  if (brandKey && ACCENT_MAP[brandKey]) return ACCENT_MAP[brandKey]!;
  return ACCENT_MAP[name.trim().toLowerCase()] ?? "51 102 255";
}

/** True when API returns a navigable absolute HTTPS URL for ecosystem SSO. */
export function isValidEcosystemRedirectUrl(
  url: string | null | undefined,
): url is string {
  if (url == null) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#" || trimmed === "/") return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function closeWindowIfOpen(targetWindow: Window | null): void {
  if (targetWindow && !targetWindow.closed) {
    try {
      targetWindow.close();
    } catch {
      // popup may be blocked from script close
    }
  }
}

export function openUrlInNewTab(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function updateWindowUrl(
  targetWindow: Window | null,
  url: string,
): void {
  if (targetWindow && !targetWindow.closed) {
    try {
      targetWindow.location.href = url;
    } catch {
      targetWindow.close();
      openUrlInNewTab(url);
    }
  } else {
    openUrlInNewTab(url);
  }
}

export function openWindowOrFallback(url: string): Window | null {
  try {
    return window.open(url, "_blank");
  } catch {
    openUrlInNewTab(url);
    return null;
  }
}
