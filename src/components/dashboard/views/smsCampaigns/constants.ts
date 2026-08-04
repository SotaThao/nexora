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
  [SmsCampaignAudience.All]: "segmentAll",
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
  [SmsCampaignAudience.All]: "segmentAllShort",
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

/** Panel segment cards — excludes All (composer-only). */
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

/** Create-campaign segment tabs — All first, then panel segments (matches HTML COMPOSER_SEGMENTS). */
export const SMS_CAMPAIGN_COMPOSER_SEGMENTS: SmsCampaignSegmentCard[] = [
  {
    id: SmsCampaignAudience.All,
    accent: "cyan",
    nameKey: "segmentAll",
    shortNameKey: "segmentAllShort",
    descKey: "segmentAllDesc",
    countLabelKey: "countCustomers",
    badgeKey: "badgeReady",
  },
  ...SMS_CAMPAIGN_SEGMENT_CARDS,
];

/** Default selected audience in Create SMS Campaign (first composer tab). */
export const SMS_CAMPAIGN_DEFAULT_AUDIENCE =
  SMS_CAMPAIGN_COMPOSER_SEGMENTS[0].id;

type SmsAudienceSummaryCounts = {
  all: number;
  new: number;
  days15: number;
  days30: number;
  days60: number;
  vip: number;
  birthdayThisMonth: number;
};

const AUDIENCE_SUMMARY_COUNT: Record<
  SmsCampaignAudience,
  (summary: SmsAudienceSummaryCounts) => number
> = {
  [SmsCampaignAudience.New]: (summary) => summary.new,
  [SmsCampaignAudience.Days15]: (summary) => summary.days15,
  [SmsCampaignAudience.Days30]: (summary) => summary.days30,
  [SmsCampaignAudience.Days60]: (summary) => summary.days60,
  [SmsCampaignAudience.Vip]: (summary) => summary.vip,
  [SmsCampaignAudience.Birthday]: (summary) => summary.birthdayThisMonth,
  [SmsCampaignAudience.All]: (summary) => summary.all,
};

export function getAudienceCount(
  summary: SmsAudienceSummaryCounts | undefined,
  audience: SmsCampaignAudience,
): number {
  if (!summary) return 0;
  return AUDIENCE_SUMMARY_COUNT[audience](summary);
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

/** Featured / best-value package selected when the buy modal opens. */
export const SMS_CREDIT_DEFAULT_PACKAGE_ID =
  SMS_CREDIT_PACKAGES_MOCK.find((pkg) => pkg.featured)?.id
  ?? SMS_CREDIT_PACKAGES_MOCK[0].id;

export const SMS_CREDIT_DEFAULT_PAYMENT_ID = SmsCreditPaymentId.Usdv;

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
export const SMS_CAMPAIGN_LINK_PHONE = "13463755759" as const;

export const SMS_COMPOSER_TAG_SAMPLES = {
  [SMS_COMPOSER_TAG.name]: "Linh",
  [SMS_COMPOSER_TAG.shop]: "Bitcoin Nail Bar",
  [SMS_COMPOSER_TAG.link]: `nexora.ai/b/…?${PUBLIC_BOOKING_ROUTE.langQuery}=${parsePublicBookingLang("en")}`,
  [SMS_COMPOSER_TAG.phone]: "832-786-5576",
} as const;

type SmsCampaignLinkOptions = {
  source?: string | null;
  /** Merchant profile phone → `?p=` (digits only, no spaces / `+`). */
  phone?: string | null;
};

/** Strip spaces/symbols so SMS links use digits only. */
export function toSmsCampaignLinkPhone(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D/g, "");
}

function appendSmsCampaignLinkQuery(
  path: string,
  langCode: string,
  options: SmsCampaignLinkOptions = {},
): string {
  const source =
    String(options.source ?? VoiceLeadSource.Sms).trim() || VoiceLeadSource.Sms;
  const profilePhone = toSmsCampaignLinkPhone(options.phone);
  const parts = [
    `${encodeURIComponent(PUBLIC_BOOKING_ROUTE.langQuery)}=${encodeURIComponent(langCode)}`,
    `${encodeURIComponent(PUBLIC_BOOKING_ROUTE.sourceQuery)}=${encodeURIComponent(source)}`,
  ];
  if (profilePhone) {
    parts.push(`${PUBLIC_BOOKING_ROUTE.profilePhoneQuery}=${profilePhone}`);
  }
  return `${path}?${parts.join("&")}`;
}

/** SMS-friendly business booking link: `{domain}/b/{businessKey}?lang=&src=Sms[&p=]`. */
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

/** Expand `{link}` in campaign copy to the booking URL (lang + src + optional p). */
export function expandSmsCampaignLinkTags(
  messageBody: string,
  businessKey?: string | null,
  lang?: string | null,
  options: SmsCampaignLinkOptions = {},
): string {
  const text = String(messageBody ?? "");
  if (!text.includes(SMS_COMPOSER_TAG.link)) return text;
  const link = buildSmsCampaignBusinessLinkPreview(businessKey, lang, options);
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
  [SmsCampaignAudience.All]: [
    { titleKey: "tplAll1Title", textKey: "tplAll1Text" },
    { titleKey: "tplAll2Title", textKey: "tplAll2Text" },
  ],
};
