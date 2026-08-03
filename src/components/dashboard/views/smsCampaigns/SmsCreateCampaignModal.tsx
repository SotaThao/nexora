import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../../../contexts/LanguageContext";
import { useNotification } from "../../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../../data/errorCodes";
import { useMerchantVoiceMyTenant } from "../../../../data/hooks/useMerchantVoiceBookings";
import { useProfileSettings } from "../../../../data/hooks/useProfileSettings";
import {
  useAnalyzeMerchantVoiceSmsText,
  useCreateMerchantVoiceSmsCampaign,
  useEstimateMerchantVoiceSmsCampaign,
  useMerchantVoiceSmsCampaign,
  useUpdateMerchantVoiceSmsCampaign,
} from "../../../../data/hooks/useMerchantVoiceSmsCampaigns";
import {
  SmsCampaignAudience,
  SmsCampaignScheduleMode,
  SmsEncoding,
} from "../../../../data/merchantVoice/domain";
import type {
  SmsCampaignAudienceSummaryDto,
  SmsTextEstimateDto,
} from "../../../../data/repositories/merchantVoiceSmsCampaigns";
import { getApiErrorCode } from "../../../../types/domain";
import { getWebUrlOrigin } from "../../../../utils/webUrlBase";
import { parseApiDateTime } from "../../utils";
import {
  applyAiHubProgressiveValidation,
  isAiHubFieldBelowVisibleFold,
} from "../bookingHubDialogValidation";
import {
  formatBookingHubDateDisplay,
  formatBookingHubTimeDisplay,
} from "../bookingHubFormatters";
import {
  AlertTriangleIcon,
  CalendarTabIcon,
  ClockIcon,
  CloseIcon,
  GiftIcon,
  LinkIcon,
  MegaphoneIcon,
  PeopleTabIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  SmartphoneIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
  UserIcon,
  UserPlusIcon,
  WalletCardsIcon,
  ZapIcon,
} from "../BookingHubIcons";
import {
  buildSmsCampaignBusinessLinkPreview,
  expandSmsCampaignLinkTags,
  formatSmsCostUsd,
  getAudienceCount,
  SMS_API_MODE_TO_COMPOSER,
  SMS_CAMPAIGN_COMPOSER_SEGMENTS,
  SMS_CAMPAIGN_DEFAULT_AUDIENCE,
  SMS_CAMPAIGN_NAME_INPUT,
  SMS_CAMPAIGN_TEMPLATES,
  SMS_CAMPAIGN_TK,
  SMS_COMPOSER_MODE_TO_API,
  SMS_COMPOSER_TAG,
  SMS_COMPOSER_TAG_SAMPLES,
  SMS_COMPOSER_TAGS,
  SMS_CREATE_FIELD,
  SMS_DEFAULT_SCHEDULE_TIME,
  SMS_LANDING_PAGE_OPTIONS,
  SMS_PRICE_PER_SMS,
  SmsComposerScheduleMode,
  type SmsCreateFieldErrors,
} from "./constants";
import SmsScheduleDatePicker from "./SmsScheduleDatePicker";

const TK = SMS_CAMPAIGN_TK;
const TK_HUB = "components.dashboard.views.BookingHubView";
const SMS_ANALYZE_MAX_CHARS = 3200;
const EMPTY_TEXT_ESTIMATE: SmsTextEstimateDto = {
  encoding: SmsEncoding.Gsm7,
  characterCount: 0,
  segmentCount: 0,
  maxCharactersPerSegment: 160,
  charactersRemainingInLastSegment: 160,
  estimatedCostUsd: 0,
  segments: [],
};

const SEGMENT_ICON: Record<SmsCampaignAudience, React.ReactNode> = {
  [SmsCampaignAudience.New]: <UserPlusIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days15]: <CalendarTabIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days30]: <ClockIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days60]: <RefreshCwIcon className="marketing-icon" />,
  [SmsCampaignAudience.Vip]: <StarIcon className="marketing-icon" />,
  [SmsCampaignAudience.Birthday]: <GiftIcon className="marketing-icon" />,
  [SmsCampaignAudience.All]: <PeopleTabIcon className="marketing-icon" />,
};

