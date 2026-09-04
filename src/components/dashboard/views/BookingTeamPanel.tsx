import React, { useEffect, useMemo, useRef, useState } from "react";
import { BOOKING_HUB_PAGE_SIZE } from "../../../constants/pagination";
import { TWELVE_HOUR_INPUT_LANG } from "../../../constants/timeFormat";
import { BOOKING_HUB_PAGINATION_CLASSNAME } from "./bookingHubFormatters";
import { applyAiHubProgressiveValidation } from "./bookingHubDialogValidation";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import {
  useCreateMerchantVoiceStaff,
  useMerchantVoiceBusinessStaff,
  useMerchantVoiceServiceCategories,
  useMerchantVoiceServices,
  useMerchantVoiceStaff,
  useMerchantVoiceStaffById,
  useToggleMerchantVoiceStaffStatus,
  useUpdateMerchantVoiceStaff,
} from "../../../data/hooks/useMerchantVoiceBookings";
import {
  useMerchantStaff,
  useResolveMerchantStaffLink,
} from "../../../data/hooks/useMerchantStaff";
import {
  useCreateLocalStaffProfile,
  useUpdateLocalStaff,
} from "../../../data/hooks/useLocalStaff";
import { usePosRoles } from "../../../data/hooks/usePosRoles";
import {
  useSaveStaffPosProfile,
  useSaveStaffServiceAssignments,
  useUpdateStaffWeeklySchedule,
} from "../../../data/hooks/usePosStaffProfile";
import {
  buildMerchantVoiceServiceSections,
  flattenMerchantVoiceServiceSections,
} from "../../../data/merchantVoice/serviceCatalog";
import {
  isStaffStatusActive,
  mapDayOfWeekToApiName,
  mapStaffStatusToActivityApi,
  MerchantVoiceDayOfWeek,
  MerchantVoiceStaffStatus,
  normalizeMerchantVoiceDayOfWeek,
  type MerchantVoiceStaffDto,
} from "../../../data/repositories/merchantVoice";
import { usePagination } from "../../../hooks/usePagination";
import { getApiErrorCode } from "../../../types/domain";
import { splitFullName } from "../../../utils/staffName";
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  normalizePhoneE164,
  parsePhone,
} from "../../CountryCodeSelect";
import Pagination from "../../ui/Pagination";
import {
  ClockIcon,
  PencilIcon,
  SpinnerIcon,
  XLgIcon,
} from "./BookingHubIcons";
import {
  BookingTeamGridSkeleton,
  BookingTechModalProfileSkeleton,
  BookingTechScheduleSkeleton,
  BookingTechServicesSkeleton,
  BookingTechStaffListSkeleton,
} from "./BookingHubSkeletons";
import { useBookingHubVoiceEnabled } from "./BookingHubVoiceContext";
import { openNativeDateTimePicker } from "./bookingHubFormatters";

const TK = "components.dashboard.views.BookingHubView.team";
const TK_HUB = "components.dashboard.views.BookingHubView";
const POS_TK = "components.dashboard.views.pos.PosStaffProfileView";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const DEFAULT_SCHEDULE_START = "09:00";
const DEFAULT_SCHEDULE_END = "19:00";

type DayKey = (typeof DAY_KEYS)[number];
type ModalMode = "create" | "edit" | "detail";
type PosPayStructureType = "Commission" | "WeeklySalary" | "AgreedAmount";

interface DaySchedule {
  dayOff: boolean;
  start: string;
  end: string;
}

type WeeklySchedule = Record<DayKey, DaySchedule>;

interface TeamMember {
  id: string;
  staffProfileId: string | null;
  name: string;
  phone: string;
  email: string;
  services: string[];
  schedule: string;
  customers: number;
  avatar: string;
  avatarStyle?: React.CSSProperties;
  smsEnabled: boolean;
}

interface BusinessStaffOption {
  id: string;
  linkId?: string | null;
  name: string;
  phone: string;
  email: string;
  position: string;
  isAlreadyAdded: boolean;
  avatar: string;
  avatarStyle?: React.CSSProperties;
}

const INITIAL_TEAM_MEMBERS: TeamMember[] = [];

const DAY_KEY_TO_API_DAY: Record<DayKey, MerchantVoiceDayOfWeek> = {
  sun: MerchantVoiceDayOfWeek.Sunday,
  mon: MerchantVoiceDayOfWeek.Monday,
  tue: MerchantVoiceDayOfWeek.Tuesday,
  wed: MerchantVoiceDayOfWeek.Wednesday,
  thu: MerchantVoiceDayOfWeek.Thursday,
  fri: MerchantVoiceDayOfWeek.Friday,
  sat: MerchantVoiceDayOfWeek.Saturday,
};

const API_DAY_TO_DAY_KEY: Record<MerchantVoiceDayOfWeek, DayKey> = {
  [MerchantVoiceDayOfWeek.Sunday]: "sun",
  [MerchantVoiceDayOfWeek.Monday]: "mon",
  [MerchantVoiceDayOfWeek.Tuesday]: "tue",
  [MerchantVoiceDayOfWeek.Wednesday]: "wed",
  [MerchantVoiceDayOfWeek.Thursday]: "thu",
  [MerchantVoiceDayOfWeek.Friday]: "fri",
  [MerchantVoiceDayOfWeek.Saturday]: "sat",
};

function normalizeDayKey(
  dayOfWeek: number | string | undefined | null,
): DayKey | null {
  const day = normalizeMerchantVoiceDayOfWeek(dayOfWeek);
  if (day === null) return null;
  return API_DAY_TO_DAY_KEY[day] ?? null;
}

function normalizeScheduleTime(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed.slice(0, 5);

  const hour = Number(match[1]);
  const minute = match[2];
  if (hour < 0 || hour > 23) return trimmed.slice(0, 5);
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function createDaySchedule(dayOff = false): DaySchedule {
  return {
    dayOff,
    start: DEFAULT_SCHEDULE_START,
    end: DEFAULT_SCHEDULE_END,
  };
}

function schedulesToWeeklySchedule(
  schedules: MerchantVoiceStaffDto["schedules"] | undefined,
): WeeklySchedule {
  const schedule = emptySchedule();

  DAY_KEYS.forEach((key) => {
    schedule[key] = createDaySchedule(true);
  });

  for (const item of schedules ?? []) {
    const day = normalizeDayKey(item.dayOfWeek);
    if (!day) continue;

    if (item.isDayOff) {
      schedule[day] = createDaySchedule(true);
      continue;
    }

    schedule[day] = {
      dayOff: false,
      start: normalizeScheduleTime(item.startTime) || DEFAULT_SCHEDULE_START,
      end: normalizeScheduleTime(item.endTime) || DEFAULT_SCHEDULE_END,
    };
  }

  return schedule;
}

function emptySchedule(): WeeklySchedule {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = createDaySchedule(false);
    return acc;
  }, {} as WeeklySchedule);
}

function parseSchedule(raw?: string): WeeklySchedule {
  const schedule = emptySchedule();
  if (!raw) {
    return DAY_KEYS.reduce((acc, key) => {
      acc[key] = createDaySchedule(true);
      return acc;
    }, {} as WeeklySchedule);
  }

  DAY_KEYS.forEach((key) => {
    schedule[key] = createDaySchedule(true);
  });

  raw.split(";").forEach((part) => {
    const [dayPart, times] = part.split("=");
    if (!dayPart || !times || !DAY_KEYS.includes(dayPart as DayKey)) return;
    const [start, end] = times.split("-");
    schedule[dayPart as DayKey] = {
      dayOff: false,
      start: start || DEFAULT_SCHEDULE_START,
      end: end || DEFAULT_SCHEDULE_END,
    };
  });

  return schedule;
}

function formatSkills(skills: string | null | undefined): string[] {
  if (!skills) return [];
  const parsed = skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed;
}

