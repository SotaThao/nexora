import React, { useEffect, useMemo, useState } from "react";
import { BOOKING_HUB_PAGE_SIZE } from "../../../constants/pagination";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import {
  useMerchantVoiceCallStatistics,
  useMerchantVoiceCalls,
  useSendMerchantVoiceCallFollowUpSms,
} from "../../../data/hooks/useMerchantVoiceBookings";
import {
  CallUiStatus,
  mapCallOutcomeToUiStatus,
  type MerchantVoiceCallDto,
} from "../../../data/repositories/merchantVoice";
import { usePagination } from "../../../hooks/usePagination";
import { getApiErrorCode } from "../../../types/domain";
import {
  formatNationalNumber,
  isValidPhoneE164,
  normalizePhoneSearchTerm,
  parsePhone,
} from "../../CountryCodeSelect";
import Pagination from "../../ui/Pagination";
import { parseApiDateTime } from "../utils";
import {
  CalendarCheckIcon,
  GraphUpIcon,
  PhoneIncomingIcon,
  PhoneTabIcon,
  PhoneXIcon,
  SendIcon,
  SpinnerIcon,
} from "./BookingHubIcons";
import { useBookingHubVoiceEnabled } from "./BookingHubVoiceContext";

const TK = "components.dashboard.views.BookingHubView.callLog";

type CallStatus = CallUiStatus;

interface CallItem {
  id: string;
  time: string;
  name: string;
  phoneDisplay: string;
  status: CallStatus;
  durationSeconds: number;
  note: string;
  followUpSmsSentAt: string | null;
  isNewCaller: boolean;
  canFollowUp: boolean;
}

const KPI_ACCENT_ELECTRIC = {
  "--kpi-accent": "var(--nexora-electric)",
} as React.CSSProperties;
const KPI_ACCENT_RED = { "--kpi-accent": "#ef4444" } as React.CSSProperties;
const KPI_ACCENT_SUCCESS = {
  "--kpi-accent": "var(--nexora-success)",
} as React.CSSProperties;
const KPI_ACCENT_BRAND = {
  "--kpi-accent": "var(--nexora-brand)",
} as React.CSSProperties;

const STATUS_META: Record<
  CallStatus,
  { icon: React.ReactNode; badgeClass: string; labelKey: string }
> = {
  [CallUiStatus.Answered]: {
    icon: <PhoneIncomingIcon />,
    badgeClass: "booking-status-sms",
    labelKey: "statusAnswered",
  },
  [CallUiStatus.Missed]: {
    icon: <PhoneXIcon />,
    badgeClass: "booking-status-noshow",
    labelKey: "statusMissed",
  },
  [CallUiStatus.Booked]: {
    icon: <CalendarCheckIcon />,
    badgeClass: "booking-status-done",
    labelKey: "statusBooked",
  },
};

const STATUS_FILTER_ORDER: CallStatus[] = [
  CallUiStatus.Missed,
  CallUiStatus.Answered,
  CallUiStatus.Booked,
];

function formatDuration(seconds: number) {
  if (!seconds) return "_";
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function toLocalDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCallTime(
  createdAt: string,
  todayLabel: string,
  yesterdayLabel: string,
  language: string,
): string {
  const date = parseApiDateTime(createdAt);
  if (!date) return createdAt;

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateLocale = language === "vi" ? "vi-VN" : "en-US";
  const dateIso = toLocalDateIso(date);
  const todayIso = toLocalDateIso(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = toLocalDateIso(yesterday);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
  const timeStr = timeFormatter.format(date);

  if (dateIso === todayIso) return `${todayLabel} ${timeStr}`;
  if (dateIso === yesterdayIso) return `${yesterdayLabel} ${timeStr}`;

  const dateFormatter = new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
    timeZone,
  });
  return `${dateFormatter.format(date)} ${timeStr}`;
}

