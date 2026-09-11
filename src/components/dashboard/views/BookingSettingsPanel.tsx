import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import {
  useCreateMerchantVoiceService,
  useDeleteMerchantVoiceService,
  useDeleteMerchantVoiceServiceCategory,
  useMerchantVoiceConfig,
  useMerchantVoiceServiceCategories,
  useMerchantVoiceServices,
  useReorderMerchantVoiceServices,
  useSaveCategoriesBatch,
  useSaveServicesBatch,
  useUpdateMerchantVoiceConfig,
  useUpdateMerchantVoiceService,
} from "../../../data/hooks/useMerchantVoiceBookings";
import { useReorderPosCategories } from "../../../data/hooks/usePosCategories";
import { useMerchantVoiceOptions } from "../../../data/hooks/useMerchantVoiceOptions";
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
  type SaveCategoryBatchItem,
  type SaveServiceBatchItem,
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
import { TWELVE_HOUR_INPUT_LANG } from "../../../constants/timeFormat";
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
  ClockHistoryIcon,
  CurrencyDollarIcon,
  InfoCircleIcon,
  PeopleTabIcon,
  MessageSquareIcon,
  ShopIcon,
  SpinnerIcon,
  StarsIcon,
} from "./BookingHubIcons";
import { BookingSettingsSkeleton } from "./BookingHubSkeletons";
import { prepareVoiceSelectionsForSave, voiceSelectionsForSave } from "./voiceLibrary/voiceSelectionDraft";
import { VoiceSelectionCard } from "./voiceLibrary/VoiceSelectionCard";
import HolidayClosuresCard from "./HolidayClosuresCard";
import BookingTeamPanel from "./BookingTeamPanel";
import ServicesPricingPanel, {
  ServicesPricingCategoryManager,
  ServicesPricingServiceSection,
} from "./services/ServicesPricingPanel";
import {
  ServicesPricingServiceModal,
  ServicesPricingServiceRow,
  type ServicesPricingServiceField,
  type ServicesPricingServiceModalField,
  type ServicesPricingServiceModalFieldErrors,
} from "./services/ServicesPricingServiceEditor";
import { useBookingHubVoiceEnabled } from "./BookingHubVoiceContext";
import { applyAiHubProgressiveValidation } from "./bookingHubDialogValidation";
import {
  newServiceDraftReducer,
  validateNewServiceDrafts,
  type NewServiceDraftError,
} from "./bookingSettingsNewServiceDrafts";
import {
  buildCategoryOrderItems,
  planCategoryDraftChanges,
} from "./bookingSettingsCategoryDrafts";
import { buildServiceOrderItems } from "./bookingSettingsServiceOrder";

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
  id: string;
  name: string;
  isSystem: boolean;
}

interface ServiceRow {
  id: string;
  icon: string;
  tone: Tone;
  name: string;
  price: number;
  duration: number;
  /** Display name for primary accordion grouping. */
  category: string;
  /** Primary category id (first selected / preferred). */
  categoryId: string;
  /** All linked category ids (multi-category). */
  categoryIds: string[];
  note?: string | null;
  photoUrl?: string | null;
}

type ServiceModalMode = "create" | "edit";

type ServiceModalDraft = {
  mode: ServiceModalMode;
  serviceId: string | null;
  categoryIds: string[];
  name: string;
  price: string;
  duration: string;
  note: string;
  photo: File | null;
  photoUrl: string | null;
};

type InlineServiceDraft = {
  name: string;
  price: string;
  duration: string;
};

function buildInlineServiceDraft(service: ServiceRow): InlineServiceDraft {
  return {
    name: service.name,
    price: formatWholeNumberInputValue(service.price),
    duration: formatWholeNumberInputValue(service.duration),
  };
}

interface CategoryDraft {
  id: string | null;
  draftKey: string;
  name: string;
  isSystem: boolean;
  /** Unsaved row created via Add category. */
  isNew?: boolean;
}

const DEFAULT_SERVICE_CATEGORY = "Other services";

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPersistedServiceId(id: string) {
  return GUID_RE.test(id);
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
  ];
  return cleaned.length > 0 ? cleaned : [fallbackId];
}

function primaryCategoryId(categoryIds: string[], fallbackId: string): string {
  return categoryIds[0] || fallbackId;
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
  ];
}

/**
 * API payload for service categories.
 * Built-in Other is never sent as an id — Other-only → `null`.
 */
function categoryIdsPayloadForApi(categoryIds: string[]): string[] | null {
  const ids = categoryIdsForApi(categoryIds);
  return ids.length > 0 ? ids : null;
}

function sameCategoryIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((id, index) => id === b[index]);
}

/** Keep the API category order across refreshes while retaining local-only fallback groups. */
function unionSettingsCategories(
  previous: SettingsCategory[],
  next: SettingsCategory[],
  removedIds: string[] = [],
): SettingsCategory[] {
  const removed = new Set(removedIds);
  const previousById = new Map(
    previous.map((category) => [category.id, category]),
  );
  const seen = new Set<string>();
  const ordered: SettingsCategory[] = [];

  next.forEach((category) => {
    if (!category.id || removed.has(category.id) || seen.has(category.id))
      return;
    const existing = previousById.get(category.id);
    ordered.push({
      id: category.id,
      name: category.name || existing?.name || DEFAULT_SERVICE_CATEGORY,
      isSystem:
        category.isSystem ||
        existing?.isSystem ||
        category.id === OTHER_SERVICES_CATEGORY_ID,
    });
    seen.add(category.id);
  });

  previous.forEach((category) => {
    if (removed.has(category.id) || seen.has(category.id)) return;
    ordered.push(category);
    seen.add(category.id);
  });

  return ordered;
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

function flattenCategoriesToUi(
  categoriesData: MerchantVoiceServiceCategoryDto[],
): {
  categories: SettingsCategory[];
  services: ServiceRow[];
} {
  const categories = [...categoriesData]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      isSystem: category.isSystem || category.id === OTHER_SERVICES_CATEGORY_ID,
    }));

  const byId = new Map<string, ServiceRow>();
  let index = 0;
  const otherId =
    categories.find((category) => category.isSystem)?.id ||
    OTHER_SERVICES_CATEGORY_ID;
  // Match HTML: place each service under the category accordion it was nested in.
  [...categoriesData]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((category) => {
      category.services.forEach((service) => {
        if (!service.id) return;
        const existing = byId.get(service.id);
        if (existing) {
          const mergedIds = normalizeServiceCategoryIds(
            [
              ...existing.categoryIds,
              category.id,
              ...(service.categoryIds || []),
            ],
            otherId,
          );
          const preferredId = primaryCategoryId(mergedIds, otherId);
          const linked =
            categories.find((item) => item.id === preferredId) ||
            categories.find((item) => item.isSystem);
          byId.set(service.id, {
            ...existing,
            categoryIds: mergedIds,
            categoryId: preferredId,
            category: linked?.name || existing.category,
          });
          return;
        }
        const toneSeed = INITIAL_SERVICES[index % INITIAL_SERVICES.length];
        const categoryIds = normalizeServiceCategoryIds(
          service.categoryIds?.length ? service.categoryIds : [category.id],
          otherId,
        );
        const preferredId = primaryCategoryId(categoryIds, otherId);
        const linked =
          categories.find((item) => item.id === preferredId) ||
          categories.find((item) => item.id === category.id);
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
          note: service.note,
          photoUrl: service.photoUrl,
        });
        index += 1;
      });
    });

  return { categories, services: Array.from(byId.values()) };
}

function mergeFlatServicesIntoCategories(
  categories: SettingsCategory[],
  flatServices: Array<{
    id: string;
    name: string;
    price: number | null;
    durationMinutes: number | null;
    icon: string | null;
    note: string | null;
    photoUrl: string | null;
    isActive: boolean;
    categoryIds: string[];
  }>,
): ServiceRow[] {
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const other =
    categories.find((category) => category.isSystem) ||
    categories.find((category) => category.id === OTHER_SERVICES_CATEGORY_ID);

  return flatServices
    .filter((service) => service.isActive !== false && service.id)
    .map((service, index) => {
      const otherId = other?.id || OTHER_SERVICES_CATEGORY_ID;
      const categoryIds = normalizeServiceCategoryIds(
        service.categoryIds,
        otherId,
      );
      const preferredId = primaryCategoryId(categoryIds, otherId);
      const linked = categoryById.get(preferredId) || other;
      const toneSeed = INITIAL_SERVICES[index % INITIAL_SERVICES.length];
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
        note: service.note,
        photoUrl: service.photoUrl,
      } satisfies ServiceRow;
    });
}

const AI_LANGUAGE_OPTIONS = [
  MerchantVoiceUiLanguage.Auto,
  MerchantVoiceUiLanguage.Vi,
  MerchantVoiceUiLanguage.En,
] as const;

const PROMO_MAX_LENGTH = 1000;
// Mirrors Constants.VoiceTenantContentLimits on the backend: both columns are unbounded text and
// the ceiling is enforced by the command validators.
const DESCRIPTION_MAX_LENGTH = 10000;
const BUSINESS_FAQ_MAX_LENGTH = 10000;
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
      acc[item.id] = settings[item.configKey];
      return acc;
    },
    { ...BOOKING_SMS_DEFAULT_ENABLED },
  );
}

function bookingSmsSettingsPayloadFromEnabled(
  enabled: Record<BookingSmsRecipientId, boolean>,
): Record<BookingSmsConfigKey, boolean> {
  return BOOKING_SMS_RECIPIENTS.reduce(
    (acc, item) => {
      acc[item.configKey] = enabled[item.id];
      return acc;
    },
    {} as Record<BookingSmsConfigKey, boolean>,
  );
}

const SALON_NAME_TEMPLATE_TOKEN = "Bitcoin Nail Bar";

