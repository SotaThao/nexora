import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import {
  useCreateMerchantVoiceService,
  useCreateMerchantVoiceServiceCategory,
  useDeleteMerchantVoiceService,
  useDeleteMerchantVoiceServiceCategory,
  useMerchantVoiceConfig,
  useMerchantVoiceServiceCategories,
  useMerchantVoiceServices,
  useUpdateMerchantVoiceConfig,
  useUpdateMerchantVoiceService,
  useUpdateMerchantVoiceServiceCategory,
} from "../../../data/hooks/useMerchantVoiceBookings";
import { useMerchantSetup } from "../../../data/hooks/useMerchantSetup";
import {
  useBookingSettings,
  useUpdateBookingSettings,
} from "../../../data/hooks/usePosBookingSettings";
import {
  clampMerchantVoiceServiceDurationMinutes,
  mapConfigLanguageToUiLanguage,
  mapUiLanguageToConfigLanguage,
  merchantVoiceRepository,
  MerchantVoiceDayOfWeek,
  MerchantVoiceUiLanguage,
  normalizeMerchantVoiceDayOfWeek,
  OTHER_SERVICES_CATEGORY_ID,
  type MerchantVoiceServiceCategoryDto,
} from "../../../data/repositories/merchantVoice";
import { qk } from "../../../data/queryKeys";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorCode } from "../../../types/domain";
import {
  loadSpeechVoices,
  speakBookingPreview,
  stopBookingPreview,
} from "../../../utils/bookingVoicePreview";
import { formatWholeNumberInputValue } from "../../../utils/numericInput";
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneForApi,
  parsePhone,
} from "../../CountryCodeSelect";
import {
  DEFAULT_SETTINGS_TIMEZONE,
  detectTimeZoneFromAddressText,
  EMPTY_LOCATION,
  getSettingsCountryLabel,
  isKnownSettingsCountryCode,
  isSettingsTimeZone,
  normalizeSettingsCountry,
  SETTINGS_COUNTRY_OPTIONS,
  SETTINGS_TIMEZONE_OPTIONS,
  splitSettingsAddress,
  type LocationParts,
  type SettingsCountryOption,
} from "./settingsLocationDetect";
import {
  geocodeSalonAddress,
  isGeocodeAddressQueryReady,
  type GeocodedSalonAddress,
} from "./settingsAddressGeocode";
import {
  CheckCircleFillIcon,
  ClockHistoryIcon,
  CurrencyDollarIcon,
  FolderTreeIcon,
  InfoCircleIcon,
  PencilIcon,
  PeopleTabIcon,
  PlusIcon,
  PlusLgIcon,
  MessageSquareIcon,
  ShopIcon,
  SpinnerIcon,
  StarsIcon,
  Trash2Icon,
  XLgIcon,
} from "./BookingHubIcons";
import { BookingSettingsSkeleton } from "./BookingHubSkeletons";
import BookingTeamPanel from "./BookingTeamPanel";
import { useBookingHubVoiceEnabled } from "./BookingHubVoiceContext";
import { applyAiHubProgressiveValidation } from "./bookingHubDialogValidation";

const TK = "components.dashboard.views.BookingHubView.settings";
const TK_HUB = "components.dashboard.views.BookingHubView";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];
type Language = MerchantVoiceUiLanguage;
type Tone =
  | "tone-violet"
  | "tone-cyan"
  | "tone-rose"
  | "tone-sky"
  | "tone-amber"
  | "tone-emerald";

const DAY_KEY_TO_API: Record<DayKey, MerchantVoiceDayOfWeek> = {
  mon: MerchantVoiceDayOfWeek.Monday,
  tue: MerchantVoiceDayOfWeek.Tuesday,
  wed: MerchantVoiceDayOfWeek.Wednesday,
  thu: MerchantVoiceDayOfWeek.Thursday,
  fri: MerchantVoiceDayOfWeek.Friday,
  sat: MerchantVoiceDayOfWeek.Saturday,
  sun: MerchantVoiceDayOfWeek.Sunday,
};

const API_DAY_TO_DAY_KEY: Partial<Record<MerchantVoiceDayOfWeek, DayKey>> = {
  [MerchantVoiceDayOfWeek.Monday]: "mon",
  [MerchantVoiceDayOfWeek.Tuesday]: "tue",
  [MerchantVoiceDayOfWeek.Wednesday]: "wed",
  [MerchantVoiceDayOfWeek.Thursday]: "thu",
  [MerchantVoiceDayOfWeek.Friday]: "fri",
  [MerchantVoiceDayOfWeek.Saturday]: "sat",
  [MerchantVoiceDayOfWeek.Sunday]: "sun",
};

