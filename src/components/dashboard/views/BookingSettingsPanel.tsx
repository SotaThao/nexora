import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import {
  useMerchantVoiceConfig,
  useUpdateMerchantVoiceConfig,
} from "../../../data/hooks/useMerchantVoiceBookings";
import {
  clampMerchantVoiceServiceDurationMinutes,
  isValidMerchantVoiceServiceDuration,
  mapConfigLanguageToUiLanguage,
  mapUiLanguageToConfigLanguage,
  MerchantVoiceDayOfWeek,
  MerchantVoiceServiceField,
  MerchantVoiceUiLanguage,
  normalizeMerchantVoiceDayOfWeek,
} from "../../../data/repositories/merchantVoice";
import { getApiErrorCode } from "../../../types/domain";
import {
  loadSpeechVoices,
  speakBookingPreview,
  stopBookingPreview,
} from "../../../utils/bookingVoicePreview";
import {
  formatWholeNumberInputValue,
  parseWholeNumberInput,
} from "../../../utils/numericInput";
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneForApi,
  parsePhone,
} from "../../CountryCodeSelect";
import {
  ClockHistoryIcon,
  CurrencyDollarIcon,
  FolderTreeIcon,
  InfoCircleIcon,
  PeopleTabIcon,
  PlusIcon,
  PlusLgIcon,
  ShopIcon,
  SpinnerIcon,
  StarsIcon,
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

interface ServiceRow {
  id: string
  icon: string
  tone: Tone
  name: string
  price: number
  duration: number
  /** Persisted via config service `note` (HTML category accordion). */
  category: string
}

const DEFAULT_SERVICE_CATEGORY = "Other services"

const SETTINGS_COUNTRY_OPTIONS = [
  { value: "US", labelKey: "countryUS" },
  { value: "CA", labelKey: "countryCA" },
  { value: "MX", labelKey: "countryMX" },
  { value: "VN", labelKey: "countryVN" },
] as const

type SettingsCountryCode = (typeof SETTINGS_COUNTRY_OPTIONS)[number]["value"]

type LocationParts = {
  street: string
  city: string
  state: string
  zip: string
  country: SettingsCountryCode
}

const EMPTY_LOCATION: LocationParts = {
  street: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
}

function normalizeSettingsCountry(value: string): SettingsCountryCode {
  const raw = value.trim().toUpperCase()
  if (raw === "CA" || raw === "CANADA") return "CA"
  if (raw === "MX" || raw === "MEXICO") return "MX"
  if (raw === "VN" || raw === "VIETNAM" || raw === "VIỆT NAM") return "VN"
  if (raw === "US" || raw === "USA" || raw === "UNITED STATES") return "US"
  return "US"
}

/** Join structured location fields into the single API `address` string. */
function joinSettingsAddress(parts: LocationParts) {
  const street = parts.street.trim()
  const city = parts.city.trim()
  const stateZip = [parts.state.trim(), parts.zip.trim()].filter(Boolean).join(" ")
  const cityStateZip = [city, stateZip].filter(Boolean).join(", ")
  const country = parts.country.trim()
  return [street, cityStateZip, country].filter(Boolean).join(", ")
}

/** Best-effort split of a stored address into HTML location fields. */
function splitSettingsAddress(raw: string): LocationParts {
  const text = String(raw || "").trim()
  if (!text) return { ...EMPTY_LOCATION }
  const chunks = text.split(",").map((part) => part.trim()).filter(Boolean)
  if (chunks.length >= 4) {
    const country = normalizeSettingsCountry(chunks[chunks.length - 1])
    const stateZip = chunks[chunks.length - 2]
    const city = chunks[chunks.length - 3]
    const street = chunks.slice(0, -3).join(", ")
    const [state, ...zipParts] = stateZip.split(/\s+/).filter(Boolean)
    return {
      street,
      city,
      state: state || "",
      zip: zipParts.join(" "),
      country,
    }
  }
  if (chunks.length === 3) {
    const stateZip = chunks[2]
    const [state, ...zipParts] = stateZip.split(/\s+/).filter(Boolean)
    return {
      street: chunks[0],
      city: chunks[1],
      state: state || "",
      zip: zipParts.join(" "),
      country: "US",
    }
  }
  return { ...EMPTY_LOCATION, street: text }
}

const SETTINGS_TIMEZONE_OPTIONS = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Mexico_City",
  "America/Tijuana",
  "Asia/Ho_Chi_Minh",
] as const