const PROMO_TEMPLATES = {
  "reward-yourself": {
    labelKey: "promoTemplateRewardLabel",
    enText: [
      "Promotion 1: Reward Yourself",
      "Offer: Free $25 e-gift card.",
      "Eligibility: Book any pedicure service of $55 or more.",
      "Availability: Monday–Saturday, by appointment only.",
      "Rules: One free $25 e-gift card per qualifying visit. For future services only, not redeemable for cash, and cannot be used for gratuity. Cannot combine with other promotions, discounts, coupons, rewards, or special offers. One promotional offer per customer per visit.",
      "General rule: The salon may modify or end any promotion at any time.",
    ].join("\n"),
    viText: [
      "Khuyến mãi 1: Tự thưởng cho mình",
      "Ưu đãi: Tặng thẻ quà tặng điện tử trị giá $25 miễn phí.",
      "Điều kiện: Đặt lịch làm dịch vụ chăm sóc chân (pedicure) từ $55 trở lên.",
      "Thời gian: Thứ Hai–Thứ Bảy, chỉ nhận theo lịch hẹn.",
      "Quy định: Mỗi lần đủ điều kiện được tặng 1 thẻ quà tặng $25. Chỉ áp dụng cho dịch vụ trong tương lai, không quy đổi tiền mặt và không dùng để tip. Không kết hợp với các ưu đãi/giảm giá/quà tặng khác. Mỗi khách chỉ nhận 1 ưu đãi/1 lượt ghé.",
      "Quy tắc chung: Tiệm có thể thay đổi hoặc kết thúc ưu đãi bất cứ lúc nào.",
    ].join("\n"),
  },
  "first-visit": {
    labelKey: "promoTemplateFirstVisitLabel",
    enText: [
      "Promotion 2: First-Visit Special",
      "Offer: 20% off any service for new customers.",
      "Eligibility: First-time customers only, valid on their first visit.",
      "Availability: Monday–Saturday, by appointment only.",
      "Rules: One 20% discount per new customer. Cannot combine with other promotions, discounts, coupons, rewards, or special offers.",
      "General rule: The salon may modify or end any promotion at any time.",
    ].join("\n"),
    viText: [
      "Khuyến mãi 2: Ưu đãi lần đầu",
      "Ưu đãi: Giảm 20% cho bất kỳ dịch vụ nào dành cho khách mới.",
      "Điều kiện: Chỉ áp dụng cho khách lần đầu, có hiệu lực trong lần ghé đầu tiên.",
      "Thời gian: Thứ Hai–Thứ Bảy, chỉ nhận theo lịch hẹn.",
      "Quy định: Mỗi khách mới chỉ nhận 1 lần giảm 20%. Không kết hợp với các ưu đãi/giảm giá/quà tặng khác.",
      "Quy tắc chung: Tiệm có thể thay đổi hoặc kết thúc ưu đãi bất cứ lúc nào.",
    ].join("\n"),
  },
  "refer-a-friend": {
    labelKey: "promoTemplateReferLabel",
    enText: [
      "Promotion 3: Refer-a-Friend",
      "Offer: $15 credit for you and your friend.",
      "Eligibility: Referred friend must book and complete a service of $40 or more.",
      "Availability: Ongoing, by appointment only.",
      "Rules: Credit is issued after the referred friend’s visit is complete. Cannot combine with other promotions, discounts, coupons, rewards, or special offers.",
      "General rule: The salon may modify or end any promotion at any time.",
    ].join("\n"),
    viText: [
      "Khuyến mãi 3: Giới thiệu bạn bè",
      "Ưu đãi: Tặng $15 tiền ưu đãi cho bạn và người bạn giới thiệu.",
      "Điều kiện: Người được giới thiệu phải đặt lịch và hoàn tất dịch vụ từ $40 trở lên.",
      "Thời gian: Áp dụng liên tục, chỉ nhận theo lịch hẹn.",
      "Quy định: Tiền ưu đãi được ghi nhận sau khi người được giới thiệu hoàn tất lần ghé. Không kết hợp với các ưu đãi/giảm giá/quà tặng khác.",
      "Quy tắc chung: Tiệm có thể thay đổi hoặc kết thúc ưu đãi bất cứ lúc nào.",
    ].join("\n"),
  },
} as const;

const GREETING_TEMPLATES = {
  "warm-welcome": {
    labelKey: "greetingTemplateWarmLabel",
    enText:
      "Hi! Thanks for calling Bitcoin Nail Bar. I'm your AI assistant — I can help you book an appointment, check pricing, or answer questions. How can I help today?",
    viText:
      "Xin chào! Cảm ơn bạn đã gọi Bitcoin Nail Bar. Tôi là trợ lý AI của tiệm — tôi có thể giúp bạn đặt lịch, xem giá, hoặc trả lời các câu hỏi. Hôm nay bạn cần hỗ trợ gì ạ?",
  },
  "quick-booking": {
    labelKey: "greetingTemplateQuickLabel",
    enText:
      "Hello! You've reached Bitcoin Nail Bar. I can book your appointment right now, check today's availability, or answer a quick pricing question — what would you like to do?",
    viText:
      "Chào bạn! Bạn đã gọi đến Bitcoin Nail Bar. Tôi có thể giúp bạn đặt lịch ngay bây giờ, kiểm tra tình trạng trống hôm nay, hoặc trả lời nhanh về giá — bạn muốn làm gì ạ?",
  },
  bilingual: {
    labelKey: "greetingTemplateBilingualLabel",
    enText:
      "Xin chào! Bạn đã gọi đến Bitcoin Nail Bar. / Hi! You've reached Bitcoin Nail Bar. Tôi có thể giúp đặt lịch, kiểm tra giá, hoặc trả lời câu hỏi. How can I help you today?",
    viText:
      "Xin chào! Bạn đã gọi đến Bitcoin Nail Bar. / Hi! You've reached Bitcoin Nail Bar. Tôi có thể giúp đặt lịch, kiểm tra giá, hoặc trả lời câu hỏi. How can I help you today?",
  },
} as const;

const FIRST_CALL_SMS_TEMPLATES = {
  "thanks-booking": {
    labelKey: "firstCallSmsTemplateThanksLabel",
    enText:
      "Thanks for choosing Bitcoin Nail Bar! As a special welcome, enjoy an exclusive discount on your next visit. Book your appointment and treat yourself!",
    viText:
      "Cảm ơn bạn đã chọn Bitcoin Nail Bar! Ưu đãi đặc biệt dành cho bạn: nhận giảm giá độc quyền cho lần ghé tiếp theo. Đặt lịch và tận hưởng dịch vụ nhé!",
  },
  "first-time-welcome": {
    labelKey: "firstCallSmsTemplateWelcomeLabel",
    enText:
      "Welcome to Bitcoin Nail Bar! As a first-time customer, you can enjoy a special discount on your next visit. We look forward to seeing you soon!",
    viText:
      "Chào mừng bạn đến với Bitcoin Nail Bar! Là khách hàng lần đầu, bạn sẽ nhận được ưu đãi giảm giá đặc biệt cho lần ghé tiếp theo. Hẹn gặp bạn sớm!",
  },
  "promo-teaser": {
    labelKey: "firstCallSmsTemplatePromoLabel",
    enText:
      "A special offer is waiting for you at Bitcoin Nail Bar! Enjoy an exclusive first-time customer discount on your next visit. Treat yourself and save!",
    viText:
      "Một ưu đãi đặc biệt đang chờ bạn tại Bitcoin Nail Bar! Tận hưởng giảm giá độc quyền dành cho khách hàng lần đầu trong lần ghé tiếp theo. Làm đẹp và tiết kiệm hơn!",
  }
} as const;

const AI_HUB_SUGGESTIONS = {
  greeting: GREETING_TEMPLATES,
  promo: PROMO_TEMPLATES,
  firstCallSms: FIRST_CALL_SMS_TEMPLATES,
} as const;

type GreetingSuggestKey = keyof typeof AI_HUB_SUGGESTIONS.greeting;
type PromoSuggestKey = keyof typeof AI_HUB_SUGGESTIONS.promo;
type FirstCallSmsSuggestKey = keyof typeof AI_HUB_SUGGESTIONS.firstCallSms;

function applySalonNameToTemplate(text: string, salonName: string) {
  const resolvedName = salonName.trim() || SALON_NAME_TEMPLATE_TOKEN;
  return text.split(SALON_NAME_TEMPLATE_TOKEN).join(resolvedName);
}

const GREETING_I18N_KEY_BY_LANGUAGE: Record<Language, string> = {
  [MerchantVoiceUiLanguage.Auto]: "greetingAuto",
  [MerchantVoiceUiLanguage.Vi]: "greetingVi",
  [MerchantVoiceUiLanguage.En]: "greetingEn",
};

const LANGUAGE_BUTTON_LABEL_KEY_BY_LANGUAGE: Record<Language, string> = {
  [MerchantVoiceUiLanguage.Auto]: "languageLabels.autoShort",
  [MerchantVoiceUiLanguage.Vi]: "languageLabels.vi",
  [MerchantVoiceUiLanguage.En]: "languageLabels.en",
};

function greetingI18nKey(language: Language) {
  return GREETING_I18N_KEY_BY_LANGUAGE[language];
}

function defaultGreetingI18nKey(language: Language) {
  return greetingI18nKey(language);
}

function translateKnownGreeting(text: string, language: Language) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const enPattern =
    /^Hello\s+\{\{\s*customerName\s*\}\}\.\s+Thank you for calling\s+(.+?)\.\s+How can I help you today\?$/i;
  const viPattern =
    /^Xin chào\s+\{\{\s*customerName\s*\}\}\.\s+Cảm ơn bạn đã gọi\s+(.+?)\.\s+Tôi có thể giúp gì cho bạn hôm nay\?$/i;

  const enMatch = normalized.match(enPattern);
  if (enMatch) {
    const salon = enMatch[1]?.trim() || SALON_NAME_TEMPLATE_TOKEN;
    if (language === MerchantVoiceUiLanguage.Vi) {
      return `Xin chào {{customerName}}. Cảm ơn bạn đã gọi ${salon}. Tôi có thể giúp gì cho bạn hôm nay?`;
    }
    return `Hello {{customerName}}. Thank you for calling ${salon}. How can I help you today?`;
  }

  const viMatch = normalized.match(viPattern);
  if (viMatch) {
    const salon = viMatch[1]?.trim() || SALON_NAME_TEMPLATE_TOKEN;
    if (language === MerchantVoiceUiLanguage.Vi) {
      return `Xin chào {{customerName}}. Cảm ơn bạn đã gọi ${salon}. Tôi có thể giúp gì cho bạn hôm nay?`;
    }
    return `Hello {{customerName}}. Thank you for calling ${salon}. How can I help you today?`;
  }

  return null;
}

function shouldSyncGreetingForLanguageChange(
  currentGreeting: string,
  loadedGreeting: string,
  fallbackGreetings: string[],
) {
  const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
  const current = normalize(currentGreeting);
  const loaded = normalize(loadedGreeting);
  if (!current) return true;
  if (loaded && current === loaded) return true;
  return fallbackGreetings.map((item) => normalize(item)).includes(current);
}

