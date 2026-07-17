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
import { normalizePhoneSearchTerm } from "../../CountryCodeSelect";
import {
  BOOKING_HUB_EMPTY_CELL,
  BOOKING_HUB_PAGINATION_CLASSNAME,
  BOOKING_HUB_STATUS_FILTER_ALL,
  BOOKING_KPI_ACCENTS,
  countPageItemsByStatus,
  filterPageItemsByStatus,
  formatCallDurationSeconds,
  formatVoicePhoneDisplay,
  toLocalDateIso,
} from "./bookingHubFormatters";
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

function formatCallTime(
  createdAt: string,
  todayLabel: string,
  yesterdayLabel: string,
  language: string,
): string {
  const date = parseApiDateTime(createdAt);
  if (!date) return BOOKING_HUB_EMPTY_CELL;

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

function toCallItem(
  item: MerchantVoiceCallDto,
  todayLabel: string,
  yesterdayLabel: string,
  language: string,
): CallItem {
  const status = mapCallOutcomeToUiStatus(item.outcome);
  const phoneDisplay =
    formatVoicePhoneDisplay(item.callerPhone, BOOKING_HUB_EMPTY_CELL) ??
    BOOKING_HUB_EMPTY_CELL;
  return {
    id: item.id,
    time: formatCallTime(item.createdAt, todayLabel, yesterdayLabel, language),
    name: item.callerName?.trim() || BOOKING_HUB_EMPTY_CELL,
    phoneDisplay,
    status,
    durationSeconds: item.durationSeconds,
    note: item.notes?.trim() || BOOKING_HUB_EMPTY_CELL,
    followUpSmsSentAt: item.followUpSmsSentAt,
    isNewCaller: item.isNewCaller,
    canFollowUp:
      status === CallUiStatus.Missed &&
      !item.followUpSmsSentAt &&
      Boolean(item.callerPhone?.trim()),
  };
}

function callDisplayName(call: Pick<CallItem, "name" | "phoneDisplay">): string {
  if (call.name !== BOOKING_HUB_EMPTY_CELL) return call.name;
  if (call.phoneDisplay !== BOOKING_HUB_EMPTY_CELL) return call.phoneDisplay;
  return call.name;
}

export default function BookingCallLogPanel() {
  const { t, currentLanguage } = useTranslation();
  const { showToast } = useNotification();
  const voiceEnabled = useBookingHubVoiceEnabled();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    CallStatus | typeof BOOKING_HUB_STATUS_FILTER_ALL
  >(BOOKING_HUB_STATUS_FILTER_ALL);
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
    // Status chips are UI-only on the loaded page (same as Today). Search + paging still hit BE.
    { pageNumber, pageSize, searchTerm },
    { enabled: voiceEnabled },
  );
  const sendFollowUpSmsMutation = useSendMerchantVoiceCallFollowUpSms();

  const isListLoading = isCallsLoading || isCallsFetching;

  const todayLabel = t(`${TK}.todayLabel`);
  const yesterdayLabel = t(`${TK}.yesterdayLabel`);

  const calls = useMemo(
    () =>
      (callsResponse?.items ?? []).map((item) =>
        toCallItem(item, todayLabel, yesterdayLabel, currentLanguage),
      ),
    [callsResponse?.items, todayLabel, yesterdayLabel, currentLanguage],
  );

  const statusCounts = useMemo(
    () => countPageItemsByStatus(calls, STATUS_FILTER_ORDER),
    [calls],
  );

  const visibleCalls = useMemo(
    () => filterPageItemsByStatus(calls, statusFilter),
    [calls, statusFilter],
  );

  // Stay on the current page: chip filter only narrows this page’s rows (no BE Status refetch).
  const handleStatusFilterChange = (
    next: CallStatus | typeof BOOKING_HUB_STATUS_FILTER_ALL,
  ) => {
    if (next === statusFilter) return;
    setStatusFilter(next);
  };

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
      const displayName = callDisplayName(call);
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
      className="booking-sub-panel is-active panel-calllog"
      aria-busy={isStatisticsLoading || isListLoading}
    >
      <div className="overview-kpis calllog-kpis" data-call-stats>
        <article className="overview-card kpi-card" style={BOOKING_KPI_ACCENTS.electric}>
          <div className="kpi-top">
            <div className="kpi-icon">
              <PhoneTabIcon />
            </div>
          </div>
          <div className="kpi-label">{t(`${TK}.kpiCallsToday`)}</div>
          <div className="kpi-value">{stats.todayCount}</div>
        </article>

        <article className="overview-card kpi-card" style={BOOKING_KPI_ACCENTS.red}>
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

        <article className="overview-card kpi-card" style={BOOKING_KPI_ACCENTS.success}>
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

        <article className="overview-card kpi-card" style={BOOKING_KPI_ACCENTS.brand}>
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
              className={`booking-status-chip ${statusFilter === BOOKING_HUB_STATUS_FILTER_ALL ? "is-active" : ""}`}
              type="button"
              aria-pressed={statusFilter === BOOKING_HUB_STATUS_FILTER_ALL}
              onClick={() => handleStatusFilterChange(BOOKING_HUB_STATUS_FILTER_ALL)}
            >
              <span>{t(`${TK}.filterAll`)}</span>
              <span className="booking-status-chip-count">
                {statusCounts[BOOKING_HUB_STATUS_FILTER_ALL]}
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
                  onClick={() => handleStatusFilterChange(id)}
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
                          <td data-label={t(`${TK}.colTime`)}>{call.time}</td>
                          <td data-label={t(`${TK}.colCaller`)}>
                            <div className="booking-customer-name">
                              {call.name}
                              {call.isNewCaller ? (
                                <span className="badge badge-soft">
                                  {t(`${TK}.newCallerBadge`)}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td data-label={t(`${TK}.colPhone`)}>
                            {call.phoneDisplay}
                          </td>
                          <td data-label={t(`${TK}.colStatus`)}>
                            <span
                              className={`badge booking-status ${meta.badgeClass}`}
                            >
                              {meta.icon}
                              <span>{t(`${TK}.${meta.labelKey}`)}</span>
                            </span>
                          </td>
                          <td data-label={t(`${TK}.colDuration`)}>
                            {formatCallDurationSeconds(
                              call.durationSeconds,
                              BOOKING_HUB_EMPTY_CELL,
                            )}
                          </td>
                          <td data-label={t(`${TK}.colNotes`)}>
                            <span className="call-note-cell">{call.note}</span>
                          </td>
                          <td data-label={t(`${TK}.colAction`)}>
                            <div className="booking-actions">
                              {showFollowUpSms ? (
                                <button
                                  className="booking-mini-button primary"
                                  type="button"
                                  disabled={isPending}
                                  title={t(`${TK}.followUpSms`)}
                                  aria-label={t(`${TK}.followUpSmsAriaLabel`, {
                                    name: callDisplayName(call),
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
              className={BOOKING_HUB_PAGINATION_CLASSNAME}
            />
          ) : null}
        </article>
      </div>
    </div>
  );
}