type SettingsTimeZone = (typeof SETTINGS_TIMEZONE_OPTIONS)[number]

const DEFAULT_SETTINGS_TIMEZONE: SettingsTimeZone = "America/Chicago"

const US_STATE_TIMEZONES: Array<{ timeZone: SettingsTimeZone; states: string[] }> = [
  {
    timeZone: "America/Los_Angeles",
    states: ["CA", "CALIFORNIA", "NV", "NEVADA", "OR", "OREGON", "WA", "WASHINGTON"],
  },
  {
    timeZone: "America/Denver",
    states: [
      "AZ", "ARIZONA", "CO", "COLORADO", "ID", "IDAHO", "MT", "MONTANA",
      "NM", "NEW MEXICO", "UT", "UTAH", "WY", "WYOMING",
    ],
  },
  {
    timeZone: "America/New_York",
    states: [
      "CT", "CONNECTICUT", "DE", "DELAWARE", "FL", "FLORIDA", "GA", "GEORGIA",
      "ME", "MAINE", "MD", "MARYLAND", "MA", "MASSACHUSETTS", "NH", "NEW HAMPSHIRE",
      "NJ", "NEW JERSEY", "NY", "NEW YORK", "NC", "NORTH CAROLINA", "OH", "OHIO",
      "PA", "PENNSYLVANIA", "RI", "RHODE ISLAND", "SC", "SOUTH CAROLINA",
      "VT", "VERMONT", "VA", "VIRGINIA", "WV", "WEST VIRGINIA",
    ],
  },
  {
    timeZone: "America/Chicago",
    states: [
      "AL", "ALABAMA", "AR", "ARKANSAS", "IA", "IOWA", "IL", "ILLINOIS",
      "KS", "KANSAS", "KY", "KENTUCKY", "LA", "LOUISIANA", "MN", "MINNESOTA",
      "MS", "MISSISSIPPI", "MO", "MISSOURI", "NE", "NEBRASKA", "ND", "NORTH DAKOTA",
      "OK", "OKLAHOMA", "SD", "SOUTH DAKOTA", "TN", "TENNESSEE", "TX", "TEXAS",
      "WI", "WISCONSIN",
    ],
  },
]

function isSettingsTimeZone(value: string): value is SettingsTimeZone {
  return (SETTINGS_TIMEZONE_OPTIONS as readonly string[]).includes(value)
}

/** Mirror HTML `detectSettingsTimeZone` from salon location fields. */
function detectSettingsTimeZone(parts: LocationParts): SettingsTimeZone {
  const country = parts.country.trim().toUpperCase()
  const state = parts.state.trim().toUpperCase()
  const city = parts.city.trim().toUpperCase()

  if (country === "VN") return "Asia/Ho_Chi_Minh"

  if (country === "CA") {
    if (/^(BC|BRITISH COLUMBIA)$/.test(state)) return "America/Vancouver"
    if (/^(AB|ALBERTA|SK|SASKATCHEWAN)$/.test(state)) return "America/Edmonton"
    if (/^(MB|MANITOBA)$/.test(state)) return "America/Winnipeg"
    return "America/Toronto"
  }

  if (country === "MX") {
    if (/TIJUANA|BAJA CALIFORNIA/.test(`${city} ${state}`)) return "America/Tijuana"
    return "America/Mexico_City"
  }

  for (const entry of US_STATE_TIMEZONES) {
    if (entry.states.includes(state)) return entry.timeZone
  }

  return DEFAULT_SETTINGS_TIMEZONE
}

