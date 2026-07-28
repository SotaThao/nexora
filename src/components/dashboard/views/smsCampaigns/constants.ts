import {
  SmsCampaignAudience,
  SmsCampaignRecipientStatus,
  SmsCampaignScheduleMode,
  SmsCampaignStatus,
  SmsCreditPackageCode,
} from "../../../../data/merchantVoice/domain";
import { VoiceLeadSource } from "../../../../data/publicVoiceBooking/domain";
import { getWebUrlOrigin } from "../../../../utils/webUrlBase";
import {
  parsePublicBookingLang,
  PUBLIC_BOOKING_ROUTE,
} from "../../../public/booking/constants";

export const SMS_CAMPAIGN_TK =
  "components.dashboard.views.BookingHubView.smsCampaigns";

/** Credit balance below this shows the low-credit pill state. */
export const SMS_CREDITS_LOW_THRESHOLD = 100;

export const SMS_CAMPAIGN_STATUS_CLASS: Record<SmsCampaignStatus, string> = {
  [SmsCampaignStatus.Draft]: "is-scheduled",
  [SmsCampaignStatus.Scheduled]: "is-scheduled",
  [SmsCampaignStatus.Sending]: "is-scheduled",
  [SmsCampaignStatus.Sent]: "is-sent",
  [SmsCampaignStatus.PartiallyFailed]: "is-cancelled",
  [SmsCampaignStatus.Failed]: "is-cancelled",
  [SmsCampaignStatus.Cancelled]: "is-cancelled",
  [SmsCampaignStatus.Active]: "is-active",
  [SmsCampaignStatus.Paused]: "is-cancelled",
};

export const SMS_RECIPIENT_STATUS_CLASS: Record<
  SmsCampaignRecipientStatus,
  string
> = {
  [SmsCampaignRecipientStatus.Pending]: "is-scheduled",
  [SmsCampaignRecipientStatus.Sent]: "is-sent",
  [SmsCampaignRecipientStatus.Failed]: "is-failed",
  [SmsCampaignRecipientStatus.Cancelled]: "is-unknown",
};

/** i18n keys for recipient status labels (API SmsCampaignRecipientStatus). */
export const SMS_RECIPIENT_STATUS_I18N_KEY: Record<
  SmsCampaignRecipientStatus,
  string
> = {
  [SmsCampaignRecipientStatus.Pending]: "recipientStatusPending",
  [SmsCampaignRecipientStatus.Sent]: "recipientStatusSent",
  [SmsCampaignRecipientStatus.Failed]: "recipientStatusFailed",
  [SmsCampaignRecipientStatus.Cancelled]: "recipientStatusCancelled",
};

export const SMS_CAMPAIGN_STATUS_I18N_KEY: Record<SmsCampaignStatus, string> = {
  [SmsCampaignStatus.Draft]: "statusDraft",
  [SmsCampaignStatus.Scheduled]: "statusScheduled",
  [SmsCampaignStatus.Sending]: "statusSending",
  [SmsCampaignStatus.Sent]: "statusSent",
  [SmsCampaignStatus.PartiallyFailed]: "statusPartiallyFailed",
  [SmsCampaignStatus.Failed]: "statusFailed",
  [SmsCampaignStatus.Cancelled]: "statusCancelled",
  [SmsCampaignStatus.Active]: "statusActive",
  [SmsCampaignStatus.Paused]: "statusPaused",
};

export const SMS_CAMPAIGN_MODE_I18N_KEY: Record<
  SmsCampaignScheduleMode,
  string
> = {
  [SmsCampaignScheduleMode.SendNow]: "modeNow",
  [SmsCampaignScheduleMode.Scheduled]: "modeScheduled",
  [SmsCampaignScheduleMode.Auto]: "modeAutomated",
};

export const SMS_CAMPAIGN_AUDIENCE_I18N_KEY: Record<
  SmsCampaignAudience,
  string