function scheduleToString(staff: MerchantVoiceStaffDto) {
  return (staff.schedules || [])
    .filter((item) => !item.isDayOff && item.startTime && item.endTime)
    .map((item) => {
      const day = normalizeDayKey(item.dayOfWeek);
      if (!day) return null;
      const start = normalizeScheduleTime(item.startTime);
      const end = normalizeScheduleTime(item.endTime);
      if (!start || !end) return null;
      return `${day}=${start}-${end}`;
    })
    .filter(Boolean)
    .join(";");
}

function toTeamMember(staff: MerchantVoiceStaffDto, unnamedLabel: string): TeamMember {
  const first = staff.fullName?.trim()?.charAt(0)?.toUpperCase() || "T";
  return {
    id: staff.id,
    staffProfileId: staff.staffProfileId ?? null,
    name: staff.fullName || unnamedLabel,
    phone: staff.phoneNumber || "",
    email: staff.email || "",
    services: formatSkills(staff.skills),
    schedule: scheduleToString(staff),
    customers: 0,
    avatar: first,
    smsEnabled: isStaffStatusActive(staff.status),
  };
}

function formatPhoneDisplay(phone: string | null | undefined): string {
  const raw = phone?.trim();
  if (!raw) return "—";
  const parsed = parsePhone(raw);
  const national = formatNationalNumber(
    parsed.nationalNumber,
    parsed.countryCode,
  );
  if (!national) return raw;
  return `${parsed.countryCode} ${national}`.trim();
}

function isScheduleRowMissingTime(row: DaySchedule): boolean {
  if (row.dayOff) return false;
  return !row.start || !row.end;
}

function getScheduleRowError(
  row: DaySchedule,
  requiredMessage: string,
  invalidMessage: string,
): string | null {
  if (row.dayOff) return null;
  if (!row.start || !row.end) return requiredMessage;
  if (row.end <= row.start) return invalidMessage;
  return null;
}

function hasScheduleValidationError(
  schedule: WeeklySchedule,
  requiredMessage: string,
  invalidMessage: string,
): boolean {
  return DAY_KEYS.some(
    (day) =>
      getScheduleRowError(schedule[day], requiredMessage, invalidMessage) !==
      null,
  );
}

function isScheduleRowInvalid(row: DaySchedule): boolean {
  if (row.dayOff || !row.start || !row.end) return false;
  return row.end <= row.start;
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PersonPlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 4v4M10 6h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M1.5 13c0-2 1.8-3.6 4-3.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="11" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8.5 13c.2-1.8 1.6-3.2 3.5-3.2 1 0 1.9.4 2.5 1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PersonCardIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="6" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M4 11c.4-1.2 1.3-2 2.5-2h1c1.2 0 2.1.8 2.5 2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ServicesListIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5 6h.01M7 6h4M5 8h.01M7 8h4M5 10h.01M7 10h4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RolePayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <rect
        x="3"
        y="2"
        width="10"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M6 5.5h4M6 8h4M6 10.5h2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarWeekIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M2 6.5h12M5 1.5v2.5M11 1.5v2.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M5 9h1.5M7.75 9H9.25M10.75 9h1.5M5 11.5h1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TechScheduleTimeBox({
  value,
  disabled,
  invalid,
  ariaLabel,
  onChange,
}: {
  value: string;
  disabled: boolean;
  invalid: boolean;
  ariaLabel: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className="settings-time-box"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        const input = event.currentTarget.querySelector("input");
        if (input instanceof HTMLInputElement) {
          openNativeDateTimePicker(input);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) return;
          openNativeDateTimePicker(
            event.currentTarget.querySelector("input"),
          );
        }
      }}
    >
      <input
        className="settings-hour-input"
        type="time"
        value={value}
        lang={TWELVE_HOUR_INPUT_LANG}
        step={60}
        disabled={disabled}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
      />
      <ClockIcon />
    </div>
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
      width="13"
      height="13"
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

interface Props {
  /** When true, render without Booking Book sub-panel / overview-card chrome (Settings embed). */
  embedded?: boolean
  /** Reuse only the create-technician dialog without rendering the AI Hub team roster. */
  createModalOnly?: boolean
  onCreateModalClose?: () => void
  /** Add POS role/pay fields and persist them after the shared staff record. */
  posPayEnabled?: boolean
}