function languageButtonLabelKey(language: Language) {
  return LANGUAGE_BUTTON_LABEL_KEY_BY_LANGUAGE[language];
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

function SettingsSuggestLabel() {
  const { t } = useTranslation();
  return (
    <span className="settings-suggest-label">
      <StarsIcon className="settings-promo-suggest-icon" aria-hidden="true" />
      {t(`${TK}.suggestLabel`)}
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
  const saveCategoriesBatchMutation = useSaveCategoriesBatch();
  const deleteCategoryMutation = useDeleteMerchantVoiceServiceCategory();
  const createServiceMutation = useCreateMerchantVoiceService();
  const updateServiceMutation = useUpdateMerchantVoiceService();
  const deleteServiceMutation = useDeleteMerchantVoiceService();
  const saveServicesBatchMutation = useSaveServicesBatch();
  const reorderCategoriesMutation = useReorderPosCategories();
  const reorderServicesMutation = useReorderMerchantVoiceServices();
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
      note: "",
      photo: null,
      photoUrl: null,
    },
  );
  const [serviceModalPhotoPreviewUrl, setServiceModalPhotoPreviewUrl] =
    useState<string | null>(null);
  const serviceModalObjectUrlRef = useRef<string | null>(null);
  const [serviceModalError, setServiceModalError] = useState("");
  const [serviceModalFieldErrors, setServiceModalFieldErrors] =
    useState<ServicesPricingServiceModalFieldErrors>({});
  const [serviceModalCategoriesError, setServiceModalCategoriesError] =
    useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<CategoryDraft[]>([]);
  const [categoryModalError, setCategoryModalError] = useState("");
  const [categoryModalErrorIndex, setCategoryModalErrorIndex] = useState<
    number | null
  >(null);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [categoryOrderDirty, setCategoryOrderDirty] = useState(false);
  const [highlightServiceId, setHighlightServiceId] = useState<string | null>(
    null,
  );
  const [inlineServiceDrafts, setInlineServiceDrafts] = useState<
    Record<string, InlineServiceDraft>
  >({});
  const [inlineServiceErrors, setInlineServiceErrors] = useState<
    Record<string, string>
  >({});
  const [newServiceDrafts, dispatchNewServiceDraft] = useReducer(
    newServiceDraftReducer,
    [],
  );
  const [newServiceDraftErrors, setNewServiceDraftErrors] = useState<
    Record<string, NewServiceDraftError>
  >({});
  const newServiceDraftIdRef = useRef(0);
  const categoryDraftIdRef = useRef(0);
  const inlineServiceDraftsRef = useRef(inlineServiceDrafts);
  const [openServiceCategoryIds, setOpenServiceCategoryIds] = useState(
    () => new Set<string>(),
  );
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [language, setLanguage] = useState<Language>(
    MerchantVoiceUiLanguage.Auto,
  );
  const voiceOptionsQuery = useMerchantVoiceOptions(mapUiLanguageToConfigLanguage(language), { enabled: voiceEnabled });
  const voiceLanguageScopeRef = useRef<{ language: string; languages?: string[] }>({ language: mapUiLanguageToConfigLanguage(language) });
  if (voiceLanguageScopeRef.current.language !== mapUiLanguageToConfigLanguage(language)) {
    voiceLanguageScopeRef.current = { language: mapUiLanguageToConfigLanguage(language) };
  }
  useEffect(() => {
    if (voiceOptionsQuery.data && !voiceLanguageScopeRef.current.languages) {
      voiceLanguageScopeRef.current.languages = voiceOptionsQuery.data.languages.map((group) => group.languageCode);
    }
  }, [voiceOptionsQuery.data, language]);
  const [draftVoiceSelections, setDraftVoiceSelections] = useState<Record<string, string>>({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const configDirtyRef = useRef(false);
  const editRevisionRef = useRef(0);
  const hydratedConfigRef = useRef<typeof configData>(undefined);
  const markConfigDirty = () => { configDirtyRef.current = true; editRevisionRef.current += 1; };
  const [greeting, setGreeting] = useState(() => t(`${TK}.greetingEn`));
  const loadedGreetingRef = useRef("");
  const [selectedGreetingSuggestKey, setSelectedGreetingSuggestKey] =
    useState<GreetingSuggestKey | null>(null);
  const [selectedPromoSuggestKey, setSelectedPromoSuggestKey] =
    useState<PromoSuggestKey | null>(null);
  const [selectedFirstCallSmsSuggestKey, setSelectedFirstCallSmsSuggestKey] =
    useState<FirstCallSmsSuggestKey | null>(null);
  const [promotion, setPromotion] = useState("");
  const [salonName, setSalonName] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [aiPhone, setAiPhone] = useState("");
  const [bookingNotifyPhone, setBookingNotifyPhone] = useState("");
  const [location, setLocation] = useState<LocationParts>({
    ...EMPTY_LOCATION,
  });
  const [extraCountries, setExtraCountries] = useState<SettingsCountryOption[]>(
    [],
  );
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [yelpReviewUrl, setYelpReviewUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [description, setDescription] = useState("");
  const [businessFaq, setBusinessFaq] = useState("");
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
    googleReviewUrl?: string;
    yelpReviewUrl?: string;
    website?: string;
    facebookUrl?: string;
    instagramUrl?: string;
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
    const seen = new Set(
      SETTINGS_COUNTRY_OPTIONS.map((option) => option.value),
    );
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
    markConfigDirty();
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
    markConfigDirty();
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
    markConfigDirty();
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
    if (!configData || configDirtyRef.current || hydratedConfigRef.current === configData) return;
    hydratedConfigRef.current = configData;

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
      ensureCountryOption(
        locationParts.country,
        configData.country || undefined,
      );
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
    setYelpReviewUrl(configData.yelpUrl || "");
    setFacebookUrl(configData.facebookUrl || "");
    setInstagramUrl(configData.instagramUrl || "");
    setWebsite(configData.website || "");
    setDescription((configData.description || "").slice(0, DESCRIPTION_MAX_LENGTH));
    setBusinessFaq((configData.businessFaq || "").slice(0, BUSINESS_FAQ_MAX_LENGTH));
    setPromoSms(
      (configData.promoSms || "").slice(0, FIRST_CALL_SMS_MAX_LENGTH),
    );
    setSendSmsPromoEnabled(configData.sendSmsPromoEnabled !== false);
    setPromotion((configData.promotion || "").slice(0, PROMO_MAX_LENGTH));
    const resolvedLang = mapConfigLanguageToUiLanguage(configData.language);
    setLanguage(resolvedLang);
    const loadedGreeting =
      configData.welcomeGreeting ||
      t(`${TK}.${defaultGreetingI18nKey(resolvedLang)}`);
    loadedGreetingRef.current = loadedGreeting;
    setGreeting(loadedGreeting);

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
        : mergeFlatServicesIntoCategories(
          next.categories,
          flatServicesData || [],
        );
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
          next.categories.find(
            (item) => item.id === OTHER_SERVICES_CATEGORY_ID,
          );
        const otherId = other?.id || OTHER_SERVICES_CATEGORY_ID;
        const categoryIds = normalizeServiceCategoryIds(
          service.categoryIds,
          otherId,
        ).filter(
          (id) =>
            next.categories.some((item) => item.id === id) ||
            id === OTHER_SERVICES_CATEGORY_ID,
        );
        const resolvedIds = normalizeServiceCategoryIds(categoryIds, otherId);
        const preferredId = primaryCategoryId(resolvedIds, otherId);
        const linked =
          next.categories.find((item) => item.id === preferredId) || other;
        if (!linked) return { ...service, categoryIds: resolvedIds };
        return {
          ...service,
          category: linked.name,
          categoryId: linked.id,
          categoryIds: resolvedIds,
        };
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
    serviceSnapshotRef.current = new Map(
      rows.map((row) => [row.id, { ...row }]),
    );
  };

  const refreshServicesCatalog = async () => {
    const refreshed = await merchantVoiceRepository.getServiceCategories();
    const next = flattenCategoriesToUi(refreshed);
    // Flat DTO list matching what GET .../services returns — either read straight off
    // the (already-fetched) nested categories response, or fetched separately below
    // when this merchant's categories response doesn't nest services.
    let flatServiceDtos;
    let mergedServices;
    if (next.services.length > 0) {
      const byId = new Map(
        refreshed
          .flatMap((category) => category.services)
          .filter((service) => service.id)
          .map((service) => [service.id, service] as const),
      );
      flatServiceDtos = Array.from(byId.values());
      mergedServices = next.services;
    } else {
      flatServiceDtos = await merchantVoiceRepository.getServices();
      mergedServices = mergeFlatServicesIntoCategories(
        next.categories,
        flatServiceDtos,
      );
    }
    setCategories((prev) => unionSettingsCategories(prev, next.categories));
    setServices(mergedServices);
    servicesRef.current = mergedServices;
    rememberServiceSnapshot(mergedServices);
    servicesDirtyRef.current = false;
    // Seed the query cache with the data already fetched above instead of invalidating —
    // invalidating would trigger a second, redundant GET for the same categories/services,
    // since these hooks' queryFn calls the exact same repository functions as above.
    queryClient.setQueryData(qk.merchantVoiceServiceCategories(), refreshed);
    queryClient.setQueryData(qk.merchantVoiceServices(), flatServiceDtos);
    return mergedServices;
  };

  const buildServiceApiPayload = (service: ServiceRow) => ({
    name: service.name.trim(),
    price: Number.isFinite(service.price) ? service.price : 0,
    durationMinutes: clampMerchantVoiceServiceDurationMinutes(service.duration),
    note: service.note?.trim() || null,
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
    return {
      realCategories,
      onlyOther,
      hasRealCategories: realCategories.length > 0,
    };
  }, [serviceModalCategoryOptions]);

  useEffect(() => {
    if (!serviceModalOpen || !serviceModalCategorySelection.onlyOther) return;
    setServiceModalDraft((prev) => {
      if (prev.categoryIds.includes(OTHER_SERVICES_CATEGORY_ID)) return prev;
      return { ...prev, categoryIds: [OTHER_SERVICES_CATEGORY_ID] };
    });
  }, [serviceModalOpen, serviceModalCategorySelection.onlyOther]);

  const releaseServiceModalObjectUrl = () => {
    if (!serviceModalObjectUrlRef.current) return;
    URL.revokeObjectURL(serviceModalObjectUrlRef.current);
    serviceModalObjectUrlRef.current = null;
  };

  const closeServiceModal = () => {
    releaseServiceModalObjectUrl();
    setServiceModalPhotoPreviewUrl(null);
    setServiceModalOpen(false);
  };

  const selectServiceModalPhoto = (photo: File | null) => {
    releaseServiceModalObjectUrl();
    const previewUrl = photo ? URL.createObjectURL(photo) : null;
    serviceModalObjectUrlRef.current = previewUrl;
    setServiceModalPhotoPreviewUrl(previewUrl);
    setServiceModalDraft((prev) => ({ ...prev, photo }));
  };

  useEffect(
    () => () => {
      if (serviceModalObjectUrlRef.current) {
        URL.revokeObjectURL(serviceModalObjectUrlRef.current);
      }
    },
    [],
  );

  const openServiceModal = (categoryId?: string) => {
    const preferredId = typeof categoryId === "string" ? categoryId.trim() : "";
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
      note: "",
      photo: null,
      photoUrl: null,
    });
    releaseServiceModalObjectUrl();
    setServiceModalPhotoPreviewUrl(null);
    setServiceModalError("");
    setServiceModalFieldErrors({});
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
      note: service.note ?? "",
      photo: null,
      photoUrl: service.photoUrl ?? null,
    });
    releaseServiceModalObjectUrl();
    setServiceModalPhotoPreviewUrl(service.photoUrl ?? null);
    setServiceModalError("");
    setServiceModalFieldErrors({});
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

  const updateServiceModalField = (
    field: ServicesPricingServiceModalField,
    value: string,
  ) => {
    setServiceModalError("");
    setServiceModalFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setServiceModalDraft((prev) =>
      field === "description"
        ? { ...prev, note: value }
        : { ...prev, [field]: value },
    );
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
    const nextFieldErrors: ServicesPricingServiceModalFieldErrors = {};
    const nextCategoriesError = selectedCategoryIds.length === 0
      ? t(`${TK}.serviceModalCategoryRequired`)
      : "";
    if (!name) {
      nextFieldErrors.name = t(`${TK}.serviceModalNameRequired`);
    }
    if (
      serviceModalDraft.price.trim() === "" ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1_000_000
    ) {
      nextFieldErrors.price = t(`${TK}.serviceModalPriceInvalid`);
    }
    if (!Number.isFinite(duration) || duration <= 0 || duration > 720) {
      nextFieldErrors.duration = t(`${TK}.serviceModalDurationInvalid`);
    }
    setServiceModalError("");
    setServiceModalFieldErrors(nextFieldErrors);
    setServiceModalCategoriesError(nextCategoriesError);
    if (nextCategoriesError || Object.keys(nextFieldErrors).length > 0) {
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
        const existing = servicesRef.current.find(
          (row) => row.id === serviceId,
        );
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
          note: serviceModalDraft.note.trim() || null,
          photoUrl: existing?.photoUrl ?? null,
        };

        if (
          snapshot &&
          snapshot.name === nextRow.name &&
          snapshot.price === nextRow.price &&
          snapshot.duration === nextRow.duration &&
          sameCategoryIds(
            categoryIdsForApi(snapshot.categoryIds),
            categoryIds ?? [],
          ) &&
          (snapshot.note ?? "") === (nextRow.note ?? "") &&
          !serviceModalDraft.photo
        ) {
          clearInlineServiceDraft(serviceId);
          closeServiceModal();
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
          closeServiceModal();
          return;
        }

        await updateServiceMutation.mutateAsync({
          id: serviceId,
          body: {
            ...buildServiceApiPayload(nextRow),
            photo: serviceModalDraft.photo,
          },
        });
        clearInlineServiceDraft(serviceId);
        closeServiceModal();
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
        note: serviceModalDraft.note.trim() || null,
        photo: serviceModalDraft.photo,
        isActive: true,
        categoryIds,
      });
      closeServiceModal();
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

  const clearInlineServiceDraft = (serviceId: string) => {
    setInlineServiceDrafts((prev) => {
      if (!prev[serviceId]) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  };

  const openCategoryModal = () => {
    setCategoryDrafts(
      categories.length
        ? categories.map((category) => ({
          id: category.id,
          draftKey: category.id,
          name: category.name,
          isSystem: category.isSystem,
          isNew: false,
        }))
        : [
          {
            id: OTHER_SERVICES_CATEGORY_ID,
            draftKey: OTHER_SERVICES_CATEGORY_ID,
            name: DEFAULT_SERVICE_CATEGORY,
            isSystem: true,
            isNew: false,
          },
        ],
    );
    setCategoryModalError("");
    setCategoryModalErrorIndex(null);
    setCategoryOrderDirty(false);
    setCategoryModalOpen(true);
  };

  const syncCategoryDraftsFromApi = (nextCategories: SettingsCategory[]) => {
    setCategoryDrafts(
      nextCategories.map((category) => ({
        id: category.id,
        draftKey: category.id,
        name: category.name,
        isSystem: category.isSystem,
        isNew: false,
      })),
    );
  };

  const countServicesForCategory = (draft: CategoryDraft) =>
    services.filter((service) => {
      if (draft.id) return service.categoryIds.includes(draft.id);
      return service.category === draft.name;
    }).length;

  const formatCategoryServiceCount = (count: number) =>
    count === 1
      ? t(`${TK}.categoryServiceCountOne`)
      : t(`${TK}.categoryServiceCount`, { count });

  const saveCategoryModal = async () => {
    const plan = planCategoryDraftChanges(categoryDrafts, categories, {
      nameRequired: t(`${TK}.categoryModalNameRequired`),
      duplicateName: t(`${TK}.categoryModalDuplicate`),
    });

    if (plan.error) {
      setCategoryModalError(plan.error.message);
      setCategoryModalErrorIndex(plan.error.draftIndex);
      return;
    }

    if (
      plan.creates.length === 0 &&
      plan.updates.length === 0 &&
      !categoryOrderDirty
    ) {
      return;
    }

    setIsSavingCategories(true);
    setCategoryModalError("");
    setCategoryModalErrorIndex(null);
    try {
      const batchItems: SaveCategoryBatchItem[] = [
        ...plan.creates.map((category) => ({ name: category.name })),
        ...plan.updates.map((category) => ({
          id: category.id,
          name: category.name,
        })),
      ];
      if (batchItems.length > 0) {
        await saveCategoriesBatchMutation.mutateAsync(batchItems);
      }

      let refreshed = await merchantVoiceRepository.getServiceCategories();
      if (categoryOrderDirty) {
        await reorderCategoriesMutation.mutateAsync(
          buildCategoryOrderItems(categoryDrafts, refreshed),
        );
        refreshed = await merchantVoiceRepository.getServiceCategories();
      }

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
      setCategoryOrderDirty(false);
      setCategoryModalOpen(false);
      showToast(t(`${TK}.saveSuccess`), "success");
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setCategoryModalError(message);
      showToast(message, "error");
    } finally {
      setIsSavingCategories(false);
    }
  };

  const deleteCategoryRow = async (index: number) => {
    const draft = categoryDrafts[index];
    if (!draft || draft.isSystem) return;
    if (draft.isNew) {
      setCategoryDrafts((prev) =>
        prev.filter((_, rowIndex) => rowIndex !== index),
      );
      setCategoryModalError("");
      setCategoryModalErrorIndex(null);
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
          mergedCategories.find(
            (item) => item.id === OTHER_SERVICES_CATEGORY_ID,
          );
        setServices((prev) =>
          prev.map((service) => {
            if (
              !draft.id ||
              !service.categoryIds.includes(draft.id) ||
              !other
            ) {
              return service;
            }
            const categoryIds = normalizeServiceCategoryIds(
              service.categoryIds.filter((id) => id !== draft.id),
              other.id,
            );
            const preferredId = primaryCategoryId(categoryIds, other.id);
            const linked =
              mergedCategories.find((item) => item.id === preferredId) || other;
            return {
              ...service,
              categoryIds,
              categoryId: preferredId,
              category: linked.name,
            };
          }),
        );
      }
      setCategoryDrafts((prev) =>
        prev.filter((category) => category.id !== draft.id),
      );
      setCategoryModalErrorIndex(null);
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
    if (categoryModalErrorIndex === index) {
      setCategoryModalError("");
      setCategoryModalErrorIndex(null);
    }
  };

  const addCategoryDraft = () => {
    setCategoryModalError("");
    setCategoryDrafts((prev) => [
      ...prev,
      {
        id: null,
        draftKey: `new-category-${++categoryDraftIdRef.current}`,
        name: "",
        isSystem: false,
        isNew: true,
      },
    ]);
  };

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
      );
      let placed = false;
      ids.forEach((categoryId) => {
        const target = sectionById.get(categoryId);
        if (!target) return;
        if (!target.services.some((row) => row.id === service.id)) {
          target.services.push(service);
        }
        placed = true;
      });
      if (placed) return;

      const target = otherSection;
      if (target) {
        if (!target.services.some((row) => row.id === service.id)) {
          target.services.push(service);
        }
        return;
      }

      // Synthesize a group when categories have not loaded yet.
      const fallbackId = service.categoryId || OTHER_SERVICES_CATEGORY_ID;
      let fallback = sectionById.get(fallbackId);
      if (!fallback) {
        fallback = {
          id: fallbackId,
          name: service.category || DEFAULT_SERVICE_CATEGORY,
          isSystem: fallbackId === OTHER_SERVICES_CATEGORY_ID,
          services: [],
        };
        sections.push(fallback);
        sectionById.set(fallbackId, fallback);
      }
      if (!fallback.services.some((row) => row.id === service.id)) {
        fallback.services.push(service);
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

  const reorderServicesForCategory = async (
    _categoryId: string,
    orderedCategoryServices: ServiceRow[],
  ) => {
    const previous = servicesRef.current;
    const orderedById = new Map(
      orderedCategoryServices.map((service) => [service.id, service]),
    );
    const orderedIds = new Set(orderedById.keys());
    let orderedIndex = 0;
    const next = previous.map((service) => {
      if (!orderedIds.has(service.id)) return service;
      const replacement = orderedCategoryServices[orderedIndex];
      orderedIndex += 1;
      return replacement ?? service;
    });

    setServices(next);
    servicesRef.current = next;
    try {
      await reorderServicesMutation.mutateAsync(
        buildServiceOrderItems(
          next.filter((service) => isPersistedServiceId(service.id)),
        ),
      );
    } catch (error) {
      setServices(previous);
      servicesRef.current = previous;
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), "error");
    }
  };

  const addNewServiceDraft = (categoryId: string) => {
    newServiceDraftIdRef.current += 1;
    dispatchNewServiceDraft({
      type: "add",
      draft: {
        id: `new-service-${newServiceDraftIdRef.current}`,
        categoryId,
        name: "",
        price: "",
        duration: "",
      },
    });
    setOpenServiceCategoryIds((prev) => new Set(prev).add(categoryId));
  };

  const updateNewServiceDraft = (
    id: string,
    field: "name" | "price" | "duration",
    value: string,
  ) => {
    dispatchNewServiceDraft({ type: "update", id, field, value });
    setNewServiceDraftErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const cancelNewServiceDraft = (id: string) => {
    dispatchNewServiceDraft({ type: "remove", id });
    setNewServiceDraftErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleLanguageSelect = (next: Language) => {
    markConfigDirty();
    const resolved = next;
    setLanguage(resolved);

    // Greeting
    if (selectedGreetingSuggestKey) {
      const template = AI_HUB_SUGGESTIONS.greeting[selectedGreetingSuggestKey];
      const nextText =
        resolved === MerchantVoiceUiLanguage.Vi
          ? template.viText
          : template.enText;
      setGreeting(applySalonNameToTemplate(nextText, salonName));
    } else {
      const translatedKnownGreeting =
        translateKnownGreeting(greeting, resolved) ||
        translateKnownGreeting(loadedGreetingRef.current, resolved);
      if (translatedKnownGreeting) {
        setGreeting(translatedKnownGreeting);
      } else {
        const shouldSyncGreeting = shouldSyncGreetingForLanguageChange(
          greeting,
          loadedGreetingRef.current,
          [
            t(`${TK}.greetingEn`),
            t(`${TK}.greetingVi`),
            t(`${TK}.greetingAuto`),
          ],
        );
        if (shouldSyncGreeting) {
          const translatedGreeting = t(
            `${TK}.${defaultGreetingI18nKey(resolved)}`,
          );
          setGreeting(translatedGreeting);
        }
      }
    }

    // Promo
    if (selectedPromoSuggestKey) {
      const template = AI_HUB_SUGGESTIONS.promo[selectedPromoSuggestKey];
      const nextText =
        resolved === MerchantVoiceUiLanguage.Vi
          ? template.viText
          : template.enText;
      setPromotion(nextText.slice(0, PROMO_MAX_LENGTH));
    }

    // First-call SMS
    if (selectedFirstCallSmsSuggestKey) {
      const template =
        AI_HUB_SUGGESTIONS.firstCallSms[selectedFirstCallSmsSuggestKey];
      const nextText =
        resolved === MerchantVoiceUiLanguage.Vi
          ? template.viText
          : template.enText;
      setPromoSms(
        applySalonNameToTemplate(nextText, salonName).slice(
          0,
          FIRST_CALL_SMS_MAX_LENGTH,
        ),
      );
    }

    setStatus(
      t(`${TK}.languageSelected`, {
        language: t(`${TK}.languageLabels.${resolved}`),
      }),
    );
  };

  const handlePromoChange = (value: string) => {
    setPromotion(value.slice(0, PROMO_MAX_LENGTH));
    setSelectedPromoSuggestKey(null);
  };

  const handlePromoSuggest = (key: PromoSuggestKey) => {
    markConfigDirty();
    const template = AI_HUB_SUGGESTIONS.promo[key];
    if (!template) return;
    const nextText =
      language === MerchantVoiceUiLanguage.Vi
        ? template.viText
        : template.enText;
    setPromotion(nextText.slice(0, PROMO_MAX_LENGTH));
    setSelectedPromoSuggestKey(key);
    setStatus(
      t(`${TK}.promoFilled`, { name: t(`${TK}.${template.labelKey}`) }),
    );
  };

  const handleGreetingSuggest = (key: GreetingSuggestKey) => {
    markConfigDirty();
    const template = AI_HUB_SUGGESTIONS.greeting[key];
    if (!template) return;
    const nextText =
      language === MerchantVoiceUiLanguage.Vi
        ? template.viText
        : template.enText;
    setGreeting(applySalonNameToTemplate(nextText, salonName));
    setSelectedGreetingSuggestKey(key);
    if (formErrors.greeting)
      setFormErrors((prev) => ({ ...prev, greeting: undefined }));
    setStatus(
      t(`${TK}.greetingFilled`, { name: t(`${TK}.${template.labelKey}`) }),
    );
  };

  const handleFirstCallSmsSuggest = (key: FirstCallSmsSuggestKey) => {
    markConfigDirty();
    const template = AI_HUB_SUGGESTIONS.firstCallSms[key];
    if (!template) return;
    setPromoSms(
      applySalonNameToTemplate(
        language === MerchantVoiceUiLanguage.Vi
          ? template.viText
          : template.enText,
        salonName,
      ).slice(0, FIRST_CALL_SMS_MAX_LENGTH),
    );
    setSelectedFirstCallSmsSuggestKey(key);
    setStatus(
      t(`${TK}.firstCallSmsFilled`, { name: t(`${TK}.${template.labelKey}`) }),
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
    if (isSavingSettings || updateConfigMutation.isPending || updateBookingSettingsMutation.isPending) return;
    const saveRevision = editRevisionRef.current;
    const activeLanguage = mapUiLanguageToConfigLanguage(language);
    const expectedVoiceLanguages = voiceLanguageScopeRef.current.languages;
    let submittedVoiceSelections: Array<{ languageCode: string; voiceTtsVoiceId: string }> = [];
    const requiredMessage = t(
      "components.dashboard.views.BookingHubView.team.requiredField",
    );
    const nextNewServiceDraftErrors = validateNewServiceDrafts(
      newServiceDrafts,
      {
        nameRequired: t(`${TK}.serviceModalNameRequired`),
        priceInvalid: t(`${TK}.serviceModalPriceInvalid`),
        durationInvalid: t(`${TK}.serviceModalDurationInvalid`),
      },
    );
    const nextErrors: typeof formErrors = {};
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

    const invalidUrlMsg = t(`${TK}.invalidUrl`);
    const isValidUrl = (v: string) => {
      if (!v.trim()) return true;
      try {
        const u = new URL(v.trim());
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    };
    if (!isValidUrl(googleReviewUrl))
      nextErrors.googleReviewUrl = invalidUrlMsg;
    if (!isValidUrl(yelpReviewUrl)) nextErrors.yelpReviewUrl = invalidUrlMsg;
    if (!isValidUrl(website)) nextErrors.website = invalidUrlMsg;
    if (!isValidUrl(facebookUrl)) nextErrors.facebookUrl = invalidUrlMsg;
    if (!isValidUrl(instagramUrl)) nextErrors.instagramUrl = invalidUrlMsg;

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
          googleReviewUrl: t(`${TK}.googleReviewLink`),
          yelpReviewUrl: t(`${TK}.yelpReviewLink`),
          website: t(`${TK}.website`),
          facebookUrl: t(`${TK}.facebook`),
          instagramUrl: t(`${TK}.instagram`),
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

    // Past this point the save is definitely going through — only now do we surface
    // draft-row errors. Doing this any earlier would flag draft rows even when an
    // unrelated field above blocks the save. Invalid/unfinished rows stay visible with
    // their error instead of being removed — only rows that pass are sent below.
    setNewServiceDraftErrors(nextNewServiceDraftErrors);
    if (Object.keys(nextNewServiceDraftErrors).length > 0) {
      const invalidCategoryIds = new Set(
        newServiceDrafts
          .filter((draft) => nextNewServiceDraftErrors[draft.id])
          .map((draft) => draft.categoryId),
      );
      setOpenServiceCategoryIds(
        (prev) => new Set([...prev, ...invalidCategoryIds]),
      );
    }

    // Existing services edited inline (no longer auto-saved on blur) are validated the
    // same way — dirty rows that pass are saved in "Save settings"; invalid ones are
    // skipped and keep showing their inline error.
    const dirtyInlineServices = services
      .map((service) => ({
        service,
        draft: resolveInlineServiceDraft(service),
      }))
      .filter(({ service, draft }) =>
        isInlineServiceDraftDirty(service, draft),
      );
    const nextInlineServiceErrors: Record<string, string> = {};
    const validDirtyInlineServices: Array<{
      service: ServiceRow;
      draft: InlineServiceDraft;
    }> = [];
    for (const entry of dirtyInlineServices) {
      const name = entry.draft.name.trim();
      const price = Number(entry.draft.price);
      const duration = Number(entry.draft.duration);
      if (!name) {
        nextInlineServiceErrors[entry.service.id] = t(
          `${TK}.serviceModalNameRequired`,
        );
        continue;
      }
      if (
        entry.draft.price.trim() === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        price > 1_000_000
      ) {
        nextInlineServiceErrors[entry.service.id] = t(
          `${TK}.serviceModalPriceInvalid`,
        );
        continue;
      }
      if (
        entry.draft.duration.trim() === "" ||
        !Number.isFinite(duration) ||
        duration <= 0 ||
        duration > 720
      ) {
        nextInlineServiceErrors[entry.service.id] = t(
          `${TK}.serviceModalDurationInvalid`,
        );
        continue;
      }
      validDirtyInlineServices.push(entry);
    }
    setInlineServiceErrors(nextInlineServiceErrors);

    // If ANY service row — new draft or inline-edited — is invalid, no service save API
    // call goes out at all (not even for the rows that do pass). The form just shows the
    // red errors; the user must fix every row before "Save settings" saves any of them.
    const hasInvalidServiceRows =
      Object.keys(nextNewServiceDraftErrors).length > 0 ||
      Object.keys(nextInlineServiceErrors).length > 0;

    const persistedDirtyServices = hasInvalidServiceRows
      ? []
      : validDirtyInlineServices.filter(({ service }) =>
        isPersistedServiceId(service.id),
      );
    const localOnlyDirtyServices = hasInvalidServiceRows
      ? []
      : validDirtyInlineServices.filter(
        ({ service }) => !isPersistedServiceId(service.id),
      );
    const newServiceDraftsToSave = hasInvalidServiceRows
      ? []
      : newServiceDrafts;
    const createdNewServiceDraftIds: string[] = [];
    const updatedServiceIds: string[] = [];
    if (
      newServiceDraftsToSave.length > 0 ||
      persistedDirtyServices.length > 0 ||
      localOnlyDirtyServices.length > 0
    ) {
      setIsSavingService(true);
    }

    setIsSavingSettings(true);
    try {
      const activeDrafts = voiceSelectionsForSave(draftVoiceSelections, activeLanguage, Object.keys(draftVoiceSelections));
      if (voiceEnabled && activeDrafts.length > 0) {
        const refreshed = await voiceOptionsQuery.refetch();
        if (refreshed.error) throw refreshed.error;
        const groups = refreshed.data?.languages || [];
        const prepared = prepareVoiceSelectionsForSave(draftVoiceSelections, activeLanguage, expectedVoiceLanguages, groups);
        submittedVoiceSelections = prepared.selections;
        if (prepared.unavailable) {
          showToast(t(`${TK}.voiceLibrary.draftUnavailable`), "error");
          return;
        }
      }
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
          facebookUrl: facebookUrl.trim() || null,
          instagramUrl: instagramUrl.trim() || null,
          yelpUrl: yelpReviewUrl.trim() || null,
          website: website.trim() || null,
          description: description.trim().slice(0, DESCRIPTION_MAX_LENGTH) || null,
          businessFaq: businessFaq.trim().slice(0, BUSINESS_FAQ_MAX_LENGTH) || null,
          promotion: promotion.trim().slice(0, PROMO_MAX_LENGTH) || null,
          promoSms: promoSms.trim().slice(0, FIRST_CALL_SMS_MAX_LENGTH) || null,
          sendSmsPromoEnabled,
          timeZone: timeZone.trim() || null,
          language: mapUiLanguageToConfigLanguage(language),
          welcomeGreeting: greeting.trim(),
          voiceSelections: submittedVoiceSelections,
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
        }).then(() => {
          setDraftVoiceSelections((current) => Object.fromEntries(Object.entries(current).filter(([code, id]) =>
            !submittedVoiceSelections.some((saved) => saved.languageCode === code && saved.voiceTtsVoiceId === id))));
          if (saveRevision === editRevisionRef.current) configDirtyRef.current = false;
        }),
      ];

      // Review URLs (Google / Yelp / Facebook / Instagram) are already written onto Business
      // by UpdateMerchantVoiceConfig (+ profile sync for GoogleReviewUrl). A second
      // updateReviewLinks call that omitted feedbackEmail was wiping Business.FeedbackEmail
      // on every save — do not re-post review-links from this panel.

      // Booking SMS Notifications live on PosBookingSettings now — saved as a second,
      // independent request alongside the Nexora Voice config above. Non-SMS fields on
      // that resource (auto-confirm, lead time, etc.) aren't shown on this panel, so they
      // round-trip from whatever POS Booking Settings already has loaded.
      if (businessId) {
        savePromises.push(
          updateBookingSettingsMutation.mutateAsync({
            autoConfirmEnabled:
              posBookingSettingsData?.autoConfirmEnabled ?? true,
            minLeadTimeMinutes:
              posBookingSettingsData?.minLeadTimeMinutes ?? 15,
            maxAdvanceDays: posBookingSettingsData?.maxAdvanceDays ?? 7,
            reminderHoursBefore:
              posBookingSettingsData?.reminderHoursBefore ?? 12,
            holidayAutoNotifyEnabled:
              posBookingSettingsData?.holidayAutoNotifyEnabled ?? true,
            ...bookingSmsSettingsPayloadFromEnabled(bookingSmsEnabled),
          }),
        );
      }

      await Promise.all(savePromises);

      // Local-only rows (not yet persisted) never went through the API — just commit
      // their edits to local state, same as the old per-row inline save did.
      for (const { service, draft } of localOnlyDirtyServices) {
        const nextRow: ServiceRow = {
          ...service,
          name: draft.name.trim(),
          price: Number(draft.price),
          duration: clampMerchantVoiceServiceDurationMinutes(
            Number(draft.duration),
          ),
        };
        setServices((prev) =>
          prev.map((row) => (row.id === service.id ? nextRow : row)),
        );
        servicesRef.current = servicesRef.current.map((row) =>
          row.id === service.id ? nextRow : row,
        );
        serviceSnapshotRef.current.set(service.id, { ...nextRow });
        clearInlineServiceDraft(service.id);
      }

      // description/tags/status are intentionally omitted below (not sent as null/[]/"Active")
      // — this endpoint is the shared catalog POS also writes to, and Booking Hub's UI has no
      // fields for them, so explicit blank values would wipe POS-managed data on every save.
      // icon is sent as null only on create (nothing to protect yet); on update it's omitted
      // too — ServiceRow.icon is always backfilled with a display fallback (e.g. "✨"), so
      // sending it back would silently overwrite a real POS-managed icon on every save.
      const createBatchItems: SaveServiceBatchItem[] =
        newServiceDraftsToSave.map((draft) => ({
          name: draft.name.trim(),
          price: Number(draft.price),
          durationMinutes: clampMerchantVoiceServiceDurationMinutes(
            Number(draft.duration),
          ),
          categoryIds: categoryIdsPayloadForApi([draft.categoryId]),
        }));
      const updateBatchItems: SaveServiceBatchItem[] =
        persistedDirtyServices.map(({ service, draft }) => ({
          id: service.id,
          name: draft.name.trim(),
          price: Number(draft.price),
          durationMinutes: clampMerchantVoiceServiceDurationMinutes(
            Number(draft.duration),
          ),
          categoryIds: categoryIdsPayloadForApi(service.categoryIds),
        }));
      const batchItems = [...createBatchItems, ...updateBatchItems];

      if (batchItems.length > 0) {
        await saveServicesBatchMutation.mutateAsync(batchItems);

        for (const draft of newServiceDraftsToSave) {
          createdNewServiceDraftIds.push(draft.id);
          dispatchNewServiceDraft({ type: "remove", id: draft.id });
        }
        for (const { service } of persistedDirtyServices) {
          updatedServiceIds.push(service.id);
        }
      }

      if (
        createdNewServiceDraftIds.length > 0 ||
        updatedServiceIds.length > 0
      ) {
        // Don't reset draft/inline errors to {} here — rows that were skipped for
        // being invalid (not part of the ids above) must keep showing their error.
        await refreshServicesCatalog();
      }

      // Clear updated services' drafts only after fresh server data has replaced the
      // old snapshot — clearing before refetch would flash the pre-edit values for a
      // render (the row falls back to the now-stale `service` while still refetching).
      for (const serviceId of updatedServiceIds) {
        clearInlineServiceDraft(serviceId);
      }

      await queryClient.invalidateQueries({ queryKey: qk.merchantSetup() });

      // Settings above always save when we get here — but a row skipped for failing
      // validation (still shown in red) means the save was only partial. Surface that
      // as a warning instead of a plain "saved" toast, so a skipped row can't look like
      // a successful save.
      const hasSkippedServiceRows =
        Object.keys(nextNewServiceDraftErrors).length > 0 ||
        Object.keys(nextInlineServiceErrors).length > 0;
      const saveResultMessage = hasSkippedServiceRows
        ? t(`${TK}.savePartialSuccess`)
        : t(`${TK}.saveSuccess`);
      setStatus(saveResultMessage);
      setFormErrors({});
      showToast(
        saveResultMessage,
        hasSkippedServiceRows ? "warning" : "success",
      );
    } catch (error) {
      if (submittedVoiceSelections.length > 0) void queryClient.invalidateQueries({ queryKey: qk.merchantVoiceOptionsRoot() });
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      // createdNewServiceDraftIds/updatedServiceIds are only non-empty once the batch
      // call itself has succeeded — a failure after that point (e.g. refreshServicesCatalog
      // throwing) must retry the refresh and must NOT be reported as a save failure.
      if (
        createdNewServiceDraftIds.length > 0 ||
        updatedServiceIds.length > 0
      ) {
        void refreshServicesCatalog().catch(() => undefined);
      }
      if (
        createdNewServiceDraftIds.length === 0 &&
        newServiceDraftsToSave.length > 0
      ) {
        // Merge, don't replace — invalid rows already have their own error showing.
        // Empty `fields` here — this is an API-level rejection, not a single bad input, so
        // every field on the row is marked invalid.
        setNewServiceDraftErrors((prev) => ({
          ...prev,
          ...Object.fromEntries(
            newServiceDraftsToSave.map((draft) => [
              draft.id,
              { fields: [], message },
            ]),
          ),
        }));
      }
      if (updatedServiceIds.length === 0 && persistedDirtyServices.length > 0) {
        setInlineServiceErrors((prev) => ({
          ...prev,
          ...Object.fromEntries(
            persistedDirtyServices.map(({ service }) => [service.id, message]),
          ),
        }));
      }
      setStatus(message);
      showToast(message, "error");
    } finally {
      if (
        newServiceDraftsToSave.length > 0 ||
        persistedDirtyServices.length > 0 ||
        localOnlyDirtyServices.length > 0
      ) {
        setIsSavingService(false);
      }
      setIsSavingSettings(false);
    }
  };

  if (isConfigLoading || isCategoriesLoading || isServicesLoading) {
    return <BookingSettingsSkeleton />;
  }

  return (
    <div className="settings-shell" ref={settingsShellRef} onChangeCapture={(event) => { if (!(event.target as HTMLElement).closest(".voice-library-modal")) markConfigDirty(); }}>
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
            <label
              className="settings-field settings-salon-name-field"
              data-ai-hub-field="salonName"
            >
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
                    markConfigDirty();
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
                  onChange={() => { }}
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
                    markConfigDirty();
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
                  placeholder={t(`${TK}.placeholderStreet`)}
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
            <label
              className="settings-field settings-span-full"
              data-ai-hub-field="website"
            >
              <span className="settings-label">{t(`${TK}.website`)}</span>
              <input
                className="settings-input"
                type="url"
                value={website}
                placeholder={t(`${TK}.placeholderWebsite`)}
                autoComplete="url"
                inputMode="url"
                aria-invalid={Boolean(formErrors.website)}
                onChange={(event) => {
                  setWebsite(event.target.value);
                  if (formErrors.website)
                    setFormErrors((prev) => ({ ...prev, website: undefined }));
                }}
              />
              <span className="settings-field-error-slot">
                {formErrors.website ? (
                  <span className="settings-field-error">
                    {formErrors.website}
                  </span>
                ) : null}
              </span>
            </label>
            <label
              className="settings-field"
              data-ai-hub-field="googleReviewUrl"
            >
              <span className="settings-label">
                {t(`${TK}.googleReviewLink`)}
              </span>
              <input
                className="settings-input"
                type="url"
                value={googleReviewUrl}
                placeholder={t(`${TK}.placeholderGoogleReviewLink`)}
                autoComplete="url"
                inputMode="url"
                aria-invalid={Boolean(formErrors.googleReviewUrl)}
                onChange={(event) => {
                  setGoogleReviewUrl(event.target.value);
                  if (formErrors.googleReviewUrl)
                    setFormErrors((prev) => ({
                      ...prev,
                      googleReviewUrl: undefined,
                    }));
                }}
              />
              <span className="settings-field-error-slot">
                {formErrors.googleReviewUrl ? (
                  <span className="settings-field-error">
                    {formErrors.googleReviewUrl}
                  </span>
                ) : null}
              </span>
            </label>
            <label className="settings-field" data-ai-hub-field="yelpReviewUrl">
              <span className="settings-label">
                {t(`${TK}.yelpReviewLink`)}
              </span>
              <input
                className="settings-input"
                type="url"
                value={yelpReviewUrl}
                placeholder={t(`${TK}.placeholderYelp`)}
                autoComplete="url"
                inputMode="url"
                aria-invalid={Boolean(formErrors.yelpReviewUrl)}
                onChange={(event) => {
                  setYelpReviewUrl(event.target.value);
                  if (formErrors.yelpReviewUrl)
                    setFormErrors((prev) => ({
                      ...prev,
                      yelpReviewUrl: undefined,
                    }));
                }}
              />
              <span className="settings-field-error-slot">
                {formErrors.yelpReviewUrl ? (
                  <span className="settings-field-error">
                    {formErrors.yelpReviewUrl}
                  </span>
                ) : null}
              </span>
            </label>
            <div className="settings-social-links">
              <div className="settings-social-links-title">
                {t(`${TK}.socialLinksTitle`)}
              </div>
              <div className="settings-social-grid">
                <label
                  className="settings-field"
                  data-ai-hub-field="facebookUrl"
                >
                  <span className="settings-label">{t(`${TK}.facebook`)}</span>
                  <input
                    className="settings-input"
                    type="url"
                    value={facebookUrl}
                    placeholder={t(`${TK}.placeholderFacebook`)}
                    autoComplete="url"
                    inputMode="url"
                    aria-invalid={Boolean(formErrors.facebookUrl)}
                    onChange={(event) => {
                      setFacebookUrl(event.target.value);
                      if (formErrors.facebookUrl)
                        setFormErrors((prev) => ({
                          ...prev,
                          facebookUrl: undefined,
                        }));
                    }}
                  />
                  <span className="settings-field-error-slot">
                    {formErrors.facebookUrl ? (
                      <span className="settings-field-error">
                        {formErrors.facebookUrl}
                      </span>
                    ) : null}
                  </span>
                </label>
                <label
                  className="settings-field"
                  data-ai-hub-field="instagramUrl"
                >
                  <span className="settings-label">{t(`${TK}.instagram`)}</span>
                  <input
                    className="settings-input"
                    type="url"
                    value={instagramUrl}
                    placeholder={t(`${TK}.placeholderInstagram`)}
                    autoComplete="url"
                    inputMode="url"
                    aria-invalid={Boolean(formErrors.instagramUrl)}
                    onChange={(event) => {
                      setInstagramUrl(event.target.value);
                      if (formErrors.instagramUrl)
                        setFormErrors((prev) => ({
                          ...prev,
                          instagramUrl: undefined,
                        }));
                    }}
                  />
                  <span className="settings-field-error-slot">
                    {formErrors.instagramUrl ? (
                      <span className="settings-field-error">
                        {formErrors.instagramUrl}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>
            </div>
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
                        lang={TWELVE_HOUR_INPUT_LANG}
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
                        lang={TWELVE_HOUR_INPUT_LANG}
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
                    setStatus(t(`${TK}.timeZoneManualSet`, { timeZone: next }));
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

        <div className="settings-holiday-stack">
          <HolidayClosuresCard />

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
            {voiceEnabled && (
              <div className="settings-field settings-span-full">
                <span className="settings-label">{t(`${TK}.voiceFieldLabel`)}</span>
                <VoiceSelectionCard key={language} language={mapUiLanguageToConfigLanguage(language)}
                  drafts={draftVoiceSelections} disabled={isSavingSettings || updateConfigMutation.isPending}
                  onOpen={() => { stopBookingPreview(); setIsPreviewPlaying(false); }}
                  onConfirm={(code, id) => {
                    markConfigDirty();
                    voiceLanguageScopeRef.current.languages = [...new Set([...(voiceLanguageScopeRef.current.languages || []), code])];
                    setDraftVoiceSelections((current) => {
                      const next = { ...current };
                      if (configData?.voiceSelections?.some((saved) => saved.languageCode === code && saved.voiceTtsVoiceId === id)) delete next[code];
                      else next[code] = id;
                      return next;
                    });
                  }} />
                <div className="settings-language-status">{t(`${TK}.voiceFieldHint`)}</div>
              </div>
            )}
            <label
              className="settings-field settings-span-full"
              data-ai-hub-field="greeting"
            >
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
                  setSelectedGreetingSuggestKey(null);
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
              <div className="settings-promo-suggest-row">
                <SettingsSuggestLabel />
                <button
                  className={`settings-promo-suggest${selectedGreetingSuggestKey === "warm-welcome"
                      ? " is-active"
                      : ""
                    }`}
                  type="button"
                  onClick={() => handleGreetingSuggest("warm-welcome")}
                >
                  {t(`${TK}.greetingSuggestWarm`)}
                </button>
                <button
                  className={`settings-promo-suggest${selectedGreetingSuggestKey === "quick-booking"
                      ? " is-active"
                      : ""
                    }`}
                  type="button"
                  onClick={() => handleGreetingSuggest("quick-booking")}
                >
                  {t(`${TK}.greetingSuggestQuick`)}
                </button>
                <button
                  className={`settings-promo-suggest${selectedGreetingSuggestKey === "bilingual"
                      ? " is-active"
                      : ""
                    }`}
                  type="button"
                  onClick={() => handleGreetingSuggest("bilingual")}
                >
                  {t(`${TK}.greetingSuggestBilingual`)}
                </button>
              </div>
            </label>

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
                <div
                  id="settings-promo-count"
                  className={`settings-promo-count ${promotion.length >= PROMO_MAX_LENGTH ? "is-max" : ""}`}
                >
                  <span>{promotion.length}</span>/{PROMO_MAX_LENGTH}
                </div>
                <div className="settings-promo-suggest-row">
                  <SettingsSuggestLabel />
                  <button
                    className={`settings-promo-suggest${selectedPromoSuggestKey === "reward-yourself"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() => handlePromoSuggest("reward-yourself")}
                  >
                    {t(`${TK}.promoSuggestReward`)}
                  </button>
                  <button
                    className={`settings-promo-suggest${selectedPromoSuggestKey === "first-visit"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() => handlePromoSuggest("first-visit")}
                  >
                    {t(`${TK}.promoSuggestFirstVisit`)}
                  </button>
                  <button
                    className={`settings-promo-suggest${selectedPromoSuggestKey === "refer-a-friend"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() => handlePromoSuggest("refer-a-friend")}
                  >
                    {t(`${TK}.promoSuggestRefer`)}
                  </button>
                </div>
              </div>
            </label>

            <label className="settings-field settings-span-full">
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.businessDescriptionLabel`)}
                <SettingsInfoTooltip
                  id="business-description-help"
                  ariaLabel={t(`${TK}.businessDescriptionInfoAria`)}
                >
                  {t(`${TK}.businessDescriptionHelp`)}
                </SettingsInfoTooltip>
              </span>
              <textarea
                className="settings-textarea settings-textarea-promo"
                value={description}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder={t(`${TK}.businessDescriptionPlaceholder`)}
                aria-describedby="settings-business-description-count"
                onChange={(event) =>
                  setDescription(
                    event.target.value.slice(0, DESCRIPTION_MAX_LENGTH),
                  )
                }
              />
              <div className="settings-promo-meta">
                <div
                  id="settings-business-description-count"
                  className={`settings-promo-count ${description.length >= DESCRIPTION_MAX_LENGTH ? "is-max" : ""}`}
                >
                  <span>{description.length}</span>/{DESCRIPTION_MAX_LENGTH}
                </div>
              </div>
            </label>

            <label className="settings-field settings-span-full">
              <span className="settings-label settings-label-with-tooltip">
                {t(`${TK}.businessFaqLabel`)}
                <SettingsInfoTooltip
                  id="business-faq-help"
                  ariaLabel={t(`${TK}.businessFaqInfoAria`)}
                >
                  {t(`${TK}.businessFaqHelp`)}
                </SettingsInfoTooltip>
              </span>
              <textarea
                className="settings-textarea settings-textarea-promo"
                value={businessFaq}
                maxLength={BUSINESS_FAQ_MAX_LENGTH}
                placeholder={t(`${TK}.businessFaqPlaceholder`)}
                aria-describedby="settings-business-faq-count"
                onChange={(event) =>
                  setBusinessFaq(
                    event.target.value.slice(0, BUSINESS_FAQ_MAX_LENGTH),
                  )
                }
              />
              <div className="settings-promo-meta">
                <div
                  id="settings-business-faq-count"
                  className={`settings-promo-count ${businessFaq.length >= BUSINESS_FAQ_MAX_LENGTH ? "is-max" : ""}`}
                >
                  <span>{businessFaq.length}</span>/{BUSINESS_FAQ_MAX_LENGTH}
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
                      markConfigDirty();
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
                  onChange={(event) => {
                    setSelectedFirstCallSmsSuggestKey(null);
                    setPromoSms(
                      event.target.value.slice(0, FIRST_CALL_SMS_MAX_LENGTH),
                    );
                  }}
                />
                <div className="settings-promo-suggest-row">
                  <SettingsSuggestLabel />
                  <button
                    className={`settings-promo-suggest${selectedFirstCallSmsSuggestKey === "thanks-booking"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() => handleFirstCallSmsSuggest("thanks-booking")}
                  >
                    {t(`${TK}.firstCallSmsSuggestThanks`)}
                  </button>
                  <button
                    className={`settings-promo-suggest${selectedFirstCallSmsSuggestKey === "first-time-welcome"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() =>
                      handleFirstCallSmsSuggest("first-time-welcome")
                    }
                  >
                    {t(`${TK}.firstCallSmsSuggestWelcome`)}
                  </button>
                  <button
                    className={`settings-promo-suggest${selectedFirstCallSmsSuggestKey === "promo-teaser"
                        ? " is-active"
                        : ""
                      }`}
                    type="button"
                    onClick={() => handleFirstCallSmsSuggest("promo-teaser")}
                  >
                    {t(`${TK}.firstCallSmsSuggestPromo`)}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            className={`booking-secondary-button settings-preview-button ${isPreviewPlaying ? "is-playing" : ""}`}
            type="button"
            aria-pressed={isPreviewPlaying}
            onClick={handlePreview}
          >
            {isPreviewPlaying
              ? t(`${TK}.previewVoiceStop`)
              : t(`${TK}.voiceLibrary.devicePreview`)}
          </button>
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
          <ServicesPricingPanel
            sections={catalogSections}
            adapter={{
              getId: (section) => section.id,
              getName: (section) => section.name,
              getCount: (section) => section.services.length,
            }}
            controller={{
              isOpen: (sectionId) => openServiceCategoryIds.has(sectionId),
              onToggleSection: toggleServiceCategory,
              onAddService: (sectionId) => {
                if (sectionId) addNewServiceDraft(sectionId);
                else openServiceModal();
              },
              onManageCategories: openCategoryModal,
              isBusy: isSavingService,
            }}
            labels={{
              manageCategories: t(`${TK}.manageCategories`),
              addService: t(`${TK}.addService`),
              empty: t(`${TK}.servicesEmpty`),
              emptyAction: t(`${TK}.servicesEmptyCta`),
              formatCount: formatCategoryServiceCount,
            }}
            renderSection={(section) => {
              const categoryServices = section.services;
              const categoryNewServiceDrafts = newServiceDrafts.filter(
                (draft) => draft.categoryId === section.id,
              );
              return (
                <ServicesPricingServiceSection
                  items={categoryServices}
                  getId={(service) => service.id}
                  onReorder={(orderedServices) =>
                    reorderServicesForCategory(section.id, orderedServices)
                  }
                  dragHandleLabel={t(`${TK}.serviceDragHandle`)}
                  disabled={isSavingService || reorderServicesMutation.isPending}
                  labels={{
                    service: t(`${TK}.serviceColumn`),
                    price: t(`${TK}.priceColumn`),
                    duration: t(`${TK}.durationColumn`),
                    empty: t(`${TK}.categoryEmpty`),
                  }}
                  renderItem={(service, dragHandle) => {
                    const draft =
                      inlineServiceDrafts[service.id] ??
                      buildInlineServiceDraft(service);
                    return (
                      <ServicesPricingServiceRow
                        item={service}
                        dragHandle={dragHandle}
                        adapter={{
                          getId: (item) => item.id,
                          getName: () => draft.name,
                          getPrice: () => draft.price,
                          getDuration: () => draft.duration,
                          getPhotoUrl: (item) => item.photoUrl,
                          getTone: (item) => item.tone,
                        }}
                        controller={{
                          onChange: (item, field, value) =>
                            updateInlineServiceDraft(item, field, value),
                          onEdit: openEditServiceModal,
                          onRemove: (item) => removeService(item.id, section.id),
                          isDirty: () =>
                            isInlineServiceDraftDirty(service, draft),
                          isPending: (item) =>
                            pendingServiceActionId === item.id || isSavingService,
                        }}
                        labels={{
                          name: t(`${TK}.serviceNameAria`),
                          namePlaceholder: t(`${TK}.placeholderServiceName`),
                          price: t(`${TK}.servicePriceAria`),
                          pricePlaceholder: t(`${TK}.placeholderServicePrice`),
                          duration: t(`${TK}.serviceDurationAria`),
                          durationPlaceholder: t(`${TK}.placeholderServiceDuration`),
                          durationUnit: t(`${TK}.durationUnit`),
                          edit: t(`${TK}.serviceEditAria`),
                          remove: t(`${TK}.removeService`),
                          save: t(`${TK}.saveButton`),
                        }}
                        error={inlineServiceErrors[service.id]}
                        highlighted={highlightServiceId === service.id}
                        visualFallbackText="✨"
                      />
                    );
                  }}
                  extensionRows={
                    categoryNewServiceDrafts.length > 0
                      ? categoryNewServiceDrafts.map((draft) => {
                        const draftError = newServiceDraftErrors[draft.id];
                        const invalidFields: ServicesPricingServiceField[] =
                          draftError?.fields.length
                            ? draftError.fields
                            : draftError
                              ? ["name", "price", "duration"]
                              : [];
                        return (
                          <ServicesPricingServiceRow
                            key={draft.id}
                            item={draft}
                            dragHandle={<span aria-hidden="true" />}
                            adapter={{
                              getId: (item) => item.id,
                              getName: (item) => item.name,
                              getPrice: (item) => item.price,
                              getDuration: (item) => item.duration,
                              getPhotoUrl: () => null,
                              getTone: () => "tone-violet",
                            }}
                            controller={{
                              onChange: (item, field, value) =>
                                updateNewServiceDraft(item.id, field, value),
                              onRemove: (item) => cancelNewServiceDraft(item.id),
                              isDirty: () => true,
                              isPending: () => isSavingService,
                            }}
                            labels={{
                              name: t(`${TK}.serviceNameAria`),
                              namePlaceholder: t(`${TK}.placeholderServiceName`),
                              price: t(`${TK}.servicePriceAria`),
                              pricePlaceholder: t(`${TK}.placeholderServicePrice`),
                              duration: t(`${TK}.serviceDurationAria`),
                              durationPlaceholder: t(`${TK}.placeholderServiceDuration`),
                              durationUnit: t(`${TK}.durationUnit`),
                              edit: t(`${TK}.serviceEditAria`),
                              remove: t(`${TK}.serviceModalCancel`),
                              save: t(`${TK}.saveButton`),
                            }}
                            error={draftError?.message}
                            invalidFields={invalidFields}
                            isNew
                            autoFocusName
                          />
                        );
                      })
                      : undefined
                  }
                />
              );
            }}
          />
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
            isSavingSettings ||
            isSavingService
          }
          onClick={handleSave}
        >
          {updateConfigMutation.isPending || isSavingService ? (
            <SpinnerIcon className="booking-inline-spinner" />
          ) : null}
          {t(`${TK}.saveButton`)}
        </button>
      </div>

      <ServicesPricingServiceModal
        open={serviceModalOpen}
        mode={serviceModalDraft.mode}
        value={{
          name: serviceModalDraft.name,
          price: serviceModalDraft.price,
          duration: serviceModalDraft.duration,
          description: serviceModalDraft.note,
          categoryIds: serviceModalDraft.categoryIds,
          photoPreviewUrl: serviceModalPhotoPreviewUrl,
        }}
        categories={serviceModalCategoryOptions
          .filter((category) => !isOtherServicesCategory(category))
          .map((category) => ({
            id: category.id,
            name: category.name,
            checked: serviceModalDraft.categoryIds.includes(category.id),
          }))}
        controller={{
          onClose: closeServiceModal,
          onFieldChange: updateServiceModalField,
          onToggleCategory: toggleServiceModalCategory,
          onPhotoChange: selectServiceModalPhoto,
          onSubmit: saveServiceModal,
        }}
        labels={{
          title: t(
            `${TK}.${serviceModalDraft.mode === "edit"
              ? "serviceModalEditTitle"
              : "serviceModalTitle"
            }`,
          ),
          subtitle: t(
            `${TK}.${serviceModalDraft.mode === "edit"
              ? "serviceModalEditSub"
              : "serviceModalSub"
            }`,
          ),
          categories: t(`${TK}.serviceModalCategories`),
          categoriesEmpty: t(`${TK}.serviceModalCategoriesEmpty`),
          categoriesHelp: t(`${TK}.serviceModalCategoriesHelp`),
          name: t(`${TK}.serviceModalName`),
          namePlaceholder: t(`${TK}.placeholderServiceName`),
          price: t(`${TK}.serviceModalPrice`),
          pricePlaceholder: t(`${TK}.placeholderServicePrice`),
          duration: t(`${TK}.serviceModalDuration`),
          durationPlaceholder: t(`${TK}.placeholderServiceDuration`),
          durationUnit: t(`${TK}.durationUnit`),
          description: t(`${TK}.serviceModalDescription`),
          descriptionPlaceholder: t(`${TK}.serviceModalDescriptionPlaceholder`),
          image: t(`${TK}.serviceModalImage`),
          chooseImage: t(`${TK}.serviceModalChoosePhoto`),
          takePhoto: t(`${TK}.serviceModalTakePhoto`),
          imageHelp: t(`${TK}.serviceModalImageHelp`),
          imageFormats: t(`${TK}.serviceModalImageFormats`),
          imageSizeHint: t(`${TK}.serviceModalImageSizeHint`),
          cameraTitle: t(`${TK}.serviceModalCameraTitle`),
          cameraHint: t(`${TK}.serviceModalCameraHint`),
          photoUploadAria: t(`${TK}.serviceModalPhotoUploadAria`),
          required: t(`${TK}.serviceModalRequired`),
          optional: t(`${TK}.serviceModalOptional`),
          close: t(`${TK}.serviceModalCloseAria`),
          cancel: t(`${TK}.serviceModalCancel`),
          submit: t(
            `${TK}.${serviceModalDraft.mode === "edit"
              ? "serviceModalUpdate"
              : "serviceModalSave"
            }`,
          ),
        }}
        error={serviceModalError}
        fieldErrors={serviceModalFieldErrors}
        categoriesError={serviceModalCategoriesError}
        isSubmitting={isSavingService}
      />

      <ServicesPricingCategoryManager
        open={categoryModalOpen}
        categories={categoryDrafts}
        adapter={{
          getKey: (draft) => draft.draftKey,
          getId: (draft) => draft.id,
          getName: (draft) => draft.name,
          getCount: countServicesForCategory,
          isSystem: (draft) => draft.isSystem,
          isNew: (draft) => Boolean(draft.isNew),
        }}
        controller={{
          onClose: () => setCategoryModalOpen(false),
          onAdd: addCategoryDraft,
          onNameChange: updateCategoryDraft,
          onDelete: deleteCategoryRow,
          onSave: saveCategoryModal,
          onReorder: (nextCategories) => {
            setCategoryDrafts(nextCategories)
            setCategoryOrderDirty(true)
          },
          isBusy: isSavingCategories || reorderCategoriesMutation.isPending,
        }}
        labels={{
          title: t(`${TK}.categoryModalTitle`),
          subtitle: t(`${TK}.categoryModalSub`),
          categories: t(`${TK}.categoryModalCategories`),
          categoriesSubtitle: t(`${TK}.categoryModalCategoriesSub`),
          addCategory: t(`${TK}.categoryModalAdd`),
          close: t(`${TK}.categoryModalCloseAria`),
          cancel: t(`${TK}.categoryCancelAria`),
          save: t(`${TK}.categoryModalSave`),
          empty: t(`${TK}.categoryModalEmpty`),
          namePlaceholder: t(`${TK}.categoryNamePlaceholder`),
          nameAriaLabel: t(`${TK}.categoryModalCategories`),
          deleteAriaLabel: t(`${TK}.categoryModalRemoveAria`),
          dragHandle: t(`${TK}.dragHandle`),
          formatCount: formatCategoryServiceCount,
        }}
        error={categoryModalError}
        errorIndex={categoryModalErrorIndex}
      />
    </div>
  );
}