> = {
  [SmsCampaignAudience.New]: "segmentNew",
  [SmsCampaignAudience.Days15]: "segmentDay15",
  [SmsCampaignAudience.Days30]: "segmentDay30",
  [SmsCampaignAudience.Days60]: "segmentDay60",
  [SmsCampaignAudience.Vip]: "segmentVip",
  [SmsCampaignAudience.Birthday]: "segmentBirthday",
};

export const SMS_CAMPAIGN_AUDIENCE_SHORT_I18N_KEY: Record<
  SmsCampaignAudience,
  string
> = {
  [SmsCampaignAudience.New]: "segmentNewShort",
  [SmsCampaignAudience.Days15]: "segmentDay15Short",
  [SmsCampaignAudience.Days30]: "segmentDay30Short",
  [SmsCampaignAudience.Days60]: "segmentDay60Short",
  [SmsCampaignAudience.Vip]: "segmentVipShort",
  [SmsCampaignAudience.Birthday]: "segmentBirthdayShort",
};

export type SmsCampaignSegmentAccent =
  | "cyan"
  | "green"
  | "purple"
  | "orange"
  | "pink"
  | "birthday";

export interface SmsCampaignSegmentCard {
  id: SmsCampaignAudience;
  accent: SmsCampaignSegmentAccent;
  nameKey: string;
  shortNameKey: string;
  descKey: string;
  countLabelKey: string;
  badgeKey: string;
}

export const SMS_CAMPAIGN_SEGMENT_CARDS: SmsCampaignSegmentCard[] = [
  {
    id: SmsCampaignAudience.New,
    accent: "cyan",
    nameKey: "segmentNew",
    shortNameKey: "segmentNewShort",
    descKey: "segmentNewDesc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeReady",
  },
  {
    id: SmsCampaignAudience.Days15,
    accent: "green",
    nameKey: "segmentDay15",
    shortNameKey: "segmentDay15Short",
    descKey: "segmentDay15Desc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeReady",
  },
  {
    id: SmsCampaignAudience.Days30,
    accent: "purple",
    nameKey: "segmentDay30",
    shortNameKey: "segmentDay30Short",
    descKey: "segmentDay30Desc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeScheduled",
  },
  {
    id: SmsCampaignAudience.Days60,
    accent: "orange",
    nameKey: "segmentDay60",
    shortNameKey: "segmentDay60Short",
    descKey: "segmentDay60Desc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeReady",
  },
  {
    id: SmsCampaignAudience.Vip,
    accent: "pink",
    nameKey: "segmentVip",
    shortNameKey: "segmentVipShort",
    descKey: "segmentVipDesc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeSent",
  },
  {
    id: SmsCampaignAudience.Birthday,
    accent: "birthday",
    nameKey: "segmentBirthday",
    shortNameKey: "segmentBirthdayShort",
    descKey: "segmentBirthdayDesc",
    countLabelKey: "countBirthdayMonth",
    badgeKey: "badgeAuto",
  },
];

export function getAudienceCount(
  summary:
    | {
        new: number;
        days15: number;
        days30: number;
        days60: number;
        vip: number;
        birthdayThisMonth: number;
      }
    | undefined,
  audience: SmsCampaignAudience,
): number {
  if (!summary) return 0;
  if (audience === SmsCampaignAudience.New) return summary.new;
  if (audience === SmsCampaignAudience.Days15) return summary.days15;
  if (audience === SmsCampaignAudience.Days30) return summary.days30;
  if (audience === SmsCampaignAudience.Days60) return summary.days60;
  if (audience === SmsCampaignAudience.Vip) return summary.vip;
  return summary.birthdayThisMonth;
}

/** Fallback local USD/segment estimate when API estimate is not ready yet. */
export const SMS_PRICE_PER_SMS = 0.025;

/**
 * Format API USD amounts without rounding 0.025 → 0.03.
 * Keeps up to 3 decimals when needed; otherwise 2 for normal currency.
 */
export function formatSmsCostUsd(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  const as3 = value.toFixed(3);
  if (as3.endsWith("0")) return value.toFixed(2);
  return as3;
}