const SERVICE_SUGGESTIONS = [
  { id: "gel-x-extension", name: "Gel-X Extension", price: 55, duration: 90 },
  { id: "polish-change", name: "Polish Change", price: 15, duration: 20 },
  { id: "french-tips", name: "French Tips", price: 10, duration: 15 },
  { id: "chrome-mirror", name: "Chrome / Mirror", price: 15, duration: 20 },
  { id: "cat-eye-gel", name: "Cat Eye Gel", price: 50, duration: 75 },
  { id: "soak-off-removal", name: "Soak-Off Removal", price: 10, duration: 20 },
  { id: "eyebrow-wax", name: "Eyebrow Wax", price: 12, duration: 15 },
  { id: "lash-fill", name: "Lash Fill", price: 45, duration: 60 },
] as const

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
    duration: 60,
  },
  {
    id: "classic-manicure",
    icon: "🖐️",
    tone: "tone-cyan",
    name: "Classic Manicure",
    price: 22,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 45,
  },
  {
    id: "full-set-acrylic",
    icon: "💎",
    tone: "tone-rose",
    name: "Full Set Acrylic",
    price: 45,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 90,
  },
  {
    id: "dip-powder",
    icon: "✨",
    tone: "tone-sky",
    name: "Dip Powder",
    price: 40,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 75,
  },
  {
    id: "fill-in",
    icon: "🔁",
    tone: "tone-amber",
    name: "Fill-In",
    price: 32,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 60,
  },
  {
    id: "classic-pedicure",
    icon: "🦶",
    tone: "tone-emerald",
    name: "Classic Pedicure",
    price: 30,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 50,
  },
  {
    id: "deluxe-pedicure",
    icon: "👑",
    tone: "tone-violet",
    name: "Deluxe Pedicure",
    price: 50,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 70,
  },
  {
    id: "pedicure-gel-combo",
    icon: "🧴",
    tone: "tone-cyan",
    name: "Pedicure + Gel Combo",
    price: 65,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 105,
  },
  {
    id: "kid-mani-pedi",
    icon: "🧸",
    tone: "tone-amber",
    name: "Kid Mani-Pedi",
    price: 25,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 40,
  },
  {
    id: "nail-art",
    icon: "🎨",
    tone: "tone-rose",
    name: "Nail Art (per nail)",
    price: 5,
    category: DEFAULT_SERVICE_CATEGORY,
    duration: 10,
  },
];

const AI_LANGUAGE_OPTIONS = [
  MerchantVoiceUiLanguage.Auto,
  MerchantVoiceUiLanguage.Vi,
  MerchantVoiceUiLanguage.En,
] as const;