interface HourRow {
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface SettingsCategory {
  id: string
  name: string
  isSystem: boolean
}

interface ServiceRow {
  id: string
  icon: string
  tone: Tone
  name: string
  price: number
  duration: number
  /** Display name for primary accordion grouping. */
  category: string
  /** Primary category id (first selected / preferred). */
  categoryId: string
  /** All linked category ids (multi-category). */
  categoryIds: string[]
}

type ServiceModalMode = "create" | "edit"

type ServiceModalDraft = {
  mode: ServiceModalMode
  serviceId: string | null
  categoryIds: string[]
  name: string
  price: string
  duration: string
}

type InlineServiceDraft = {
  name: string
  price: string
  duration: string
}

function buildInlineServiceDraft(service: ServiceRow): InlineServiceDraft {
  return {
    name: service.name,
    price: formatWholeNumberInputValue(service.price),
    duration: formatWholeNumberInputValue(service.duration),
  }
}

function parseInlineServicePrice(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "")
  const parts = cleaned.split(".")
  return parts.length <= 1
    ? cleaned
    : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`
}

interface CategoryDraft {
  id: string | null
  name: string
  isSystem: boolean
  /** Unsaved row created via Add category. */
  isNew?: boolean
  /** Existing row currently in rename mode. */
  isEditing?: boolean
}

const DEFAULT_SERVICE_CATEGORY = "Other services"

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPersistedServiceId(id: string) {
  return GUID_RE.test(id)
}

function normalizeServiceCategoryIds(
  categoryIds: string[] | undefined,
  fallbackId: string,
): string[] {
  const cleaned = [
    ...new Set(
      (categoryIds || [])
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ]
  return cleaned.length > 0 ? cleaned : [fallbackId]
}

function primaryCategoryId(categoryIds: string[], fallbackId: string): string {
  return categoryIds[0] || fallbackId
}

function isOtherServicesCategory(category: {
  id: string;
  isSystem?: boolean;
}): boolean {
  return (
    category.isSystem === true || category.id === OTHER_SERVICES_CATEGORY_ID
  );
}

/** Real category ids for API. Default "Other services" is built-in — never send its id. */
function categoryIdsForApi(categoryIds: string[]): string[] {
  return [
    ...new Set(
      categoryIds
        .filter((id): id is string => typeof id === "string")
        .map((id) => id.trim())
        .filter((id) => id && id !== OTHER_SERVICES_CATEGORY_ID),
    ),
  ]
}

/**
 * API payload for service categories.
 * Built-in Other is never sent as an id — Other-only → `null`.
 */
function categoryIdsPayloadForApi(categoryIds: string[]): string[] | null {
  const ids = categoryIdsForApi(categoryIds)
  return ids.length > 0 ? ids : null
}

function sameCategoryIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const a = [...left].sort()
  const b = [...right].sort()
  return a.every((id, index) => id === b[index])
}

/** Keep full category catalog across refreshes (API may omit empty groups). */
function unionSettingsCategories(
  previous: SettingsCategory[],
  next: SettingsCategory[],
  removedIds: string[] = [],
): SettingsCategory[] {
  const removed = new Set(removedIds)
  const byId = new Map<string, SettingsCategory>()
  previous.forEach((category) => {
    if (removed.has(category.id)) return
    byId.set(category.id, category)
  })
  next.forEach((category) => {
    if (!category.id || removed.has(category.id)) return
    const existing = byId.get(category.id)
    byId.set(category.id, {
      id: category.id,
      name: category.name || existing?.name || DEFAULT_SERVICE_CATEGORY,
      isSystem:
        category.isSystem ||
        existing?.isSystem ||
        category.id === OTHER_SERVICES_CATEGORY_ID,
    })
  })
  return [...byId.values()].sort((left, right) => {
    if (left.isSystem !== right.isSystem) return left.isSystem ? -1 : 1
    return left.name.localeCompare(right.name)
  })
}

const INITIAL_HOURS: Record<DayKey, HourRow> = {
  mon: { open: true, openTime: "07:00", closeTime: "21:00" },
  tue: { open: true, openTime: "07:00", closeTime: "21:00" },
  wed: { open: true, openTime: "07:00", closeTime: "21:00" },
  thu: { open: true, openTime: "07:00", closeTime: "21:00" },
  fri: { open: true, openTime: "07:00", closeTime: "21:00" },
  sat: { open: false, openTime: "10:00", closeTime: "16:00" },
  sun: { open: false, openTime: "09:00", closeTime: "19:00" },
};

const INITIAL_SERVICES: ServiceRow[] = [
  {
    id: "gel-manicure",
    icon: "💅",
    tone: "tone-violet",
    name: "Gel Manicure",
    price: 35,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 60,
  },
  {
    id: "classic-manicure",
    icon: "🖐️",
    tone: "tone-cyan",
    name: "Classic Manicure",
    price: 22,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 45,
  },
  {
    id: "full-set-acrylic",
    icon: "💎",
    tone: "tone-rose",
    name: "Full Set Acrylic",
    price: 45,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 90,
  },
  {
    id: "dip-powder",
    icon: "✨",
    tone: "tone-sky",
    name: "Dip Powder",
    price: 40,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 75,
  },
  {
    id: "fill-in",
    icon: "🔁",
    tone: "tone-amber",
    name: "Fill-In",
    price: 32,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 60,
  },
  {
    id: "classic-pedicure",
    icon: "🦶",
    tone: "tone-emerald",
    name: "Classic Pedicure",
    price: 30,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 50,
  },
  {
    id: "deluxe-pedicure",
    icon: "👑",
    tone: "tone-violet",
    name: "Deluxe Pedicure",
    price: 50,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 70,
  },
  {
    id: "pedicure-gel-combo",
    icon: "🧴",
    tone: "tone-cyan",
    name: "Pedicure + Gel Combo",
    price: 65,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 105,
  },
  {
    id: "kid-mani-pedi",
    icon: "🧸",
    tone: "tone-amber",
    name: "Kid Mani-Pedi",
    price: 25,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 40,
  },
  {
    id: "nail-art",
    icon: "🎨",
    tone: "tone-rose",
    name: "Nail Art (per nail)",
    price: 5,
    category: DEFAULT_SERVICE_CATEGORY,
    categoryId: OTHER_SERVICES_CATEGORY_ID,
    categoryIds: [OTHER_SERVICES_CATEGORY_ID],
    duration: 10,
  },
];

function flattenCategoriesToUi(categoriesData: MerchantVoiceServiceCategoryDto[]): {
  categories: SettingsCategory[]
  services: ServiceRow[]
} {
  const categories = [...categoriesData]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      isSystem: category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
    }))

  const byId = new Map<string, ServiceRow>()
  let index = 0
  const otherId =
    categories.find((category) => category.isSystem)?.id ||
    OTHER_SERVICES_CATEGORY_ID
  // Match HTML: place each service under the category accordion it was nested in.
  ;[...categoriesData]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((category) => {
      category.services.forEach((service) => {
        if (!service.id) return
        const existing = byId.get(service.id)
        if (existing) {
          const mergedIds = normalizeServiceCategoryIds(
            [...existing.categoryIds, category.id, ...(service.categoryIds || [])],
            otherId,
          )
          const preferredId = primaryCategoryId(mergedIds, otherId)
          const linked =
            categories.find((item) => item.id === preferredId) ||
            categories.find((item) => item.isSystem)
          byId.set(service.id, {
            ...existing,
            categoryIds: mergedIds,
            categoryId: preferredId,
            category: linked?.name || existing.category,
          })
          return
        }
        const toneSeed = INITIAL_SERVICES[index % INITIAL_SERVICES.length]
        const categoryIds = normalizeServiceCategoryIds(
          service.categoryIds?.length
            ? service.categoryIds
            : [category.id],
          otherId,
        )
        const preferredId = primaryCategoryId(categoryIds, otherId)
        const linked =
          categories.find((item) => item.id === preferredId) ||
          categories.find((item) => item.id === category.id)
        byId.set(service.id, {
          id: service.id,
          icon: service.icon || toneSeed?.icon || "✨",
          tone: toneSeed?.tone || "tone-violet",
          name: service.name || "",
          price: Number(service.price ?? 0),
          duration: clampMerchantVoiceServiceDurationMinutes(
            Number(service.durationMinutes ?? 0),
          ),
          category: linked?.name || category.name || DEFAULT_SERVICE_CATEGORY,
          categoryId: preferredId,
          categoryIds,
        })
        index += 1
      })
    })

  return { categories, services: Array.from(byId.values()) }
}

function mergeFlatServicesIntoCategories(
  categories: SettingsCategory[],
  flatServices: Array<{
    id: string
    name: string
    price: number | null
    durationMinutes: number | null
    icon: string | null
    isActive: boolean
    categoryIds: string[]
  }>,
): ServiceRow[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const other =
    categories.find((category) => category.isSystem) ||
    categories.find((category) => category.id === OTHER_SERVICES_CATEGORY_ID)

  return flatServices
    .filter((service) => service.isActive !== false && service.id)
    .map((service, index) => {
      const otherId = other?.id || OTHER_SERVICES_CATEGORY_ID
      const categoryIds = normalizeServiceCategoryIds(
        service.categoryIds,
        otherId,
      )
      const preferredId = primaryCategoryId(categoryIds, otherId)
      const linked = categoryById.get(preferredId) || other
      const toneSeed = INITIAL_SERVICES[index % INITIAL_SERVICES.length]
      return {
        id: service.id,
        icon: service.icon || toneSeed?.icon || "✨",
        tone: toneSeed?.tone || "tone-violet",
        name: service.name || "",
        price: Number(service.price ?? 0),
        duration: clampMerchantVoiceServiceDurationMinutes(
          Number(service.durationMinutes ?? 0),
        ),
        category: linked?.name || DEFAULT_SERVICE_CATEGORY,
        categoryId: linked?.id || OTHER_SERVICES_CATEGORY_ID,
        categoryIds,
      } satisfies ServiceRow
    })
}

const AI_LANGUAGE_OPTIONS = [
  MerchantVoiceUiLanguage.Auto,
  MerchantVoiceUiLanguage.Vi,
  MerchantVoiceUiLanguage.En,
] as const;

const PROMO_MAX_LENGTH = 1000;
const FIRST_CALL_SMS_MAX_LENGTH = 320;

// Booking SMS Notifications — the setting itself now lives on PosBookingSettings
// (shared with POS's own Booking Settings card); this panel just reads/writes the
// 3 recipient toggles through the POS booking-settings endpoint.
const BOOKING_SMS_RECIPIENTS = [
  {
    id: "customer",
    configKey: "notifyCustomerSmsEnabled",
    titleKey: "bookingSmsCustomerTitle",
    descKey: "bookingSmsCustomerDesc",
    enableAriaKey: "bookingSmsCustomerEnableAria",
    disableAriaKey: "bookingSmsCustomerDisableAria",
  },
  {
    id: "business",
    configKey: "notifyBusinessSmsEnabled",
    titleKey: "bookingSmsBusinessTitle",
    descKey: "bookingSmsBusinessDesc",
    enableAriaKey: "bookingSmsBusinessEnableAria",
    disableAriaKey: "bookingSmsBusinessDisableAria",
  },
  {
    id: "staff",
    configKey: "notifyAssignedStaffSmsEnabled",
    titleKey: "bookingSmsStaffTitle",
    descKey: "bookingSmsStaffDesc",
    enableAriaKey: "bookingSmsStaffEnableAria",
    disableAriaKey: "bookingSmsStaffDisableAria",
  },
] as const;

type BookingSmsRecipientId = (typeof BOOKING_SMS_RECIPIENTS)[number]["id"];
type BookingSmsConfigKey = (typeof BOOKING_SMS_RECIPIENTS)[number]["configKey"];

const BOOKING_SMS_DEFAULT_ENABLED: Record<BookingSmsRecipientId, boolean> = {
  customer: true,
  business: true,
  staff: true,
};

function bookingSmsEnabledFromSettings(
  settings: Record<BookingSmsConfigKey, boolean>,
): Record<BookingSmsRecipientId, boolean> {
  return BOOKING_SMS_RECIPIENTS.reduce(
    (acc, item) => {
      acc[item.id] = settings[item.configKey]
      return acc
    },
    { ...BOOKING_SMS_DEFAULT_ENABLED },
  )
}

function bookingSmsSettingsPayloadFromEnabled(
  enabled: Record<BookingSmsRecipientId, boolean>,
): Record<BookingSmsConfigKey, boolean> {
  return BOOKING_SMS_RECIPIENTS.reduce(
    (acc, item) => {
      acc[item.configKey] = enabled[item.id]
      return acc
    },
    {} as Record<BookingSmsConfigKey, boolean>,
  )
}

const PROMO_TEMPLATES = {
  "reward-yourself": {
    labelKey: "promoTemplateRewardLabel",
    text: [
      "Promotion 1: Reward Yourself",
      "Offer: Free $25 e-gift card.",
      "Eligibility: Book any pedicure service of $55 or more.",
      "Availability: Monday–Saturday, by appointment only.",
      "Rules: One free $25 e-gift card per qualifying visit. For future services only, not redeemable for cash, and cannot be used for gratuity. Cannot combine with other promotions, discounts, coupons, rewards, or special offers. One promotional offer per customer per visit.",
      "General rule: The salon may modify or end any promotion at any time.",
    ].join("\n"),
  },
} as const;

const GREETING_I18N_KEY_BY_LANGUAGE: Record<Language, string> = {
  [MerchantVoiceUiLanguage.Auto]: "greetingAuto",
  [MerchantVoiceUiLanguage.Vi]: "greetingVi",
  [MerchantVoiceUiLanguage.En]: "greetingEn",
}

const LANGUAGE_BUTTON_LABEL_KEY_BY_LANGUAGE: Record<Language, string> = {
  [MerchantVoiceUiLanguage.Auto]: "languageLabels.autoShort",
  [MerchantVoiceUiLanguage.Vi]: "languageLabels.vi",
  [MerchantVoiceUiLanguage.En]: "languageLabels.en",
}

function greetingI18nKey(language: Language) {
  return GREETING_I18N_KEY_BY_LANGUAGE[language]
}

function languageButtonLabelKey(language: Language) {
  return LANGUAGE_BUTTON_LABEL_KEY_BY_LANGUAGE[language]
}

function openTimePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Browser may block showPicker without direct user gesture on some inputs.
    }
  }
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="14"
      height="14"
      className={collapsed ? "is-collapsed" : ""}
    >
      <path
        d="m4 10 4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsInfoTooltip({
  id,
  ariaLabel,
  children,
}: {
  id: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);

  const placeTooltip = () => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const pad = 16;
    const gap = 8;
    const maxWidth = Math.min(320, window.innerWidth - pad * 2);

    content.classList.add("is-placed");
    content.style.position = "fixed";
    content.style.left = "0";
    content.style.top = "0";
    content.style.right = "auto";
    content.style.bottom = "auto";
    content.style.transform = "none";
    content.style.width = "max-content";
    content.style.maxWidth = `${maxWidth}px`;

    const applyPosition = () => {
      const width = Math.min(content.offsetWidth || maxWidth, maxWidth);
      content.style.width = `${width}px`;

      const triggerRect = trigger.getBoundingClientRect();
      let top = triggerRect.top - gap - content.offsetHeight;
      if (top < pad) {
        top = triggerRect.bottom + gap;
      }
      const maxTop = window.innerHeight - pad - content.offsetHeight;
      top = Math.max(pad, Math.min(top, Math.max(pad, maxTop)));

      let left =
        triggerRect.left + triggerRect.width / 2 - content.offsetWidth / 2;
      left = Math.max(
        pad,
        Math.min(left, window.innerWidth - pad - content.offsetWidth),
      );

      content.style.top = `${Math.round(top)}px`;
      content.style.left = `${Math.round(left)}px`;
    };

    requestAnimationFrame(applyPosition);
  };

  const clearPlacement = () => {
    const content = contentRef.current;
    if (!content) return;
    content.classList.remove("is-placed");
    content.style.position = "";
    content.style.left = "";
    content.style.top = "";
    content.style.right = "";
    content.style.bottom = "";
    content.style.transform = "";
    content.style.width = "";
    content.style.maxWidth = "";
  };

  return (
    <span
      className="settings-tooltip"
      onMouseEnter={placeTooltip}
      onFocus={placeTooltip}
      onMouseLeave={clearPlacement}
      onBlur={clearPlacement}
    >
      <button
        ref={triggerRef}
        className="settings-tooltip-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-describedby={id}
        onClick={(event) => {
          event.preventDefault();
          placeTooltip();
        }}
      >
        <InfoCircleIcon className="settings-tooltip-icon" />
      </button>
      <span
        ref={contentRef}
        className="settings-tooltip-content"
        id={id}
        role="tooltip"
      >
        {children}
      </span>
    </span>
  );
}

function SettingsCard({
  cardId,
  collapsed,
  onToggle,
  title,
  subtitle,
  className,
  children,
}: {
  cardId: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  title: React.ReactNode;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);
  const expandLabel = t(`${TK}.expandSection`);
  const collapseLabel = t(`${TK}.collapseSection`);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (collapsed) body.setAttribute("inert", "");
    else body.removeAttribute("inert");
  }, [collapsed]);

  return (
    <article
      className={`settings-card${className ? ` ${className}` : ""}${collapsed ? " is-collapsed" : ""}`}
      data-settings-card={cardId}
    >
      <button
        className="settings-card-head"
        type="button"
        aria-expanded={!collapsed}
        aria-controls={`settings-card-body-${cardId}`}
        aria-label={collapsed ? expandLabel : collapseLabel}
        onClick={() => onToggle(cardId)}
      >
        <div>
          <div className="settings-card-title">{title}</div>
          {!collapsed ? (
            <div className="settings-card-sub">{subtitle}</div>
          ) : null}
        </div>
        <span className="settings-collapse-button" aria-hidden="true">
          <ChevronIcon collapsed={collapsed} />
        </span>
      </button>
      <div
        ref={bodyRef}
        className="settings-card-body"
        id={`settings-card-body-${cardId}`}
        aria-hidden={collapsed}
      >
        <div className="settings-card-body-inner">{children}</div>
      </div>
    </article>
  );
}

export default function BookingSettingsPanel() {
  const { t } = useTranslation();
  const { showToast, showConfirm } = useNotification();
  const queryClient = useQueryClient();
  const voiceEnabled = useBookingHubVoiceEnabled();
  const { data: configData, isLoading: isConfigLoading } =
    useMerchantVoiceConfig({ enabled: voiceEnabled });
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useMerchantVoiceServiceCategories({ enabled: voiceEnabled });
  const { data: flatServicesData, isLoading: isServicesLoading } =
    useMerchantVoiceServices({ enabled: voiceEnabled });
  const updateConfigMutation = useUpdateMerchantVoiceConfig();
  const { data: merchantSetupData } = useMerchantSetup();
  const businessId = merchantSetupData?.businessInfo?.businessId;
  const { data: posBookingSettingsData } = useBookingSettings(businessId);
  const updateBookingSettingsMutation = useUpdateBookingSettings(businessId);
  const createCategoryMutation = useCreateMerchantVoiceServiceCategory();
  const updateCategoryMutation = useUpdateMerchantVoiceServiceCategory();
  const deleteCategoryMutation = useDeleteMerchantVoiceServiceCategory();
  const createServiceMutation = useCreateMerchantVoiceService();
  const updateServiceMutation = useUpdateMerchantVoiceService();
  const deleteServiceMutation = useDeleteMerchantVoiceService();
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<SettingsCategory[]>([]);
  const servicesRef = useRef<ServiceRow[]>([]);
  const serviceSnapshotRef = useRef<Map<string, ServiceRow>>(new Map());
  const servicesDirtyRef = useRef(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [pendingServiceActionId, setPendingServiceActionId] = useState<
    string | null
  >(null);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalDraft, setServiceModalDraft] = useState<ServiceModalDraft>(
    {
      mode: "create",
      serviceId: null,
      categoryIds: [],
      name: "",
      price: "",
      duration: "",
    },
  );
  const [serviceModalError, setServiceModalError] = useState("");
  const [serviceModalCategoriesError, setServiceModalCategoriesError] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>([]);
  const [categoryModalError, setCategoryModalError] = useState("");
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [pendingCategoryFocus, setPendingCategoryFocus] = useState<
    "new" | "edit" | null
  >(null);
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const [highlightServiceId, setHighlightServiceId] = useState<string | null>(
    null,
  );
  const [inlineServiceDrafts, setInlineServiceDrafts] = useState<
    Record<string, InlineServiceDraft>
  >({});
  const [inlineServiceErrors, setInlineServiceErrors] = useState<
    Record<string, string>
  >({});
  const inlineServiceDraftsRef = useRef(inlineServiceDrafts);
  const [openServiceCategoryIds, setOpenServiceCategoryIds] = useState(
    () => new Set<string>(),
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [language, setLanguage] = useState<Language>(
    MerchantVoiceUiLanguage.Auto,
  );
  const [greeting, setGreeting] = useState(() => t(`${TK}.greetingEn`));
  const [promotion, setPromotion] = useState("");
  const [salonName, setSalonName] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [aiPhone, setAiPhone] = useState("");
  const [bookingNotifyPhone, setBookingNotifyPhone] = useState("");
  const [location, setLocation] = useState<LocationParts>({ ...EMPTY_LOCATION });
  const [extraCountries, setExtraCountries] = useState<SettingsCountryOption[]>(
    [],
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [timeZone, setTimeZone] = useState<string>(DEFAULT_SETTINGS_TIMEZONE);
  const [timeZoneManual, setTimeZoneManual] = useState(false);
  const timeZoneManualRef = useRef(false);
  const addressGeocodeAbortRef = useRef<AbortController | null>(null);
  const addressGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastGeocodedQueryRef = useRef("");
  const [addressGeocodeStatus, setAddressGeocodeStatus] = useState<
    "idle" | "detecting" | "failed"
  >("idle");
  const [promoSms, setPromoSms] = useState("");
  const [sendSmsPromoEnabled, setSendSmsPromoEnabled] = useState(true);
  const [bookingSmsEnabled, setBookingSmsEnabled] = useState<
    Record<BookingSmsRecipientId, boolean>
  >(BOOKING_SMS_DEFAULT_ENABLED);
  const [statusMessage, setStatusMessage] = useState("");
  const [formErrors, setFormErrors] = useState<{
    salonName?: string;
    salonPhone?: string;
    bookingNotifyPhone?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    greeting?: string;
  }>({});
  const [hoursErrorByDay, setHoursErrorByDay] = useState<
    Record<DayKey, string>
  >({
    mon: "",
    tue: "",
    wed: "",
    thu: "",
    fri: "",
    sat: "",
    sun: "",
  });
  const settingsShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inlineServiceDraftsRef.current = inlineServiceDrafts;
  }, [inlineServiceDrafts]);

  const isCollapsed = (cardId: string) => collapsedCards[cardId] === true;
  const salonPhoneParsed = useMemo(() => parsePhone(salonPhone), [salonPhone]);
  const aiPhoneParsed = useMemo(() => parsePhone(aiPhone), [aiPhone]);
  const bookingNotifyPhoneParsed = useMemo(
    () => parsePhone(bookingNotifyPhone),
    [bookingNotifyPhone],
  );

  const countryOptions = useMemo(() => {
    const seen = new Set(SETTINGS_COUNTRY_OPTIONS.map((option) => option.value));
    const extras = extraCountries.filter((option) => {
      if (seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    });
    return [...SETTINGS_COUNTRY_OPTIONS, ...extras];
  }, [extraCountries]);

  const ensureCountryOption = (code: string, label?: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper || isKnownSettingsCountryCode(upper)) return;
    setExtraCountries((prev) => {
      if (prev.some((option) => option.value === upper)) return prev;
      return [
        ...prev,
        {
          value: upper,
          label: getSettingsCountryLabel(upper, label),
        },
      ];
    });
  };

  timeZoneManualRef.current = timeZoneManual;

  const applyGeocodedAddress = (result: GeocodedSalonAddress) => {
    ensureCountryOption(result.location.country, result.countryLabel);

    // 1) Fill structured location fields from address geocode.
    // Keep the user's Address text as typed (no road-name rewrite).
    setLocation((prev) => ({
      street: prev.street.trim() || result.location.street,
      city: result.location.city || prev.city,
      state: result.location.state || prev.state,
      zip: result.location.zip || prev.zip,
      country: result.location.country || prev.country,
    }));

    // 2) Address changed → unlock manual TZ and apply geocoded zone.
    timeZoneManualRef.current = false;
    setTimeZoneManual(false);
    if (result.timeZone) {
      setTimeZone(result.timeZone);
      return;
    }
    const fallbackTz = detectTimeZoneFromAddressText(
      result.location.street || "",
    );
    if (fallbackTz) setTimeZone(fallbackTz);
  };

  const runAddressGeocode = async (
    query: string,
    options?: { showFailure?: boolean },
  ) => {
    const trimmed = query.trim();
    if (!isGeocodeAddressQueryReady(trimmed)) {
      setAddressGeocodeStatus("idle");
      return;
    }
    if (lastGeocodedQueryRef.current === trimmed) {
      setAddressGeocodeStatus("idle");
      return;
    }

    addressGeocodeAbortRef.current?.abort();
    const controller = new AbortController();
    addressGeocodeAbortRef.current = controller;
    setAddressGeocodeStatus("detecting");

    try {
      const result = await geocodeSalonAddress(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      if (!result) {
        const localTz = detectTimeZoneFromAddressText(trimmed);
        if (localTz) {
          // New address text → resume auto timezone even after a manual pick.
          timeZoneManualRef.current = false;
          setTimeZoneManual(false);
          setTimeZone(localTz);
          lastGeocodedQueryRef.current = trimmed;
          setAddressGeocodeStatus("idle");
          return;
        }
        setAddressGeocodeStatus(options?.showFailure ? "failed" : "idle");
        return;
      }
      lastGeocodedQueryRef.current = trimmed;
      applyGeocodedAddress(result);
      setAddressGeocodeStatus("idle");
      setFormErrors((prev) => ({
        ...prev,
        street: undefined,
        city: undefined,
        state: undefined,
        zip: undefined,
        country: undefined,
      }));
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") return;
      setAddressGeocodeStatus(options?.showFailure ? "failed" : "idle");
    }
  };

  const scheduleAddressGeocode = (query: string) => {
    if (addressGeocodeTimerRef.current) {
      clearTimeout(addressGeocodeTimerRef.current);
    }
    addressGeocodeTimerRef.current = setTimeout(() => {
      void runAddressGeocode(query);
    }, 700);
  };

  const flushAddressGeocode = (query: string) => {
    if (addressGeocodeTimerRef.current) {
      clearTimeout(addressGeocodeTimerRef.current);
      addressGeocodeTimerRef.current = null;
    }
    void runAddressGeocode(query, { showFailure: true });
  };

  useEffect(
    () => () => {
      if (addressGeocodeTimerRef.current) {
        clearTimeout(addressGeocodeTimerRef.current);
      }
      addressGeocodeAbortRef.current?.abort();
    },
    [],
  );

  const patchLocation = (partial: Partial<LocationParts>) => {
    setLocation((prev) => ({ ...prev, ...partial }));
  };

  const toggleCard = (cardId: string) => {
    setCollapsedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const setStatus = (message: string) => setStatusMessage(message);

  const formatVietnamDisplay = (rawNational: string) => {
    const digits = rawNational.replace(/\D/g, "");
    const hasTrunkZero = digits.startsWith("0");
    const clipped = digits.slice(0, hasTrunkZero ? 10 : 9);

    if (hasTrunkZero) {
      if (clipped.length <= 4) return clipped;
      if (clipped.length <= 7)
        return `${clipped.slice(0, 4)}-${clipped.slice(4)}`;
      return `${clipped.slice(0, 4)}-${clipped.slice(4, 7)}-${clipped.slice(7, 10)}`;
    }

    if (clipped.length <= 3) return clipped;
    if (clipped.length <= 6)
      return `${clipped.slice(0, 3)}-${clipped.slice(3)}`;
    return `${clipped.slice(0, 3)}-${clipped.slice(3, 6)}-${clipped.slice(6, 9)}`;
  };

  const formatPhoneInput = (raw: string, fallbackRaw?: string) => {
    const input = raw.trim();
    if (!input) return "";

    const hasExplicitCountryCode = input.startsWith("+");
    const digitsOnly = input.replace(/\D/g, "");
    const isVnLocalWithTrunk = /^0\d{8,10}$/.test(digitsOnly);
    const parsed = parsePhone(input);
    const fallbackParsed = fallbackRaw?.trim()
      ? parsePhone(fallbackRaw.trim())
      : null;
    const inferredCountryCode = hasExplicitCountryCode
      ? parsed.countryCode
      : fallbackParsed?.countryCode || (isVnLocalWithTrunk ? "+84" : "+1");

    // Keep local VN trunk prefix "0" in UI formatting (e.g. 0385... -> 0385 478 857).
    const nationalSource =
      !hasExplicitCountryCode && isVnLocalWithTrunk
        ? digitsOnly
        : parsed.nationalNumber;
    const national =
      inferredCountryCode === "+84"
        ? formatVietnamDisplay(nationalSource)
        : formatNationalNumber(nationalSource, inferredCountryCode);
    if (!national) return input;
    return hasExplicitCountryCode
      ? `${inferredCountryCode} ${national}`.trim()
      : national;
  };

  const validateHours = (hoursState: Record<DayKey, HourRow>) => {
    const nextErrors: Record<DayKey, string> = {
      mon: "",
      tue: "",
      wed: "",
      thu: "",
      fri: "",
      sat: "",
      sun: "",
    };

    DAY_KEYS.forEach((day) => {
      const row = hoursState[day];
      if (!row.open) return;
      if (!row.openTime || !row.closeTime) {
        nextErrors[day] = t(`${TK}.hourRequired`);
        return;
      }
      if (row.openTime >= row.closeTime) {
        nextErrors[day] = t(`${TK}.hourInvalid`);
      }
    });

    setHoursErrorByDay(nextErrors);
    return DAY_KEYS.every((day) => !nextErrors[day]);
  };

  const toggleHour = (day: DayKey) => {
    setHours((prev) => {
      const nextOpen = !prev[day].open;
      setStatus(t(`${TK}.hourUpdated`, { day: t(`${TK}.days.${day}`) }));
      return { ...prev, [day]: { ...prev[day], open: nextOpen } };
    });
    setHoursErrorByDay((prev) => ({ ...prev, [day]: "" }));
  };

  const updateHourTime = (
    day: DayKey,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    setStatus(t(`${TK}.hourTimeUpdated`, { day: t(`${TK}.days.${day}`) }));
    setHoursErrorByDay((prev) => ({ ...prev, [day]: "" }));
  };

  useEffect(() => {
    loadSpeechVoices();
  }, []);

  useEffect(() => {
    if (!configData) return;

    setSalonName(configData.name || "");
    setSalonPhone(formatPhoneInput(configData.forwardPhoneNumber || ""));
    setAiPhone(formatPhoneInput(configData.aiPhoneNumber || ""));
    setBookingNotifyPhone(
      formatPhoneInput(configData.bookingNotifyPhone || ""),
    );
    const hasStructuredLocation = Boolean(
      configData.city?.trim() ||
        configData.state?.trim() ||
        configData.zipCode?.trim() ||
        configData.country?.trim(),
    );
    const locationParts = hasStructuredLocation
      ? {
          street: (configData.address || "").trim(),
          city: (configData.city || "").trim(),
          state: (configData.state || "").trim(),
          zip: (configData.zipCode || "").trim(),
          country: normalizeSettingsCountry(configData.country || "US"),
        }
      : splitSettingsAddress(configData.address || "");
    setLocation(locationParts);
    if (locationParts.country) {
      ensureCountryOption(locationParts.country, configData.country || undefined);
    }
    const loadedTimeZone = String(configData.timeZone || "").trim();
    const detectedTimeZone = detectTimeZoneFromAddressText(
      locationParts.street,
    );
    if (loadedTimeZone) {
      setTimeZone(loadedTimeZone);
      // Lock manual only when saved TZ differs from address-based hint.
      setTimeZoneManual(
        detectedTimeZone != null && detectedTimeZone !== loadedTimeZone,
      );
    } else if (detectedTimeZone) {
      setTimeZone(detectedTimeZone);
      setTimeZoneManual(false);
    } else {
      setTimeZone(DEFAULT_SETTINGS_TIMEZONE);
      setTimeZoneManual(false);
    }
    setGoogleReviewUrl(configData.googleReviewUrl || "");
    setWebsite(configData.website || "");
    setDescription(configData.description || "");
    setPromoSms((configData.promoSms || "").slice(0, FIRST_CALL_SMS_MAX_LENGTH));
    setSendSmsPromoEnabled(configData.sendSmsPromoEnabled !== false);
    setPromotion((configData.promotion || "").slice(0, PROMO_MAX_LENGTH));
    const resolvedLang = mapConfigLanguageToUiLanguage(configData.language);
    setLanguage(resolvedLang);
    setGreeting(
      configData.welcomeGreeting ||
        t(`${TK}.${greetingI18nKey(resolvedLang)}`),
    );

    const nextHours = { ...INITIAL_HOURS };
    configData.operatingHours.forEach((item) => {
      const apiDay = normalizeMerchantVoiceDayOfWeek(item.dayOfWeek);
      if (apiDay === null) return;
      const key = API_DAY_TO_DAY_KEY[apiDay];
      if (!key) return;
      nextHours[key] = {
        open: Boolean(item.isOpen),
        openTime: item.openTime?.slice(0, 5) || "",
        closeTime: item.closeTime?.slice(0, 5) || "",
      };
    });
    setHours(nextHours);
  }, [configData, t]);

  // Booking SMS Notifications now live on PosBookingSettings — a separate query/resource
  // from the Nexora Voice config above, so it hydrates independently.
  useEffect(() => {
    if (!posBookingSettingsData) return;
    setBookingSmsEnabled(bookingSmsEnabledFromSettings(posBookingSettingsData));
  }, [posBookingSettingsData]);

  useEffect(() => {
    if (!categoriesData) return;
    const next = flattenCategoriesToUi(categoriesData);
    const mergedServices =
      next.services.length > 0
        ? next.services
        : mergeFlatServicesIntoCategories(next.categories, flatServicesData || []);
    setCategories((prev) => unionSettingsCategories(prev, next.categories));
    if (!servicesDirtyRef.current) {
      setServices(mergedServices);
      servicesRef.current = mergedServices;
      rememberServiceSnapshot(mergedServices);
      return;
    }
    setServices((prev) =>
      prev.map((service) => {
        const other =
          next.categories.find((item) => item.isSystem) ||
          next.categories.find((item) => item.id === OTHER_SERVICES_CATEGORY_ID);
        const otherId = other?.id || OTHER_SERVICES_CATEGORY_ID
        const categoryIds = normalizeServiceCategoryIds(
          service.categoryIds,
          otherId,
        ).filter(
          (id) =>
            next.categories.some((item) => item.id === id) ||
            id === OTHER_SERVICES_CATEGORY_ID,
        )
        const resolvedIds = normalizeServiceCategoryIds(categoryIds, otherId)
        const preferredId = primaryCategoryId(resolvedIds, otherId)
        const linked =
          next.categories.find((item) => item.id === preferredId) || other
        if (!linked) return { ...service, categoryIds: resolvedIds }
        return {
          ...service,
          category: linked.name,
          categoryId: linked.id,
          categoryIds: resolvedIds,
        }
      }),
    );
  }, [categoriesData, flatServicesData]);

  useEffect(
    () => () => {
      stopBookingPreview();
    },
    [],
  );

  const rememberServiceSnapshot = (rows: ServiceRow[]) => {
    serviceSnapshotRef.current = new Map(rows.map((row) => [row.id, { ...row }]));
  };

  const refreshServicesCatalog = async () => {
    const refreshed = await merchantVoiceRepository.getServiceCategories();
    const next = flattenCategoriesToUi(refreshed);
    const mergedServices =
      next.services.length > 0
        ? next.services
        : mergeFlatServicesIntoCategories(
            next.categories,
            await merchantVoiceRepository.getServices(),
          );
    setCategories((prev) => unionSettingsCategories(prev, next.categories));
    setServices(mergedServices);
    servicesRef.current = mergedServices;
    rememberServiceSnapshot(mergedServices);
    servicesDirtyRef.current = false;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.merchantVoiceServices() }),
      queryClient.invalidateQueries({
        queryKey: qk.merchantVoiceServiceCategories(),
      }),
    ]);
    return mergedServices;
  };

  const buildServiceApiPayload = (service: ServiceRow) => ({
    name: service.name.trim(),
    price: Number.isFinite(service.price) ? service.price : 0,
    durationMinutes: clampMerchantVoiceServiceDurationMinutes(service.duration),
    note: null as string | null,
    icon: service.icon?.trim() || null,
    isActive: true,
    categoryIds: categoryIdsPayloadForApi(service.categoryIds),
  });

  const serviceModalCategoryOptions = useMemo(() => {
    const byId = new Map<string, SettingsCategory>();
    const upsert = (category: SettingsCategory) => {
      if (!category.id) return;
      const existing = byId.get(category.id);
      if (existing) {
        byId.set(category.id, {
          ...existing,
          name: category.name || existing.name,
          isSystem:
            existing.isSystem ||
            category.isSystem ||
            category.id === OTHER_SERVICES_CATEGORY_ID,
        });
        return;
      }
      byId.set(category.id, {
        id: category.id,
        name: category.name || DEFAULT_SERVICE_CATEGORY,
        isSystem:
          category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
      });
    };

    categories.forEach(upsert);
    (categoriesData || []).forEach((category) => {
      upsert({
        id: category.id,
        name: category.name,
        isSystem:
          category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
      });
    });

    const hasOther = [...byId.values()].some(
      (category) =>
        category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
    );
    if (!hasOther) {
      upsert({
        id: OTHER_SERVICES_CATEGORY_ID,
        name: DEFAULT_SERVICE_CATEGORY,
        isSystem: true,
      });
    }

    return [...byId.values()].sort((left, right) => {
      // Default (system) category first, then A–Z.
      if (left.isSystem !== right.isSystem) return left.isSystem ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
  }, [categories, categoriesData]);

  const serviceModalCategorySelection = useMemo(() => {
    const realCategories = serviceModalCategoryOptions.filter(
      (category) => !isOtherServicesCategory(category),
    );
    const onlyOther =
      realCategories.length === 0 && serviceModalCategoryOptions.length > 0;
    return { realCategories, onlyOther, hasRealCategories: realCategories.length > 0 };
  }, [serviceModalCategoryOptions]);

  useEffect(() => {
    if (!serviceModalOpen || !serviceModalCategorySelection.onlyOther) return;
    setServiceModalDraft((prev) => {
      if (prev.categoryIds.includes(OTHER_SERVICES_CATEGORY_ID)) return prev;
      return { ...prev, categoryIds: [OTHER_SERVICES_CATEGORY_ID] };
    });
  }, [serviceModalOpen, serviceModalCategorySelection.onlyOther]);

  const openServiceModal = (categoryId?: string) => {
    const preferredId =
      typeof categoryId === "string" ? categoryId.trim() : "";
    const { onlyOther } = serviceModalCategorySelection;
    // Only Other in catalog → auto-check. Else global Add → none; from group → that category.
    const initialCategoryIds = onlyOther
      ? [OTHER_SERVICES_CATEGORY_ID]
      : !preferredId
        ? []
        : preferredId === OTHER_SERVICES_CATEGORY_ID
          ? [OTHER_SERVICES_CATEGORY_ID]
          : categoryIdsForApi([preferredId]);
    setServiceModalDraft({
      mode: "create",
      serviceId: null,
      categoryIds: initialCategoryIds,
      name: "",
      price: "",
      duration: "",
    });
    setServiceModalError("");
    setServiceModalCategoriesError("");
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServiceRow) => {
    const draft = resolveInlineServiceDraft(service);
    const assignedCategoryIds = categoryIdsForApi(service.categoryIds);
    setServiceModalDraft({
      mode: "edit",
      serviceId: service.id,
      categoryIds:
        assignedCategoryIds.length > 0
          ? assignedCategoryIds
          : [OTHER_SERVICES_CATEGORY_ID],
      name: draft.name,
      price: draft.price,
      duration: draft.duration,
    });
    setServiceModalError("");
    setServiceModalCategoriesError("");
    setServiceModalOpen(true);
  };

  const toggleServiceModalCategory = (categoryId: string) => {
    const category = serviceModalCategoryOptions.find(
      (item) => item.id === categoryId,
    );
    const isOther = category ? isOtherServicesCategory(category) : false;
    if (isOther) {
      return;
    }
    setServiceModalError("");
    setServiceModalCategoriesError("");
    setServiceModalDraft((prev) => {
      const selected = prev.categoryIds.includes(categoryId);
      if (selected) {
        return {
          ...prev,
          categoryIds: prev.categoryIds.filter((id) => id !== categoryId),
        };
      }
      return {
        ...prev,
        categoryIds: [
          ...prev.categoryIds.filter((id) => id !== OTHER_SERVICES_CATEGORY_ID),
          categoryId,
        ],
      };
    });
  };

  const removeService = async (id: string, categoryId: string) => {
    const service = servicesRef.current.find((row) => row.id === id);
    if (!service) return;

    const isOtherCategory =
      categoryId === OTHER_SERVICES_CATEGORY_ID ||
      categories.find((item) => item.id === categoryId)?.isSystem === true;
    const assignedCategoryIds = categoryIdsForApi(service.categoryIds);
    const belongsToMultipleCategories =
      !isOtherCategory &&
      assignedCategoryIds.includes(categoryId) &&
      assignedCategoryIds.length > 1;

    // In a category accordion: only unlink from that category when the service
    // still belongs to other categories. Otherwise delete the service entirely.
    if (belongsToMultipleCategories) {
      const categoryName =
        categories.find((item) => item.id === categoryId)?.name ||
        service.category ||
        DEFAULT_SERVICE_CATEGORY;
      const ok = await showConfirm(
        t(`${TK}.serviceRemoveFromCategoryConfirmMessage`, {
          name: service.name || "—",
          category: categoryName,
        }),
        t(`${TK}.serviceRemoveFromCategoryConfirmTitle`),
      );
      if (!ok) return;

      const nextCategoryIds = assignedCategoryIds.filter(
        (id) => id !== categoryId,
      );
      const preferredId = primaryCategoryId(
        nextCategoryIds,
        nextCategoryIds[0] || OTHER_SERVICES_CATEGORY_ID,
      );
      const linked =
        categories.find((item) => item.id === preferredId) ||
        categories.find((item) => item.isSystem);
      const nextRow: ServiceRow = {
        ...service,
        categoryIds: nextCategoryIds,
        categoryId: preferredId,
        category: linked?.name || DEFAULT_SERVICE_CATEGORY,
      };

      setPendingServiceActionId(id);
      try {
        if (isPersistedServiceId(id)) {
          await updateServiceMutation.mutateAsync({
            id,
            body: buildServiceApiPayload(nextRow),
          });
          await refreshServicesCatalog();
        } else {
          setServices((prev) =>
            prev.map((row) => (row.id === id ? nextRow : row)),
          );
          servicesRef.current = servicesRef.current.map((row) =>
            row.id === id ? nextRow : row,
          );
          serviceSnapshotRef.current.set(id, { ...nextRow });
        }
        showToast(
          t(`${TK}.serviceRemovedFromCategory`, {
            name: service.name,
            category: categoryName,
          }),
          "success",
        );
      } catch (error) {
        const message = t(getErrorI18nKey(getApiErrorCode(error)));
        showToast(message, "error");
      } finally {
        setPendingServiceActionId(null);
      }
      return;
    }

    const ok = await showConfirm(
      t(`${TK}.serviceDeleteConfirmMessage`, { name: service.name || "—" }),
      t(`${TK}.serviceDeleteConfirmTitle`),
    );
    if (!ok) return;

    if (!isPersistedServiceId(id)) {
      setServices((prev) => prev.filter((row) => row.id !== id));
      servicesRef.current = servicesRef.current.filter((row) => row.id !== id);
      return;
    }

    setPendingServiceActionId(id);
    try {
      await deleteServiceMutation.mutateAsync(id);
      showToast(t(`${TK}.serviceDeleted`, { name: service.name }), "success");
      await refreshServicesCatalog();
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      showToast(message, "error");
    } finally {
      setPendingServiceActionId(null);
    }
  };

  const saveServiceModal = async () => {
    const name = serviceModalDraft.name.trim();
    const price = Number(serviceModalDraft.price);
    const duration = Number(serviceModalDraft.duration);
    const selectedCategoryIds = [
      ...new Set(
        serviceModalDraft.categoryIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];
    // Other alone → null on the API (built-in uncategorised group).
    const categoryIds = categoryIdsPayloadForApi(selectedCategoryIds);
    setServiceModalCategoriesError("");
    if (selectedCategoryIds.length === 0) {
      setServiceModalCategoriesError(t(`${TK}.serviceModalCategoryRequired`));
      setServiceModalError("");
      return;
    }
    if (!name) {
      setServiceModalError(t(`${TK}.serviceModalNameRequired`));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setServiceModalError(t(`${TK}.serviceModalPriceInvalid`));
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setServiceModalError(t(`${TK}.serviceModalDurationInvalid`));
      return;
    }

    const preferredId = primaryCategoryId(
      selectedCategoryIds,
      OTHER_SERVICES_CATEGORY_ID,
    );
    const linked =
      categories.find((item) => item.id === preferredId) ||
      serviceModalCategoryOptions.find((item) => item.id === preferredId);

    setIsSavingService(true);
    setServiceModalError("");
    try {
      if (serviceModalDraft.mode === "edit" && serviceModalDraft.serviceId) {
        const serviceId = serviceModalDraft.serviceId;
        const existing = servicesRef.current.find((row) => row.id === serviceId);
        const snapshot = serviceSnapshotRef.current.get(serviceId);
        const nextRow: ServiceRow = {
          id: serviceId,
          icon: existing?.icon || "✨",
          tone: existing?.tone || "tone-violet",
          name,
          price,
          duration: clampMerchantVoiceServiceDurationMinutes(duration),
          category: linked?.name || DEFAULT_SERVICE_CATEGORY,
          categoryId: preferredId,
          categoryIds: selectedCategoryIds,
        };

        if (
          snapshot &&
          snapshot.name === nextRow.name &&
          snapshot.price === nextRow.price &&
          snapshot.duration === nextRow.duration &&
          sameCategoryIds(
            categoryIdsForApi(snapshot.categoryIds),
            categoryIds ?? [],
          )
        ) {
          clearInlineServiceDraft(serviceId);
          setServiceModalOpen(false);
          return;
        }

        if (!isPersistedServiceId(serviceId)) {
          setServices((prev) =>
            prev.map((row) => (row.id === serviceId ? nextRow : row)),
          );
          servicesRef.current = servicesRef.current.map((row) =>
            row.id === serviceId ? nextRow : row,
          );
          serviceSnapshotRef.current.set(serviceId, { ...nextRow });
          clearInlineServiceDraft(serviceId);
          setServiceModalOpen(false);
          return;
        }

        await updateServiceMutation.mutateAsync({
          id: serviceId,
          body: buildServiceApiPayload(nextRow),
        });
        clearInlineServiceDraft(serviceId);
        setServiceModalOpen(false);
        await refreshServicesCatalog();
        setHighlightServiceId(serviceId);
        window.setTimeout(
          () =>
            setHighlightServiceId((current) =>
              current === serviceId ? null : current,
            ),
          1400,
        );
        setStatus(t(`${TK}.serviceUpdated`, { name }));
        showToast(t(`${TK}.serviceUpdated`, { name }), "success");
        return;
      }

      const newId = await createServiceMutation.mutateAsync({
        name,
        price,
        durationMinutes: clampMerchantVoiceServiceDurationMinutes(duration),
        note: null,
        icon: null,
        isActive: true,
        categoryIds,
      });
      setServiceModalOpen(false);
      await refreshServicesCatalog();
      if (newId) {
        setHighlightServiceId(newId);
        window.setTimeout(
          () =>
            setHighlightServiceId((current) =>
              current === newId ? null : current,
            ),
          1400,
        );
      }
      setStatus(t(`${TK}.serviceAdded`, { name }));
      showToast(t(`${TK}.serviceAdded`, { name }), "success");
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setServiceModalError(message);
      showToast(message, "error");
    } finally {
      setIsSavingService(false);
    }
  };

  const openServiceModalFromCategory = (categoryId: string) => {
    setCategoryModalOpen(false);
    openServiceModal(categoryId);
  };

  const resolveInlineServiceDraft = (service: ServiceRow): InlineServiceDraft =>
    inlineServiceDraftsRef.current[service.id] ??
    buildInlineServiceDraft(service);

  const updateInlineServiceDraft = (
    service: ServiceRow,
    field: keyof InlineServiceDraft,
    value: string,
  ) => {
    setInlineServiceErrors((prev) => {
      if (!prev[service.id]) return prev;
      const next = { ...prev };
      delete next[service.id];
      return next;
    });
    setInlineServiceDrafts((prev) => ({
      ...prev,
      [service.id]: {
        ...(prev[service.id] ?? buildInlineServiceDraft(service)),
        [field]: value,
      },
    }));
  };

  const isInlineServiceDraftDirty = (
    service: ServiceRow,
    draft: InlineServiceDraft,
  ): boolean => {
    const snapshot = serviceSnapshotRef.current.get(service.id) ?? service;
    const price = Number(draft.price);
    const duration = Number(draft.duration);
    if (draft.name.trim() !== snapshot.name.trim()) return true;
    if (!Number.isFinite(price) || price !== snapshot.price) return true;
    if (
      !Number.isFinite(duration) ||
      clampMerchantVoiceServiceDurationMinutes(duration) !== snapshot.duration
    ) {
      return true;
    }
    return false;
  };

  const isInlineServiceDirty = (service: ServiceRow): boolean =>
    isInlineServiceDraftDirty(service, resolveInlineServiceDraft(service));

  const clearInlineServiceDraft = (serviceId: string) => {
    setInlineServiceDrafts((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const saveInlineService = async (serviceId: string) => {
    const service = servicesRef.current.find((row) => row.id === serviceId);
    if (!service || pendingServiceActionId === serviceId) return;

    if (!isInlineServiceDirty(service)) {
      clearInlineServiceDraft(serviceId);
      return;
    }

    const draft = resolveInlineServiceDraft(service);
    const name = draft.name.trim();
    const price = Number(draft.price);
    const duration = Number(draft.duration);

    if (!name) {
      setInlineServiceErrors((prev) => ({
        ...prev,
        [serviceId]: t(`${TK}.serviceModalNameRequired`),
      }));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setInlineServiceErrors((prev) => ({
        ...prev,
        [serviceId]: t(`${TK}.serviceModalPriceInvalid`),
      }));
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setInlineServiceErrors((prev) => ({
        ...prev,
        [serviceId]: t(`${TK}.serviceModalDurationInvalid`),
      }));
      return;
    }

    const nextRow: ServiceRow = {
      ...service,
      name,
      price,
      duration: clampMerchantVoiceServiceDurationMinutes(duration),
    };

    setPendingServiceActionId(serviceId);
    setInlineServiceErrors((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });

    try {
      if (!isPersistedServiceId(serviceId)) {
        setServices((prev) =>
          prev.map((row) => (row.id === serviceId ? nextRow : row)),
        );
        servicesRef.current = servicesRef.current.map((row) =>
          row.id === serviceId ? nextRow : row,
        );
        serviceSnapshotRef.current.set(serviceId, { ...nextRow });
      } else {
        await updateServiceMutation.mutateAsync({
          id: serviceId,
          body: buildServiceApiPayload(nextRow),
        });
        await refreshServicesCatalog();
      }
      clearInlineServiceDraft(serviceId);
      showToast(t(`${TK}.serviceUpdated`, { name }), "success");
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setInlineServiceErrors((prev) => ({ ...prev, [serviceId]: message }));
      showToast(message, "error");
    } finally {
      setPendingServiceActionId(null);
    }
  };

  const openCategoryModal = () => {
    setCategoryDrafts(
      categories.length
        ? categories.map((category) => ({
            id: category.id,
            name: category.name,
            isSystem: category.isSystem,
            isNew: false,
            isEditing: false,
          }))
        : [
            {
              id: OTHER_SERVICES_CATEGORY_ID,
              name: DEFAULT_SERVICE_CATEGORY,
              isSystem: true,
              isNew: false,
              isEditing: false,
            },
          ],
    );
    setCategoryModalError("");
    setPendingCategoryFocus(null);
    setCategoryModalOpen(true);
  };

  const syncCategoryDraftsFromApi = (nextCategories: SettingsCategory[]) => {
    setCategoryDrafts(
      nextCategories.map((category) => ({
        id: category.id,
        name: category.name,
        isSystem: category.isSystem,
        isNew: false,
        isEditing: false,
      })),
    );
  };

  const countServicesForCategory = (draft: CategoryDraft) =>
    services.filter((service) => {
      if (draft.id) return service.categoryIds.includes(draft.id)
      return service.category === draft.name
    }).length;

  const formatCategoryServiceCount = (count: number) =>
    count === 1
      ? t(`${TK}.categoryServiceCountOne`)
      : t(`${TK}.categoryServiceCount`, { count });

  const isDuplicateCategoryName = (name: string, ignoreIndex: number) => {
    const normalized = name.trim().toLowerCase();
    return categoryDrafts.some(
      (draft, index) =>
        index !== ignoreIndex &&
        draft.name.trim().toLowerCase() === normalized,
    );
  };

  const confirmCreateCategory = async (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft?.isNew) return;
    const name = draft.name.trim();
    if (!name) {
      setCategoryModalError(t(`${TK}.categoryModalNameRequired`));
      categoryInputRef.current?.focus();
      return;
    }
    if (isDuplicateCategoryName(name, index)) {
      setCategoryModalError(t(`${TK}.categoryModalDuplicate`));
      categoryInputRef.current?.focus();
      return;
    }

    setIsSavingCategories(true);
    setCategoryModalError("");
    try {
      await createCategoryMutation.mutateAsync({ name });
      setPendingCategoryFocus(null);
      showToast(t(`${TK}.categoryCreated`), "success");
      // Query invalidation refreshes categories; keep modal open with latest rows.
      const refreshed = await merchantVoiceRepository.getServiceCategories();
      const next = flattenCategoriesToUi(refreshed);
      const mergedCategories = unionSettingsCategories(
        categories,
        next.categories,
      );
      setCategories(mergedCategories);
      if (!servicesDirtyRef.current) {
        setServices(
          next.services.length > 0
            ? next.services
            : mergeFlatServicesIntoCategories(
                mergedCategories,
                await merchantVoiceRepository.getServices(),
              ),
        );
      }
      syncCategoryDraftsFromApi(mergedCategories);
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setCategoryModalError(message);
      showToast(message, "error");
    } finally {
      setIsSavingCategories(false);
    }
  };

  const confirmRenameCategory = async (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft?.id || draft.isSystem || !draft.isEditing) return;
    const name = draft.name.trim();
    if (!name) {
      setCategoryModalError(t(`${TK}.categoryModalNameRequired`));
      categoryInputRef.current?.focus();
      return;
    }
    if (isDuplicateCategoryName(name, index)) {
      setCategoryModalError(t(`${TK}.categoryModalDuplicate`));
      categoryInputRef.current?.focus();
      return;
    }
    const previous = categories.find((item) => item.id === draft.id);
    if (previous && previous.name === name) {
      setCategoryDrafts((prev) =>
        prev.map((row, rowIndex) =>
          rowIndex === index
            ? { ...row, name, isEditing: false }
            : row,
        ),
      );
      setPendingCategoryFocus(null);
      return;
    }

    setIsSavingCategories(true);
    setCategoryModalError("");
    try {
      await updateCategoryMutation.mutateAsync({
        id: draft.id,
        body: { name },
      });
      showToast(t(`${TK}.categoryUpdated`), "success");
      const refreshed = await merchantVoiceRepository.getServiceCategories();
      const next = flattenCategoriesToUi(refreshed);
      const mergedCategories = unionSettingsCategories(
        categories,
        next.categories,
      );
      setCategories(mergedCategories);
      if (!servicesDirtyRef.current) {
        setServices(
          next.services.length > 0
            ? next.services
            : mergeFlatServicesIntoCategories(
                mergedCategories,
                await merchantVoiceRepository.getServices(),
              ),
        );
      }
      syncCategoryDraftsFromApi(mergedCategories);
      setPendingCategoryFocus(null);
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setCategoryModalError(message);
      showToast(message, "error");
    } finally {
      setIsSavingCategories(false);
    }
  };

  const startEditCategory = (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft || draft.isSystem || draft.isNew) return;
    setCategoryModalError("");
    setCategoryDrafts((prev) =>
      prev.map((row, rowIndex) => ({
        ...row,
        isEditing: rowIndex === index,
        // Drop unfinished new draft when starting edit.
        ...(row.isNew ? { name: row.name } : null),
      })).filter((row) => !(row.isNew && !row.name.trim())),
    );
    setPendingCategoryFocus("edit");
  };

  const cancelCategoryRow = (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft) return;
    setCategoryModalError("");
    if (draft.isNew) {
      setCategoryDrafts((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
      setPendingCategoryFocus(null);
      return;
    }
    const original = categories.find((item) => item.id === draft.id);
    setCategoryDrafts((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              name: original?.name || row.name,
              isEditing: false,
            }
          : row,
      ),
    );
    setPendingCategoryFocus(null);
  };

  const deleteCategoryRow = async (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft || draft.isSystem) return;
    if (draft.isNew) {
      cancelCategoryRow(index);
      return;
    }
    if (!draft.id) return;

    const ok = await showConfirm(
      t(`${TK}.categoryDeleteConfirmMessage`, { name: draft.name }),
      t(`${TK}.categoryDeleteConfirmTitle`),
    );
    if (!ok) return;

    setIsSavingCategories(true);
    setCategoryModalError("");
    try {
      await deleteCategoryMutation.mutateAsync(draft.id);
      showToast(t(`${TK}.categoryDeleted`), "success");
      const refreshed = await merchantVoiceRepository.getServiceCategories();
      const next = flattenCategoriesToUi(refreshed);
      const mergedCategories = unionSettingsCategories(
        categories,
        next.categories,
        draft.id ? [draft.id] : [],
      );
      setCategories(mergedCategories);
      if (!servicesDirtyRef.current) {
        setServices(
          next.services.length > 0
            ? next.services
            : mergeFlatServicesIntoCategories(
                mergedCategories,
                await merchantVoiceRepository.getServices(),
              ),
        );
      } else {
        // Remap dirty services that lived under deleted category → Other.
        const other =
          mergedCategories.find((item) => item.isSystem) ||
          mergedCategories.find((item) => item.id === OTHER_SERVICES_CATEGORY_ID);
        setServices((prev) =>
          prev.map((service) => {
            if (!draft.id || !service.categoryIds.includes(draft.id) || !other) {
              return service
            }
            const categoryIds = normalizeServiceCategoryIds(
              service.categoryIds.filter((id) => id !== draft.id),
              other.id,
            )
            const preferredId = primaryCategoryId(categoryIds, other.id)
            const linked =
              mergedCategories.find((item) => item.id === preferredId) || other
            return {
              ...service,
              categoryIds,
              categoryId: preferredId,
              category: linked.name,
            }
          }),
        );
      }
      syncCategoryDraftsFromApi(mergedCategories);
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setCategoryModalError(message);
      showToast(message, "error");
    } finally {
      setIsSavingCategories(false);
    }
  };

  const updateCategoryDraft = (index: number, value: string) => {
    setCategoryDrafts((prev) =>
      prev.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, name: value } : draft,
      ),
    );
  };

  const addCategoryDraft = () => {
    const existingNewIndex = categoryDrafts.findIndex((draft) => draft.isNew);
    if (existingNewIndex >= 0) {
      setPendingCategoryFocus("new");
      return;
    }
    setCategoryModalError("");
    setCategoryDrafts((prev) => [
      ...prev.map((row) => ({ ...row, isEditing: false })),
      { id: null, name: "", isSystem: false, isNew: true, isEditing: false },
    ]);
    setPendingCategoryFocus("new");
  };

  useEffect(() => {
    if (!pendingCategoryFocus || !categoryModalOpen) return;
    const input = categoryInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
    setPendingCategoryFocus(null);
  }, [pendingCategoryFocus, categoryModalOpen, categoryDrafts]);

  const catalogSections = useMemo(() => {
    const sections = categories.map((category) => ({
      ...category,
      services: [] as ServiceRow[],
    }));
    const sectionById = new Map(
      sections.map((section) => [section.id, section] as const),
    );
    const otherSection =
      sections.find((section) => section.isSystem) ||
      sections.find((section) => section.id === OTHER_SERVICES_CATEGORY_ID);

    services.forEach((service) => {
      const ids = normalizeServiceCategoryIds(
        service.categoryIds,
        service.categoryId || OTHER_SERVICES_CATEGORY_ID,
      )
      let placed = false
      ids.forEach((categoryId) => {
        const target = sectionById.get(categoryId)
        if (!target) return
        if (!target.services.some((row) => row.id === service.id)) {
          target.services.push(service)
        }
        placed = true
      })
      if (placed) return

      const target = otherSection
      if (target) {
        if (!target.services.some((row) => row.id === service.id)) {
          target.services.push(service)
        }
        return
      }

      // Synthesize a group when categories have not loaded yet.
      const fallbackId = service.categoryId || OTHER_SERVICES_CATEGORY_ID
      let fallback = sectionById.get(fallbackId)
      if (!fallback) {
        fallback = {
          id: fallbackId,
          name: service.category || DEFAULT_SERVICE_CATEGORY,
          isSystem: fallbackId === OTHER_SERVICES_CATEGORY_ID,
          services: [],
        }
        sections.push(fallback)
        sectionById.set(fallbackId, fallback)
      }
      if (!fallback.services.some((row) => row.id === service.id)) {
        fallback.services.push(service)
      }
    });

    if (sections.length === 0 && services.length > 0) {
      return [
        {
          id: OTHER_SERVICES_CATEGORY_ID,
          name: DEFAULT_SERVICE_CATEGORY,
          isSystem: true,
          services: [...services],
        },
      ];
    }

    return sections;
  }, [categories, services]);

  // Keep accordion ids valid when catalog changes; all categories start collapsed.
  useEffect(() => {
    if (catalogSections.length === 0) {
      setOpenServiceCategoryIds(new Set());
      return;
    }
    setOpenServiceCategoryIds((prev) => {
      const validIds = new Set(catalogSections.map((section) => section.id));
      return new Set([...prev].filter((id) => validIds.has(id)));
    });
  }, [catalogSections]);

  const toggleServiceCategory = (categoryId: string) => {
    setOpenServiceCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleLanguageSelect = (next: Language) => {
    const resolved = next;
    setLanguage(resolved);
    setGreeting(t(`${TK}.${greetingI18nKey(resolved)}`));
    setStatus(
      t(`${TK}.languageSelected`, {
        language: t(`${TK}.languageLabels.${resolved}`),
      }),
    );
  };

  const handlePromoChange = (value: string) => {
    setPromotion(value.slice(0, PROMO_MAX_LENGTH));
  };

  const handlePromoSuggest = (key: keyof typeof PROMO_TEMPLATES) => {
    const template = PROMO_TEMPLATES[key];
    if (!template) return;
    setPromotion(template.text.slice(0, PROMO_MAX_LENGTH));
    setStatus(
      t(`${TK}.promoFilled`, { name: t(`${TK}.${template.labelKey}`) }),
    );
  };

  const handlePreview = async () => {
    if (isPreviewPlaying) {
      stopBookingPreview();
      setIsPreviewPlaying(false);
      setStatus(t(`${TK}.previewStopped`));
      return;
    }

    const text = greeting.trim() || t(`${TK}.greetingEn`);

    try {
      await speakBookingPreview({
        text,
        language,
        onStart: () => {
          setIsPreviewPlaying(true);
          setStatus(t(`${TK}.previewPlaying`));
        },
        onEnd: () => {
          setIsPreviewPlaying(false);
          setStatus(t(`${TK}.previewDone`));
        },
        onError: () => {
          setIsPreviewPlaying(false);
          setStatus(t(`${TK}.previewFailed`));
        },
      });
    } catch (error) {
      setIsPreviewPlaying(false);
      if (error instanceof Error && error.message === "speech-not-supported") {
        setStatus(t(`${TK}.previewNotSupported`));
        return;
      }
      setStatus(t(`${TK}.previewFailed`));
    }
  };
  const handleSave = async () => {
    const requiredMessage = t(
      "components.dashboard.views.BookingHubView.team.requiredField",
    );
    const nextErrors: {
      salonName?: string;
      salonPhone?: string;
      bookingNotifyPhone?: string;
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      greeting?: string;
    } = {};
    if (!salonName.trim()) nextErrors.salonName = requiredMessage;
    // Salon phone + booking notify phone are optional; validate format only when entered.
    if (
      salonPhoneParsed.nationalNumber.replace(/\D/g, "") &&
      !isValidPhoneE164(salonPhone, salonPhoneParsed.countryCode)
    ) {
      nextErrors.salonPhone = t(`${TK}.invalidPhone`);
    }
    if (
      bookingNotifyPhoneParsed.nationalNumber.replace(/\D/g, "") &&
      !isValidPhoneE164(
        bookingNotifyPhone,
        bookingNotifyPhoneParsed.countryCode,
      )
    ) {
      nextErrors.bookingNotifyPhone = t(`${TK}.invalidPhone`);
    }
    if (!location.street.trim()) nextErrors.street = requiredMessage;
    if (!location.country.trim()) nextErrors.country = requiredMessage;
    if (!greeting.trim()) nextErrors.greeting = requiredMessage;

    if (
      applyAiHubProgressiveValidation({
        allErrors: nextErrors,
        root: settingsShellRef.current,
        setErrors: setFormErrors,
        showToast,
        fieldLabels: {
          salonName: t(`${TK}.salonName`),
          salonPhone: t(`${TK}.salonPhone`),
          bookingNotifyPhone: t(`${TK}.bookingNotifyPhone`),
          street: t(`${TK}.address`),
          city: t(`${TK}.city`),
          state: t(`${TK}.state`),
          zip: t(`${TK}.zip`),
          country: t(`${TK}.country`),
          greeting: t(`${TK}.greetingScript`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return;
    }

    const validHours = validateHours(hours);
    if (!validHours) {
      showToast(t(`${TK}.hourValidationSummary`), "error");
      return;
    }

    try {
      const salonPhonePayload = normalizePhoneForApi(
        salonPhone,
        parsePhone(salonPhone).countryCode,
      );
      const bookingNotifyPhonePayload = normalizePhoneForApi(
        bookingNotifyPhone,
        parsePhone(bookingNotifyPhone).countryCode,
      );

      const savePromises: Array<Promise<unknown>> = [
        updateConfigMutation.mutateAsync({
          name: salonName.trim(),
          forwardPhoneNumber: salonPhonePayload,
          bookingNotifyPhone: bookingNotifyPhonePayload,
          address: location.street.trim(),
          city: location.city.trim() || null,
          state: location.state.trim() || null,
          zipCode: location.zip.trim() || null,
          country: location.country.trim() || null,
          googleReviewUrl: googleReviewUrl.trim(),
          website: website.trim() || null,
          description: description.trim() || null,
          promotion: promotion.trim().slice(0, PROMO_MAX_LENGTH) || null,
          promoSms: promoSms.trim().slice(0, FIRST_CALL_SMS_MAX_LENGTH) || null,
          sendSmsPromoEnabled,
          timeZone: timeZone.trim() || null,
          language: mapUiLanguageToConfigLanguage(language),
          welcomeGreeting: greeting.trim(),
          operatingHours: DAY_KEYS.map((day) => {
            const row = hours[day];
            if (!row.open) {
              return {
                dayOfWeek: DAY_KEY_TO_API[day],
                isOpen: false,
              };
            }
            return {
              dayOfWeek: DAY_KEY_TO_API[day],
              isOpen: true,
              openTime: `${row.openTime}:00`,
              closeTime: `${row.closeTime}:00`,
            };
          }),
        }),
      ];

      // Booking SMS Notifications live on PosBookingSettings now — saved as a second,
      // independent request alongside the Nexora Voice config above. Non-SMS fields on
      // that resource (auto-confirm, lead time, etc.) aren't shown on this panel, so they
      // round-trip from whatever POS Booking Settings already has loaded.
      if (businessId) {
        savePromises.push(
          updateBookingSettingsMutation.mutateAsync({
            autoConfirmEnabled: posBookingSettingsData?.autoConfirmEnabled ?? true,
            minLeadTimeMinutes: posBookingSettingsData?.minLeadTimeMinutes ?? 15,
            maxAdvanceDays: posBookingSettingsData?.maxAdvanceDays ?? 7,
            reminderHoursBefore: posBookingSettingsData?.reminderHoursBefore ?? 12,
            ...bookingSmsSettingsPayloadFromEnabled(bookingSmsEnabled),
          }),
        );
      }

      await Promise.all(savePromises);

      setStatus(t(`${TK}.saveSuccess`));
      setFormErrors({});
      showToast(t(`${TK}.saveSuccess`), "success");
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setStatus(message);
      showToast(message, "error");
    }
  };

  if (isConfigLoading || isCategoriesLoading || isServicesLoading) {
    return <BookingSettingsSkeleton />;
  }

  return (
    <div className="settings-shell" ref={settingsShellRef}>
      <div className="settings-hero is-compact">
        <div className="settings-eyebrow">{t(`${TK}.eyebrow`)}</div>
        <h2 className="settings-title">{t(`${TK}.oneSourceTitle`)}</h2>
        <p className="settings-desc">{t(`${TK}.oneSourceDesc`)}</p>
        <div className="settings-sync-grid">
          <div className="settings-sync-pill">
            <strong>{t(`${TK}.syncPillVoice`)}</strong>
            {t(`${TK}.syncVoice`)}
          </div>
          <div className="settings-sync-pill">
            <strong>{t(`${TK}.syncPillSms`)}</strong>
            {t(`${TK}.syncSms`)}
          </div>
          <div className="settings-sync-pill">
            <strong>{t(`${TK}.syncPillLanding`)}</strong>
            {t(`${TK}.syncLanding`)}
          </div>
          <div className="settings-sync-pill">
            <strong>{t(`${TK}.syncPillSchema`)}</strong>
            {t(`${TK}.syncSchema`)}
          </div>
          <div className="settings-sync-pill">
            <strong>{t(`${TK}.syncPillBooking`)}</strong>
            {t(`${TK}.syncBooking`)}
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <SettingsCard
          cardId="salon"
          collapsed={isCollapsed("salon")}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-card-title-icon">
                <ShopIcon />
              </span>
              {t(`${TK}.salonInfoTitle`)}
            </>
          }
          subtitle={t(`${TK}.salonInfoSub`)}
        >
          <div className="settings-field-grid settings-business-grid">
            <label className="settings-field" data-ai-hub-field="salonName">
              <span className="settings-label">{t(`${TK}.salonName`)}</span>
              <input
                className="settings-input"
                type="text"
                value={salonName}
                placeholder={t(`${TK}.placeholderSalonName`)}
                aria-invalid={Boolean(formErrors.salonName)}
                onChange={(event) => {
                  setSalonName(event.target.value);
                  if (formErrors.salonName)
                    setFormErrors((prev) => ({
                      ...prev,
                      salonName: undefined,
                    }));
                }}
              />
              <span className="settings-field-error-slot">
                {formErrors.salonName ? (
                  <span className="settings-field-error">
                    {formErrors.salonName}
                  </span>
                ) : null}
              </span>
            </label>
            <label className="settings-field" data-ai-hub-field="salonPhone">
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.salonPhone`)}
                <SettingsInfoTooltip
                  id="salon-phone-number-help"
                  ariaLabel={t(`${TK}.salonPhoneInfoAria`)}
                >
                  {t(`${TK}.salonPhoneHelp`)}
                </SettingsInfoTooltip>
              </span>
              <span className="phone-input-shell">
                <CountryCodeSelect
                  value={salonPhoneParsed.countryCode}
                  embedded
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(
                      salonPhoneParsed.nationalNumber,
                      nextCode,
                    );
                    setSalonPhone(
                      formatted ? `${nextCode} ${formatted}`.trim() : "",
                    );
                    if (formErrors.salonPhone)
                      setFormErrors((prev) => ({
                        ...prev,
                        salonPhone: undefined,
                      }));
                  }}
                />
                <input
                  className="settings-input phone-mask-input"
                  type="tel"
                  value={formatNationalNumber(
                    salonPhoneParsed.nationalNumber,
                    salonPhoneParsed.countryCode,
                  )}
                  placeholder={getNationalPhonePlaceholder(
                    salonPhoneParsed.countryCode,
                  )}
                  aria-invalid={Boolean(formErrors.salonPhone)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  onChange={(event) => {
                    const formatted = formatNationalNumber(
                      event.target.value,
                      salonPhoneParsed.countryCode,
                    );
                    setSalonPhone(
                      formatted
                        ? `${salonPhoneParsed.countryCode} ${formatted}`.trim()
                        : "",
                    );
                    if (formErrors.salonPhone)
                      setFormErrors((prev) => ({
                        ...prev,
                        salonPhone: undefined,
                      }));
                  }}
                />
              </span>
              <span className="settings-field-error-slot">
                {formErrors.salonPhone ? (
                  <span className="settings-field-error">
                    {formErrors.salonPhone}
                  </span>
                ) : null}
              </span>
            </label>
            <label className="settings-field">
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.aiLine`)}
                <SettingsInfoTooltip
                  id="ai-answering-number-help"
                  ariaLabel={t(`${TK}.aiLineInfoAria`)}
                >
                  {t(`${TK}.aiLineHelp`)}
                </SettingsInfoTooltip>
              </span>
              <span className="phone-input-shell">
                <CountryCodeSelect
                  value={aiPhoneParsed.countryCode}
                  embedded
                  disabled
                  onChange={() => {}}
                />
                <input
                  className="settings-input phone-mask-input"
                  type="tel"
                  value={formatNationalNumber(
                    aiPhoneParsed.nationalNumber,
                    aiPhoneParsed.countryCode,
                  )}
                  placeholder={getNationalPhonePlaceholder(
                    aiPhoneParsed.countryCode,
                  )}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  readOnly
                />
              </span>
            </label>
            <label
              className="settings-field"
              data-ai-hub-field="bookingNotifyPhone"
            >
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.bookingNotifyPhone`)}
                <SettingsInfoTooltip
                  id="booking-notification-number-help"
                  ariaLabel={t(`${TK}.bookingNotifyInfoAria`)}
                >
                  {t(`${TK}.bookingNotifyHelp`)}
                </SettingsInfoTooltip>
              </span>
              <span className="phone-input-shell">
                <CountryCodeSelect
                  value={bookingNotifyPhoneParsed.countryCode}
                  embedded
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(
                      bookingNotifyPhoneParsed.nationalNumber,
                      nextCode,
                    );
                    setBookingNotifyPhone(
                      formatted ? `${nextCode} ${formatted}`.trim() : "",
                    );
                    if (formErrors.bookingNotifyPhone)
                      setFormErrors((prev) => ({
                        ...prev,
                        bookingNotifyPhone: undefined,
                      }));
                  }}
                />
                <input
                  className="settings-input phone-mask-input"
                  type="tel"
                  value={formatNationalNumber(
                    bookingNotifyPhoneParsed.nationalNumber,
                    bookingNotifyPhoneParsed.countryCode,
                  )}
                  placeholder={getNationalPhonePlaceholder(
                    bookingNotifyPhoneParsed.countryCode,
                  )}
                  aria-invalid={Boolean(formErrors.bookingNotifyPhone)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  onChange={(event) => {
                    const formatted = formatNationalNumber(
                      event.target.value,
                      bookingNotifyPhoneParsed.countryCode,
                    );
                    setBookingNotifyPhone(
                      formatted
                        ? `${bookingNotifyPhoneParsed.countryCode} ${formatted}`.trim()
                        : "",
                    );
                    if (formErrors.bookingNotifyPhone)
                      setFormErrors((prev) => ({
                        ...prev,
                        bookingNotifyPhone: undefined,
                      }));
                  }}
                />
              </span>
              <span className="settings-field-error-slot">
                {formErrors.bookingNotifyPhone ? (
                  <span className="settings-field-error">
                    {formErrors.bookingNotifyPhone}
                  </span>
                ) : null}
              </span>
            </label>
            <div className="settings-location-grid">
              <label
                className="settings-field settings-span-full"
                data-ai-hub-field="street"
              >
                <span className="settings-label">{t(`${TK}.address`)}</span>
                <input
                  className="settings-input"
                  type="text"
                  value={location.street}
                  placeholder={t(`${TK}.placeholderStreetFull`)}
                  autoComplete="street-address"
                  aria-invalid={Boolean(formErrors.street)}
                  onChange={(event) => {
                    const street = event.target.value;
                    lastGeocodedQueryRef.current = "";
                    // New address → leave "Manually selected" and re-detect TZ.
                    timeZoneManualRef.current = false;
                    setTimeZoneManual(false);
                    if (addressGeocodeStatus === "failed") {
                      setAddressGeocodeStatus("idle");
                    }
                    patchLocation({ street });
                    scheduleAddressGeocode(street);
                    if (formErrors.street)
                      setFormErrors((prev) => ({
                        ...prev,
                        street: undefined,
                      }));
                  }}
                  onBlur={(event) => {
                    flushAddressGeocode(event.target.value);
                  }}
                />
                <span className="settings-field-error-slot">
                  {formErrors.street ? (
                    <span className="settings-field-error">
                      {formErrors.street}
                    </span>
                  ) : null}
                </span>
              </label>
              <label className="settings-field" data-ai-hub-field="city">
                <span className="settings-label">{t(`${TK}.city`)}</span>
                <input
                  className="settings-input"
                  type="text"
                  value={location.city}
                  placeholder={t(`${TK}.placeholderCity`)}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(formErrors.city)}
                  onChange={(event) => {
                    patchLocation({ city: event.target.value });
                    if (formErrors.city)
                      setFormErrors((prev) => ({
                        ...prev,
                        city: undefined,
                      }));
                  }}
                />
                <span className="settings-field-error-slot">
                  {formErrors.city ? (
                    <span className="settings-field-error">
                      {formErrors.city}
                    </span>
                  ) : null}
                </span>
              </label>
              <label className="settings-field" data-ai-hub-field="state">
                <span className="settings-label">{t(`${TK}.state`)}</span>
                <input
                  className="settings-input"
                  type="text"
                  value={location.state}
                  placeholder={t(`${TK}.placeholderState`)}
                  autoComplete="address-level1"
                  aria-invalid={Boolean(formErrors.state)}
                  onChange={(event) => {
                    patchLocation({ state: event.target.value });
                    if (formErrors.state)
                      setFormErrors((prev) => ({
                        ...prev,
                        state: undefined,
                      }));
                  }}
                />
                <span className="settings-field-error-slot">
                  {formErrors.state ? (
                    <span className="settings-field-error">
                      {formErrors.state}
                    </span>
                  ) : null}
                </span>
              </label>
              <label className="settings-field" data-ai-hub-field="zip">
                <span className="settings-label">{t(`${TK}.zip`)}</span>
                <input
                  className="settings-input"
                  type="text"
                  value={location.zip}
                  placeholder={t(`${TK}.placeholderZip`)}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  aria-invalid={Boolean(formErrors.zip)}
                  onChange={(event) => {
                    patchLocation({ zip: event.target.value });
                    if (formErrors.zip)
                      setFormErrors((prev) => ({
                        ...prev,
                        zip: undefined,
                      }));
                  }}
                />
                <span className="settings-field-error-slot">
                  {formErrors.zip ? (
                    <span className="settings-field-error">
                      {formErrors.zip}
                    </span>
                  ) : null}
                </span>
              </label>
              <label className="settings-field" data-ai-hub-field="country">
                <span className="settings-label">{t(`${TK}.country`)}</span>
                <select
                  className="settings-select"
                  value={location.country}
                  autoComplete="country"
                  aria-invalid={Boolean(formErrors.country)}
                  onChange={(event) => {
                    patchLocation({
                      country: normalizeSettingsCountry(event.target.value),
                    });
                    if (formErrors.country)
                      setFormErrors((prev) => ({
                        ...prev,
                        country: undefined,
                      }));
                  }}
                >
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  {!countryOptions.some(
                    (option) => option.value === location.country,
                  ) && location.country ? (
                    <option value={location.country}>
                      {getSettingsCountryLabel(location.country)}
                    </option>
                  ) : null}
                </select>
                <span className="settings-field-error-slot">
                  {formErrors.country ? (
                    <span className="settings-field-error">
                      {formErrors.country}
                    </span>
                  ) : null}
                </span>
              </label>
            </div>
            <label className="settings-field settings-span-full">
              <span className="settings-label">
                {t(`${TK}.googleReviewLink`)}
              </span>
              <input
                className="settings-input"
                type="text"
                value={googleReviewUrl}
                placeholder={t(`${TK}.placeholderGoogleReviewLink`)}
                onChange={(event) => setGoogleReviewUrl(event.target.value)}
              />
            </label>
            <label className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.website`)}</span>
              <input
                className="settings-input"
                type="url"
                value={website}
                placeholder={t(`${TK}.placeholderWebsite`)}
                autoComplete="url"
                inputMode="url"
                onChange={(event) => setWebsite(event.target.value)}
              />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          cardId="hours"
          collapsed={isCollapsed("hours")}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-card-title-icon">
                <ClockHistoryIcon />
              </span>
              {t(`${TK}.hoursTitle`)}
            </>
          }
          subtitle={t(`${TK}.hoursSub`)}
        >
          <div className="settings-hours">
            {DAY_KEYS.map((day) => {
              const row = hours[day];
              const rowError = hoursErrorByDay[day];
              return (
                <div
                  className={`settings-hour-row ${row.open ? "" : "is-closed"}`}
                  key={day}
                >
                  <label className="settings-hour-toggle">
                    <input
                      type="checkbox"
                      checked={row.open}
                      onChange={() => toggleHour(day)}
                    />
                    <span>{t(`${TK}.days.${day}`)}</span>
                  </label>
                  <div className="settings-hour-times">
                    <div
                      className="settings-time-box"
                      onClick={(event) => {
                        const input =
                          event.currentTarget.querySelector("input");
                        if (input instanceof HTMLInputElement)
                          openTimePicker(input);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openTimePicker(
                            event.currentTarget.querySelector("input"),
                          );
                        }
                      }}
                      role="button"
                      tabIndex={row.open ? 0 : -1}
                      aria-label={t(`${TK}.openTimeAria`, {
                        day: t(`${TK}.days.${day}`),
                      })}
                    >
                      <input
                        className="settings-hour-input"
                        type="time"
                        lang="en-US-u-hc-h12"
                        step={60}
                        value={row.openTime}
                        disabled={!row.open}
                        aria-invalid={Boolean(rowError)}
                        aria-label={t(`${TK}.openTimeAria`, {
                          day: t(`${TK}.days.${day}`),
                        })}
                        onChange={(event) =>
                          updateHourTime(day, "openTime", event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                      <ClockIcon />
                    </div>
                    <span className="settings-hour-to">
                      {t(`${TK}.hoursTo`)}
                    </span>
                    <div
                      className="settings-time-box"
                      onClick={(event) => {
                        const input =
                          event.currentTarget.querySelector("input");
                        if (input instanceof HTMLInputElement)
                          openTimePicker(input);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openTimePicker(
                            event.currentTarget.querySelector("input"),
                          );
                        }
                      }}
                      role="button"
                      tabIndex={row.open ? 0 : -1}
                      aria-label={t(`${TK}.closeTimeAria`, {
                        day: t(`${TK}.days.${day}`),
                      })}
                    >
                      <input
                        className="settings-hour-input"
                        type="time"
                        lang="en-US-u-hc-h12"
                        step={60}
                        value={row.closeTime}
                        disabled={!row.open}
                        aria-invalid={Boolean(rowError)}
                        aria-label={t(`${TK}.closeTimeAria`, {
                          day: t(`${TK}.days.${day}`),
                        })}
                        onChange={(event) =>
                          updateHourTime(day, "closeTime", event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                      <ClockIcon />
                    </div>
                  </div>
                  {rowError ? (
                    <span className="settings-hour-error">{rowError}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="settings-hours-toolbar">
            <label className="settings-timezone-field">
              <span className="settings-label">{t(`${TK}.timeZone`)}</span>
              <div
                className={`settings-timezone-select-wrap${addressGeocodeStatus === "detecting" ? " is-detecting" : ""}`}
              >
                <select
                  className="settings-select settings-timezone-select"
                  value={timeZone || DEFAULT_SETTINGS_TIMEZONE}
                  aria-label={t(`${TK}.timeZoneAria`)}
                  aria-busy={addressGeocodeStatus === "detecting"}
                  disabled={addressGeocodeStatus === "detecting"}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTimeZone(next);
                    setTimeZoneManual(true);
                    setStatus(
                      t(`${TK}.timeZoneManualSet`, { timeZone: next }),
                    );
                  }}
                >
                  {SETTINGS_TIMEZONE_OPTIONS.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                  {timeZone && !isSettingsTimeZone(timeZone) ? (
                    <option value={timeZone}>{timeZone}</option>
                  ) : null}
                </select>
                {addressGeocodeStatus === "detecting" ? (
                  <span
                    className="settings-timezone-loading"
                    aria-hidden="true"
                  >
                    <SpinnerIcon className="booking-inline-spinner" />
                  </span>
                ) : null}
              </div>
            </label>
            <span
              className={`settings-timezone-status${addressGeocodeStatus === "detecting" ? " is-detecting" : ""}${addressGeocodeStatus === "failed" ? " is-failed" : ""}`}
            >
              {addressGeocodeStatus === "detecting"
                ? t(`${TK}.timeZoneDetecting`)
                : addressGeocodeStatus === "failed"
                  ? t(`${TK}.timeZoneDetectFailed`)
                  : timeZoneManual
                    ? t(`${TK}.timeZoneManual`)
                    : t(`${TK}.timeZoneAuto`)}
            </span>
          </div>
        </SettingsCard>

        <SettingsCard
          cardId="voice"
          collapsed={isCollapsed("voice")}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-ai-title-icon" aria-hidden="true">
                AI
                <StarsIcon className="settings-ai-spark" />
              </span>
              {t(`${TK}.voiceTitle`)}
            </>
          }
          subtitle={t(`${TK}.voiceSub`)}
        >
          <div className="settings-field-grid">
            <div className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.aiLanguage`)}</span>
              <div
                className="settings-language-grid"
                role="group"
                aria-label={t(`${TK}.aiLanguage`)}
              >
                {AI_LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang}
                    className={`settings-language-card ${language === lang ? "is-active" : ""}`}
                    type="button"
                    aria-pressed={language === lang}
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    {t(`${TK}.${languageButtonLabelKey(lang)}`)}
                  </button>
                ))}
              </div>
              <div className="settings-language-status">
                {t(`${TK}.languageStatus.${language}`)}
              </div>
            </div>
            <div className="settings-field settings-span-full" data-ai-hub-field="greeting">
              <span className="settings-label" id="settings-greeting-label">
                {t(`${TK}.greetingScript`)}
              </span>
              <textarea
                className="settings-textarea"
                value={greeting}
                placeholder={t(`${TK}.placeholderGreeting`)}
                aria-labelledby="settings-greeting-label"
                aria-invalid={Boolean(formErrors.greeting)}
                onChange={(event) => {
                  setGreeting(event.target.value);
                  if (formErrors.greeting)
                    setFormErrors((prev) => ({ ...prev, greeting: undefined }));
                }}
              />
              <span className="settings-field-error-slot">
                {formErrors.greeting ? (
                  <span className="settings-field-error">
                    {formErrors.greeting}
                  </span>
                ) : null}
              </span>
              <button
                className={`booking-secondary-button settings-preview-button ${isPreviewPlaying ? "is-playing" : ""}`}
                type="button"
                aria-pressed={isPreviewPlaying}
                onClick={handlePreview}
              >
                {isPreviewPlaying
                  ? t(`${TK}.previewVoiceStop`)
                  : t(`${TK}.previewVoice`)}
              </button>
            </div>

            <label className="settings-field settings-span-full">
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.promoLabel`)}
                <SettingsInfoTooltip
                  id="promotion-details-help"
                  ariaLabel={t(`${TK}.promoInfoAria`)}
                >
                  {t(`${TK}.promoHelp`)}
                </SettingsInfoTooltip>
              </span>
              <textarea
                className="settings-textarea settings-textarea-promo"
                value={promotion}
                maxLength={PROMO_MAX_LENGTH}
                placeholder={t(`${TK}.promoPlaceholder`)}
                aria-describedby="settings-promo-count"
                onChange={(event) =>
                  handlePromoChange(
                    event.target.value.slice(0, PROMO_MAX_LENGTH),
                  )
                }
              />
              <div className="settings-promo-meta">
                <div className="settings-promo-suggest-row">
                  <button
                    className="settings-promo-suggest"
                    type="button"
                    onClick={() => handlePromoSuggest("reward-yourself")}
                  >
                    <StarsIcon className="settings-promo-suggest-icon" />
                    {t(`${TK}.promoSuggestReward`)}
                  </button>
                </div>
                <div
                  id="settings-promo-count"
                  className={`settings-promo-count ${promotion.length >= PROMO_MAX_LENGTH ? "is-max" : ""}`}
                >
                  <span>{promotion.length}</span>/{PROMO_MAX_LENGTH}
                </div>
              </div>
            </label>

            <div className="settings-first-call-sms settings-span-full">
              <div className="settings-first-call-sms-head">
                <div className="settings-first-call-sms-copy">
                  <span className="settings-label settings-label-with-tooltip">
                    {t(`${TK}.firstCallSmsLabel`)}
                    <SettingsInfoTooltip
                      id="first-call-sms-help"
                      ariaLabel={t(`${TK}.firstCallSmsInfoAria`)}
                    >
                      {t(`${TK}.firstCallSmsHelp`)}
                    </SettingsInfoTooltip>
                  </span>
                </div>
                <div className="settings-first-call-sms-toggle">
                  <span
                    className={`settings-first-call-sms-toggle-label${sendSmsPromoEnabled ? "" : " is-off"}`}
                    aria-live="polite"
                  >
                    {sendSmsPromoEnabled
                      ? t(`${TK}.firstCallSmsToggleOn`)
                      : t(`${TK}.firstCallSmsToggleOff`)}
                  </span>
                  <button
                    className={`toggle-pill${sendSmsPromoEnabled ? " is-on" : ""}`}
                    type="button"
                    role="switch"
                    aria-checked={sendSmsPromoEnabled}
                    aria-label={
                      sendSmsPromoEnabled
                        ? t(`${TK}.firstCallSmsDisableAria`)
                        : t(`${TK}.firstCallSmsEnableAria`)
                    }
                    onClick={() => {
                      setSendSmsPromoEnabled((prev) => {
                        const next = !prev;
                        setStatus(
                          next
                            ? t(`${TK}.firstCallSmsEnabled`)
                            : t(`${TK}.firstCallSmsDisabled`),
                        );
                        return next;
                      });
                    }}
                  />
                </div>
              </div>
              <div className="settings-field">
                <textarea
                  className="settings-textarea"
                  value={promoSms}
                  maxLength={FIRST_CALL_SMS_MAX_LENGTH}
                  placeholder={t(`${TK}.firstCallSmsPlaceholder`)}
                  aria-label={t(`${TK}.firstCallSmsMessageLabel`)}
                  onChange={(event) =>
                    setPromoSms(
                      event.target.value.slice(0, FIRST_CALL_SMS_MAX_LENGTH),
                    )
                  }
                />
              </div>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          cardId="bookingSms"
          collapsed={isCollapsed("bookingSms")}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-card-title-icon">
                <MessageSquareIcon />
              </span>
              {t(`${TK}.bookingSmsTitle`)}
            </>
          }
          subtitle={t(`${TK}.bookingSmsSub`)}
        >
          <div className="settings-config-stack">
            {BOOKING_SMS_RECIPIENTS.map((item) => {
              const enabled = bookingSmsEnabled[item.id];
              return (
                <div className="settings-booking-sms-row" key={item.id}>
                  <div className="settings-booking-sms-copy">
                    <div className="settings-config-title">
                      {t(`${TK}.${item.titleKey}`)}
                    </div>
                    <div className="settings-config-desc">
                      {t(`${TK}.${item.descKey}`)}
                    </div>
                  </div>
                  <div className="settings-booking-sms-control">
                    <span
                      className={`settings-booking-sms-status${enabled ? "" : " is-off"}`}
                      aria-live="polite"
                    >
                      {enabled
                        ? t(`${TK}.bookingSmsStatusOn`)
                        : t(`${TK}.bookingSmsStatusOff`)}
                    </span>
                    <button
                      className={`toggle-pill${enabled ? " is-on" : ""}`}
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      disabled={
                        !voiceEnabled ||
                        isConfigLoading ||
                        updateConfigMutation.isPending ||
                        updateBookingSettingsMutation.isPending
                      }
                      aria-label={
                        enabled
                          ? t(`${TK}.${item.disableAriaKey}`)
                          : t(`${TK}.${item.enableAriaKey}`)
                      }
                      onClick={() => {
                        setBookingSmsEnabled((prev) => {
                          const next = !prev[item.id];
                          setStatus(
                            next
                              ? t(`${TK}.bookingSmsRecipientEnabled`, {
                                  recipient: t(`${TK}.${item.titleKey}`),
                                })
                              : t(`${TK}.bookingSmsRecipientDisabled`, {
                                  recipient: t(`${TK}.${item.titleKey}`),
                                }),
                          );
                          return { ...prev, [item.id]: next };
                        });
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsCard>
      </div>

      <SettingsCard
        cardId="team"
        collapsed={isCollapsed("team")}
        onToggle={toggleCard}
        title={
          <>
            <span className="settings-card-title-icon">
              <PeopleTabIcon />
            </span>
            {t(`${TK}.teamTitle`)}
          </>
        }
        subtitle={t(`${TK}.teamSub`)}
      >
        <div className="settings-team-slot">
          <BookingTeamPanel embedded />
        </div>
      </SettingsCard>

      <div className="settings-two-grid">
        <SettingsCard
          cardId="services"
          className="settings-service-pricing-card"
          collapsed={isCollapsed("services")}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-card-title-icon">
                <CurrencyDollarIcon />
              </span>
              {t(`${TK}.servicesTitle`)}
            </>
          }
          subtitle={t(`${TK}.servicesSub`)}
        >
          <div className="settings-actions settings-service-actions">
            <button
              className="booking-secondary-button settings-category-manager-open"
              type="button"
              onClick={openCategoryModal}
            >
              <FolderTreeIcon />
              {t(`${TK}.manageCategories`)}
            </button>
            <button
              className="booking-primary-button"
              type="button"
              onClick={() => openServiceModal()}
            >
              <PlusLgIcon />
              {t(`${TK}.enterManually`)}
            </button>
          </div>

          <div className="settings-service-list settings-service-body">
            {catalogSections.length === 0 ? (
              <div className="settings-service-catalog-state">
                <p>{t(`${TK}.servicesEmpty`)}</p>
                <button
                  className="booking-primary-button"
                  type="button"
                  onClick={() => openServiceModal()}
                >
                  <PlusLgIcon />
                  {t(`${TK}.servicesEmptyCta`)}
                </button>
              </div>
            ) : (
              catalogSections.map((section) => {
                const categoryServices = section.services;
                const isOpen = openServiceCategoryIds.has(section.id);
                const panelId = `settings-service-category-panel-${section.id}`;
                return (
                  <div
                    key={section.id}
                    className={`settings-service-category${isOpen ? " is-open" : ""}`}
                  >
                    <div className="settings-service-category-head">
                      <button
                        type="button"
                        className="settings-service-category-toggle"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => toggleServiceCategory(section.id)}
                      >
                        <span className="settings-service-category-name">
                          {section.name}
                        </span>
                        <span className="settings-service-category-count">
                          {formatCategoryServiceCount(categoryServices.length)}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="settings-service-category-add"
                        onClick={() => openServiceModal(section.id)}
                      >
                        <PlusLgIcon />
                        {t(`${TK}.addService`)}
                      </button>
                      <button
                        type="button"
                        className="settings-service-category-chevron-btn"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        aria-label={section.name}
                        onClick={() => toggleServiceCategory(section.id)}
                      >
                        <svg
                          className="settings-service-category-chevron"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                          width="16"
                          height="16"
                        >
                          <path
                            d="m6 9 6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div
                      className="settings-service-category-panel"
                      id={panelId}
                      role="region"
                      aria-hidden={!isOpen}
                    >
                      <div className="settings-service-category-panel-inner">
                    <div className="settings-service-category-body">
                      <div
                        className="settings-service-header"
                        aria-hidden="true"
                      >
                        <span />
                        <span>{t(`${TK}.serviceColumn`)}</span>
                        <span>{t(`${TK}.priceColumn`)}</span>
                        <span>{t(`${TK}.durationColumn`)}</span>
                        <span />
                      </div>
                      {categoryServices.length === 0 ? (
                        <div className="settings-category-empty">
                          {t(`${TK}.categoryEmpty`)}
                        </div>
                      ) : (
                        categoryServices.map((service) => {
                          const isPending =
                            pendingServiceActionId === service.id;
                          const draft =
                            inlineServiceDrafts[service.id] ??
                            buildInlineServiceDraft(service);
                          const isDirty = isInlineServiceDraftDirty(
                            service,
                            draft,
                          );
                          const inlineError = inlineServiceErrors[service.id];
                          return (
                            <div
                              className={`settings-service-row is-compact${isDirty ? " is-editing" : ""}${highlightServiceId === service.id ? " is-highlight" : ""}`}
                              data-service-row-id={service.id}
                              key={`${section.id}-${service.id}`}
                            >
                              <div
                                className="settings-service-edit-grid"
                                onBlur={(event) => {
                                  const nextTarget =
                                    event.relatedTarget as Node | null;
                                  if (
                                    nextTarget &&
                                    event.currentTarget.contains(nextTarget)
                                  ) {
                                    return;
                                  }
                                  void saveInlineService(service.id);
                                }}
                              >
                                <span
                                  className={`settings-service-visual ${service.tone}`}
                                  aria-hidden="true"
                                >
                                  {service.icon}
                                </span>
                                <input
                                  className="settings-service-input"
                                  type="text"
                                  value={draft.name}
                                  placeholder={t(
                                    `${TK}.placeholderServiceName`,
                                  )}
                                  aria-label={t(`${TK}.serviceNameAria`)}
                                  disabled={isPending}
                                  onChange={(event) => {
                                    updateInlineServiceDraft(
                                      service,
                                      "name",
                                      event.target.value,
                                    );
                                  }}
                                />
                                <div className="settings-service-input-wrap">
                                  <span className="settings-service-prefix">
                                    $
                                  </span>
                                  <input
                                    className="settings-service-input price"
                                    type="text"
                                    inputMode="decimal"
                                    value={draft.price}
                                    placeholder={t(
                                      `${TK}.placeholderServicePrice`,
                                    )}
                                    aria-label={t(`${TK}.servicePriceAria`)}
                                    disabled={isPending}
                                    onChange={(event) => {
                                      updateInlineServiceDraft(
                                        service,
                                        "price",
                                        parseInlineServicePrice(
                                          event.target.value,
                                        ),
                                      );
                                    }}
                                  />
                                </div>
                                <div className="settings-service-input-wrap">
                                  <input
                                    className="settings-service-input duration"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={draft.duration}
                                    placeholder={t(
                                      `${TK}.placeholderServiceDuration`,
                                    )}
                                    aria-label={t(
                                      `${TK}.serviceDurationAria`,
                                    )}
                                    disabled={isPending}
                                    onChange={(event) => {
                                      updateInlineServiceDraft(
                                        service,
                                        "duration",
                                        event.target.value.replace(/\D/g, ""),
                                      );
                                    }}
                                  />
                                  <span className="settings-service-suffix">
                                    {t(`${TK}.durationUnit`)}
                                  </span>
                                </div>
                                <div className="settings-service-row-actions">
                                  {isDirty ? (
                                    <button
                                      className="settings-service-confirm"
                                      type="button"
                                      aria-label={t(
                                        `${TK}.serviceConfirmUpdateAria`,
                                      )}
                                      disabled={isPending || isSavingService}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                      }}
                                      onClick={() => {
                                        void saveInlineService(service.id);
                                      }}
                                    >
                                      {isPending ? (
                                        <SpinnerIcon className="booking-inline-spinner" />
                                      ) : (
                                        <CheckCircleFillIcon className="settings-service-confirm-icon" />
                                      )}
                                    </button>
                                  ) : null}
                                  <button
                                    className="settings-service-edit"
                                    type="button"
                                    aria-label={t(`${TK}.serviceEditAria`)}
                                    disabled={isPending || isSavingService}
                                    onClick={() => openEditServiceModal(service)}
                                  >
                                    <PencilIcon className="settings-service-edit-icon" />
                                  </button>
                                  <button
                                    className="settings-service-remove"
                                    type="button"
                                    aria-label={t(`${TK}.removeService`)}
                                    disabled={isPending || isSavingService}
                                    onClick={() => {
                                      void removeService(
                                        service.id,
                                        section.id,
                                      );
                                    }}
                                  >
                                    {isPending ? (
                                      <SpinnerIcon className="booking-inline-spinner" />
                                    ) : (
                                      "×"
                                    )}
                                  </button>
                                </div>
                              </div>
                              {inlineError ? (
                                <p
                                  className="settings-service-row-error"
                                  role="alert"
                                >
                                  {inlineError}
                                </p>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SettingsCard>

      </div>

      <div className="settings-save-bar">
        <div>
          <div className="settings-save-copy">{t(`${TK}.saveCopy`)}</div>
          {statusMessage ? (
            <div className="settings-status">{statusMessage}</div>
          ) : null}
        </div>
        <button
          className="booking-primary-button"
          type="button"
          disabled={
            updateConfigMutation.isPending ||
            isSavingCategories ||
            isSavingService
          }
          onClick={handleSave}
        >
          {updateConfigMutation.isPending ? (
            <SpinnerIcon className="booking-inline-spinner" />
          ) : null}
          {t(`${TK}.saveButton`)}
        </button>
      </div>

      {serviceModalOpen ? (
        <div className="settings-service-modal" role="presentation">
          <div
            className="settings-service-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-service-modal-title"
          >
            <div className="settings-service-modal-head">
              <div>
                <div
                  className="settings-service-modal-title"
                  id="settings-service-modal-title"
                >
                  {t(
                    `${TK}.${
                      serviceModalDraft.mode === "edit"
                        ? "serviceModalEditTitle"
                        : "serviceModalTitle"
                    }`,
                  )}
                </div>
                <div className="settings-service-modal-sub">
                  {t(
                    `${TK}.${
                      serviceModalDraft.mode === "edit"
                        ? "serviceModalEditSub"
                        : "serviceModalSub"
                    }`,
                  )}
                </div>
              </div>
              <button
                className="settings-service-modal-close"
                type="button"
                aria-label={t(`${TK}.serviceModalCloseAria`)}
                onClick={() => setServiceModalOpen(false)}
              >
                <XLgIcon />
              </button>
            </div>
            <div className="settings-service-modal-body">
              <div className="settings-service-modal-grid">
                <div
                  className={`settings-field settings-service-modal-field-name${
                    serviceModalCategoriesError ? " has-error" : ""
                  }`}
                >
                  <span className="settings-label">
                    {t(`${TK}.serviceModalCategories`)}
                    <span className="settings-required-mark" aria-hidden="true">
                      *
                    </span>
                  </span>
                  <div
                    className={`settings-service-modal-categories${
                      serviceModalCategoriesError ? " has-error" : ""
                    }`}
                    role="group"
                    aria-invalid={serviceModalCategoriesError ? "true" : undefined}
                    aria-describedby={
                      serviceModalCategoriesError
                        ? "settings-service-modal-categories-error"
                        : undefined
                    }
                    aria-label={t(`${TK}.serviceModalCategories`)}
                  >
                    {serviceModalCategoryOptions.length === 0 ? (
                      <div className="settings-service-modal-categories-empty">
                        {t(`${TK}.serviceModalCategoriesEmpty`)}
                      </div>
                    ) : (
                      serviceModalCategoryOptions.map((category) => {
                        const isOther = isOtherServicesCategory(category);
                        const { onlyOther, hasRealCategories } =
                          serviceModalCategorySelection;
                        const disabled =
                          isOther && (onlyOther || hasRealCategories);
                        const checked = isOther
                          ? onlyOther ||
                            serviceModalDraft.categoryIds.includes(category.id)
                          : serviceModalDraft.categoryIds.includes(category.id);
                        return (
                          <label
                            key={category.id}
                            className={`settings-service-modal-category-option${checked ? " is-selected" : ""}${disabled ? " is-disabled" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={disabled}
                              onChange={() => {
                                toggleServiceModalCategory(category.id);
                              }}
                            />
                            <span>{category.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {serviceModalCategoriesError ? (
                    <span
                      id="settings-service-modal-categories-error"
                      className="settings-field-error"
                      role="alert"
                    >
                      {serviceModalCategoriesError}
                    </span>
                  ) : (
                    <span className="settings-help">
                      {t(`${TK}.serviceModalCategoriesHelp`)}
                    </span>
                  )}
                </div>
                <label className="settings-field settings-service-modal-field-name">
                  <span className="settings-label">
                    {t(`${TK}.serviceModalName`)}
                  </span>
                  <input
                    className="settings-input"
                    type="text"
                    value={serviceModalDraft.name}
                    placeholder={t(`${TK}.placeholderServiceName`)}
                    autoComplete="off"
                    onChange={(event) =>
                      setServiceModalDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="settings-field">
                  <span className="settings-label">
                    {t(`${TK}.serviceModalPrice`)}
                  </span>
                  <div className="settings-service-input-wrap settings-service-modal-input-wrap">
                    <span className="settings-service-prefix" aria-hidden="true">
                      $
                    </span>
                    <input
                      className="settings-input settings-service-modal-affix-input is-price"
                      type="text"
                      inputMode="decimal"
                      value={serviceModalDraft.price}
                      placeholder={t(`${TK}.placeholderServicePrice`)}
                      aria-label={t(`${TK}.serviceModalPrice`)}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/[^\d.]/g, "");
                        const parts = raw.split(".");
                        const next =
                          parts.length <= 1
                            ? raw
                            : `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
                        setServiceModalDraft((prev) => ({
                          ...prev,
                          price: next,
                        }));
                      }}
                    />
                  </div>
                </label>
                <label className="settings-field">
                  <span className="settings-label">
                    {t(`${TK}.serviceModalDuration`)}
                  </span>
                  <div className="settings-service-input-wrap settings-service-modal-input-wrap">
                    <input
                      className="settings-input settings-service-modal-affix-input is-duration"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={serviceModalDraft.duration}
                      placeholder={t(`${TK}.placeholderServiceDuration`)}
                      aria-label={t(`${TK}.serviceModalDuration`)}
                      onChange={(event) =>
                        setServiceModalDraft((prev) => ({
                          ...prev,
                          duration: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                    />
                    <span className="settings-service-suffix" aria-hidden="true">
                      min
                    </span>
                  </div>
                </label>
              </div>
              {serviceModalError ? (
                <div className="settings-service-modal-error" role="alert">
                  {serviceModalError}
                </div>
              ) : null}
            </div>
            <div className="settings-service-modal-actions">
              <button
                className="booking-secondary-button"
                type="button"
                onClick={() => setServiceModalOpen(false)}
              >
                {t(`${TK}.serviceModalCancel`)}
              </button>
              <button
                className="booking-primary-button"
                type="button"
                disabled={isSavingService}
                onClick={() => {
                  void saveServiceModal();
                }}
              >
                {isSavingService ? (
                  <SpinnerIcon className="booking-inline-spinner" />
                ) : serviceModalDraft.mode === "edit" ? (
                  <CheckCircleFillIcon className="settings-action-icon" />
                ) : (
                  <PlusIcon className="settings-action-icon" />
                )}{" "}
                {t(
                  `${TK}.${
                    serviceModalDraft.mode === "edit"
                      ? "serviceModalUpdate"
                      : "serviceModalSave"
                  }`,
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {categoryModalOpen ? (
        <div className="settings-service-modal" role="presentation">
          <div
            className="settings-service-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-category-modal-title"
          >
            <div className="settings-service-modal-head">
              <div>
                <div
                  className="settings-service-modal-title"
                  id="settings-category-modal-title"
                >
                  {t(`${TK}.categoryModalTitle`)}
                </div>
                <div className="settings-service-modal-sub">
                  {t(`${TK}.categoryModalSub`)}
                </div>
              </div>
              <button
                className="settings-service-modal-close"
                type="button"
                aria-label={t(`${TK}.categoryModalCloseAria`)}
                onClick={() => setCategoryModalOpen(false)}
              >
                <XLgIcon />
              </button>
            </div>
            <div className="settings-service-modal-body">
              <div className="settings-category-manager">
                <div className="settings-category-manager-head">
                  <div>
                    <div className="settings-category-manager-title">
                      <FolderTreeIcon className="settings-category-manager-icon" />
                      {t(`${TK}.categoryModalCategories`)}
                    </div>
                    <div className="settings-category-manager-sub">
                      {t(`${TK}.categoryModalCategoriesSub`)}
                    </div>
                  </div>
                  <button
                    className="settings-category-manager-add"
                    type="button"
                    disabled={isSavingCategories}
                    onClick={addCategoryDraft}
                  >
                    <PlusIcon className="settings-category-manager-add-icon" />
                    {t(`${TK}.categoryModalAdd`)}
                  </button>
                </div>
                <div className="settings-category-list">
                  {categoryDrafts.length === 0 ? (
                    <div className="settings-category-empty">
                      {t(`${TK}.categoryModalEmpty`)}
                    </div>
                  ) : (
                    categoryDrafts.map((draft, index) => {
                      const serviceCount = countServicesForCategory(draft);
                      const isActiveRow = Boolean(draft.isNew || draft.isEditing);
                      const canEdit = !draft.isSystem && !draft.isNew;
                      return (
                        <div
                          className={`settings-category-row${draft.isNew ? " is-new" : ""}${draft.isEditing ? " is-editing" : ""}`}
                          key={`${draft.id || "new"}-${index}`}
                        >
                          <div className="settings-category-row-main">
                            <FolderTreeIcon className="settings-category-row-icon" />
                            <div className="settings-category-row-label">
                              <input
                                ref={isActiveRow ? categoryInputRef : undefined}
                                className="settings-category-name-input"
                                type="text"
                                value={draft.name}
                                size={
                                  draft.isNew || draft.isEditing
                                    ? undefined
                                    : Math.max(draft.name.length, 1)
                                }
                                disabled={
                                  draft.isSystem ||
                                  (!draft.isNew && !draft.isEditing) ||
                                  isSavingCategories
                                }
                                placeholder={
                                  draft.isNew
                                    ? t(`${TK}.categoryNamePlaceholder`)
                                    : undefined
                                }
                                aria-label={t(`${TK}.categoryModalCategories`)}
                                onChange={(event) =>
                                  updateCategoryDraft(index, event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    if (draft.isNew) {
                                      void confirmCreateCategory(index);
                                    } else if (draft.isEditing) {
                                      void confirmRenameCategory(index);
                                    }
                                  }
                                  if (event.key === "Escape" && isActiveRow) {
                                    event.preventDefault();
                                    cancelCategoryRow(index);
                                  }
                                }}
                              />
                              <span
                                className="settings-category-count"
                                title={formatCategoryServiceCount(serviceCount)}
                              >
                                {formatCategoryServiceCount(serviceCount)}
                              </span>
                            </div>
                          </div>
                          <div className="settings-category-row-actions">
                            {draft.isNew || draft.isEditing ? (
                              <>
                                <button
                                  className="settings-category-row-action is-confirm"
                                  type="button"
                                  aria-label={
                                    draft.isNew
                                      ? t(`${TK}.categoryConfirmAddAria`)
                                      : t(`${TK}.categoryConfirmEditAria`)
                                  }
                                  disabled={isSavingCategories}
                                  onClick={() => {
                                    if (draft.isNew) {
                                      void confirmCreateCategory(index);
                                    } else {
                                      void confirmRenameCategory(index);
                                    }
                                  }}
                                >
                                  {isSavingCategories ? (
                                    <SpinnerIcon className="settings-category-row-action-icon" />
                                  ) : (
                                    <CheckCircleFillIcon className="settings-category-row-action-icon is-confirm-icon" />
                                  )}
                                </button>
                                <button
                                  className="settings-category-row-action"
                                  type="button"
                                  aria-label={t(`${TK}.categoryCancelAria`)}
                                  disabled={isSavingCategories}
                                  onClick={() => cancelCategoryRow(index)}
                                >
                                  <XLgIcon className="settings-category-row-action-icon" />
                                </button>
                              </>
                            ) : (
                              <>
                                {draft.id ? (
                                  <button
                                    className="settings-category-row-add-service"
                                    type="button"
                                    disabled={isSavingCategories}
                                    aria-label={t(`${TK}.addService`)}
                                    onClick={() => {
                                      openServiceModalFromCategory(draft.id);
                                    }}
                                  >
                                    <PlusLgIcon />
                                    {t(`${TK}.addService`)}
                                  </button>
                                ) : null}
                                {canEdit ? (
                                  <button
                                    className="settings-category-row-action"
                                    type="button"
                                    aria-label={t(`${TK}.categoryEditAria`)}
                                    disabled={isSavingCategories}
                                    onClick={() => startEditCategory(index)}
                                  >
                                    <PencilIcon className="settings-category-row-action-icon" />
                                  </button>
                                ) : null}
                                {!draft.isSystem ? (
                                  <button
                                    className="settings-category-row-action is-danger"
                                    type="button"
                                    aria-label={t(`${TK}.categoryModalRemoveAria`)}
                                    disabled={isSavingCategories}
                                    onClick={() => {
                                      void deleteCategoryRow(index);
                                    }}
                                  >
                                    <Trash2Icon className="settings-category-row-action-icon" />
                                  </button>
                                ) : null}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              {categoryModalError ? (
                <div className="settings-service-modal-error" role="alert">
                  {categoryModalError}
                </div>
              ) : null}
            </div>
            <div className="settings-service-modal-actions">
              <button
                className="booking-primary-button"
                type="button"
                disabled={isSavingCategories}
                onClick={() => setCategoryModalOpen(false)}
              >
                {t(`${TK}.categoryModalClose`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