export enum SmsComposerScheduleMode {
  Now = "now",
  Schedule = "schedule",
  Auto = "auto",
}

export const SMS_COMPOSER_MODE_TO_API: Record<
  SmsComposerScheduleMode,
  SmsCampaignScheduleMode
> = {
  [SmsComposerScheduleMode.Now]: SmsCampaignScheduleMode.SendNow,
  [SmsComposerScheduleMode.Schedule]: SmsCampaignScheduleMode.Scheduled,
  [SmsComposerScheduleMode.Auto]: SmsCampaignScheduleMode.Auto,
};

export const SMS_API_MODE_TO_COMPOSER: Record<
  SmsCampaignScheduleMode,
  SmsComposerScheduleMode
> = {
  [SmsCampaignScheduleMode.SendNow]: SmsComposerScheduleMode.Now,
  [SmsCampaignScheduleMode.Scheduled]: SmsComposerScheduleMode.Schedule,
  [SmsCampaignScheduleMode.Auto]: SmsComposerScheduleMode.Auto,
};

/** @deprecated Prefer SmsCreditPackageCode */
export enum SmsCreditPackageId {
  Starter = SmsCreditPackageCode.Sms500,
  Growth = SmsCreditPackageCode.Sms1500,
  Business = SmsCreditPackageCode.Sms3000,
  Scale = SmsCreditPackageCode.Sms6000,
}

export enum SmsCreditPaymentId {
  Usdv = "USDV",
  Usdt = "USDT",
  Usd = "USD",
  Btc = "BTC",
  Vnd = "VND",
}

export interface SmsCreditPackageMock {
  id: SmsCreditPackageCode;
  credits: number;
  price: number;
  nameKey: string;
  noteKey: string;
  featured?: boolean;
}

export interface SmsCreditPaymentMock {
  id: SmsCreditPaymentId;
  label: string;
  balance: string;
  asset: string;
}

export interface SmsCampaignTemplateMock {
  titleKey: string;
  textKey: string;
}

export const SMS_CREDIT_PACKAGES_MOCK: SmsCreditPackageMock[] = [
  {
    id: SmsCreditPackageCode.Sms500,
    credits: 500,
    price: 25,
    nameKey: "pkgStarter",
    noteKey: "pkgStarterNote",
  },
  {
    id: SmsCreditPackageCode.Sms1500,
    credits: 1500,
    price: 60,
    nameKey: "pkgGrowth",
    noteKey: "pkgGrowthNote",
  },
  {
    id: SmsCreditPackageCode.Sms3000,
    credits: 3000,
    price: 99,
    nameKey: "pkgBusiness",
    noteKey: "pkgBusinessNote",
  },
  {
    id: SmsCreditPackageCode.Sms6000,
    credits: 6000,
    price: 175,
    nameKey: "pkgScale",
    noteKey: "pkgScaleNote",
    featured: true,
  },
];

export const SMS_CREDIT_PAYMENTS_MOCK: SmsCreditPaymentMock[] = [
  {
    id: SmsCreditPaymentId.Usdv,
    label: "USDV",
    balance: "—",
    asset: "/assets/sms-credits/usdv.png",
  },
  {
    id: SmsCreditPaymentId.Usdt,
    label: "USDT",
    balance: "—",
    asset: "/assets/sms-credits/usdt.png",
  },
  {
    id: SmsCreditPaymentId.Usd,
    label: "USD",
    balance: "—",
    asset: "/assets/sms-credits/usd.png",
  },
  {
    id: SmsCreditPaymentId.Btc,
    label: "BTC",
    balance: "—",
    asset: "/assets/sms-credits/btc.png",
  },
  {
    id: SmsCreditPaymentId.Vnd,
    label: "VND",
    balance: "—",
    asset: "/assets/sms-credits/vnd.png",
  },
];

export const SMS_COMPOSER_TAG = {
  name: "{name}",
  shop: "{shop}",
  link: "{link}",
  phone: "{phone}",
} as const;