function formatCallerPhoneDisplay(phone: string | null | undefined): string {
  const raw = phone?.trim();
  if (!raw) return "";

  const parsed = parsePhone(raw);
  if (isValidPhoneE164(raw, parsed.countryCode)) {
    const national = formatNationalNumber(
      parsed.nationalNumber,
      parsed.countryCode,
    );
    if (national.replace(/\D/g, "")) {
      return `${parsed.countryCode} ${national}`.trim();
    }
  }

  return raw;
}

function toCallItem(
  item: MerchantVoiceCallDto,
  todayLabel: string,
  yesterdayLabel: string,
  unknownLabel: string,
  language: string,
): CallItem {
  const status = mapCallOutcomeToUiStatus(item.outcome);
  const phoneDisplay = formatCallerPhoneDisplay(item.callerPhone);
  return {
    id: item.id,
    time: formatCallTime(item.createdAt, todayLabel, yesterdayLabel, language),
    name: item.callerName?.trim() || unknownLabel,
    phoneDisplay,
    status,
    durationSeconds: item.durationSeconds,
    note: item.notes || "",
    followUpSmsSentAt: item.followUpSmsSentAt,
    isNewCaller: item.isNewCaller,
    canFollowUp:
      status === CallUiStatus.Missed &&
      !item.followUpSmsSentAt &&
      Boolean(item.callerPhone?.trim()),
  };
}