const TAG_ICON: Record<string, React.ReactNode> = {
  [SMS_COMPOSER_TAG.name]: <UserIcon className="marketing-icon is-compact" />,
  [SMS_COMPOSER_TAG.shop]: <StoreIcon className="marketing-icon is-compact" />,
  [SMS_COMPOSER_TAG.link]: <LinkIcon className="marketing-icon is-compact" />,
  [SMS_COMPOSER_TAG.phone]: <PhoneIcon className="marketing-icon is-compact" />,
};

type Props = {
  open: boolean;
  initialAudience?: SmsCampaignAudience;
  campaignId?: string | null;
  availableCredits: number;
  audienceSummary?: SmsCampaignAudienceSummaryDto;
  onClose: () => void;
  onSaved: (message: string) => void;
  onBuyCredits?: () => void;
};

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}

/** Turn SMS preview link text (often host/path without scheme) into an absolute href. */
function toPreviewHref(displayLink: string): string | null {
  const trimmed = displayLink.trim();
  if (!trimmed || trimmed.includes("…") || trimmed.includes("...")) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const origin = getWebUrlOrigin();
  if (origin) {
    try {
      const { protocol } = new URL(origin);
      return `${protocol}//${trimmed.replace(/^\/+/, "")}`;
    } catch {
      // fall through
    }
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function renderPreviewLinkHtml(displayLink: string): string {
  const label = escapeHtml(displayLink);
  const href = toPreviewHref(displayLink);
  if (!href) return `<span class="lnk">${label}</span>`;
  return `<a class="lnk" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function renderPreviewHtml(
  text: string,
  tagSamples: Record<string, string> = SMS_COMPOSER_TAG_SAMPLES,
): string {
  if (!text.trim()) return "";

  // Resolve merge tags in plain text first.
  let raw = text;
  raw = raw
    .split(SMS_COMPOSER_TAG.link)
    .join(tagSamples[SMS_COMPOSER_TAG.link] || "");
  for (const [tag, sample] of Object.entries(tagSamples)) {
    if (tag === SMS_COMPOSER_TAG.link) continue;
    raw = raw.split(tag).join(sample);
  }

  // Linkify booking / http URLs so preview "open link" carries prefill query params.
  // Host may include a port (e.g. localhost:3000/b/...).
  const urlPattern =
    /(https?:\/\/[^\s]+|(?:[a-zA-Z0-9.-]+(?::\d+)?)\/b\/[^\s]+)/g;
  const parts: string[] = [];
  let lastIndex = 0;
  for (const match of raw.matchAll(urlPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(escapeHtml(raw.slice(lastIndex, index)));
    }
    parts.push(renderPreviewLinkHtml(match[0]));
    lastIndex = index + match[0].length;
  }
  if (lastIndex < raw.length) {
    parts.push(escapeHtml(raw.slice(lastIndex)));
  }
  return parts.join("").replace(/\n/g, "<br>");
}

function toScheduledAtUtc(date: string, time: string): string | undefined {
  if (!date || !time) return undefined;
  const local = new Date(`${date}T${time}`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

function openDateTimePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) return;
  input.focus();
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Browser may block showPicker without a trusted user gesture.
    }
  }
}

function toLocalDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalTimeInputValue(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function splitUtcToLocalInputs(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: SMS_DEFAULT_SCHEDULE_TIME };
  const parsed = parseApiDateTime(iso);
  if (!parsed) return { date: "", time: SMS_DEFAULT_SCHEDULE_TIME };
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

export default function SmsCreateCampaignModal({
  open,
  initialAudience = SMS_CAMPAIGN_DEFAULT_AUDIENCE,
  campaignId = null,
  availableCredits,
  audienceSummary,
  onClose,
  onSaved,
  onBuyCredits,
}: Props) {
  const { t, currentLanguage } = useTranslation();
  const { showToast } = useNotification();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageSelectionRef = useRef({ start: 0, end: 0 });
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scheduleSectionRef = useRef<HTMLDivElement | null>(null);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  const isEdit = !!campaignId;
  const myTenantQuery = useMerchantVoiceMyTenant({ enabled: open });
  const profileQuery = useProfileSettings({ enabled: open });
  const campaignQuery = useMerchantVoiceSmsCampaign(campaignId, {
    enabled: open && isEdit,
  });
  const estimateMutation = useEstimateMerchantVoiceSmsCampaign();
  const analyzeMutation = useAnalyzeMerchantVoiceSmsText();
  const createMutation = useCreateMerchantVoiceSmsCampaign();
  const updateMutation = useUpdateMerchantVoiceSmsCampaign();
  const { mutate: estimateCampaign } = estimateMutation;
  const { mutate: analyzeText } = analyzeMutation;

  const [audience, setAudience] = useState(initialAudience);
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const [scheduleMode, setScheduleMode] = useState(SmsComposerScheduleMode.Now);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState(SMS_DEFAULT_SCHEDULE_TIME);
  const [nameError, setNameError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [textEstimate, setTextEstimate] =
    useState<SmsTextEstimateDto>(EMPTY_TEXT_ESTIMATE);
  const analyzeRequestIdRef = useRef(0);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isHydrating =
    isEdit && campaignQuery.isLoading && hydratedId !== campaignId;

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isSubmitting, onClose]);

  // Reset create form only when the dialog opens — not when submit pending toggles (e.g. after API error).
  useEffect(() => {
    if (!open || isEdit) return;

    setAudience(initialAudience);
    setCampaignName("");
    setMessage("");
    messageSelectionRef.current = { start: 0, end: 0 };
    setLandingPage("");
    setScheduleMode(SmsComposerScheduleMode.Now);
    setScheduleDate("");
    setScheduleTime(SMS_DEFAULT_SCHEDULE_TIME);
    setNameError("");
    setMessageError("");
    setScheduleError("");
    setHydratedId(null);
    setTextEstimate(EMPTY_TEXT_ESTIMATE);
    requestAnimationFrame(() => closeBtnRef.current?.focus());
  }, [open, isEdit, initialAudience]);

  useEffect(() => {
    if (!open || !isEdit) return;
    requestAnimationFrame(() => closeBtnRef.current?.focus());
  }, [open, isEdit]);

  useEffect(() => {
    if (
      !open ||
      !isEdit ||
      !campaignQuery.data ||
      hydratedId === campaignQuery.data.id
    )
      return;
    const detail = campaignQuery.data;
    const scheduleInputs = splitUtcToLocalInputs(detail.scheduledAtUtc);
    setAudience(detail.audienceSegment);
    setCampaignName(detail.name);
    setMessage(detail.messageBody);
    messageSelectionRef.current = {
      start: detail.messageBody.length,
      end: detail.messageBody.length,
    };
    setLandingPage(detail.linkUrl ?? "");
    setScheduleMode(SMS_API_MODE_TO_COMPOSER[detail.scheduleMode]);
    setScheduleDate(scheduleInputs.date);
    setScheduleTime(scheduleInputs.time);
    setHydratedId(detail.id);
  }, [open, isEdit, campaignQuery.data, hydratedId]);

  useEffect(() => {
    if (!open) return undefined;

    // API requires non-empty messageBody — use a minimal placeholder until the user composes.
    const text = message.trim() || SMS_COMPOSER_TAG.name;
    const delayMs = message.trim() ? 400 : 0;

    const timer = window.setTimeout(() => {
      estimateCampaign({
        audienceSegment: audience,
        messageBody: text,
        linkUrl: landingPage || undefined,
      });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [open, audience, message, landingPage, estimateCampaign]);

  useEffect(() => {
    if (!open) return undefined;

    const requestId = ++analyzeRequestIdRef.current;
    const timer = window.setTimeout(() => {
      analyzeText(
        { text: message.slice(0, SMS_ANALYZE_MAX_CHARS) },
        {
          onSuccess: (data) => {
            if (requestId === analyzeRequestIdRef.current) {
              setTextEstimate(data);
            }
          },
        },
      );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [open, message, analyzeText]);

  const numberLocale = currentLanguage === "vi" ? "vi-VN" : "en-US";
  const segmentCard = useMemo(
    () =>
      SMS_CAMPAIGN_COMPOSER_SEGMENTS.find((item) => item.id === audience) ??
      SMS_CAMPAIGN_COMPOSER_SEGMENTS[0],
    [audience],
  );
  const templates = SMS_CAMPAIGN_TEMPLATES[audience];
  const estimate = estimateMutation.data;

  const audienceCount =
    estimate?.recipients ?? getAudienceCount(audienceSummary, audience);
  const parts = Math.max(
    estimate?.segmentsPerMessage ?? textEstimate.segmentCount,
    1,
  );
  const totalSms = estimate?.totalSegments ?? audienceCount * parts;
  const estimatedCostUsd = estimate?.estimatedCostUsd;
  const cost = formatSmsCostUsd(
    typeof estimatedCostUsd === "number" && Number.isFinite(estimatedCostUsd)
      ? estimatedCostUsd
      : totalSms * SMS_PRICE_PER_SMS,
  );
  const spendableCredits = estimate?.creditBalance ?? availableCredits;
  const enoughCredits =
    estimate?.hasEnoughCredits ?? spendableCredits >= totalSms;
  const lowCredits =
    spendableCredits > 0 && totalSms >= spendableCredits * 0.8;
  const needsCreditWarning = !enoughCredits || lowCredits;
  const encodingLabel = estimate?.encoding ?? textEstimate.encoding;
  const charUnits = textEstimate.characterCount;
  const charParts = textEstimate.segmentCount;
  const charEncoding = textEstimate.encoding;
  const charPerPart = textEstimate.maxCharactersPerSegment || 160;
  const profilePhone = profileQuery.data?.phoneNumber?.trim() || "";
  const tagSamples = useMemo(
    () => ({
      ...SMS_COMPOSER_TAG_SAMPLES,
      [SMS_COMPOSER_TAG.shop]:
        myTenantQuery.data?.name?.trim() ||
        SMS_COMPOSER_TAG_SAMPLES[SMS_COMPOSER_TAG.shop],
      [SMS_COMPOSER_TAG.link]: buildSmsCampaignBusinessLinkPreview(
        myTenantQuery.data?.businessKey,
        currentLanguage,
        { phone: profilePhone || undefined },
      ),
    }),
    [
      currentLanguage,
      myTenantQuery.data?.businessKey,
      myTenantQuery.data?.name,
      profilePhone,
    ],
  );
  const previewHtml = useMemo(
    () => renderPreviewHtml(message, tagSamples),
    [message, tagSamples],
  );

  const rememberMessageSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    messageSelectionRef.current = {
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    };
  };

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    const fallbackEnd = message.length;
    // Prefer live caret while focused; otherwise last saved caret (tag click blurs).
    const live =
      el && document.activeElement === el
        ? {
            start: el.selectionStart ?? fallbackEnd,
            end: el.selectionEnd ?? fallbackEnd,
          }
        : messageSelectionRef.current;
    const start = Number.isFinite(live.start) ? live.start : fallbackEnd;
    const end = Number.isFinite(live.end) ? live.end : fallbackEnd;
    const before = message.slice(0, start);
    const after = message.slice(end);
    // Keep merge tags spaced (e.g. `{link} {phone}`, not `{link}{phone}`).
    const lead = before.length > 0 && !/\s$/.test(before) ? " " : "";
    const trail = after.length > 0 && !/^\s/.test(after) ? " " : "";
    const inserted = `${lead}${tag}${trail}`;
    const next = `${before}${inserted}${after}`;
    const cursor = before.length + inserted.length;
    messageSelectionRef.current = { start: cursor, end: cursor };
    setMessage(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const applyCreateFieldErrors = (errs: SmsCreateFieldErrors) => {
    setNameError(errs[SMS_CREATE_FIELD.campaignName] || "");
    setMessageError(errs[SMS_CREATE_FIELD.message] || "");
    setScheduleError(errs[SMS_CREATE_FIELD.schedule] || "");
  };

  const handleSend = async () => {
    const name = campaignName.trim();
    const text = message.trim();
    const apiMode = SMS_COMPOSER_MODE_TO_API[scheduleMode];
    let scheduledAtUtc: string | undefined;

    const allErrors: SmsCreateFieldErrors = {};
    if (!name)
      allErrors[SMS_CREATE_FIELD.campaignName] = t(`${TK}.alertNameRequired`);
    if (!text)
      allErrors[SMS_CREATE_FIELD.message] = t(`${TK}.alertEmptyMessage`);

    if (apiMode === SmsCampaignScheduleMode.Scheduled) {
      if (!scheduleDate || !scheduleTime) {
        allErrors[SMS_CREATE_FIELD.schedule] = t(`${TK}.alertScheduleRequired`);
      } else {
        scheduledAtUtc = toScheduledAtUtc(scheduleDate, scheduleTime);
        if (!scheduledAtUtc) {
          allErrors[SMS_CREATE_FIELD.schedule] = t(
            `${TK}.alertScheduleRequired`,
          );
        }
      }
    }

    if (
      applyAiHubProgressiveValidation({
        allErrors,
        root: modalBodyRef.current,
        setErrors: applyCreateFieldErrors,
        fieldLabels: {
          [SMS_CREATE_FIELD.campaignName]: t(`${TK}.campaignNameLabel`).replace(
            /\s*\*\s*$/,
            "",
          ),
          [SMS_CREATE_FIELD.message]: t(`${TK}.stepCompose`),
          [SMS_CREATE_FIELD.schedule]: t(`${TK}.stepSchedule`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return;
    }

    if (apiMode === SmsCampaignScheduleMode.Scheduled && scheduledAtUtc) {
      if (new Date(scheduledAtUtc).getTime() <= Date.now()) {
        const pastMsg = t(getErrorI18nKey("SMS_CAMPAIGN_SCHEDULED_AT_IN_PAST"));
        setScheduleError(pastMsg);
        const scheduleEl = scheduleSectionRef.current;
        const below = Boolean(
          scheduleEl && isAiHubFieldBelowVisibleFold(scheduleEl),
        );
        if (below) {
          showToast(pastMsg, "error");
          scheduleEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }
    }

    if (!enoughCredits && apiMode !== SmsCampaignScheduleMode.Auto) {
      showToast(
        t(`${TK}.alertInsufficientCredits`, {
          need: totalSms,
          have: spendableCredits,
        }),
        "error",
      );
      return;
    }

    try {
      const messageBody = expandSmsCampaignLinkTags(
        text,
        myTenantQuery.data?.businessKey,
        currentLanguage,
        { phone: profilePhone || undefined },
      );

      if (isEdit && campaignId) {
        await updateMutation.mutateAsync({
          id: campaignId,
          body: {
            name,
            audienceSegment: audience,
            messageBody,
            linkUrl: landingPage || undefined,
            scheduledAtUtc,
          },
        });
        onSaved(t(`${TK}.updateSuccess`, { name }));
        return;
      }

      await createMutation.mutateAsync({
        name,
        audienceSegment: audience,
        messageBody,
        linkUrl: landingPage || undefined,
        scheduleMode: apiMode,
        scheduledAtUtc,
      });

      if (apiMode === SmsCampaignScheduleMode.SendNow) {
        onSaved(
          t(`${TK}.sendSuccessNow`, {
            total: totalSms,
            count: audienceCount,
            segment: t(`${TK}.${segmentCard.nameKey}`),
          }),
        );
        return;
      }
      if (apiMode === SmsCampaignScheduleMode.Scheduled) {
        onSaved(
          t(`${TK}.sendSuccessSchedule`, {
            total: totalSms,
            date: formatBookingHubDateDisplay(scheduleDate, numberLocale),
            time: formatBookingHubTimeDisplay(scheduleTime, numberLocale),
          }),
        );
        return;
      }
      onSaved(
        t(`${TK}.sendSuccessAuto`, {
          segment: t(`${TK}.${segmentCard.nameKey}`),
        }),
      );
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), "error");
    }
  };

  if (!open) return null;

  if (isEdit && campaignQuery.isError) {
    return (
      <div className="modal-overlay open" role="presentation">
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-header">
            <div className="modal-title">{t(`${TK}.composerTitle`)}</div>
            <button className="modal-close" type="button" onClick={onClose}>
              <CloseIcon className="marketing-icon" />
            </button>
          </div>
          <div className="modal-body">
            <p>{t(getErrorI18nKey(getApiErrorCode(campaignQuery.error)))}</p>
          </div>
        </div>
      </div>
    );
  }

  const whenLabel =
    scheduleMode === SmsComposerScheduleMode.Now
      ? t(`${TK}.confirmWhenNow`)
      : scheduleMode === SmsComposerScheduleMode.Schedule
        ? t(`${TK}.confirmWhenSchedule`, {
            date: scheduleDate
              ? formatBookingHubDateDisplay(scheduleDate, numberLocale)
              : scheduleDate,
            time: scheduleTime
              ? formatBookingHubTimeDisplay(scheduleTime, numberLocale)
              : scheduleTime,
          })
        : t(`${TK}.confirmWhenAuto`);

  const countLabel = new Intl.NumberFormat(numberLocale).format(audienceCount);
  const controlsDisabled = isSubmitting || isHydrating;
  const scheduleControlsDisabled = controlsDisabled || isEdit;
  const minScheduleDate = toLocalDateInputValue();
  const minScheduleTime =
    scheduleDate === minScheduleDate ? toLocalTimeInputValue() : undefined;

  const applyScheduleTime = (next: string) => {
    if (!next) {
      setScheduleTime(minScheduleTime ?? SMS_DEFAULT_SCHEDULE_TIME);
      return;
    }
    // Silent clamp — native mobile time pickers often ignore `min` visually.
    if (minScheduleTime && next < minScheduleTime) {
      setScheduleTime(minScheduleTime);
      return;
    }
    setScheduleTime(next);
  };

  const selectScheduleMode = () => {
    setScheduleMode(SmsComposerScheduleMode.Schedule);
    setScheduleDate((prev) =>
      prev && prev >= toLocalDateInputValue() ? prev : toLocalDateInputValue(),
    );
  };

  return (
    <div className="modal-overlay open" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="composerModalTitle"
        aria-busy={controlsDisabled}
      >
        <div className="modal-header">
          <div className="modal-title" id="composerModalTitle">
            <MegaphoneIcon className="marketing-icon" />
            <span>
              {isEdit ? t(`${TK}.composerEditTitle`) : t(`${TK}.composerTitle`)}
            </span>
          </div>
          <button
            ref={closeBtnRef}
            className="modal-close"
            type="button"
            aria-label={t(`${TK}.closeComposer`)}
            disabled={isSubmitting}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon" />
          </button>
        </div>

        <div className="modal-body" ref={modalBodyRef}>
          <div
            className="field-group"
            data-ai-hub-field={SMS_CREATE_FIELD.campaignName}
          >
            <div className="field-label">{t(`${TK}.campaignNameLabel`)}</div>
            <input
              className={`form-input${nameError ? " has-error" : ""}`}
              type="text"
              name={SMS_CAMPAIGN_NAME_INPUT}
              maxLength={200}
              value={campaignName}
              disabled={controlsDisabled}
              placeholder={t(`${TK}.campaignNamePlaceholder`)}
              aria-invalid={Boolean(nameError)}
              aria-required="true"
              onChange={(event) => {
                setCampaignName(event.target.value);
                if (nameError) setNameError("");
              }}
            />
            {nameError ? (
              <span className="field-error" role="alert" aria-live="polite">
                {nameError}
              </span>
            ) : null}
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepSegment`)}</div>
            <div className="segment-grid">
              {SMS_CAMPAIGN_COMPOSER_SEGMENTS.map((item) => {
                const count = getAudienceCount(audienceSummary, item.id);
                return (
                  <button
                    key={item.id}
                    className={`segment-btn${item.id === audience ? " selected" : ""}`}
                    type="button"
                    disabled={controlsDisabled}
                    onClick={() => {
                      setAudience(item.id);
                    }}
                  >
                    <span className="segment-btn-icon">
                      {SEGMENT_ICON[item.id]}
                    </span>
                    <span className="segment-btn-name">
                      {t(`${TK}.${item.shortNameKey}`)}
                    </span>
                    <span className="segment-btn-count">
                      {count.toLocaleString(numberLocale)}{" "}
                      {t(`${TK}.countCustomers`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepTemplate`)}</div>
            <div className="template-list">
              {templates.map((tpl) => (
                <button
                  key={tpl.titleKey}
                  className="template-item"
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => {
                    const next = t(`${TK}.${tpl.textKey}`);
                    setMessage(next);
                    messageSelectionRef.current = {
                      start: next.length,
                      end: next.length,
                    };
                  }}
                >
                  <div className="template-item-title">
                    <SparklesIcon className="marketing-icon is-compact" />
                    <span>{t(`${TK}.${tpl.titleKey}`)}</span>
                  </div>
                  <div className="template-item-text">
                    {t(`${TK}.${tpl.textKey}`)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div
            className="field-group"
            data-ai-hub-field={SMS_CREATE_FIELD.message}
          >
            <div className="field-label">{t(`${TK}.stepCompose`)}</div>
            <div className="sms-composer">
              <div className="sms-toolbar">
                <span>{t(`${TK}.insertTag`)}</span>
                {SMS_COMPOSER_TAGS.map((item) => (
                  <button
                    key={item.tag}
                    className="tag-btn"
                    type="button"
                    disabled={controlsDisabled}
                    onMouseDown={(event) => {
                      // Keep textarea focus/caret so tags insert at the cursor, not at 0.
                      event.preventDefault();
                    }}
                    onClick={() => insertTag(item.tag)}
                  >
                    {TAG_ICON[item.tag]}
                    <span>{t(`${TK}.${item.labelKey}`)}</span>
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className={`sms-textarea${messageError ? " has-error" : ""}`}
                value={message}
                disabled={controlsDisabled}
                placeholder={t(`${TK}.composePlaceholder`)}
                aria-invalid={Boolean(messageError)}
                onSelect={rememberMessageSelection}
                onKeyUp={rememberMessageSelection}
                onClick={rememberMessageSelection}
                onChange={(event) => {
                  setMessage(event.target.value);
                  rememberMessageSelection();
                  if (messageError) setMessageError("");
                }}
              />
              <div className="sms-footer">
                <span>{t(`${TK}.stopDisclaimer`)}</span>
                <span className={`char-count${charParts > 1 ? " multi" : ""}`}>
                  {t(`${TK}.charCount`, {
                    units: charUnits,
                    parts: charParts,
                    encoding: charEncoding,
                    perPart: charPerPart,
                  })}
                </span>
              </div>
            </div>
            {messageError ? (
              <span className="field-error" role="alert" aria-live="polite">
                {messageError}
              </span>
            ) : null}

            <div className="sms-preview">
              <div className="sms-preview-label">
                <SmartphoneIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.previewLabel`)}</span>
              </div>
              <div className="sms-bubble">
                {previewHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <span className="sms-preview-empty">
                    {t(`${TK}.previewEmpty`)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepLanding`)}</div>
            <div className="lp-attach-row">
              <select
                className="form-select"
                value={landingPage}
                disabled
                title={t(`${TK}.createLandingPageSoon`)}
                aria-label={t(`${TK}.stepLanding`)}
              >
                {SMS_LANDING_PAGE_OPTIONS.map((option) => (
                  <option key={option.value || "none"} value={option.value}>
                    {t(`${TK}.${option.labelKey}`)}
                  </option>
                ))}
              </select>
              <button
                className="btn-outline"
                type="button"
                disabled
                title={t(`${TK}.createLandingPageSoon`)}
                aria-label={t(`${TK}.createLandingPageSoon`)}
              >
                <PlusIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.createLandingPage`)}</span>
              </button>
            </div>
          </div>

          <div
            className={`field-group${scheduleError ? " has-error" : ""}`}
            ref={scheduleSectionRef}
            data-ai-hub-field={SMS_CREATE_FIELD.schedule}
          >
            <div className="field-label">{t(`${TK}.stepSchedule`)}</div>
            <div className="schedule-options">
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Now ? " selected" : ""}`}
                type="button"
                disabled={scheduleControlsDisabled}
                onClick={() => {
                  setScheduleMode(SmsComposerScheduleMode.Now);
                  if (scheduleError) setScheduleError("");
                }}
              >
                <span className="schedule-opt-icon">
                  <ZapIcon className="marketing-icon" />
                </span>
                <span className="schedule-opt-label">
                  {t(`${TK}.scheduleNow`)}
                </span>
              </button>
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Schedule ? " selected" : ""}`}
                type="button"
                disabled={scheduleControlsDisabled}
                onClick={() => {
                  selectScheduleMode();
                  if (scheduleError) setScheduleError("");
                }}
              >
                <span className="schedule-opt-icon">
                  <ClockIcon className="marketing-icon" />
                </span>
                <span className="schedule-opt-label">
                  {t(`${TK}.scheduleLater`)}
                </span>
              </button>
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Auto ? " selected" : ""}`}
                type="button"
                disabled={scheduleControlsDisabled}
                onClick={() => {
                  setScheduleMode(SmsComposerScheduleMode.Auto);
                  if (scheduleError) setScheduleError("");
                }}
              >
                <span className="schedule-opt-icon">
                  <RefreshCwIcon className="marketing-icon" />
                </span>
                <span className="schedule-opt-label">
                  {t(`${TK}.scheduleAuto`)}
                </span>
              </button>
            </div>
            {scheduleMode === SmsComposerScheduleMode.Schedule ? (
              <div className="time-input-row">
                <SmsScheduleDatePicker
                  value={scheduleDate}
                  minDate={minScheduleDate}
                  locale={numberLocale}
                  disabled={scheduleControlsDisabled}
                  placeholder={t(`${TK}.scheduleDatePlaceholder`)}
                  prevMonthAriaLabel={t(`${TK}.schedulePrevMonth`)}
                  nextMonthAriaLabel={t(`${TK}.scheduleNextMonth`)}
                  formatDisplay={formatBookingHubDateDisplay}
                  onChange={(next) => {
                    setScheduleDate(next);
                    if (scheduleError) setScheduleError("");
                  }}
                />
                <div
                  className={`schedule-datetime-shell${scheduleTime ? " has-value" : " is-empty"}`}
                  lang={`${numberLocale}-u-hc-h12`}
                >
                  <span
                    className="schedule-datetime-display"
                    aria-hidden="true"
                  >
                    {scheduleTime
                      ? formatBookingHubTimeDisplay(scheduleTime, numberLocale)
                      : t(`${TK}.scheduleTimePlaceholder`)}
                  </span>
                  <input
                    className={`form-input schedule-datetime-input${scheduleTime ? " has-value" : " is-empty"}`}
                    type="time"
                    lang={`${numberLocale}-u-hc-h12`}
                    step={60}
                    value={scheduleTime}
                    min={minScheduleTime}
                    disabled={scheduleControlsDisabled}
                    aria-label={t(`${TK}.scheduleTimePlaceholder`)}
                    onClick={(event) => {
                      const input = event.currentTarget;
                      if (minScheduleTime) {
                        input.min = minScheduleTime;
                        input.setAttribute("min", minScheduleTime);
                        if (!scheduleTime || scheduleTime < minScheduleTime) {
                          setScheduleTime(minScheduleTime);
                          input.value = minScheduleTime;
                        }
                      } else {
                        input.removeAttribute("min");
                      }
                      openDateTimePicker(input);
                    }}
                    onChange={(event) => {
                      applyScheduleTime(event.target.value);
                    }}
                  />
                </div>
              </div>
            ) : null}
            {scheduleError ? (
              <span className="field-error" role="alert" aria-live="polite">
                {scheduleError}
              </span>
            ) : null}
          </div>

          <div className="confirm-box show">
            <div className="confirm-title">
              <AlertTriangleIcon className="marketing-icon is-compact" />
              <span>{t(`${TK}.confirmTitle`)}</span>
            </div>
            <div className="confirm-detail">
              {t(`${TK}.confirmDetailSegment`)}{" "}
              <strong>{t(`${TK}.${segmentCard.nameKey}`)}</strong> ({countLabel}{" "}
              {t(`${TK}.countCustomers`)})
              <br />
              {t(`${TK}.confirmDetailSms`)} <strong>{totalSms} SMS</strong> (
              {parts} {t(`${TK}.perCustomer`)}, {encodingLabel})
              <br />
              {t(`${TK}.confirmDetailCost`)} <strong>${cost}</strong> —{" "}
              {t(`${TK}.confirmDetailDeduct`, { count: totalSms })}
              <br />
              {t(`${TK}.confirmDetailWhen`)} <strong>{whenLabel}</strong>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="cost-preview-group">
            <div
              className={`cost-preview${needsCreditWarning ? " warn" : ""}`}
            >
              <div className="cost-preview-info">
                <div className="cost-preview-label" aria-live="polite">
                  {!enoughCredits
                    ? t(`${TK}.costInsufficient`, {
                        credits: spendableCredits,
                      })
                    : lowCredits
                      ? t(`${TK}.costLowCredits`, {
                          credits: spendableCredits,
                        })
                      : t(`${TK}.costEstimate`)}
                </div>
                <div className="cost-preview-amount">
                  {t(`${TK}.costBreakdown`, {
                    customers: audienceCount,
                    parts,
                    total: totalSms,
                    cost,
                  })}
                </div>
              </div>
            </div>
            {onBuyCredits && needsCreditWarning ? (
              <button
                type="button"
                className="cost-preview-buy-button"
                onClick={onBuyCredits}
              >
                <WalletCardsIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.buyMoreCredits`)}</span>
              </button>
            ) : null}
          </div>
          <div className="modal-footer-actions">
            <button
              className="btn-outline"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t(`${TK}.cancel`)}
            </button>
            <button
              className="btn-primary"
              type="button"
              disabled={
                controlsDisabled ||
                (!enoughCredits &&
                  scheduleMode !== SmsComposerScheduleMode.Auto)
              }
              onClick={() => void handleSend()}
            >
              <SendIcon className="marketing-icon" />
              <span>
                {isSubmitting
                  ? t(`${TK}.saving`)
                  : isEdit
                    ? t(`${TK}.saveCampaign`)
                    : t(`${TK}.sendCampaign`)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