/** Create-campaign form field keys for `data-ai-hub-field` + progressive validation. */
export const SMS_CREATE_FIELD = {
  campaignName: "campaignName",
  message: "message",
  schedule: "schedule",
} as const;

export type SmsCreateFieldKey =
  (typeof SMS_CREATE_FIELD)[keyof typeof SMS_CREATE_FIELD];

export type SmsCreateFieldErrors = Partial<Record<SmsCreateFieldKey, string>>;

export const SMS_CAMPAIGN_NAME_INPUT = "campaign-name" as const;
export const SMS_DEFAULT_SCHEDULE_TIME = "10:00" as const;
export const SMS_LINK_FALLBACK_HOST = "nexora.ai" as const;

const SMS_LITERAL_PHONE_DIGIT_MIN = 9;
const SMS_LITERAL_PHONE_DIGIT_MAX = 15;
const SMS_LITERAL_NAME_MIN_LEN = 2;
const SMS_LITERAL_NAME_MAX_LEN = 40;

export const SMS_COMPOSER_TAG_SAMPLES = {
  [SMS_COMPOSER_TAG.name]: "Linh",
  [SMS_COMPOSER_TAG.shop]: "Bitcoin Nail Bar",
  [SMS_COMPOSER_TAG.link]: `nexora.ai/b/…?${PUBLIC_BOOKING_ROUTE.langQuery}=${parsePublicBookingLang("en")}`,
  [SMS_COMPOSER_TAG.phone]: "832-786-5576",
} as const;

/** Words that look like greeting tails, not customer names. */
const SMS_NAME_STOPWORDS = new Set([
  "there",
  "friend",
  "thanks",
  "thank",
  "you",
  "all",
  "everyone",
  "bạn",
  "quý",
  "anh",
  "chị",
  "em",
  "shop",
  "salon",
]);

/**
 * Greeting / birthday openers used by SMS templates — capture a literal name when
 * the merchant deleted `{name}` and typed a real customer name.
 */