export default function BookingCallLogPanel() {
  const { t, currentLanguage } = useTranslation();
  const { showToast } = useNotification();
  const voiceEnabled = useBookingHubVoiceEnabled();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatus | "all">("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingFollowUps, setPendingFollowUps] = useState<
    Record<string, boolean>
  >({});
  /** Hide Follow-up SMS immediately after a successful send (no "Sent" tag). */
  const [sentFollowUpIds, setSentFollowUpIds] = useState<Record<string, true>>(
    {},
  );
  const {
    pageNumber,
    pageSize,
    setPage,
    reset: resetPage,
  } = usePagination({
    pageSize: BOOKING_HUB_PAGE_SIZE,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev === search) return prev;
        resetPage();
        return search;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, resetPage]);

  const searchTerm = normalizePhoneSearchTerm(debouncedSearch) || undefined;

  const { data: statistics, isLoading: isStatisticsLoading } =
    useMerchantVoiceCallStatistics({ enabled: voiceEnabled });
  const {
    data: callsResponse,
    isLoading: isCallsLoading,
    isFetching: isCallsFetching,
    isError: isCallsError,
    refetch: refetchCalls,
  } = useMerchantVoiceCalls(
    { pageNumber, pageSize, searchTerm },
    { enabled: voiceEnabled },
  );
  const sendFollowUpSmsMutation = useSendMerchantVoiceCallFollowUpSms();

  const isListLoading = isCallsLoading || isCallsFetching;

  const unknownLabel = t(`${TK}.unknownCaller`);
  const todayLabel = t(`${TK}.todayLabel`);
  const yesterdayLabel = t(`${TK}.yesterdayLabel`);

  const calls = useMemo(
    () =>
      (callsResponse?.items ?? []).map((item) =>
        toCallItem(
          item,
          todayLabel,
          yesterdayLabel,
          unknownLabel,
          currentLanguage,
        ),
      ),
    [
      callsResponse?.items,
      todayLabel,
      yesterdayLabel,
      unknownLabel,
      currentLanguage,
    ],
  );

  const statusCounts = useMemo(() => {
    const counts = {
      all: calls.length,
      [CallUiStatus.Missed]: 0,
      [CallUiStatus.Answered]: 0,
      [CallUiStatus.Booked]: 0,
    };
    for (const call of calls) {
      counts[call.status] += 1;
    }
    return counts;
  }, [calls]);

  const visibleCalls = useMemo(() => {
    if (statusFilter === "all") return calls;
    return calls.filter((call) => call.status === statusFilter);
  }, [calls, statusFilter]);

  const stats = useMemo(
    () => ({
      todayCount: statistics?.callsToday ?? 0,
      missed: statistics?.missedCallsNeedingFollowUp ?? 0,
      booked: statistics?.bookedToday ?? 0,
      answerRate: statistics?.answerRatePercent ?? 0,
    }),
    [statistics],
  );

  const handleFollowUpSms = async (call: CallItem) => {
    if (!call.canFollowUp || pendingFollowUps[call.id]) return;

    setPendingFollowUps((prev) => ({ ...prev, [call.id]: true }));
    try {
      const sent = await sendFollowUpSmsMutation.mutateAsync({ id: call.id });
      const displayName =
        call.name === unknownLabel ? call.phoneDisplay || call.name : call.name;
      if (sent) {
        setSentFollowUpIds((prev) => ({ ...prev, [call.id]: true }));
        showToast(
          t(`${TK}.followUpSmsSuccess`, { name: displayName }),
          "success",
        );
      } else {
        showToast(t(`${TK}.followUpSmsFailed`), "warning");
      }
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), "error");
    } finally {
      setPendingFollowUps((prev) => ({ ...prev, [call.id]: false }));
    }
  };

  return (
    <div
      className="booking-sub-panel is-active"
      aria-busy={isStatisticsLoading || isListLoading}
    >
      <div className="overview-kpis calllog-kpis">
        <article className="overview-card kpi-card" style={KPI_ACCENT_ELECTRIC}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <PhoneTabIcon />
            </div>
          </div>
          <div className="kpi-label">{t(`${TK}.kpiCallsToday`)}</div>
          <div className="kpi-value">{stats.todayCount}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_RED}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <PhoneXIcon />
            </div>
            <span className="badge booking-status booking-status-noshow">
              {t(`${TK}.kpiMissedBadge`)}
            </span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpiMissedCalls`)}</div>
          <div className="kpi-value">{stats.missed}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_SUCCESS}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <CalendarCheckIcon />
            </div>
            <span className="badge booking-status booking-status-done">
              {t(`${TK}.kpiBookedBadge`)}
            </span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpiBookedByPhone`)}</div>
          <div className="kpi-value">{stats.booked}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_BRAND}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <GraphUpIcon />
            </div>
          </div>
          <div className="kpi-label">{t(`${TK}.kpiAnswerRate`)}</div>
          <div className="kpi-value">{stats.answerRate}%</div>
        </article>
      </div>

      <div className="booking-grid">
        <article className="overview-card overview-card-pad">
          <div className="booking-daybar">
            <div className="booking-date">
              <span className="booking-action-icon">
                <PhoneTabIcon />
              </span>
              <span>{t(`${TK}.headerTitle`)}</span>
            </div>
            <span className="cust-count">
              {t(`${TK}.countLabel`, {
                shown: visibleCalls.length,
                total: callsResponse?.totalCount ?? 0,
              })}
            </span>
          </div>

          <div
            className="booking-controls booking-controls-single"
            aria-label={t(`${TK}.filtersAria`)}
          >
            <label className="booking-control-field">
              <span className="booking-control-label">
                {t(`${TK}.searchLabel`)}
              </span>
              <input
                className="booking-input"
                type="search"
                placeholder={t(`${TK}.searchPlaceholder`)}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div
            className="booking-status-chips"
            role="group"
            aria-label={t(`${TK}.statusFilterAria`)}
          >
            <button
              className={`booking-status-chip ${statusFilter === "all" ? "is-active" : ""}`}
              type="button"
              aria-pressed={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              <span>{t(`${TK}.filterAll`)}</span>
              <span className="booking-status-chip-count">
                {statusCounts.all}
              </span>
            </button>
            {STATUS_FILTER_ORDER.map((id) => {
              const meta = STATUS_META[id];
              return (
                <button
                  key={id}
                  className={`booking-status-chip ${statusFilter === id ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={statusFilter === id}
                  onClick={() => setStatusFilter(id)}
                >
                  <span className="booking-status-chip-icon">{meta.icon}</span>
                  <span>{t(`${TK}.${meta.labelKey}`)}</span>
                  <span className="booking-status-chip-count">
                    {statusCounts[id]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="booking-table-wrap">
            <div className="booking-table-scroller">
              <table className="booking-table call-table">
                <thead>
                  <tr>
                    <th scope="col">{t(`${TK}.colTime`)}</th>
                    <th scope="col">{t(`${TK}.colCaller`)}</th>
                    <th scope="col">{t(`${TK}.colPhone`)}</th>
                    <th scope="col">{t(`${TK}.colStatus`)}</th>
                    <th scope="col">{t(`${TK}.colDuration`)}</th>
                    <th scope="col">{t(`${TK}.colNotes`)}</th>
                    <th scope="col">{t(`${TK}.colAction`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {isListLoading ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>
                        <span className="booking-table-loading">
                          <SpinnerIcon className="booking-inline-spinner" />
                          <span>{t(`${TK}.loadingState`)}</span>
                        </span>
                      </td>
                    </tr>
                  ) : isCallsError ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>
                        <div>{t(`${TK}.loadError`)}</div>
                        <button
                          className="booking-mini-button"
                          type="button"
                          onClick={() => refetchCalls()}
                        >
                          {t(`${TK}.retry`)}
                        </button>
                      </td>
                    </tr>
                  ) : visibleCalls.length === 0 ? (
                    <tr>
                      <td className="booking-empty-cell" colSpan={7}>
                        {t(`${TK}.emptyState`)}
                      </td>
                    </tr>
                  ) : (
                    visibleCalls.map((call) => {
                      const meta = STATUS_META[call.status];
                      const isPending = Boolean(pendingFollowUps[call.id]);
                      const showFollowUpSms =
                        call.canFollowUp && !sentFollowUpIds[call.id];
                      return (
                        <tr className="booking-table-row" key={call.id}>
                          <td>{call.time}</td>
                          <td>
                            <div className="booking-customer-name">
                              {call.name}
                              {call.isNewCaller ? (
                                <span className="badge badge-soft">
                                  {t(`${TK}.newCallerBadge`)}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>{call.phoneDisplay || "_"}</td>
                          <td>
                            <span
                              className={`badge booking-status ${meta.badgeClass}`}
                            >
                              {meta.icon}
                              <span>{t(`${TK}.${meta.labelKey}`)}</span>
                            </span>
                          </td>
                          <td>{formatDuration(call.durationSeconds)}</td>
                          <td>
                            <span className="call-note-cell">
                              {call.note || "_"}
                            </span>
                          </td>
                          <td>
                            <div className="booking-actions">
                              {showFollowUpSms ? (
                                <button
                                  className="booking-mini-button primary booking-sms-action"
                                  type="button"
                                  disabled={isPending}
                                  title={t(`${TK}.followUpSms`)}
                                  aria-label={t(`${TK}.followUpSmsAriaLabel`, {
                                    name:
                                      call.name === unknownLabel
                                        ? call.phoneDisplay || call.name
                                        : call.name,
                                  })}
                                  onClick={() => handleFollowUpSms(call)}
                                >
                                  {isPending ? (
                                    <SpinnerIcon className="booking-inline-spinner" />
                                  ) : (
                                    <SendIcon />
                                  )}
                                  <span className="booking-mini-label">
                                    {t(`${TK}.followUpSms`)}
                                  </span>
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!isListLoading && (callsResponse?.totalCount ?? 0) > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={callsResponse?.totalPages ?? 1}
              totalCount={callsResponse?.totalCount ?? 0}
              hasNextPage={callsResponse?.hasNextPage}
              hasPreviousPage={callsResponse?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={isCallsFetching}
            />
          ) : null}
        </article>
      </div>
    </div>
  );
}
