import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import { useSubmitVoiceTrialRequest } from "../../../data/hooks/useSubmitVoiceTrialRequest";
import { imagesRepository } from "../../../data/repositories/images";
import {
  toVoiceTrialOperatingHours,
  VOICE_TRIAL_LIMITS,
  VOICE_TRIAL_PRICE_LIST_ACCEPT,
  VoiceTrialFormField,
  type SubmitVoiceTrialRequest,
} from "../../../data/voiceTrial/domain";
import { getApiErrorCode, isApiError } from "../../../types/domain";
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from "../../CountryCodeSelect";
import { applyAiHubProgressiveValidation } from "./bookingHubDialogValidation";
import {
  formatBookingHubTimeDisplay,
  openNativeDateTimePicker,
} from "./bookingHubFormatters";
import { ClockIcon } from "./BookingHubIcons";

const TK = "components.dashboard.views.BookingHubView.plans.trial";
const TK_HUB = "components.dashboard.views.BookingHubView";

const SERVICE_CHIPS = [
  "Gel Manicure",
  "Acrylic Full Set",
  "Dip Powder",
  "Pedicure",
  "Pedi + Gel",
  "Nail Art",
  "Waxing",
  "Eyelash",
  "Facial",
];

const DEFAULT_ACTIVE_SERVICES = new Set([
  "Gel Manicure",
  "Acrylic Full Set",
  "Pedicure",
]);

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type DayKey = (typeof DAY_KEYS)[number];

type HourRow = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

type HoursByDay = Record<DayKey, HourRow>;

const DEFAULT_OPEN_TIME = "09:00";
const DEFAULT_CLOSE_TIME = "19:00";