const SMS_LITERAL_NAME_PATTERNS = [
  /(?:^|[\n\s])(?:hi|hey|hello)\s+([A-Za-zÀ-ỹ][\wÀ-ỹ'’.-]{0,39})(?=[!.,\s]|$)/i,
  /(?:^|[\n\s])(?:xin chào|chào)\s+([A-Za-zÀ-ỹ][\wÀ-ỹ'’.-]{0,39})(?=[!.,\s]|$)/i,
  /(?:^|[\n\s])([A-Za-zÀ-ỹ][\wÀ-ỹ'’.-]{1,39})\s+ơi(?=[!.,\s]|$)/i,
  /(?:happy birthday|chúc mừng sinh nhật)\s+([A-Za-zÀ-ỹ][\wÀ-ỹ'’.-]{0,39})(?=[!.,\s]|$)/i,
] as const;

/** US / VN-ish phone shapes merchants type after removing `{phone}`. */
const SMS_LITERAL_PHONE_PATTERN =
  /(?:\+?\d{1,3}[\s.-]*)?(?:\(?\d{2,4}\)?[\s.-]*)\d{2,4}[\s.-]*\d{3,4}|\b0\d{8,10}\b|\+\d{9,15}\b/g;

/** Strip URLs / tags / dates so literal phone/name detection stays stable. */
function stripSmsNoiseForParsing(text: string): string {
  return String(text ?? "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/(?:[a-z0-9.-]+)\/b\/\S+/gi, " ")
    .replace(/\{[a-z]+\}/gi, " ")
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ")
    .replace(/\b\d{1,2}%/g, " ");
}

function phoneDigitCount(value: string): number {
  return String(value || "").replace(/\D/g, "").length;
}

function looksLikePhoneLiteral(value: string): boolean {
  const digits = phoneDigitCount(value);
  return (
    digits >= SMS_LITERAL_PHONE_DIGIT_MIN &&
    digits <= SMS_LITERAL_PHONE_DIGIT_MAX
  );
}

/** First literal phone in message copy (ignores URLs, dates, merge tags). */
export function extractLiteralPhoneFromSmsMessage(
  messageBody: string,
): string | null {
  const haystack = stripSmsNoiseForParsing(messageBody);
  const matches = haystack.match(SMS_LITERAL_PHONE_PATTERN) || [];
  for (const match of matches) {
    const candidate = match.trim();
    if (looksLikePhoneLiteral(candidate)) return candidate;
  }
  return null;
}

/** First literal customer name from common SMS openers (when `{name}` was removed). */
export function extractLiteralNameFromSmsMessage(
  messageBody: string,
): string | null {
  const haystack = stripSmsNoiseForParsing(messageBody);
  for (const pattern of SMS_LITERAL_NAME_PATTERNS) {
    const match = haystack.match(pattern);
    const candidate = String(match?.[1] || "")
      .trim()
      .replace(/[.,!]+$/g, "");
    if (!candidate) continue;
    if (looksLikePhoneLiteral(candidate)) continue;
    if (SMS_NAME_STOPWORDS.has(candidate.toLowerCase())) continue;
    if (
      candidate.length < SMS_LITERAL_NAME_MIN_LEN ||
      candidate.length > SMS_LITERAL_NAME_MAX_LEN
    ) {
      continue;
    }
    return candidate;
  }
  return null;
}

export type SmsCampaignLinkPrefill = {
  phone: string | null;
  name: string | null;
};

function resolveSmsPrefillField(
  text: string,
  tag: string,
  sample: string,
  extractLiteral: (body: string) => string | null,
  useSamples: boolean,
): string | null {
  if (text.includes(tag)) return useSamples ? sample : tag;
  return extractLiteral(text);
}

/**
 * Resolve phone/name for the booking `{link}` query:
 * - still has `{phone}` / `{name}` → keep merge tag (or preview sample)
 * - tags removed → detect literal phone / greeted name in the message body
 */
export function resolveSmsCampaignLinkPrefill(
  messageBody: string,
  options: { previewSamples?: boolean } = {},
): SmsCampaignLinkPrefill {
  const text = String(messageBody ?? "");
  const useSamples = Boolean(options.previewSamples);
  return {
    phone: resolveSmsPrefillField(
      text,
      SMS_COMPOSER_TAG.phone,
      SMS_COMPOSER_TAG_SAMPLES[SMS_COMPOSER_TAG.phone],
      extractLiteralPhoneFromSmsMessage,
      useSamples,
    ),
    name: resolveSmsPrefillField(
      text,
      SMS_COMPOSER_TAG.name,
      SMS_COMPOSER_TAG_SAMPLES[SMS_COMPOSER_TAG.name],
      extractLiteralNameFromSmsMessage,
      useSamples,
    ),
  };
}

type SmsCampaignLinkOptions = {
  /** Resolved sample, literal, or merge tag `{phone}` kept for BE substitution. */
  phone?: string | null;
  /** Resolved sample, literal, or merge tag `{name}` kept for BE substitution. */
  name?: string | null;
  source?: string | null;
};

function appendSmsCampaignLinkQuery(
  path: string,
  langCode: string,
  options: SmsCampaignLinkOptions = {},
): string {
  const source =
    String(options.source ?? VoiceLeadSource.Sms).trim() || VoiceLeadSource.Sms;
  const pairs: Array<[string, string]> = [
    [PUBLIC_BOOKING_ROUTE.langQuery, langCode],
    [PUBLIC_BOOKING_ROUTE.sourceQuery, source],
  ];
  const phone = String(options.phone ?? "").trim();
  const name = String(options.name ?? "").trim();
  if (phone) pairs.push([PUBLIC_BOOKING_ROUTE.phoneQuery, phone]);
  if (name) pairs.push([PUBLIC_BOOKING_ROUTE.nameQuery, name]);

  const qs = pairs
    .map(([key, value]) => {
      // Keep `{phone}` / `{name}` merge tags readable for BE body substitution.
      const encodedValue = /\{[a-z]+\}/i.test(value)
        ? value
        : encodeURIComponent(value);
      return `${encodeURIComponent(key)}=${encodedValue}`;
    })
    .join("&");
  return `${path}?${qs}`;
}

/** SMS-friendly business booking link: `{domain}/b/{businessKey}?lang=&src=Sms&phone=&name=`. */
export function buildSmsCampaignBusinessLinkPreview(
  businessKey?: string | null,
  lang?: string | null,
  options: SmsCampaignLinkOptions = {},
): string {
  const key = String(businessKey ?? "").trim();
  const origin = getWebUrlOrigin();
  let host = "";
  if (origin) {
    try {
      host = new URL(origin).host;
    } catch {
      host = origin.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    }
  }
  if (!host && typeof window !== "undefined") {
    host = window.location.host;
  }
  if (!host) host = SMS_LINK_FALLBACK_HOST;
  const path = key ? `${host}/b/${key}` : `${host}/b/…`;
  const langCode = parsePublicBookingLang(lang);
  return appendSmsCampaignLinkQuery(path, langCode, options);
}

/** Expand `{link}` in campaign copy to a booking URL carrying detected phone/name. */
export function expandSmsCampaignLinkTags(
  messageBody: string,
  businessKey?: string | null,
  lang?: string | null,
): string {
  const text = String(messageBody ?? "");
  if (!text.includes(SMS_COMPOSER_TAG.link)) return text;
  const prefill = resolveSmsCampaignLinkPrefill(text);
  const link = buildSmsCampaignBusinessLinkPreview(businessKey, lang, {
    phone: prefill.phone,
    name: prefill.name,
    source: VoiceLeadSource.Sms,
  });
  return text.split(SMS_COMPOSER_TAG.link).join(link);
}

export const SMS_COMPOSER_TAGS = [
  { tag: SMS_COMPOSER_TAG.name, labelKey: "tagCustomerName" },
  { tag: SMS_COMPOSER_TAG.shop, labelKey: "tagShopName" },
  { tag: SMS_COMPOSER_TAG.link, labelKey: "tagOfferLink" },
  { tag: SMS_COMPOSER_TAG.phone, labelKey: "tagPhone" },
] as const;

export const SMS_LANDING_PAGE_OPTIONS = [
  { value: "", labelKey: "lpNone" },
  { value: "comeback", labelKey: "lpComeback" },
  { value: "birthday", labelKey: "lpBirthday" },
] as const;

export const SMS_CAMPAIGN_TEMPLATES: Record<
  SmsCampaignAudience,
  SmsCampaignTemplateMock[]
> = {
  [SmsCampaignAudience.New]: [
    { titleKey: "tplNew1Title", textKey: "tplNew1Text" },
    { titleKey: "tplNew2Title", textKey: "tplNew2Text" },
  ],
  [SmsCampaignAudience.Days15]: [
    { titleKey: "tplDay15_1Title", textKey: "tplDay15_1Text" },
    { titleKey: "tplDay15_2Title", textKey: "tplDay15_2Text" },
  ],
  [SmsCampaignAudience.Days30]: [
    { titleKey: "tplDay30_1Title", textKey: "tplDay30_1Text" },
    { titleKey: "tplDay30_2Title", textKey: "tplDay30_2Text" },
  ],
  [SmsCampaignAudience.Days60]: [
    { titleKey: "tplDay60_1Title", textKey: "tplDay60_1Text" },
    { titleKey: "tplDay60_2Title", textKey: "tplDay60_2Text" },
  ],
  [SmsCampaignAudience.Vip]: [
    { titleKey: "tplVip1Title", textKey: "tplVip1Text" },
    { titleKey: "tplVip2Title", textKey: "tplVip2Text" },
  ],
  [SmsCampaignAudience.Birthday]: [
    { titleKey: "tplBirthday1Title", textKey: "tplBirthday1Text" },
    { titleKey: "tplBirthday2Title", textKey: "tplBirthday2Text" },
  ],
};