const PROMO_MAX_LENGTH = 1000;
const FIRST_CALL_SMS_MAX_LENGTH = 320;

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
  children,
}: {
  cardId: string;
  collapsed: boolean;
  onToggle: (id: string) => void;
  title: React.ReactNode;
  subtitle: string;
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
      className={`settings-card ${collapsed ? "is-collapsed" : ""}`}
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
  const { showToast } = useNotification();
  const voiceEnabled = useBookingHubVoiceEnabled();
  const { data: configData, isLoading: isConfigLoading } =
    useMerchantVoiceConfig({ enabled: voiceEnabled });
  const updateConfigMutation = useUpdateMerchantVoiceConfig();
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [hours, setHours] = useState(INITIAL_HOURS);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [categories, setCategories] = useState<string[]>(() => {
    const names = Array.from(
      new Set(INITIAL_SERVICES.map((service) => service.category).filter(Boolean)),
    );
    return names.length > 0 ? names : [DEFAULT_SERVICE_CATEGORY];
  });
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<string[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [serviceModalDraft, setServiceModalDraft] = useState({
    category: DEFAULT_SERVICE_CATEGORY,
    name: "",
    price: "",
    duration: "",
  });
  const [serviceModalError, setServiceModalError] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<string[]>([]);
  const [categoryModalError, setCategoryModalError] = useState("");
  const [highlightServiceId, setHighlightServiceId] = useState<string | null>(
    null,
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
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [timeZone, setTimeZone] = useState<string>(DEFAULT_SETTINGS_TIMEZONE);
  const [timeZoneManual, setTimeZoneManual] = useState(false);
  const timeZoneManualRef = useRef(false);
  const [promoSms, setPromoSms] = useState("");
  const [sendSmsPromoEnabled, setSendSmsPromoEnabled] = useState(true);
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
  const [invalidDurationServiceIds, setInvalidDurationServiceIds] = useState<
    string[]
  >([]);
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

  const isCollapsed = (cardId: string) => collapsedCards[cardId] === true;
  const salonPhoneParsed = useMemo(() => parsePhone(salonPhone), [salonPhone]);
  const aiPhoneParsed = useMemo(() => parsePhone(aiPhone), [aiPhone]);
  const bookingNotifyPhoneParsed = useMemo(
    () => parsePhone(bookingNotifyPhone),
    [bookingNotifyPhone],
  );

  timeZoneManualRef.current = timeZoneManual;

  const patchLocation = (partial: Partial<LocationParts>) => {
    setLocation((prev) => {
      const next = { ...prev, ...partial };
      if (!timeZoneManualRef.current) {
        setTimeZone(detectSettingsTimeZone(next));
      }
      return next;
    });
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
    const locationParts = splitSettingsAddress(configData.address || "");
    setLocation(locationParts);
    const loadedTimeZone = String(configData.timeZone || "").trim();
    if (loadedTimeZone && isSettingsTimeZone(loadedTimeZone)) {
      setTimeZone(loadedTimeZone);
    } else {
      setTimeZone(detectSettingsTimeZone(locationParts));
    }
    setTimeZoneManual(false);
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

    const nextServices = (configData.services || []).map((service, index) => ({
      id: service.id || `service-${index}`,
      icon: service.icon || "✨",
      tone:
        INITIAL_SERVICES[index % INITIAL_SERVICES.length]?.tone ||
        "tone-violet",
      name: service.name || "",
      price: Number(service.price ?? 0),
      duration: clampMerchantVoiceServiceDurationMinutes(
        Number(service.durationMinutes ?? 0),
      ),
      category: (service.note || "").trim() || DEFAULT_SERVICE_CATEGORY,
    }));
    setServices(nextServices);
    const categoryNames = Array.from(
      new Set(nextServices.map((service) => service.category).filter(Boolean)),
    );
    setCategories(
      categoryNames.length > 0 ? categoryNames : [DEFAULT_SERVICE_CATEGORY],
    );
  }, [configData, t]);

  useEffect(
    () => () => {
      stopBookingPreview();
    },
    [],
  );

  const addService = (
    name: string,
    price: number,
    duration: number,
    options?: {
      highlight?: boolean
      icon?: string
      tone?: Tone
      category?: string
    },
  ) => {
    const id = `service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const category = (options?.category || DEFAULT_SERVICE_CATEGORY).trim()
      || DEFAULT_SERVICE_CATEGORY;
    setServices((prev) => [
      ...prev,
      {
        id,
        icon: options?.icon ?? "✨",
        tone: options?.tone ?? "tone-violet",
        name,
        price,
        duration,
        category,
      },
    ]);
    setCategories((prev) => (
      prev.includes(category) ? prev : [...prev, category]
    ));
    if (options?.highlight) {
      setHighlightServiceId(id);
      window.setTimeout(
        () =>
          setHighlightServiceId((current) => (current === id ? null : current)),
        1400,
      );
    }
    setStatus(t(`${TK}.serviceAdded`, { name }));
    return id;
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
    setInvalidDurationServiceIds((prev) =>
      prev.filter((serviceId) => serviceId !== id),
    );
  };

  const updateService = (
    id: string,
    field: MerchantVoiceServiceField,
    value: string,
  ) => {
    if (field === MerchantVoiceServiceField.Duration) {
      setInvalidDurationServiceIds((prev) =>
        prev.filter((serviceId) => serviceId !== id),
      );
    }
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== id) return service;
        if (field === MerchantVoiceServiceField.Name)
          return { ...service, name: value };
        if (field === MerchantVoiceServiceField.Price)
          return { ...service, price: parseWholeNumberInput(value) };
        return { ...service, duration: parseWholeNumberInput(value) };
      }),
    );
  };

  const commitServiceNumberOnBlur = (
    id: string,
    field: MerchantVoiceServiceField.Price | MerchantVoiceServiceField.Duration,
  ) => {
    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== id) return service;
        if (field === MerchantVoiceServiceField.Duration) {
          return {
            ...service,
            duration: clampMerchantVoiceServiceDurationMinutes(
              service.duration,
            ),
          };
        }
        if (Number.isFinite(service[field])) return service;
        return { ...service, [field]: 0 };
      }),
    );
  };

  const openServiceModal = () => {
    setServiceModalDraft({
      category: categories[0] || DEFAULT_SERVICE_CATEGORY,
      name: "",
      price: "",
      duration: "",
    });
    setServiceModalError("");
    setServiceModalOpen(true);
  };

  const saveServiceModal = () => {
    const name = serviceModalDraft.name.trim();
    const price = Number(serviceModalDraft.price);
    const duration = Number(serviceModalDraft.duration);
    const category = serviceModalDraft.category.trim() || DEFAULT_SERVICE_CATEGORY;
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
    addService(name, price, duration, { category, highlight: true });
    setServiceModalOpen(false);
  };

  const openCategoryModal = () => {
    setCategoryDrafts(categories.length ? [...categories] : [DEFAULT_SERVICE_CATEGORY]);
    setCategoryModalError("");
    setCategoryModalOpen(true);
  };

  const saveCategoryModal = () => {
    const cleaned = categoryDrafts.map((name) => name.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setCategoryModalError(t(`${TK}.categoryModalEmpty`));
      return;
    }
    const unique = Array.from(new Set(cleaned.map((name) => name.toLowerCase())));
    if (unique.length !== cleaned.length) {
      setCategoryModalError(t(`${TK}.categoryModalDuplicate`));
      return;
    }
    const removed = categories.filter((name) => !cleaned.includes(name));
    const blocked = removed.find((name) =>
      services.some((service) => service.category === name),
    );
    if (blocked) {
      setCategoryModalError(t(`${TK}.categoryModalHasServices`, { name: blocked }));
      return;
    }
    const renameMap = new Map<string, string>();
    categories.forEach((oldName, index) => {
      const nextName = cleaned[index];
      if (nextName && oldName !== nextName) {
        renameMap.set(oldName, nextName);
      }
    });
    setCategories(cleaned);
    setServices((prev) =>
      prev.map((service) => {
        const renamed = renameMap.get(service.category);
        if (renamed) return { ...service, category: renamed };
        if (cleaned.includes(service.category)) return service;
        return {
          ...service,
          category: cleaned[0] || DEFAULT_SERVICE_CATEGORY,
        };
      }),
    );
    setCategoryModalOpen(false);
  };

  const handleSuggestToggle = () => {
    setSuggestOpen((prev) => {
      const next = !prev;
      setStatus(next ? t(`${TK}.suggestOpened`) : t(`${TK}.suggestHidden`));
      return next;
    });
  };

  const handleSuggestAdd = (suggestion: (typeof SERVICE_SUGGESTIONS)[number]) => {
    const exists = services.some(
      (service) =>
        service.name.trim().toLowerCase() === suggestion.name.toLowerCase(),
    );
    if (exists) {
      setUsedSuggestionIds((prev) =>
        prev.includes(suggestion.id) ? prev : [...prev, suggestion.id],
      );
      setStatus(t(`${TK}.suggestAlreadyInList`, { name: suggestion.name }));
      return;
    }
    addService(suggestion.name, suggestion.price, suggestion.duration, {
      highlight: true,
    });
    setUsedSuggestionIds((prev) =>
      prev.includes(suggestion.id) ? prev : [...prev, suggestion.id],
    );
    setStatus(t(`${TK}.suggestTapHint`));
  };

  const updateCategoryDraft = (index: number, value: string) => {
    setCategoryDrafts((prev) =>
      prev.map((name, draftIndex) => (draftIndex === index ? value : name)),
    );
  };

  const addCategoryDraft = () => {
    setCategoryDrafts((prev) => [...prev, ""]);
  };

  const removeCategoryDraft = (index: number) => {
    setCategoryDrafts((prev) =>
      prev.filter((_, draftIndex) => draftIndex !== index),
    );
  };

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, ServiceRow[]>();
    categories.forEach((name) => map.set(name, []));
    services.forEach((service) => {
      const key = service.category || DEFAULT_SERVICE_CATEGORY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(service);
    });
    return map;
  }, [categories, services]);

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
    if (!location.city.trim()) nextErrors.city = requiredMessage;
    if (!location.state.trim()) nextErrors.state = requiredMessage;
    if (!location.zip.trim()) nextErrors.zip = requiredMessage;
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

    const invalidDurationIds = services
      .filter(
        (service) => !isValidMerchantVoiceServiceDuration(service.duration),
      )
      .map((service) => service.id);
    if (invalidDurationIds.length > 0) {
      setInvalidDurationServiceIds(invalidDurationIds);
      setCollapsedCards((prev) => ({ ...prev, services: false }));
      showToast(t(`${TK}.durationInvalid`), "error");
      return;
    }
    setInvalidDurationServiceIds([]);

    try {
      const salonPhonePayload = normalizePhoneForApi(
        salonPhone,
        parsePhone(salonPhone).countryCode,
      );
      const bookingNotifyPhonePayload = normalizePhoneForApi(
        bookingNotifyPhone,
        parsePhone(bookingNotifyPhone).countryCode,
      );

      await updateConfigMutation.mutateAsync({
        name: salonName.trim(),
        forwardPhoneNumber: salonPhonePayload,
        bookingNotifyPhone: bookingNotifyPhonePayload,
        address: joinSettingsAddress(location),
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
        services: services.map((service) => ({
          ...(service.id && !service.id.startsWith("service-")
            ? { id: service.id }
            : {}),
          name: service.name.trim(),
          price: Number.isFinite(service.price) ? service.price : 0,
          durationMinutes: clampMerchantVoiceServiceDurationMinutes(
            service.duration,
          ),
          note: service.category?.trim() || DEFAULT_SERVICE_CATEGORY,
          icon: service.icon?.trim() || null,
          isActive: true,
        })),
      });
      setStatus(t(`${TK}.saveSuccess`));
      setFormErrors({});
      setInvalidDurationServiceIds([]);
      showToast(t(`${TK}.saveSuccess`), "success");
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)));
      setStatus(message);
      showToast(message, "error");
    }
  };

  if (isConfigLoading) {
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
                  placeholder={t(`${TK}.placeholderStreet`)}
                  autoComplete="street-address"
                  aria-invalid={Boolean(formErrors.street)}
                  onChange={(event) => {
                    patchLocation({ street: event.target.value });
                    if (formErrors.street)
                      setFormErrors((prev) => ({
                        ...prev,
                        street: undefined,
                      }));
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
                  {SETTINGS_COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`${TK}.${option.labelKey}`)}
                    </option>
                  ))}
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
              <select
                className="settings-select settings-timezone-select"
                value={
                  isSettingsTimeZone(timeZone)
                    ? timeZone
                    : DEFAULT_SETTINGS_TIMEZONE
                }
                aria-label={t(`${TK}.timeZoneAria`)}
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
              </select>
            </label>
            <span className="settings-timezone-status">
              {timeZoneManual
                ? t(`${TK}.timeZoneManual`)
                : t(`${TK}.timeZoneAuto`)}
            </span>
          </div>
        </SettingsCard>
      </div>

      <article className="settings-card settings-team-card">
        <div className="settings-card-head">
          <div>
            <div className="settings-card-title">
              <span className="settings-card-title-icon">
                <PeopleTabIcon />
              </span>
              {t(`${TK}.teamTitle`)}
            </div>
            <div className="settings-card-sub">{t(`${TK}.teamSub`)}</div>
          </div>
        </div>
        <div className="settings-team-slot">
          <BookingTeamPanel embedded />
        </div>
      </article>

      <div className="settings-two-grid">
        <SettingsCard
          cardId="services"
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
              className={`booking-secondary-button${suggestOpen ? " is-active" : ""}`}
              type="button"
              onClick={handleSuggestToggle}
            >
              <StarsIcon />
              {t(`${TK}.suggestServices`)}
            </button>
            <button
              className="booking-primary-button"
              type="button"
              onClick={openServiceModal}
            >
              <PlusLgIcon />
              {t(`${TK}.enterManually`)}
            </button>
          </div>

          {suggestOpen ? (
            <div className="settings-service-panel is-visible">
              <div className="settings-service-panel-title">
                {t(`${TK}.suggestPanelTitle`)}
              </div>
              <div className="settings-service-suggest-grid">
                {SERVICE_SUGGESTIONS.filter(
                  (item) => !usedSuggestionIds.includes(item.id),
                ).map((item) => (
                  <button
                    key={item.id}
                    className="settings-service-suggest"
                    type="button"
                    onClick={() => handleSuggestAdd(item)}
                  >
                    + {item.name} <span>${item.price}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="settings-service-list settings-service-body">
            {services.length === 0 ? (
              <div className="settings-service-catalog-state">
                <p>{t(`${TK}.servicesEmpty`)}</p>
                <button
                  className="booking-primary-button"
                  type="button"
                  onClick={openServiceModal}
                >
                  <PlusLgIcon />
                  {t(`${TK}.servicesEmptyCta`)}
                </button>
              </div>
            ) : (
              categories.map((categoryName, index) => {
                const categoryServices =
                  servicesByCategory.get(categoryName) || [];
                return (
                  <details
                    key={categoryName}
                    className="settings-service-category"
                    open={index === 0}
                  >
                    <summary className="settings-service-category-head">
                      <span className="settings-service-category-name">
                        {categoryName}
                      </span>
                      <span className="settings-service-category-count">
                        {categoryServices.length}
                      </span>
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
                    </summary>
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
                          const durationInvalid =
                            invalidDurationServiceIds.includes(service.id);
                          return (
                            <div
                              className={`settings-service-row is-compact${highlightServiceId === service.id ? " is-highlight" : ""}`}
                              key={service.id}
                            >
                              <div className="settings-service-edit-grid">
                                <span
                                  className={`settings-service-visual ${service.tone}`}
                                  aria-hidden="true"
                                >
                                  {service.icon}
                                </span>
                                <input
                                  className="settings-service-input"
                                  type="text"
                                  value={service.name}
                                  placeholder={t(
                                    `${TK}.placeholderServiceName`,
                                  )}
                                  aria-label={t(`${TK}.serviceNameAria`)}
                                  onChange={(event) =>
                                    updateService(
                                      service.id,
                                      MerchantVoiceServiceField.Name,
                                      event.target.value,
                                    )
                                  }
                                />
                                <div className="settings-service-input-wrap">
                                  <span className="settings-service-prefix">
                                    $
                                  </span>
                                  <input
                                    className="settings-service-input price"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatWholeNumberInputValue(
                                      service.price,
                                    )}
                                    placeholder={t(
                                      `${TK}.placeholderServicePrice`,
                                    )}
                                    aria-label={t(`${TK}.servicePriceAria`)}
                                    onChange={(event) =>
                                      updateService(
                                        service.id,
                                        MerchantVoiceServiceField.Price,
                                        event.target.value,
                                      )
                                    }
                                    onBlur={() =>
                                      commitServiceNumberOnBlur(
                                        service.id,
                                        MerchantVoiceServiceField.Price,
                                      )
                                    }
                                  />
                                </div>
                                <div className="settings-service-input-wrap">
                                  <input
                                    className="settings-service-input duration"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={formatWholeNumberInputValue(
                                      service.duration,
                                    )}
                                    placeholder={t(
                                      `${TK}.placeholderServiceDuration`,
                                    )}
                                    aria-label={t(
                                      `${TK}.serviceDurationAria`,
                                    )}
                                    aria-invalid={
                                      durationInvalid || undefined
                                    }
                                    onChange={(event) =>
                                      updateService(
                                        service.id,
                                        MerchantVoiceServiceField.Duration,
                                        event.target.value,
                                      )
                                    }
                                    onBlur={() =>
                                      commitServiceNumberOnBlur(
                                        service.id,
                                        MerchantVoiceServiceField.Duration,
                                      )
                                    }
                                  />
                                  <span className="settings-service-suffix">
                                    {t(`${TK}.durationUnit`)}
                                  </span>
                                </div>
                                <button
                                  className="settings-service-remove"
                                  type="button"
                                  aria-label={t(`${TK}.removeService`)}
                                  onClick={() => removeService(service.id)}
                                >
                                  ×
                                </button>
                              </div>
                              {durationInvalid ? (
                                <p
                                  className="settings-service-row-error"
                                  role="alert"
                                >
                                  {t(`${TK}.durationInvalid`)}
                                </p>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </details>
                );
              })
            )}
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
          disabled={updateConfigMutation.isPending}
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
                  {t(`${TK}.serviceModalTitle`)}
                </div>
                <div className="settings-service-modal-sub">
                  {t(`${TK}.serviceModalSub`)}
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
                <label className="settings-field settings-service-modal-field-name">
                  <span className="settings-label">
                    {t(`${TK}.serviceModalCategory`)}
                  </span>
                  <select
                    className="settings-input"
                    value={serviceModalDraft.category}
                    aria-label={t(`${TK}.serviceModalCategory`)}
                    onChange={(event) =>
                      setServiceModalDraft((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                  >
                    {categories.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))}
                  </select>
                </label>
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
                  <input
                    className="settings-input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={serviceModalDraft.price}
                    placeholder={t(`${TK}.placeholderServicePrice`)}
                    inputMode="decimal"
                    onChange={(event) =>
                      setServiceModalDraft((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="settings-field">
                  <span className="settings-label">
                    {t(`${TK}.serviceModalDuration`)}
                  </span>
                  <input
                    className="settings-input"
                    type="number"
                    min={1}
                    step={1}
                    value={serviceModalDraft.duration}
                    placeholder={t(`${TK}.placeholderServiceDuration`)}
                    inputMode="numeric"
                    onChange={(event) =>
                      setServiceModalDraft((prev) => ({
                        ...prev,
                        duration: event.target.value,
                      }))
                    }
                  />
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
                onClick={saveServiceModal}
              >
                <PlusIcon className="settings-action-icon" />{" "}
                {t(`${TK}.serviceModalSave`)}
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
                    categoryDrafts.map((categoryName, index) => {
                      const serviceCount = services.filter(
                        (service) => service.category === categoryName,
                      ).length;
                      return (
                        <div className="settings-category-row" key={`${categoryName}-${index}`}>
                          <div className="settings-category-row-main">
                            <FolderTreeIcon className="settings-category-row-icon" />
                            <input
                              className="settings-category-name-input"
                              type="text"
                              value={categoryName}
                              aria-label={t(`${TK}.categoryModalCategories`)}
                              onChange={(event) =>
                                updateCategoryDraft(index, event.target.value)
                              }
                            />
                            <span className="settings-category-count">
                              {serviceCount}
                            </span>
                          </div>
                          <div className="settings-category-row-actions">
                            <button
                              className="settings-category-row-action is-danger"
                              type="button"
                              aria-label={t(`${TK}.categoryModalRemoveAria`)}
                              onClick={() => removeCategoryDraft(index)}
                            >
                              ×
                            </button>
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
                className="booking-secondary-button"
                type="button"
                onClick={() => setCategoryModalOpen(false)}
              >
                {t(`${TK}.categoryModalClose`)}
              </button>
              <button
                className="booking-primary-button"
                type="button"
                onClick={saveCategoryModal}
              >
                {t(`${TK}.categoryModalSave`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