function createInitialHours(): HoursByDay {
  return {
    mon: { open: true, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    tue: { open: true, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    wed: { open: true, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    thu: { open: true, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    fri: { open: true, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    sat: { open: false, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
    sun: { open: false, openTime: DEFAULT_OPEN_TIME, closeTime: DEFAULT_CLOSE_TIME },
  };
}

function compareTime24h(left: string, right: string): number {
  const [leftHours, leftMinutes] = left
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  const [rightHours, rightMinutes] = right
    .split(":")
    .map((part) => Number.parseInt(part, 10));
  return leftHours * 60 + leftMinutes - (rightHours * 60 + rightMinutes);
}

function isHourTimeMissing(value: string | null | undefined): boolean {
  return !(value || "").trim();
}

function isSupportedPriceListFile(file: File): boolean {
  const fileName = (file.name || "").toLowerCase();
  const supportedExtension = /\.(png|jpe?g|webp)$/i.test(fileName);
  const supportedMime = /^image\/(png|jpe?g|webp)$/i.test(file.type || "");
  return (
    (supportedExtension || supportedMime) &&
    file.size <= VOICE_TRIAL_LIMITS.priceListFileMaxBytes
  );
}

function formatFileSizeLabel(bytes: number): string {
  const kb = Math.max(1, Math.round(bytes / 1024));
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function resolveTrialSubmitErrorCode(error: unknown): string {
  if (isApiError(error) && error.status === 429) {
    return "COMMON_RATE_LIMIT_EXCEEDED";
  }
  if (
    error &&
    typeof error === "object" &&
    "errorCode" in error &&
    typeof (error as { errorCode?: unknown }).errorCode === "string"
  ) {
    return (error as { errorCode: string }).errorCode;
  }
  return getApiErrorCode(error);
}

const PAIN_POINT_KEYS = {
  missed: `${TK}.painMissed`,
  retention: `${TK}.painRetention`,
  reviews: `${TK}.painReviews`,
  manual: `${TK}.painManual`,
  sms: `${TK}.painSms`,
} as const;

type PainPointValue = keyof typeof PAIN_POINT_KEYS;

type TrialFieldKey =
  | VoiceTrialFormField.Salon
  | VoiceTrialFormField.Owner
  | VoiceTrialFormField.Phone
  | VoiceTrialFormField.OwnerPhone
  | VoiceTrialFormField.Email
  | "services"
  | "openingDays"
  | "serviceHours"
  | "priceList"
  | VoiceTrialFormField.PainPoint;

type TrialFormErrors = Partial<Record<TrialFieldKey, string>>;

interface TrialFormState {
  salon: string;
  owner: string;
  phone: string;
  ownerPhone: string;
  email: string;
  city: string;
  website: string;
  referral: string;
  painPoint: string;
  hours: HoursByDay;
  activeServices: Set<string>;
  customServices: string[];
  customServiceInput: string;
  showCustomServiceInput: boolean;
  priceListFiles: File[];
}

function createInitialTrialForm(): TrialFormState {
  return {
    salon: "",
    owner: "",
    phone: "",
    ownerPhone: "",
    email: "",
    city: "",
    website: "",
    referral: "",
    painPoint: "",
    hours: createInitialHours(),
    activeServices: new Set(DEFAULT_ACTIVE_SERVICES),
    customServices: [],
    customServiceInput: "",
    showCustomServiceInput: false,
    priceListFiles: [],
  };
}

function TrialFieldError({ message }: { message?: string }) {
  return (
    <span className="trial-field-error-slot" aria-live="polite">
      {message ? <span className="trial-field-error">{message}</span> : null}
    </span>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="14"
      height="14"
    >
      <path
        d="m4 4 8 8M12 4 4 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="m3.5 8.5 3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <rect
        x="2.5"
        y="6"
        width="11"
        height="8"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M8 6V14M2.5 6h11M5.5 6C4.5 6 3.5 5.2 3.5 4.2S4.3 2.5 5.5 2.5 7.5 3.5 7.5 4.5M10.5 6c1 0 2-.8 2-1.8S11.7 2.5 10.5 2.5 8.5 3.5 8.5 4.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="14"
      height="14"
    >
      <path
        d="M8 13.5s3.5-1.5 3.5-5V4.5L8 2.5 4.5 4.5v4c0 3.5 3.5 5 3.5 5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <rect
        x="2"
        y="3.5"
        width="12"
        height="9"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="m2.5 4.5 5.5 4 5.5-4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="M6.5 9.5 10 6a2.1 2.1 0 0 0-3-3L3.5 6.5a3.2 3.2 0 0 0 4.5 4.5L12 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockNoteIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 5v3.2l2 1.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface TrialHourTimeFieldProps {
  value: string;
  disabled: boolean;
  invalid: boolean;
  locale: string;
  localeTag: string;
  ariaLabel: string;
  onChange: (value: string) => void;
}

function TrialHourTimeField({
  value,
  disabled,
  invalid,
  locale,
  localeTag,
  ariaLabel,
  onChange,
}: TrialHourTimeFieldProps) {
  const hasValue = !isHourTimeMissing(value);
  return (
    <span
      className={`booking-create-datetime-shell${hasValue ? " has-value" : " is-empty"}${invalid ? " has-error" : ""}`}
      lang={localeTag}
    >
      <span className="booking-create-datetime-display" aria-hidden="true">
        {formatBookingHubTimeDisplay(value, locale)}
      </span>
      <ClockIcon className="booking-create-datetime-icon" />
      <input
        className={`booking-create-datetime-input${hasValue ? " has-value" : ""}`}
        type="time"
        lang={localeTag}
        step={60}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        onClick={(event) => openNativeDateTimePicker(event.currentTarget)}
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

interface BookingTrialModalProps {
  open: boolean;
  onClose: () => void;
  /** Public landing submits without JWT (Swagger: POST trial-requests has no security). */
  anonymousSubmit?: boolean;
  /** When set, called after success toast instead of `onClose` (e.g. delayed home redirect). */
  onSubmitSuccess?: () => void;
}

export default function BookingTrialModal({
  open,
  onClose,
  anonymousSubmit = false,
  onSubmitSuccess,
}: BookingTrialModalProps) {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === "vi" ? "vi" : "en";
  const localeTag = `${locale === "vi" ? "vi-VN" : "en-US"}-u-hc-h12`;
  const { showToast } = useNotification();
  const submitTrial = useSubmitVoiceTrialRequest({
    anonymous: anonymousSubmit,
  });
  const [form, setForm] = useState<TrialFormState>(createInitialTrialForm);
  const [errors, setErrors] = useState<TrialFormErrors>({});
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [ownerPhoneTouched, setOwnerPhoneTouched] = useState(false);
  const trialDialogRef = useRef<HTMLDivElement>(null);
  const priceListInputRef = useRef<HTMLInputElement>(null);

  const phoneParsed = useMemo(() => parsePhone(form.phone), [form.phone]);
  const ownerPhoneParsed = useMemo(
    () => parsePhone(form.ownerPhone),
    [form.ownerPhone],
  );

  const getPhoneFieldError = (
    phoneValue: string,
    dialCode: string,
    requiredKey: string,
  ): string | undefined => {
    const parsed = parsePhone(phoneValue);
    if (!parsed.nationalNumber.trim()) {
      return t(requiredKey);
    }
    if (!isValidPhoneE164(phoneValue, dialCode)) {
      return t(`${TK}.validationPhoneInvalid`);
    }
    return undefined;
  };

  const applyPhoneFieldError = (
    field: VoiceTrialFormField.Phone | VoiceTrialFormField.OwnerPhone,
    phoneValue: string,
    dialCode: string,
    requiredKey: string,
  ) => {
    const phoneError = getPhoneFieldError(phoneValue, dialCode, requiredKey);
    setErrors((prev) => {
      const next = { ...prev };
      if (phoneError) next[field] = phoneError;
      else delete next[field];
      return next;
    });
  };

  const clearFieldError = (field: TrialFieldKey) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const patchForm = <K extends keyof TrialFormState>(
    key: K,
    value: TrialFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const patchFormField = (
    key: keyof Pick<
      TrialFormState,
      | "salon"
      | "owner"
      | "phone"
      | "ownerPhone"
      | "email"
      | "city"
      | "website"
      | "referral"
      | "painPoint"
      | "customServiceInput"
    >,
    value: string,
    errorField?: TrialFieldKey,
  ) => {
    patchForm(key, value);
    if (errorField) clearFieldError(errorField);
  };

  const resetForm = () => {
    setForm(createInitialTrialForm());
    setErrors({});
    setPhoneTouched(false);
    setOwnerPhoneTouched(false);
    if (priceListInputRef.current) priceListInputRef.current.value = "";
  };

  const serviceChips = [...SERVICE_CHIPS, ...form.customServices];

  const addCustomService = () => {
    const value = form.customServiceInput.trim();
    if (!value) {
      patchForm("showCustomServiceInput", false);
      return;
    }

    const exists = serviceChips.some(
      (chip) => chip.toLowerCase() === value.toLowerCase(),
    );
    const nextCustomServices = exists
      ? form.customServices
      : [...form.customServices, value];

    const matched = serviceChips.find(
      (chip) => chip.toLowerCase() === value.toLowerCase(),
    );
    const nextActiveServices = new Set(form.activeServices);
    nextActiveServices.add(matched ?? value);

    setForm((prev) => ({
      ...prev,
      customServices: nextCustomServices,
      activeServices: nextActiveServices,
      customServiceInput: "",
      showCustomServiceInput: false,
    }));
    clearFieldError("services");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleServiceChip = (value: string) => {
    setForm((prev) => {
      const next = new Set(prev.activeServices);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, activeServices: next };
    });
    clearFieldError("services");
  };

  const toggleHourDay = (day: DayKey) => {
    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], open: !prev.hours[day].open },
      },
    }));
    clearFieldError("openingDays");
    clearFieldError("serviceHours");
  };

  const updateHourTime = (
    day: DayKey,
    field: "openTime" | "closeTime",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value },
      },
    }));
    clearFieldError("serviceHours");
  };

  const syncPriceListInputFiles = (files: File[]) => {
    const input = priceListInputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
  };

  const handlePriceListChange = (fileList: FileList | null) => {
    const incoming = fileList ? Array.from(fileList) : [];
    // Native file input replaces on each pick — keep prior selections and append.
    if (incoming.length === 0) {
      syncPriceListInputFiles(form.priceListFiles);
      return;
    }

    if (incoming.some((file) => !isSupportedPriceListFile(file))) {
      syncPriceListInputFiles(form.priceListFiles);
      setErrors((prev) => ({
        ...prev,
        priceList: t(`${TK}.priceListInvalid`),
      }));
      return;
    }

    const fileKey = (file: File) =>
      `${file.name}::${file.size}::${file.lastModified}`;
    const merged = [...form.priceListFiles];
    for (const file of incoming) {
      if (!merged.some((existing) => fileKey(existing) === fileKey(file))) {
        merged.push(file);
      }
    }

    if (merged.length > VOICE_TRIAL_LIMITS.priceListUrlsMax) {
      syncPriceListInputFiles(form.priceListFiles);
      setErrors((prev) => ({
        ...prev,
        priceList: t(`${TK}.priceListTooMany`, {
          max: VOICE_TRIAL_LIMITS.priceListUrlsMax,
        }),
      }));
      return;
    }

    patchForm("priceListFiles", merged);
    clearFieldError("priceList");
    syncPriceListInputFiles(merged);
  };

  const removePriceListFile = (index: number) => {
    const nextFiles = form.priceListFiles.filter((_, i) => i !== index);
    patchForm("priceListFiles", nextFiles);
    clearFieldError("priceList");
    syncPriceListInputFiles(nextFiles);
  };

  const validateForm = (): TrialFormErrors => {
    const shopName = form.salon.trim();
    const ownerName = form.owner.trim();
    const emailValue = form.email.trim();
    const services = [...form.activeServices];
    const openingDayKeys = DAY_KEYS.filter((day) => form.hours[day].open);
    const painKey = PAIN_POINT_KEYS[form.painPoint as PainPointValue];
    const nextErrors: TrialFormErrors = {};

    if (!shopName)
      nextErrors[VoiceTrialFormField.Salon] = t(
        `${TK}.validationSalonRequired`,
      );
    if (!ownerName)
      nextErrors[VoiceTrialFormField.Owner] = t(
        `${TK}.validationOwnerRequired`,
      );
    const phoneError = getPhoneFieldError(
      form.phone,
      phoneParsed.countryCode,
      `${TK}.validationPhoneRequired`,
    );
    if (phoneError) nextErrors[VoiceTrialFormField.Phone] = phoneError;
    const ownerPhoneError = getPhoneFieldError(
      form.ownerPhone,
      ownerPhoneParsed.countryCode,
      `${TK}.validationOwnerPhoneRequired`,
    );
    if (ownerPhoneError)
      nextErrors[VoiceTrialFormField.OwnerPhone] = ownerPhoneError;
    if (!emailValue)
      nextErrors[VoiceTrialFormField.Email] = t(
        `${TK}.validationEmailRequired`,
      );
    else if (!/^\S+@\S+\.\S+$/.test(emailValue))
      nextErrors[VoiceTrialFormField.Email] = t(`${TK}.validationEmailInvalid`);
    if (services.length === 0)
      nextErrors.services = t(`${TK}.validationServicesRequired`);
    if (openingDayKeys.length === 0)
      nextErrors.openingDays = t(`${TK}.validationDaysRequired`);

    for (const day of openingDayKeys) {
      const row = form.hours[day];
      if (isHourTimeMissing(row.openTime) || isHourTimeMissing(row.closeTime)) {
        nextErrors.serviceHours = t(`${TK}.hoursDayRequired`, {
          day: t(`${TK}.days.${day}`),
        });
        break;
      }
      if (compareTime24h(row.closeTime, row.openTime) <= 0) {
        nextErrors.serviceHours = t(`${TK}.hoursDayInvalid`, {
          day: t(`${TK}.days.${day}`),
        });
        break;
      }
    }

    if (
      form.priceListFiles.length > VOICE_TRIAL_LIMITS.priceListUrlsMax ||
      form.priceListFiles.some((file) => !isSupportedPriceListFile(file))
    ) {
      nextErrors.priceList =
        form.priceListFiles.length > VOICE_TRIAL_LIMITS.priceListUrlsMax
          ? t(`${TK}.priceListTooMany`, {
              max: VOICE_TRIAL_LIMITS.priceListUrlsMax,
            })
          : t(`${TK}.priceListInvalid`);
    }

    if (!painKey)
      nextErrors[VoiceTrialFormField.PainPoint] = t(
        `${TK}.validationPainRequired`,
      );

    return nextErrors;
  };

  const buildPayload = (): SubmitVoiceTrialRequest | null => {
    const formErrors = validateForm();
    if (
      applyAiHubProgressiveValidation({
        allErrors: formErrors,
        root: trialDialogRef.current,
        setErrors: setErrors,
        showToast: (message, type) => showToast(message, type as 'warning'),
        fieldLabels: {
          salon: t(`${TK}.salonLabel`),
          owner: t(`${TK}.ownerLabel`),
          phone: t(`${TK}.phoneLabel`),
          ownerPhone: t(`${TK}.ownerPhoneLabel`),
          email: t(`${TK}.emailLabel`),
          services: t(`${TK}.servicesLabel`),
          openingDays: t(`${TK}.hoursLabel`),
          serviceHours: t(`${TK}.hoursLabel`),
          priceList: t(`${TK}.priceListLabel`),
          painPoint: t(`${TK}.painLabel`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return null;
    }

    const shopName = form.salon.trim();
    const ownerName = form.owner.trim();
    const phoneNumber = normalizePhoneE164(form.phone, phoneParsed.countryCode);
    const ownerPhoneNumber = normalizePhoneE164(
      form.ownerPhone,
      ownerPhoneParsed.countryCode,
    );
    const emailValue = form.email.trim();
    const services = [...form.activeServices];
    const painKey = PAIN_POINT_KEYS[form.painPoint as PainPointValue]!;
    const cityArea = form.city.trim();
    const website = form.website.trim();
    const referralCode = form.referral.trim();

    return {
      shopName,
      ownerName,
      phoneNumber,
      ownerPhoneNumber: ownerPhoneNumber || null,
      email: emailValue,
      cityArea: cityArea || null,
      website: website || null,
      services,
      operatingHours: toVoiceTrialOperatingHours(form.hours),
      biggestProblem: t(painKey),
      referralCode: referralCode || null,
    };
  };

  const handleSubmit = async () => {
    setPhoneTouched(true);
    setOwnerPhoneTouched(true);
    const payload = buildPayload();
    if (!payload) return;

    try {
      let priceListImageUrls: string[] | undefined;
      if (form.priceListFiles.length > 0) {
        const upload = anonymousSubmit
          ? (file: File) => imagesRepository.publicUploadAndGetUrl(file)
          : (file: File) => imagesRepository.uploadAndGetUrl(file);
        priceListImageUrls = await Promise.all(
          form.priceListFiles.map((file) => upload(file)),
        );
      }

      await submitTrial.mutateAsync({
        ...payload,
        ...(priceListImageUrls ? { priceListImageUrls } : {}),
      });
      if (onSubmitSuccess) {
        resetForm();
        onSubmitSuccess();
        return;
      }
      showToast(t(`${TK}.submitSuccess`), "success");
      handleClose();
    } catch (error) {
      showToast(
        t(getErrorI18nKey(resolveTrialSubmitErrorCode(error))),
        "error",
      );
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    applyPhoneFieldError(
      VoiceTrialFormField.Phone,
      form.phone,
      phoneParsed.countryCode,
      `${TK}.validationPhoneRequired`,
    );
  };

  const handleOwnerPhoneBlur = () => {
    setOwnerPhoneTouched(true);
    applyPhoneFieldError(
      VoiceTrialFormField.OwnerPhone,
      form.ownerPhone,
      ownerPhoneParsed.countryCode,
      `${TK}.validationOwnerPhoneRequired`,
    );
  };

  useEffect(() => {
    if (!phoneTouched) return;
    applyPhoneFieldError(
      VoiceTrialFormField.Phone,
      form.phone,
      phoneParsed.countryCode,
      `${TK}.validationPhoneRequired`,
    );
  }, [form.phone, phoneParsed.countryCode, phoneTouched]);

  useEffect(() => {
    if (!ownerPhoneTouched) return;
    applyPhoneFieldError(
      VoiceTrialFormField.OwnerPhone,
      form.ownerPhone,
      ownerPhoneParsed.countryCode,
      `${TK}.validationOwnerPhoneRequired`,
    );
  }, [form.ownerPhone, ownerPhoneParsed.countryCode, ownerPhoneTouched]);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => {
      let next = prev;
      if (!prev.phone.trim()) {
        next = { ...next, phone: PhoneDialCode.US };
      }
      if (!prev.ownerPhone.trim()) {
        next = { ...next, ownerPhone: PhoneDialCode.US };
      }
      return next;
    });
    setPhoneTouched(false);
    setOwnerPhoneTouched(false);
    setErrors({});
  }, [open]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return undefined;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="trial-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-modal-title"
    >
      <div className="trial-dialog" ref={trialDialogRef}>
        <button
          className="trial-close"
          type="button"
          aria-label={t(`${TK}.close`)}
          onClick={handleClose}
        >
          <CloseIcon />
        </button>

        <div className="trial-step">
          <div className="trial-head">
            <div className="trial-brand">
              <GiftIcon /> {t(`${TK}.brandBadge`)}
            </div>
            <h2 className="trial-title" id="trial-modal-title">
              {t(`${TK}.titleLead`)}
              <strong>{t(`${TK}.titleHighlight`)}</strong>
            </h2>
            <p className="trial-subtitle">{t(`${TK}.subtitle`)}</p>
          </div>

          <div className="trial-benefits">
            <div className="trial-benefit">
              <CheckIcon /> {t(`${TK}.benefitSetup`)}
            </div>
            <div className="trial-benefit">
              <CheckIcon /> {t(`${TK}.benefitCancel`)}
            </div>
            <div className="trial-benefit">
              <CheckIcon /> {t(`${TK}.benefitVietnamese`)}
            </div>
          </div>

          <div className="trial-scroll">
            <div className="trial-body">
              <div className="trial-grid">
              <div
                className={`trial-field ${errors.salon ? "has-error" : ""}`}
                data-ai-hub-field="salon"
              >
                <label className="trial-label" htmlFor="trial-salon">
                  {t(`${TK}.salonLabel`)} <span>*</span>
                </label>
                <input
                  className={`trial-input ${errors.salon ? "has-error" : ""}`}
                  id="trial-salon"
                  type="text"
                  value={form.salon}
                  placeholder={t(`${TK}.salonPlaceholder`)}
                  onChange={(e) =>
                    patchFormField(
                      VoiceTrialFormField.Salon,
                      e.target.value,
                      VoiceTrialFormField.Salon,
                    )
                  }
                />
                <TrialFieldError message={errors.salon} />
              </div>

              <div
                className={`trial-field ${errors.phone ? "has-error" : ""}`}
                data-ai-hub-field="phone"
              >
                <label className="trial-label" htmlFor="trial-phone">
                  {t(`${TK}.phoneLabel`)} <span>*</span>
                </label>
                <span className="phone-input-shell trial-phone-input-shell">
                  <CountryCodeSelect
                    value={phoneParsed.countryCode}
                    embedded
                    onChange={(nextCode) => {
                      const formatted = formatNationalNumber(
                        phoneParsed.nationalNumber,
                        nextCode,
                      );
                      const nextPhone = `${nextCode} ${formatted}`.trim();
                      patchForm(VoiceTrialFormField.Phone, nextPhone);
                      if (phoneTouched) {
                        applyPhoneFieldError(
                          VoiceTrialFormField.Phone,
                          nextPhone,
                          nextCode,
                          `${TK}.validationPhoneRequired`,
                        );
                      } else {
                        clearFieldError(VoiceTrialFormField.Phone);
                      }
                    }}
                  />
                  <input
                    className="trial-input phone-mask-input"
                    id="trial-phone"
                    type="tel"
                    value={formatNationalNumber(
                      phoneParsed.nationalNumber,
                      phoneParsed.countryCode,
                    )}
                    aria-invalid={Boolean(errors.phone)}
                    placeholder={getNationalPhonePlaceholder(
                      phoneParsed.countryCode,
                    )}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    onBlur={handlePhoneBlur}
                    onChange={(event) => {
                      const formatted = formatNationalNumber(
                        event.target.value,
                        phoneParsed.countryCode,
                      );
                      patchFormField(
                        VoiceTrialFormField.Phone,
                        `${phoneParsed.countryCode} ${formatted}`.trim(),
                        VoiceTrialFormField.Phone,
                      );
                    }}
                  />
                </span>
                <TrialFieldError message={errors.phone} />
              </div>

              <div
                className={`trial-field ${errors.owner ? "has-error" : ""}`}
                data-ai-hub-field="owner"
              >
                <label className="trial-label" htmlFor="trial-owner">
                  {t(`${TK}.ownerLabel`)} <span>*</span>
                </label>
                <input
                  className={`trial-input ${errors.owner ? "has-error" : ""}`}
                  id="trial-owner"
                  type="text"
                  value={form.owner}
                  placeholder={t(`${TK}.ownerPlaceholder`)}
                  onChange={(e) =>
                    patchFormField(
                      VoiceTrialFormField.Owner,
                      e.target.value,
                      VoiceTrialFormField.Owner,
                    )
                  }
                />
                <TrialFieldError message={errors.owner} />
              </div>

              <div
                className={`trial-field ${errors.ownerPhone ? "has-error" : ""}`}
                data-ai-hub-field="ownerPhone"
              >
                <label className="trial-label" htmlFor="trial-owner-phone">
                  {t(`${TK}.ownerPhoneLabel`)} <span>*</span>
                </label>
                <span className="phone-input-shell trial-phone-input-shell">
                  <CountryCodeSelect
                    value={ownerPhoneParsed.countryCode}
                    embedded
                    onChange={(nextCode) => {
                      const formatted = formatNationalNumber(
                        ownerPhoneParsed.nationalNumber,
                        nextCode,
                      );
                      const nextPhone = `${nextCode} ${formatted}`.trim();
                      patchForm(VoiceTrialFormField.OwnerPhone, nextPhone);
                      if (ownerPhoneTouched) {
                        applyPhoneFieldError(
                          VoiceTrialFormField.OwnerPhone,
                          nextPhone,
                          nextCode,
                          `${TK}.validationOwnerPhoneRequired`,
                        );
                      } else {
                        clearFieldError(VoiceTrialFormField.OwnerPhone);
                      }
                    }}
                  />
                  <input
                    className="trial-input phone-mask-input"
                    id="trial-owner-phone"
                    type="tel"
                    value={formatNationalNumber(
                      ownerPhoneParsed.nationalNumber,
                      ownerPhoneParsed.countryCode,
                    )}
                    aria-invalid={Boolean(errors.ownerPhone)}
                    placeholder={getNationalPhonePlaceholder(
                      ownerPhoneParsed.countryCode,
                    )}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    onBlur={handleOwnerPhoneBlur}
                    onChange={(event) => {
                      const formatted = formatNationalNumber(
                        event.target.value,
                        ownerPhoneParsed.countryCode,
                      );
                      patchFormField(
                        VoiceTrialFormField.OwnerPhone,
                        `${ownerPhoneParsed.countryCode} ${formatted}`.trim(),
                        VoiceTrialFormField.OwnerPhone,
                      );
                    }}
                  />
                </span>
                <TrialFieldError message={errors.ownerPhone} />
              </div>

              <div
                className={`trial-field trial-span-2 ${errors.email ? "has-error" : ""}`}
                data-ai-hub-field="email"
              >
                <label className="trial-label" htmlFor="trial-email">
                  {t(`${TK}.emailLabel`)} <span>*</span>
                </label>
                <input
                  className={`trial-input ${errors.email ? "has-error" : ""}`}
                  id="trial-email"
                  type="email"
                  value={form.email}
                  placeholder={t(`${TK}.emailPlaceholder`)}
                  onChange={(e) =>
                    patchFormField(
                      VoiceTrialFormField.Email,
                      e.target.value,
                      VoiceTrialFormField.Email,
                    )
                  }
                />
                {!errors.email ? (
                  <div className="trial-note">
                    <EnvelopeIcon /> {t(`${TK}.emailNote`)}
                  </div>
                ) : null}
                <TrialFieldError message={errors.email} />
              </div>

              <div className="trial-field trial-span-2">
                <label className="trial-label" htmlFor="trial-city">
                  {t(`${TK}.cityLabel`)}{" "}
                  <span className="trial-optional">{t(`${TK}.optional`)}</span>
                </label>
                <input
                  className="trial-input"
                  id="trial-city"
                  type="text"
                  value={form.city}
                  placeholder={t(`${TK}.cityPlaceholder`)}
                  onChange={(e) =>
                    patchFormField(VoiceTrialFormField.City, e.target.value)
                  }
                />
              </div>

              <div className="trial-field trial-span-2">
                <label className="trial-label" htmlFor="trial-website">
                  {t(`${TK}.websiteLabel`)}{" "}
                  <span className="trial-optional">{t(`${TK}.optional`)}</span>
                </label>
                <input
                  className="trial-input"
                  id="trial-website"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  value={form.website}
                  placeholder={t(`${TK}.websitePlaceholder`)}
                  onChange={(e) => patchFormField("website", e.target.value)}
                />
              </div>

              <div
                className={`trial-field trial-span-2 ${errors.services || errors.priceList ? "has-error" : ""}`}
                data-ai-hub-field="services"
              >
                <div className="trial-label">
                  {t(`${TK}.servicesLabel`)} <span>*</span>{" "}
                  <span className="trial-optional">
                    {t(`${TK}.tapToSelect`)}
                  </span>
                </div>
                <div className="trial-chip-list">
                  {serviceChips.map((chip) => (
                    <button
                      key={chip}
                      className={`trial-chip ${form.activeServices.has(chip) ? "is-active" : ""}`}
                      type="button"
                      onClick={() => toggleServiceChip(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    className="trial-chip trial-chip-add"
                    type="button"
                    aria-label={t(`${TK}.addService`)}
                    title={t(`${TK}.addService`)}
                    onClick={() => patchForm("showCustomServiceInput", true)}
                  >
                    +
                  </button>
                </div>
                {form.showCustomServiceInput ? (
                  <div className="trial-custom-service-row">
                    <input
                      className="trial-input trial-custom-service-input"
                      type="text"
                      value={form.customServiceInput}
                      placeholder={t(`${TK}.customServicePlaceholder`)}
                      autoFocus
                      onChange={(event) =>
                        patchFormField(
                          VoiceTrialFormField.CustomServiceInput,
                          event.target.value,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomService();
                        }
                        if (event.key === "Escape") {
                          patchForm("customServiceInput", "");
                          patchForm("showCustomServiceInput", false);
                        }
                      }}
                    />
                    <button
                      className="trial-custom-service-add"
                      type="button"
                      onClick={addCustomService}
                    >
                      {t(`${TK}.addService`)}
                    </button>
                  </div>
                ) : null}
                <TrialFieldError message={errors.services} />

                <div
                  className="trial-field trial-service-price-list"
                  data-ai-hub-field="priceList"
                >
                  <label className="trial-label" htmlFor="trial-price-list">
                    {t(`${TK}.priceListLabel`)}{" "}
                    <span className="trial-optional">
                      {t(`${TK}.optional`)}
                    </span>
                  </label>
                  <input
                    ref={priceListInputRef}
                    className={`trial-input trial-file-input${errors.priceList ? " has-error" : ""}`}
                    id="trial-price-list"
                    type="file"
                    multiple
                    accept={VOICE_TRIAL_PRICE_LIST_ACCEPT}
                    aria-invalid={Boolean(errors.priceList)}
                    onChange={(event) =>
                      handlePriceListChange(event.target.files)
                    }
                  />
                  {form.priceListFiles.length === 0 ? (
                    <div className="trial-note">
                      <PaperclipIcon />
                      <span>{t(`${TK}.priceListEmpty`)}</span>
                    </div>
                  ) : (
                    <div className="trial-price-list-selected">
                      {form.priceListFiles.map((file, index) => (
                        <div
                          className="trial-price-list-chip"
                          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                        >
                          <PaperclipIcon />
                          <span>
                            {t(`${TK}.priceListSelected`, {
                              name: file.name,
                              size: formatFileSizeLabel(file.size),
                            })}
                          </span>
                          <button
                            className="trial-price-list-remove"
                            type="button"
                            aria-label={t(`${TK}.priceListRemove`, {
                              name: file.name,
                            })}
                            onClick={() => removePriceListFile(index)}
                          >
                            <CloseIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <TrialFieldError message={errors.priceList} />
                </div>
              </div>

              <div
                className={`trial-field trial-span-2 ${errors.openingDays || errors.serviceHours ? "has-error" : ""}`}
                data-ai-hub-field="openingDays"
              >
                <div className="trial-label">{t(`${TK}.hoursLabel`)}</div>
                <div className="settings-hours trial-hours-list">
                  {DAY_KEYS.map((day) => {
                    const row = form.hours[day];
                    const openMissing = isHourTimeMissing(row.openTime);
                    const closeMissing = isHourTimeMissing(row.closeTime);
                    const rangeInvalid =
                      !openMissing &&
                      !closeMissing &&
                      compareTime24h(row.closeTime, row.openTime) <= 0;
                    const showHoursError =
                      Boolean(errors.serviceHours) && row.open;
                    const openInvalid =
                      showHoursError && (openMissing || rangeInvalid);
                    const closeInvalid =
                      showHoursError && (closeMissing || rangeInvalid);
                    return (
                      <div
                        className={`settings-hour-row ${row.open ? "" : "is-closed"}`}
                        key={day}
                        onClick={() => toggleHourDay(day)}
                      >
                        <label
                          className="settings-hour-toggle"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={row.open}
                            onChange={() => toggleHourDay(day)}
                          />
                          <span>{t(`${TK}.days.${day}`)}</span>
                        </label>
                        <div
                          className="settings-hour-times"
                          onClick={(event) => {
                            if (row.open) event.stopPropagation();
                          }}
                        >
                          <TrialHourTimeField
                            value={row.openTime}
                            disabled={!row.open}
                            invalid={openInvalid}
                            locale={locale}
                            localeTag={localeTag}
                            ariaLabel={t(`${TK}.openTimeAria`, {
                              day: t(`${TK}.days.${day}`),
                            })}
                            onChange={(next) =>
                              updateHourTime(day, "openTime", next)
                            }
                          />
                          <span className="settings-hour-to">
                            {t(`${TK}.scheduleTo`)}
                          </span>
                          <TrialHourTimeField
                            value={row.closeTime}
                            disabled={!row.open}
                            invalid={closeInvalid}
                            locale={locale}
                            localeTag={localeTag}
                            ariaLabel={t(`${TK}.closeTimeAria`, {
                              day: t(`${TK}.days.${day}`),
                            })}
                            onChange={(next) =>
                              updateHourTime(day, "closeTime", next)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="trial-note">
                  <ClockNoteIcon /> {t(`${TK}.hoursNote`)}
                </div>
                <TrialFieldError
                  message={errors.openingDays || errors.serviceHours}
                />
              </div>

              <div
                className={`trial-field trial-span-2 ${errors.painPoint ? "has-error" : ""}`}
                data-ai-hub-field="painPoint"
              >
                <label className="trial-label" htmlFor="trial-pain">
                  {t(`${TK}.painLabel`)}{" "}
                  <span className="trial-optional">{t(`${TK}.painHint`)}</span>
                </label>
                <select
                  className={`trial-select ${errors.painPoint ? "has-error" : ""}`}
                  id="trial-pain"
                  value={form.painPoint}
                  onChange={(e) =>
                    patchFormField(
                      VoiceTrialFormField.PainPoint,
                      e.target.value,
                      VoiceTrialFormField.PainPoint,
                    )
                  }
                >
                  <option value="">{t(`${TK}.painDefault`)}</option>
                  <option value="missed">{t(`${TK}.painMissed`)}</option>
                  <option value="retention">{t(`${TK}.painRetention`)}</option>
                  <option value="reviews">{t(`${TK}.painReviews`)}</option>
                  <option value="manual">{t(`${TK}.painManual`)}</option>
                  <option value="sms">{t(`${TK}.painSms`)}</option>
                </select>
                <TrialFieldError message={errors.painPoint} />
              </div>

              <div className="trial-field trial-span-2">
                <label className="trial-label" htmlFor="trial-ref">
                  {t(`${TK}.referralLabel`)}{" "}
                  <span className="trial-optional">{t(`${TK}.optional`)}</span>
                </label>
                <input
                  className="trial-input trial-input-uppercase"
                  id="trial-ref"
                  type="text"
                  value={form.referral}
                  placeholder={t(`${TK}.referralPlaceholder`)}
                  onChange={(e) =>
                    patchFormField(
                      VoiceTrialFormField.Referral,
                      e.target.value.toUpperCase(),
                    )
                  }
                />
                <div className="trial-credit">
                  <GiftIcon /> {t(`${TK}.referralCredit`)}
                </div>
              </div>
            </div>

            <div className="trial-actions">
              <button
                className="trial-submit"
                type="button"
                disabled={submitTrial.isPending}
                onClick={handleSubmit}
              >
                <RocketIcon />
                {submitTrial.isPending
                  ? t(`${TK}.submitting`)
                  : t(`${TK}.submit`)}
              </button>
              <div className="trial-footer">{t(`${TK}.footer`)}</div>
            </div>
          </div>
          </div>

          <div className="trial-contact">
            {t(`${TK}.contactLine`)}
            <br />
            <strong>832-979-5559</strong> ({t(`${TK}.contactTry`)}) ·{" "}
            <a href="https://nexoratouch.com" target="_blank" rel="noreferrer">
              nexoratouch.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