export default function BookingTeamPanel({
  embedded = false,
  createModalOnly = false,
  onCreateModalClose,
  posPayEnabled = false,
}: Props) {
  const { t } = useTranslation();
  const { showToast } = useNotification();
  const voiceEnabled = useBookingHubVoiceEnabled();
  const [modalOpen, setModalOpen] = useState(createModalOnly);
  const [modalMode, setModalMode] = useState<ModalMode>(
    createModalOnly ? "create" : "edit",
  );
  const [selectedId, setSelectedId] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftServices, setDraftServices] = useState<string[]>([]);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [openServiceCategoryIds, setOpenServiceCategoryIds] = useState(
    () => new Set<string>(),
  );
  const [draftStaffProfileId, setDraftStaffProfileId] = useState<string | null>(
    null,
  );
  const [draftBusinessStaffLinkId, setDraftBusinessStaffLinkId] = useState<
    string | null
  >(null);
  const [draftCreatedLocalStaffProfileId, setDraftCreatedLocalStaffProfileId] =
    useState<string | null>(null);
  const [draftPosRoleId, setDraftPosRoleId] = useState("");
  const [draftPayStructureType, setDraftPayStructureType] =
    useState<PosPayStructureType>("Commission");
  const [draftCommissionPercent, setDraftCommissionPercent] = useState("60");
  const [draftWeeklySalaryAmount, setDraftWeeklySalaryAmount] = useState("");
  const [draftAgreedAmount, setDraftAgreedAmount] = useState("");
  const [draftTipsEnabled, setDraftTipsEnabled] = useState(true);
  const [draftSchedule, setDraftSchedule] =
    useState<WeeklySchedule>(emptySchedule());
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    services?: string;
    posPay?: string;
  }>({});
  const [showScheduleValidation, setShowScheduleValidation] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const checkAllServicesRef = useRef<HTMLInputElement>(null);
  const technicianNameInputRef = useRef<HTMLInputElement>(null);
  const techDialogRef = useRef<HTMLDivElement>(null);
  const techModalBodyRef = useRef<
    HTMLDivElement & { inert: boolean }
  >(null);
  const saveInFlightRef = useRef(false);
  const [saveInFlight, setSaveInFlight] = useState(false);
  const { pageNumber, pageSize, setPage } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  });
  const {
    data: staffResponse,
    isLoading: isStaffLoading,
    isFetching: isStaffFetching,
  } = useMerchantVoiceStaff(
    {
      pageNumber,
      pageSize,
    },
    { enabled: voiceEnabled },
  );
  const { data: businessStaffResponse, isLoading: isBusinessStaffLoading } =
    useMerchantVoiceBusinessStaff(
      { searchTerm: debouncedSearchQuery },
      { enabled: voiceEnabled && modalOpen },
    );
  const {
    data: posBusinessStaffResponse,
    isLoading: isPosBusinessStaffLoading,
  } = useMerchantStaff({
    statusFilter: "Active",
    pageNumber: 1,
    pageSize: 100,
    keyword: debouncedSearchQuery,
    enabled: posPayEnabled && modalOpen,
  });
  const { data: categoriesResponse, isLoading: isCategoriesLoading } =
    useMerchantVoiceServiceCategories({
      enabled: (voiceEnabled || posPayEnabled) && modalOpen,
    });
  const { data: servicesResponse, isLoading: isServicesLoading } =
    useMerchantVoiceServices({
      enabled: (voiceEnabled || posPayEnabled) && modalOpen,
    });
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const createStaffMutation = useCreateMerchantVoiceStaff();
  const updateStaffMutation = useUpdateMerchantVoiceStaff();
  const createLocalStaffMutation = useCreateLocalStaffProfile();
  const updateLocalStaffMutation = useUpdateLocalStaff();
  const resolveStaffLinkMutation = useResolveMerchantStaffLink();
  const savePosProfileMutation = useSaveStaffPosProfile();
  const saveServiceAssignmentsMutation = useSaveStaffServiceAssignments();
  const saveWeeklyScheduleMutation = useUpdateStaffWeeklySchedule();
  const toggleStaffStatusMutation = useToggleMerchantVoiceStaffStatus();
  const { data: posRoles = [] } = usePosRoles({
    enabled: posPayEnabled && modalOpen,
  });
  const [pendingToggleIds, setPendingToggleIds] = useState<
    Record<string, boolean>
  >({});
  const { data: staffDetail, isLoading: isStaffDetailLoading } =
    useMerchantVoiceStaffById(selectedId, {
      enabled:
        voiceEnabled && modalOpen && !!selectedId && modalMode !== "create",
    });

  const businessStaffOptions = useMemo<BusinessStaffOption[]>(() => {
    if (posPayEnabled) {
      return (posBusinessStaffResponse?.items ?? [])
        .map((staff) => {
          const id =
            typeof staff.staffProfileId === "string"
              ? staff.staffProfileId
              : "";
          const name = String(
            staff.displayName || staff.nickname || staff.fullName || "",
          );
          return {
            id,
            linkId: typeof staff.linkId === "string" ? staff.linkId : null,
            name,
            phone: typeof staff.phone === "string" ? staff.phone : "",
            email: typeof staff.email === "string" ? staff.email : "",
            position:
              typeof staff.position === "string" ? staff.position : "",
            isAlreadyAdded: false,
            avatar: name.trim().charAt(0).toUpperCase() || "T",
          };
        })
        .filter((staff) => Boolean(staff.id));
    }

    return (businessStaffResponse ?? []).map((staff) => ({
      id: staff.id,
      linkId: null,
      name: staff.fullName || "",
      phone: staff.phoneNumber || "",
      email: staff.email || "",
      position: staff.position || "",
      isAlreadyAdded: staff.isAlreadyAdded,
      avatar: staff.fullName?.trim()?.charAt(0)?.toUpperCase() || "T",
    }));
  }, [businessStaffResponse, posBusinessStaffResponse?.items, posPayEnabled]);

  const filteredBusinessStaff = businessStaffOptions;

  const serviceSections = useMemo(
    () =>
      buildMerchantVoiceServiceSections(categoriesResponse, servicesResponse),
    [categoriesResponse, servicesResponse],
  );

  const serviceOptions = useMemo(() => {
    const names = flattenMerchantVoiceServiceSections(serviceSections)
      .map((service) => service.name.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [serviceSections]);

  const selectedPosServiceIds = useMemo(() => {
    const selectedNames = new Set(draftServices);
    return Array.from(
      new Set(
        flattenMerchantVoiceServiceSections(serviceSections)
          .filter((service) => selectedNames.has(service.name.trim()))
          .map((service) => service.id)
          .filter(Boolean),
      ),
    );
  }, [draftServices, serviceSections]);

  const isServiceCatalogLoading = isCategoriesLoading || isServicesLoading;
  const isStaffPickerLoading = posPayEnabled
    ? isPosBusinessStaffLoading
    : isBusinessStaffLoading;
  const isSaving =
    saveInFlight ||
    createStaffMutation.isPending ||
    updateStaffMutation.isPending ||
    createLocalStaffMutation.isPending ||
    updateLocalStaffMutation.isPending ||
    resolveStaffLinkMutation.isPending ||
    savePosProfileMutation.isPending ||
    saveServiceAssignmentsMutation.isPending ||
    saveWeeklyScheduleMutation.isPending;

  const defaultPosRoleId = useMemo(() => {
    const technicianRole = posRoles.find(
      (role) =>
        !role.isOwnerRole &&
        role.isSystemDefault &&
        role.name.trim().toLowerCase() === "technician",
    );
    return (
      technicianRole ??
      posRoles.find((role) => !role.isOwnerRole) ??
      posRoles[0]
    )?.id ?? "";
  }, [posRoles]);
  const selectedPosRoleId = draftPosRoleId || defaultPosRoleId;
  const posRoleHasError = Boolean(formErrors.posPay && !selectedPosRoleId);
  const posPayValueHasError = Boolean(
    formErrors.posPay && selectedPosRoleId,
  );

  const draftPhoneParsed = useMemo(() => parsePhone(draftPhone), [draftPhone]);

  const scheduleRequiredMessage = t(`${TK}.scheduleRequiredTime`);
  const scheduleInvalidMessage = t(`${TK}.scheduleInvalidTime`);

  const resetPosPayDraft = () => {
    setDraftPosRoleId("");
    setDraftPayStructureType("Commission");
    setDraftCommissionPercent("60");
    setDraftWeeklySalaryAmount("");
    setDraftAgreedAmount("");
    setDraftTipsEnabled(true);
  };

  const fillDraftFromMember = (
    member: TeamMember | undefined,
    mode: ModalMode,
    scheduleOverride?: WeeklySchedule,
  ) => {
    if (mode === "create" || !member) {
      setDraftName("");
      setDraftPhone("");
      setDraftEmail("");
      setDraftServices([]);
      setOpenServiceCategoryIds(
        new Set(serviceSections[0]?.id ? [serviceSections[0].id] : []),
      );
      setDraftStaffProfileId(null);
      setDraftBusinessStaffLinkId(null);
      setDraftCreatedLocalStaffProfileId(null);
      resetPosPayDraft();
      setDraftSchedule(emptySchedule());
      setFormErrors({});
      setShowScheduleValidation(false);
      return;
    }
    setDraftName(member.name);
    setDraftPhone(member.phone);
    setDraftEmail(member.email);
    setDraftServices([...member.services]);
    setOpenServiceCategoryIds(
      new Set(serviceSections[0]?.id ? [serviceSections[0].id] : []),
    );
    setDraftStaffProfileId(member.staffProfileId);
    setDraftBusinessStaffLinkId(null);
    setDraftCreatedLocalStaffProfileId(null);
    setDraftSchedule(scheduleOverride ?? parseSchedule(member.schedule));
    setFormErrors({});
    setShowScheduleValidation(false);
  };

  const openModal = (memberId?: string, mode: ModalMode = "create") => {
    if (!memberId) {
      setModalMode("create");
      setSelectedId("");
      setSearchQuery("");
      setComboboxOpen(false);
      fillDraftFromMember(undefined, "create");
      setModalOpen(true);
      return;
    }

    const target = members.find((member) => member.id === memberId);
    setModalMode(mode);
    setSelectedId(memberId);
    setSearchQuery("");
    setComboboxOpen(false);
    fillDraftFromMember(target, mode === "create" ? "create" : "edit");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saveInFlightRef.current) return;
    setModalOpen(false);
    setComboboxOpen(false);
    setSearchQuery("");
    setShowScheduleValidation(false);
    onCreateModalClose?.();
  };

  const selectBusinessStaff = (staff: BusinessStaffOption) => {
    if (staff.isAlreadyAdded) return;

    const matchedMember = members.find(
      (member) =>
        member.id === staff.id ||
        (staff.phone && member.phone === staff.phone) ||
        (staff.name && member.name === staff.name),
    );
    if (matchedMember) {
      setModalMode("edit");
      setSelectedId(matchedMember.id);
      fillDraftFromMember(matchedMember, "edit");
      setComboboxOpen(false);
      setSearchQuery("");
      return;
    }

    setModalMode("create");
    setSelectedId("");
    setDraftName(staff.name);
    setDraftPhone(staff.phone);
    setDraftEmail(staff.email);
    setDraftServices([]);
    setOpenServiceCategoryIds(
      new Set(serviceSections[0]?.id ? [serviceSections[0].id] : []),
    );
    setDraftStaffProfileId(staff.id);
    setDraftBusinessStaffLinkId(staff.linkId ?? null);
    setDraftCreatedLocalStaffProfileId(null);
    setDraftSchedule(emptySchedule());
    setFormErrors({});
    setShowScheduleValidation(false);
    setComboboxOpen(false);
    setSearchQuery("");
  };

  const startCreate = () => {
    setModalMode("create");
    setSelectedId("");
    fillDraftFromMember(undefined, "create");
    setComboboxOpen(false);
    setSearchQuery("");
    technicianNameInputRef.current?.focus();
  };

  const toggleService = (service: string) => {
    const name = service.trim();
    if (!name) return;
    setDraftServices((prev) =>
      prev.includes(name)
        ? prev.filter((item) => item !== name)
        : [...prev, name],
    );
    setFormErrors((prev) => ({ ...prev, services: "" }));
  };

  const toggleServiceGroup = (services: string[]) => {
    const names = Array.from(
      new Set(services.map((service) => service.trim()).filter(Boolean)),
    );
    if (names.length === 0) return;

    setDraftServices((prev) => {
      const allSelected = names.every((name) => prev.includes(name));
      if (allSelected) {
        const groupNames = new Set(names);
        return prev.filter((name) => !groupNames.has(name));
      }
      return Array.from(new Set([...prev, ...names]));
    });
    setFormErrors((prev) => ({ ...prev, services: "" }));
  };

  const toggleServiceCategory = (categoryId: string) => {
    setOpenServiceCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const selectedServiceCount = useMemo(
    () =>
      serviceOptions.filter((service) => draftServices.includes(service))
        .length,
    [draftServices, serviceOptions],
  );
  const allServicesSelected =
    serviceOptions.length > 0 && selectedServiceCount === serviceOptions.length;
  const someServicesSelected =
    selectedServiceCount > 0 && !allServicesSelected;

  const toggleAllServices = () => {
    setDraftServices(allServicesSelected ? [] : [...serviceOptions]);
    setFormErrors((prev) => ({ ...prev, services: "" }));
  };

  useEffect(() => {
    if (checkAllServicesRef.current) {
      checkAllServicesRef.current.indeterminate = someServicesSelected;
    }
  }, [someServicesSelected, allServicesSelected]);

  const toggleDayOff = (day: DayKey, dayOff: boolean) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [day]: {
        dayOff,
        start: dayOff
          ? DEFAULT_SCHEDULE_START
          : prev[day].start || DEFAULT_SCHEDULE_START,
        end: dayOff
          ? DEFAULT_SCHEDULE_END
          : prev[day].end || DEFAULT_SCHEDULE_END,
      },
    }));
    setShowScheduleValidation(false);
  };

  const updateScheduleTime = (
    day: DayKey,
    field: "start" | "end",
    value: string,
  ) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
    setShowScheduleValidation(false);
  };

  const toggleSms = async (id: string) => {
    const previous = members.find((member) => member.id === id);
    if (!previous || pendingToggleIds[id]) return;

    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? { ...member, smsEnabled: !member.smsEnabled }
          : member,
      ),
    );
    setPendingToggleIds((prev) => ({ ...prev, [id]: true }));

    try {
      const nextStatus = await toggleStaffStatusMutation.mutateAsync(id);
      const isEnabled = isStaffStatusActive(nextStatus);
      setMembers((prev) =>
        prev.map((member) =>
          member.id === id ? { ...member, smsEnabled: isEnabled } : member,
        ),
      );
      showToast(t(`${TK}.toggleStaffSuccess`), "success");
    } catch (error) {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === id
            ? { ...member, smsEnabled: previous.smsEnabled }
            : member,
        ),
      );
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), "error");
    } finally {
      setPendingToggleIds((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleStaffSaveError = (error: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(error))), "error");
  };

  const savePosConfiguration = async (
    businessStaffLinkId: string,
    schedules: Array<{
      dayOfWeek: string;
      isDayOff: boolean;
      startTime: string | null;
      endTime: string | null;
    }>,
  ) => {
    await savePosProfileMutation.mutateAsync({
      businessStaffLinkId,
      posRoleId: selectedPosRoleId,
      payStructureType: draftPayStructureType,
      commissionPercent:
        draftPayStructureType === "Commission"
          ? Number(draftCommissionPercent)
          : null,
      weeklySalaryAmount:
        draftPayStructureType === "WeeklySalary"
          ? Number(draftWeeklySalaryAmount)
          : null,
      agreedAmount:
        draftPayStructureType === "AgreedAmount"
          ? Number(draftAgreedAmount)
          : null,
      tipsEnabled: draftTipsEnabled,
    });
    const configurationResults = await Promise.allSettled([
      saveServiceAssignmentsMutation.mutateAsync({
        businessStaffLinkId,
        posServiceIds: selectedPosServiceIds,
      }),
      saveWeeklyScheduleMutation.mutateAsync({
        businessStaffLinkId,
        days: schedules,
      }),
    ]);
    const failedConfiguration = configurationResults.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    if (failedConfiguration) throw failedConfiguration.reason;
  };

  const saveModal = async () => {
    if (saveInFlightRef.current) return;

    const nextErrors: {
      name?: string;
      phone?: string;
      email?: string;
      services?: string;
      posPay?: string;
      schedule?: string;
    } = {};
    const trimmedName = draftName.trim();
    const trimmedEmail = draftEmail.trim();
    const hasPhoneInput = Boolean(
      draftPhoneParsed.nationalNumber.replace(/\D/g, "").trim(),
    );
    const phoneForApi = hasPhoneInput
      ? normalizePhoneE164(draftPhone, draftPhoneParsed.countryCode)
      : null;

    if (!trimmedName) nextErrors.name = t(`${TK}.technicianNameRequired`);
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t(`${TK}.invalidEmail`);
    }
    if (!draftServices.length) {
      nextErrors.services = t(`${TK}.serviceSelectionRequired`);
    }
    if (posPayEnabled) {
      if (!selectedPosRoleId) {
        nextErrors.posPay = t(`${TK}.requiredField`);
      } else if (draftPayStructureType === "Commission") {
        const commission = Number(draftCommissionPercent);
        if (
          !draftCommissionPercent.trim() ||
          !Number.isFinite(commission) ||
          commission < 0 ||
          commission > 100
        ) {
          nextErrors.posPay = t("errors.pos_staff_commission_percent_invalid");
        }
      } else {
        const amountInput =
          draftPayStructureType === "WeeklySalary"
            ? draftWeeklySalaryAmount
            : draftAgreedAmount;
        const amount = Number(amountInput);
        if (!amountInput.trim() || !Number.isFinite(amount) || amount < 0) {
          nextErrors.posPay = t("errors.pos_staff_pay_amount_invalid");
        }
      }
    }

    const scheduleInvalid = hasScheduleValidationError(
      draftSchedule,
      scheduleRequiredMessage,
      scheduleInvalidMessage,
    );
    if (scheduleInvalid) {
      nextErrors.schedule = scheduleRequiredMessage;
    }

    const blocked = applyAiHubProgressiveValidation({
      allErrors: nextErrors,
      root: techDialogRef.current,
      setErrors: (errors) => {
        const { schedule: _schedule, ...fieldOnly } = errors;
        setFormErrors(fieldOnly);
        setShowScheduleValidation(Boolean(errors.schedule));
      },
      showToast,
      fieldLabels: {
        name: t(`${TK}.techName`),
        email: t(`${TK}.email`),
        services: t(`${TK}.services`),
        posPay: t(`${POS_TK}.rolePayTipsTitle`),
        schedule: t(`${TK}.weeklySchedule`),
      },
      hubTk: TK_HUB,
      t,
    });
    if (blocked) return;

    const payload = {
      name: trimmedName,
      phone: phoneForApi,
      email: trimmedEmail || null,
      services: draftServices,
    };

    const schedulesWithApiDayNames = DAY_KEYS.map((day) => {
      const row = draftSchedule[day];
      if (row.dayOff) {
        return {
          dayOfWeek: mapDayOfWeekToApiName(DAY_KEY_TO_API_DAY[day]),
          isDayOff: true,
          startTime: null,
          endTime: null,
        };
      }
      return {
        dayOfWeek: mapDayOfWeekToApiName(DAY_KEY_TO_API_DAY[day]),
        isDayOff: false,
        startTime: row.start ? `${row.start}:00` : null,
        endTime: row.end ? `${row.end}:00` : null,
      };
    });

    saveInFlightRef.current = true;
    setSaveInFlight(true);
    let saved = false;

    try {
      if (posPayEnabled) {
        const nameParts = splitFullName(payload.name);
        const localStaffParams = {
          displayName: payload.name,
          position: null,
          bio: null,
          photoUrl: null,
          phoneNumber: payload.phone,
          email: payload.email,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
        };
        let staffProfileId = draftStaffProfileId;
        let businessStaffLinkId = draftBusinessStaffLinkId;

        if (!staffProfileId) {
          const created = await createLocalStaffMutation.mutateAsync(
            localStaffParams,
          );
          staffProfileId = created.id?.trim() || null;
          if (staffProfileId) {
            setDraftStaffProfileId(staffProfileId);
            setDraftCreatedLocalStaffProfileId(staffProfileId);
          }
        } else if (draftCreatedLocalStaffProfileId === staffProfileId) {
          await updateLocalStaffMutation.mutateAsync({
            staffProfileId,
            params: localStaffParams,
          });
        }

        if (!staffProfileId) {
          throw new Error("The created technician has no staff profile id.");
        }
        if (!businessStaffLinkId) {
          businessStaffLinkId = await resolveStaffLinkMutation.mutateAsync({
            staffProfileId,
            keyword: payload.name,
          });
          setDraftBusinessStaffLinkId(businessStaffLinkId);
        }

        await savePosConfiguration(
          businessStaffLinkId,
          schedulesWithApiDayNames,
        );
        saved = true;
      } else if (modalMode === "create") {
        const voiceSchedules = DAY_KEYS.map((day) => {
          const row = draftSchedule[day];
          if (row.dayOff) {
            return {
              dayOfWeek: DAY_KEY_TO_API_DAY[day],
              isDayOff: true,
              startTime: null,
              endTime: null,
            };
          }
          return {
            dayOfWeek: DAY_KEY_TO_API_DAY[day],
            isDayOff: false,
            startTime: row.start ? `${row.start}:00` : null,
            endTime: row.end ? `${row.end}:00` : null,
          };
        });
        const created: MerchantVoiceStaffDto =
          await createStaffMutation.mutateAsync({
            fullName: payload.name,
            phoneNumber: payload.phone,
            email: payload.email,
            skills: payload.services.join(", "),
            staffProfileId: draftStaffProfileId,
            schedules: voiceSchedules,
          });
        setSelectedId(created.id);
        saved = true;
      } else if (selectedId) {
        const editingMember = members.find(
          (member) => member.id === selectedId,
        );
        await updateStaffMutation.mutateAsync({
          id: selectedId,
          fullName: payload.name,
          phoneNumber: payload.phone,
          email: payload.email,
          skills: payload.services.join(", "),
          status: mapStaffStatusToActivityApi(
            editingMember?.smsEnabled
              ? MerchantVoiceStaffStatus.Active
              : MerchantVoiceStaffStatus.Inactive,
          ),
          schedules: schedulesWithApiDayNames,
        });
        saved = true;
      }
    } catch (error) {
      handleStaffSaveError(error);
    } finally {
      saveInFlightRef.current = false;
      setSaveInFlight(false);
    }

    if (saved) {
      showToast(t(`${TK}.saveSuccess`), "success");
      closeModal();
    }
  };

  const modalTitle =
    modalMode === "create"
      ? t(`${TK}.modalTitleCreate`)
      : t(`${TK}.modalTitleEdit`);

  const modalSub =
    modalMode === "create"
      ? t(`${TK}.modalSubCreate`)
      : t(`${TK}.modalSubEdit`, { name: draftName || t(`${TK}.selectedTech`) });

  const hasScheduleError = useMemo(
    () =>
      hasScheduleValidationError(
        draftSchedule,
        scheduleRequiredMessage,
        scheduleInvalidMessage,
      ),
    [draftSchedule, scheduleInvalidMessage, scheduleRequiredMessage],
  );

  useEffect(() => {
    const unnamedLabel = t(`${TK}.unnamedStaff`);
    const mapped = (staffResponse?.items ?? []).map((staff) =>
      toTeamMember(staff, unnamedLabel),
    );
    setMembers(mapped);
    setSelectedId((prev) => prev || mapped[0]?.id || "");
  }, [staffResponse?.items, t]);

  useEffect(() => {
    if (!staffDetail || modalMode === "create") return;
    fillDraftFromMember(
      toTeamMember(staffDetail, t(`${TK}.unnamedStaff`)),
      "edit",
      schedulesToWeeklySchedule(staffDetail.schedules),
    );
  }, [staffDetail, modalMode]);

  useEffect(() => {
    if (!modalOpen) {
      document.body.style.overflow = "";
      return undefined;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  useEffect(() => {
    if (techModalBodyRef.current) {
      techModalBodyRef.current.inert = isSaving;
    }
  }, [isSaving]);

  // Keep open ids in sync with the catalog and reveal the first group initially.
  useEffect(() => {
    if (!modalOpen || serviceSections.length === 0) return;
    setOpenServiceCategoryIds((prev) => {
      const valid = new Set(
        [...prev].filter((id) =>
          serviceSections.some((section) => section.id === id),
        ),
      );
      if (valid.size === 0) valid.add(serviceSections[0].id);
      return valid;
    });
  }, [modalOpen, serviceSections]);

  useEffect(() => {
    if (!comboboxOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setComboboxOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [comboboxOpen]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div
      className={
        createModalOnly
          ? "technician-info-modal-host"
          : embedded
            ? "settings-team-panel"
            : "booking-sub-panel is-active"
      }
      aria-busy={isStaffLoading}
    >
      {!createModalOnly ? (
        <article className={embedded ? "settings-team-body" : "overview-card overview-card-pad"}>
        <div className="tech-intro">
          <div className="tech-intro-text">{t(`${TK}.intro`)}</div>
          <button
            className="booking-primary-button"
            type="button"
            onClick={() => openModal()}
          >
            <PlusIcon />
            <span>{t(`${TK}.addTech`)}</span>
          </button>
        </div>

        <div className="tech-grid">
          {isStaffLoading ? <BookingTeamGridSkeleton count={3} /> : null}
          {!isStaffLoading && members.length === 0 ? (
            <div className="tech-grid-empty">
              <div className="tech-grid-empty-icon" aria-hidden="true">
                <PeopleIcon />
              </div>
              <div className="tech-grid-empty-title">
                {t(`${TK}.emptyTitle`)}
              </div>
              <p className="tech-grid-empty-description">
                {t(`${TK}.emptyDescription`)}
              </p>
              <button
                className="booking-primary-button"
                type="button"
                onClick={() => openModal()}
              >
                <PlusIcon />
                <span>{t(`${TK}.emptyCta`)}</span>
              </button>
            </div>
          ) : null}
          {!isStaffLoading
            ? members.map((member) => (
                <article
                  className="tech-card"
                  key={member.id}
                  data-tech-id={member.id}
                >
                  <div className="tech-top">
                    <div className="tech-avatar" style={member.avatarStyle}>
                      {member.avatar}
                    </div>
                    <div className="tech-profile">
                      <div className="tech-name">{member.name}</div>
                      <div className="tech-phone">
                        {formatPhoneDisplay(member.phone)}
                      </div>
                    </div>
                    <button
                      className={`toggle-pill ${member.smsEnabled ? "is-on" : ""}`}
                      type="button"
                      aria-label={t(`${TK}.toggleSms`, {
                        name: member.name,
                      })}
                      aria-pressed={member.smsEnabled}
                      disabled={pendingToggleIds[member.id]}
                      onClick={() => toggleSms(member.id)}
                    />
                  </div>
                  <div className="tech-card-footer">
                    <div className="tech-stats">
                      <div className="tech-stat">
                        <strong>{member.customers}</strong>
                        <span>{t(`${TK}.clientsToday`)}</span>
                      </div>
                    </div>
                    <div className="tech-card-actions">
                      <button
                        className="booking-secondary-button"
                        type="button"
                        aria-label={t(`${TK}.edit`)}
                        title={t(`${TK}.edit`)}
                        onClick={() => openModal(member.id, "detail")}
                      >
                        <PencilIcon className="marketing-icon is-compact" />
                        <span className="booking-mini-label">{t(`${TK}.edit`)}</span>
                      </button>
                    </div>
                  </div>
                  <div className="tech-services">
                    {member.services.map((service) => (
                      <span className="badge badge-plan" key={service}>
                        {service}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            : null}
        </div>

        {!isStaffLoading && (staffResponse?.totalCount ?? 0) > 0 ? (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={staffResponse?.totalPages ?? 1}
            totalCount={staffResponse?.totalCount ?? 0}
            hasNextPage={staffResponse?.hasNextPage}
            hasPreviousPage={staffResponse?.hasPreviousPage}
            onPageChange={setPage}
            isLoading={isStaffFetching}
            className={BOOKING_HUB_PAGINATION_CLASSNAME}
          />
        ) : null}
        </article>
      ) : null}

      {modalOpen ? (
        <div
          className="tech-modal"
          data-tech-mode={modalMode}
          role="presentation"
          onClick={closeModal}
        >
          <div
            ref={techDialogRef}
            className="tech-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tech-modal-title"
            aria-busy={isSaving}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tech-modal-head">
              <div className="tech-modal-heading">
                <span className="tech-title-mark">
                  <PersonPlusIcon />
                </span>
                <div>
                  <div className="tech-modal-title" id="tech-modal-title">
                    {modalTitle}
                  </div>
                  <div className="tech-modal-sub">{modalSub}</div>
                </div>
              </div>
              <button
                className="tech-modal-close"
                type="button"
                aria-label={t(`${TK}.close`)}
                onClick={closeModal}
                disabled={isSaving}
              >
                <CloseIcon />
              </button>
            </div>

            <div
              ref={techModalBodyRef}
              className="tech-modal-body"
            >
              <div className="tech-modal-section" data-tech-picker-section>
                <div className="tech-modal-section-title">
                  <PeopleIcon />
                  <span>{t(`${TK}.selectFromList`)}</span>
                </div>
                <div className="tech-select-row">
                  <div
                    className={`tech-combobox ${comboboxOpen ? "is-open" : ""}`}
                    ref={comboboxRef}
                  >
                    <label className="tech-search">
                      <span className="tech-search-icon">
                        <SearchIcon />
                      </span>
                      <input
                        type="search"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        aria-controls="tech-select-menu"
                        placeholder={t(`${TK}.searchPlaceholder`)}
                        autoComplete="off"
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value);
                          setComboboxOpen(true);
                        }}
                        onFocus={() => setComboboxOpen(true)}
                      />
                      {searchQuery ? (
                        <button
                          className="tech-search-clear"
                          type="button"
                          aria-label={t(`${TK}.clearSearch`)}
                          title={t(`${TK}.clearSearch`)}
                          onClick={() => {
                            setSearchQuery("");
                            setComboboxOpen(true);
                          }}
                        >
                          <XLgIcon />
                        </button>
                      ) : null}
                      <span className="tech-select-chevron">
                        <ChevronDownIcon />
                      </span>
                    </label>
                    {comboboxOpen ? (
                      <div className="tech-select-menu" id="tech-select-menu">
                        {isStaffPickerLoading ? (
                          <BookingTechStaffListSkeleton count={3} />
                        ) : (
                          <div
                            className="tech-choice-grid"
                            role="listbox"
                            aria-label={t(`${TK}.techList`)}
                          >
                            {filteredBusinessStaff.map((member) => (
                              <button
                                key={member.id}
                                className={`tech-choice-card ${draftStaffProfileId === member.id ? "is-active" : ""} ${member.isAlreadyAdded ? "is-disabled" : ""}`}
                                type="button"
                                role="option"
                                aria-selected={draftStaffProfileId === member.id}
                                aria-disabled={member.isAlreadyAdded}
                                disabled={member.isAlreadyAdded}
                                onClick={() => selectBusinessStaff(member)}
                              >
                                <span
                                  className="tech-avatar"
                                  style={member.avatarStyle}
                                >
                                  {member.avatar}
                                </span>
                                <span>
                                  <span className="tech-choice-name">
                                    {member.name}
                                    {member.isAlreadyAdded ? (
                                      <span className="tech-choice-badge">
                                        {t(`${TK}.alreadyAdded`)}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="tech-choice-meta">
                                    {member.position || member.email || "—"} ·{" "}
                                    {formatPhoneDisplay(member.phone)}
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        {!isStaffPickerLoading &&
                        filteredBusinessStaff.length === 0 ? (
                          <div className="tech-empty is-visible">
                            {t(`${TK}.noMatch`)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <button
                    className={`booking-secondary-button tech-create-button ${modalMode === "create" && !draftStaffProfileId ? "is-active" : ""}`}
                    type="button"
                    onClick={startCreate}
                  >
                    <PlusIcon />
                    <span>{t(`${TK}.createNew`)}</span>
                  </button>
                </div>
              </div>

              <div className="tech-modal-section">
                <div className="tech-modal-section-title">
                  <PersonCardIcon />
                  <span>{t(`${TK}.profileDetails`)}</span>
                </div>
                {modalMode !== "create" && isStaffDetailLoading ? (
                  <BookingTechModalProfileSkeleton />
                ) : (
                  <div className="tech-modal-grid">
                    <div className="settings-field" data-ai-hub-field="name">
                      <span className="settings-label">
                        {t(`${TK}.techName`)}
                        <small className="tech-required-hint">
                          {t(`${TK}.requiredHint`)}
                        </small>
                      </span>
                      <input
                        ref={technicianNameInputRef}
                        className="settings-input"
                        type="text"
                        value={draftName}
                        aria-invalid={Boolean(formErrors.name)}
                        placeholder={t(`${TK}.placeholderTechName`)}
                        onChange={(event) => {
                          setDraftName(event.target.value);
                          setFormErrors((prev) => ({ ...prev, name: "" }));
                        }}
                      />
                      <span className="field-error-slot" aria-live="polite">
                        {formErrors.name ? (
                          <span className="field-error">{formErrors.name}</span>
                        ) : null}
                      </span>
                    </div>
                    <div className="settings-field">
                      <span className="settings-label">{t(`${TK}.phone`)}</span>
                      <span className="phone-input-shell">
                        <CountryCodeSelect
                          value={draftPhoneParsed.countryCode}
                          embedded
                          onChange={(nextCode) => {
                            const formatted = formatNationalNumber(
                              draftPhoneParsed.nationalNumber,
                              nextCode,
                            );
                            setDraftPhone(`${nextCode} ${formatted}`.trim());
                            setFormErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                        />
                        <input
                          className="settings-input phone-mask-input"
                          type="tel"
                          value={formatNationalNumber(
                            draftPhoneParsed.nationalNumber,
                            draftPhoneParsed.countryCode,
                          )}
                          aria-invalid={Boolean(formErrors.phone)}
                          placeholder={getNationalPhonePlaceholder(
                            draftPhoneParsed.countryCode,
                          )}
                          inputMode="numeric"
                          autoComplete="tel-national"
                          onChange={(event) => {
                            const formatted = formatNationalNumber(
                              event.target.value,
                              draftPhoneParsed.countryCode,
                            );
                            setDraftPhone(
                              `${draftPhoneParsed.countryCode} ${formatted}`.trim(),
                            );
                            setFormErrors((prev) => ({ ...prev, phone: "" }));
                          }}
                        />
                      </span>
                      <span className="field-error-slot" aria-live="polite">
                        {formErrors.phone ? (
                          <span className="field-error">
                            {formErrors.phone}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="settings-field" data-ai-hub-field="email">
                      <span className="settings-label">{t(`${TK}.email`)}</span>
                      <input
                        className="settings-input"
                        type="email"
                        value={draftEmail}
                        aria-invalid={Boolean(formErrors.email)}
                        placeholder={t(`${TK}.placeholderEmail`)}
                        onChange={(event) => {
                          setDraftEmail(event.target.value);
                          setFormErrors((prev) => ({ ...prev, email: "" }));
                        }}
                      />
                      <span className="field-error-slot" aria-live="polite">
                        {formErrors.email ? (
                          <span className="field-error">
                            {formErrors.email}
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {posPayEnabled ? (
                <div
                  className="tech-modal-section tech-pos-pay-section"
                  role="region"
                  aria-labelledby="tech-pos-pay-title"
                  data-ai-hub-field="posPay"
                >
                  <div
                    className="tech-modal-section-title"
                    id="tech-pos-pay-title"
                  >
                    <RolePayIcon />
                    <span>{t(`${POS_TK}.rolePayTipsTitle`)}</span>
                  </div>

                  <div
                    className="tech-pos-pay-grid"
                    style={{ alignItems: "start" }}
                  >
                    <label className="settings-field">
                      <span className="settings-label">
                        {t(`${POS_TK}.roleLabel`)}
                      </span>
                      <select
                        className="settings-input"
                        aria-label={t(`${POS_TK}.roleLabel`)}
                        aria-invalid={posRoleHasError}
                        aria-describedby={
                          posRoleHasError ? "tech-pos-pay-error" : undefined
                        }
                        value={selectedPosRoleId}
                        onChange={(event) => {
                          setDraftPosRoleId(event.target.value);
                          setFormErrors((prev) => ({ ...prev, posPay: "" }));
                        }}
                      >
                        {!selectedPosRoleId ? (
                          <option value="" disabled>
                            —
                          </option>
                        ) : null}
                        {posRoles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {posRoleHasError ? (
                        <span
                          className="tech-pos-pay-field-error"
                          id="tech-pos-pay-error"
                          role="alert"
                        >
                          {formErrors.posPay}
                        </span>
                      ) : null}
                    </label>

                    <label className="settings-field">
                      <span className="settings-label">
                        {t(`${POS_TK}.payStructureLabel`)}
                      </span>
                      <select
                        className="settings-input"
                        aria-label={t(`${POS_TK}.payStructureLabel`)}
                        value={draftPayStructureType}
                        onChange={(event) => {
                          setDraftPayStructureType(
                            event.target.value as PosPayStructureType,
                          );
                          setFormErrors((prev) => ({ ...prev, posPay: "" }));
                        }}
                      >
                        {(
                          [
                            "Commission",
                            "WeeklySalary",
                            "AgreedAmount",
                          ] as const
                        ).map((type) => (
                          <option key={type} value={type}>
                            {t(`${POS_TK}.payStructureTypes.${type}`)}
                          </option>
                        ))}
                      </select>
                    </label>

                    {draftPayStructureType === "Commission" ? (
                      <label className="settings-field">
                        <span className="settings-label">
                          {t(`${POS_TK}.commissionPercentLabel`)}
                        </span>
                        <input
                          className="settings-input"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          aria-label={t(`${POS_TK}.commissionPercentLabel`)}
                          aria-invalid={posPayValueHasError}
                          aria-describedby={
                            posPayValueHasError
                              ? "tech-pos-pay-error"
                              : undefined
                          }
                          value={draftCommissionPercent}
                          onChange={(event) => {
                            setDraftCommissionPercent(event.target.value);
                            setFormErrors((prev) => ({ ...prev, posPay: "" }));
                          }}
                        />
                        {posPayValueHasError ? (
                          <span
                            className="tech-pos-pay-field-error"
                            id="tech-pos-pay-error"
                            role="alert"
                          >
                            {formErrors.posPay}
                          </span>
                        ) : null}
                      </label>
                    ) : null}

                    {draftPayStructureType === "WeeklySalary" ? (
                      <label className="settings-field">
                        <span className="settings-label">
                          {t(`${POS_TK}.weeklySalaryAmountLabel`)}
                        </span>
                        <input
                          className="settings-input"
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={t(`${POS_TK}.weeklySalaryAmountLabel`)}
                          aria-invalid={posPayValueHasError}
                          aria-describedby={
                            posPayValueHasError
                              ? "tech-pos-pay-error"
                              : undefined
                          }
                          value={draftWeeklySalaryAmount}
                          onChange={(event) => {
                            setDraftWeeklySalaryAmount(event.target.value);
                            setFormErrors((prev) => ({ ...prev, posPay: "" }));
                          }}
                        />
                        {posPayValueHasError ? (
                          <span
                            className="tech-pos-pay-field-error"
                            id="tech-pos-pay-error"
                            role="alert"
                          >
                            {formErrors.posPay}
                          </span>
                        ) : null}
                      </label>
                    ) : null}

                    {draftPayStructureType === "AgreedAmount" ? (
                      <label className="settings-field">
                        <span className="settings-label">
                          {t(`${POS_TK}.agreedAmountLabel`)}
                        </span>
                        <input
                          className="settings-input"
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label={t(`${POS_TK}.agreedAmountLabel`)}
                          aria-invalid={posPayValueHasError}
                          aria-describedby={
                            posPayValueHasError
                              ? "tech-pos-pay-error"
                              : undefined
                          }
                          value={draftAgreedAmount}
                          onChange={(event) => {
                            setDraftAgreedAmount(event.target.value);
                            setFormErrors((prev) => ({ ...prev, posPay: "" }));
                          }}
                        />
                        {posPayValueHasError ? (
                          <span
                            className="tech-pos-pay-field-error"
                            id="tech-pos-pay-error"
                            role="alert"
                          >
                            {formErrors.posPay}
                          </span>
                        ) : null}
                      </label>
                    ) : null}
                  </div>

                  <label className="tech-pos-tips-row">
                    <input
                      className="tech-pos-tips-input"
                      type="checkbox"
                      aria-label={t(`${POS_TK}.tipsEnabledLabel`)}
                      checked={draftTipsEnabled}
                      onChange={(event) =>
                        setDraftTipsEnabled(event.target.checked)
                      }
                    />
                    <span className="tech-pos-tips-switch" aria-hidden="true">
                      <span />
                    </span>
                    <span>{t(`${POS_TK}.tipsEnabledLabel`)}</span>
                  </label>

                </div>
              ) : null}

              <div
                className="tech-modal-section tech-services-section"
                role="region"
                aria-labelledby="tech-services-title"
                data-ai-hub-field="services"
              >
                <div className="tech-modal-section-title">
                  <ServicesListIcon />
                  <span id="tech-services-title">{t(`${TK}.services`)}</span>
                  {formErrors.services ? (
                    <span
                      className="tech-services-title-error"
                      id="tech-services-error"
                      role="alert"
                    >
                      {formErrors.services}
                    </span>
                  ) : null}
                </div>
                {(modalMode !== "create" && isStaffDetailLoading) ||
                isServiceCatalogLoading ? (
                  <BookingTechServicesSkeleton count={4} />
                ) : serviceSections.length > 0 ? (
                  <div
                    className="tech-services-control"
                    aria-invalid={Boolean(formErrors.services)}
                  >
                    <div
                      className={`tech-services-all-row${servicesExpanded ? " is-open" : ""}${selectedServiceCount > 0 ? " has-selection" : ""}`}
                    >
                      <label className="tech-services-check-label">
                        <input
                          ref={checkAllServicesRef}
                          type="checkbox"
                          checked={allServicesSelected}
                          onChange={toggleAllServices}
                        />
                        <span>{t(`${TK}.checkAllServices`)}</span>
                      </label>
                      <button
                        className="tech-services-expand-button"
                        type="button"
                        aria-label={t(`${TK}.services`)}
                        aria-expanded={servicesExpanded}
                        aria-controls="tech-services-catalog-panel"
                        onClick={() => setServicesExpanded((open) => !open)}
                      >
                        <span className="tech-services-count">
                          {serviceOptions.length}
                        </span>
                        <ChevronDownIcon />
                      </button>
                    </div>

                    <div
                      className={`tech-services-catalog-panel${servicesExpanded ? " is-open" : ""}`}
                      id="tech-services-catalog-panel"
                      aria-hidden={!servicesExpanded}
                    >
                      <div className="tech-services-catalog-panel-inner">
                        <div className="tech-service-categories">
                          {serviceSections.map((section) => {
                            const isOpen = openServiceCategoryIds.has(
                              section.id,
                            );
                            const serviceNames = section.services
                              .map((service) => service.name.trim())
                              .filter(Boolean);
                            const selectedCount = serviceNames.filter((name) =>
                              draftServices.includes(name),
                            ).length;
                            const allCategorySelected =
                              serviceNames.length > 0 &&
                              selectedCount === serviceNames.length;
                            const someCategorySelected =
                              selectedCount > 0 && !allCategorySelected;
                            const panelId = `tech-service-panel-${section.id}`;

                            return (
                              <div
                                className={`tech-service-category${isOpen ? " is-open" : ""}${selectedCount > 0 ? " has-selection" : ""}`}
                                key={section.id}
                              >
                                <div className="tech-service-category-head">
                                  <label className="tech-services-check-label">
                                    <input
                                      ref={(input) => {
                                        if (input) {
                                          input.indeterminate =
                                            someCategorySelected;
                                        }
                                      }}
                                      type="checkbox"
                                      checked={allCategorySelected}
                                      tabIndex={servicesExpanded ? 0 : -1}
                                      aria-label={t(`${TK}.checkAllCategory`, {
                                        category: section.name,
                                      })}
                                      onChange={() =>
                                        toggleServiceGroup(serviceNames)
                                      }
                                    />
                                    <span>{t(`${TK}.checkAll`)}</span>
                                    <strong>{section.name}</strong>
                                  </label>
                                  <button
                                    className="tech-services-expand-button"
                                    type="button"
                                    aria-label={section.name}
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    tabIndex={servicesExpanded ? 0 : -1}
                                    onClick={() =>
                                      toggleServiceCategory(section.id)
                                    }
                                  >
                                    <span className="tech-services-count">
                                      {section.services.length}
                                    </span>
                                    <ChevronDownIcon />
                                  </button>
                                </div>
                                <div
                                  className={`tech-service-category-panel${isOpen ? " is-open" : ""}`}
                                  id={panelId}
                                  aria-hidden={!isOpen}
                                >
                                  <div className="tech-service-category-panel-inner">
                                    <div className="tech-service-option-grid">
                                      {section.services.map((service) => {
                                        const name = service.name.trim();
                                        return (
                                          <label
                                            className="tech-service-option"
                                            key={`${section.id}-${service.id}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                Boolean(name) &&
                                                draftServices.includes(name)
                                              }
                                              tabIndex={
                                                servicesExpanded && isOpen
                                                  ? 0
                                                  : -1
                                              }
                                              onChange={() =>
                                                toggleService(name)
                                              }
                                            />
                                            <span>{name}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="tech-service-empty">
                    {t(`${TK}.servicesEmpty`)}
                  </div>
                )}
              </div>

              <div
                className="tech-modal-section"
                data-tech-schedule-section
                data-ai-hub-field="schedule"
              >
                <div className="tech-modal-section-title">
                  <CalendarWeekIcon />
                  <span>{t(`${TK}.weeklySchedule`)}</span>
                </div>
                {modalMode !== "create" && isStaffDetailLoading ? (
                  <BookingTechScheduleSkeleton />
                ) : (
                  <>
                    <div className="tech-schedule">
                      {DAY_KEYS.map((day) => {
                        const row = draftSchedule[day];
                        const rowError = getScheduleRowError(
                          row,
                          scheduleRequiredMessage,
                          scheduleInvalidMessage,
                        );
                        const showRowError =
                          showScheduleValidation && !!rowError;
                        const rowMissingTime = isScheduleRowMissingTime(row);
                        return (
                          <div
                            key={day}
                            className={`tech-schedule-row ${row.dayOff ? "is-day-off" : ""} ${showRowError ? "has-error" : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleDayOff(day, !row.dayOff)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                toggleDayOff(day, !row.dayOff);
                              }
                            }}
                          >
                            <span className="tech-schedule-day">
                              {t(`${TK}.days.${day}`)}
                            </span>
                            <label className="tech-schedule-off">
                              <input
                                className="tech-schedule-toggle"
                                type="checkbox"
                                checked={row.dayOff}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) =>
                                  toggleDayOff(day, event.target.checked)
                                }
                              />
                              {t(`${TK}.dayOff`)}
                            </label>
                            <span
                              className="tech-schedule-time"
                              lang={TWELVE_HOUR_INPUT_LANG}
                            >
                              <TechScheduleTimeBox
                                value={row.start}
                                disabled={row.dayOff}
                                invalid={
                                  showRowError &&
                                  (rowMissingTime || isScheduleRowInvalid(row))
                                }
                                ariaLabel={`${t(`${TK}.days.${day}`)} ${t(`${TK}.scheduleTo`)}`}
                                onChange={(next) =>
                                  updateScheduleTime(day, "start", next)
                                }
                              />
                              <span>{t(`${TK}.scheduleTo`)}</span>
                              <TechScheduleTimeBox
                                value={row.end}
                                disabled={row.dayOff}
                                invalid={
                                  showRowError &&
                                  (rowMissingTime || isScheduleRowInvalid(row))
                                }
                                ariaLabel={`${t(`${TK}.days.${day}`)} ${t(`${TK}.scheduleTo`)}`}
                                onChange={(next) =>
                                  updateScheduleTime(day, "end", next)
                                }
                              />
                            </span>
                            {showRowError ? (
                              <span className="tech-schedule-row-error">
                                {rowError}
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {showScheduleValidation && hasScheduleError ? (
                      <div className="tech-schedule-error">
                        {t(`${TK}.scheduleValidationSummary`)}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="tech-modal-actions">
              <button
                className="booking-secondary-button"
                type="button"
                onClick={closeModal}
                disabled={isSaving}
              >
                {t(`${TK}.close`)}
              </button>
              <button
                className="booking-primary-button"
                type="button"
                disabled={isSaving}
                onClick={() => void saveModal()}
              >
                {isSaving ? (
                  <SpinnerIcon className="booking-inline-spinner" />
                ) : (
                  <CheckIcon />
                )}
                <span>{t(`${TK}.saveTech`)}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
