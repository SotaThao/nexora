import { useMemo, useState } from "react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { getErrorI18nKey } from "../../../data/errorCodes";
import { useMerchantSetup } from "../../../data/hooks/useMerchantSetup";
import { useBookingSettings, useUpdateBookingSettings } from "../../../data/hooks/usePosBookingSettings";
import {
  useAffectedBookingsCount,
  useCreateMerchantVoiceHoliday,
  useDeleteMerchantVoiceHoliday,
  useMerchantVoiceHolidays,
  useUpdateMerchantVoiceHoliday,
} from "../../../data/hooks/useMerchantVoiceBookings";
import type { MerchantVoiceHolidayDto } from "../../../data/repositories/merchantVoice";
import { getApiErrorCode } from "../../../types/domain";
import { HOLIDAY_TYPE, type HolidayType } from "../../../constants/holiday";
import { formatBookingHubDateDisplay } from "./bookingHubFormatters";
import { AlertTriangleIcon, CalendarXIcon, CheckLgIcon, PlusIcon, SpinnerIcon, XLgIcon } from "./BookingHubIcons";

const TK = "components.dashboard.views.BookingHubView.settings";

const HOLIDAY_REASON_SUGGESTIONS = [
  "christmasDay",
  "thanksgiving",
  "newYearsDay",
  "independenceDay",
  "staffTraining",
] as const;

type HolidayModalMode = "add" | "edit" | "view";

type HolidayFormState = {
  holidayDate: string;
  reason: string;
  type: HolidayType;
  adjustedOpenTime: string;
  adjustedCloseTime: string;
};

const EMPTY_FORM: HolidayFormState = {
  holidayDate: "",
  reason: "",
  type: HOLIDAY_TYPE.CLOSED,
  adjustedOpenTime: "09:00",
  adjustedCloseTime: "19:00",
};

export default function HolidayClosuresCard() {
  const { t, currentLanguage } = useTranslation();
  const { showToast, showConfirm } = useNotification();

  const { data: holidays = [] } = useMerchantVoiceHolidays();
  const createMutation = useCreateMerchantVoiceHoliday();
  const updateMutation = useUpdateMerchantVoiceHoliday();
  const deleteMutation = useDeleteMerchantVoiceHoliday();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<HolidayModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HolidayFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // One toggle per Business — lives on PosBookingSettings, not per-holiday-record.
  const { data: merchantSetupData } = useMerchantSetup();
  const businessId = merchantSetupData?.businessInfo?.businessId;
  const { data: bookingSettings } = useBookingSettings(businessId);
  const updateBookingSettingsMutation = useUpdateBookingSettings(businessId);
  const holidayAutoNotifyEnabled = bookingSettings?.holidayAutoNotifyEnabled ?? true;

  const toggleHolidayAutoNotify = async () => {
    try {
      await updateBookingSettingsMutation.mutateAsync({
        autoConfirmEnabled: bookingSettings?.autoConfirmEnabled ?? true,
        minLeadTimeMinutes: bookingSettings?.minLeadTimeMinutes ?? 15,
        maxAdvanceDays: bookingSettings?.maxAdvanceDays ?? 7,
        reminderHoursBefore: bookingSettings?.reminderHoursBefore ?? 12,
        notifyCustomerSmsEnabled: bookingSettings?.notifyCustomerSmsEnabled ?? true,
        notifyBusinessSmsEnabled: bookingSettings?.notifyBusinessSmsEnabled ?? true,
        notifyAssignedStaffSmsEnabled: bookingSettings?.notifyAssignedStaffSmsEnabled ?? true,
        holidayAutoNotifyEnabled: !holidayAutoNotifyEnabled,
      });
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), "error");
    }
  };

  const { data: affectedCount = 0 } = useAffectedBookingsCount(form.holidayDate, {
    enabled: modalOpen && modalMode !== "view" && Boolean(form.holidayDate),
  });

  const isViewOnly = modalMode === "view";
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (holiday: MerchantVoiceHolidayDto) => {
    setModalMode("edit");
    setEditingId(holiday.id);
    setForm({
      holidayDate: holiday.holidayDate,
      reason: holiday.reason,
      type: holiday.type,
      adjustedOpenTime: holiday.adjustedOpenTime ?? "09:00",
      adjustedCloseTime: holiday.adjustedCloseTime ?? "19:00",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openViewModal = (holiday: MerchantVoiceHolidayDto) => {
    setModalMode("view");
    setEditingId(holiday.id);
    setForm({
      holidayDate: holiday.holidayDate,
      reason: holiday.reason,
      type: holiday.type,
      adjustedOpenTime: holiday.adjustedOpenTime ?? "09:00",
      adjustedCloseTime: holiday.adjustedCloseTime ?? "19:00",
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const validate = (): string => {
    if (!form.holidayDate) return t(`${TK}.holidayErrorDateRequired`);
    if (!form.reason.trim()) return t(`${TK}.holidayErrorReasonRequired`);
    if (form.reason.trim().length > 200) return t(`${TK}.holidayErrorReasonTooLong`);
    if (form.type === HOLIDAY_TYPE.ADJUSTED) {
      if (!form.adjustedOpenTime || !form.adjustedCloseTime)
        return t(`${TK}.holidayErrorAdjustedTimeRequired`);
      if (form.adjustedCloseTime <= form.adjustedOpenTime)
        return t(`${TK}.holidayErrorAdjustedTimeRange`);
    }
    return "";
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");

    const body = {
      holidayDate: form.holidayDate,
      reason: form.reason.trim(),
      type: form.type,
      adjustedOpenTime: form.type === HOLIDAY_TYPE.ADJUSTED ? form.adjustedOpenTime : null,
      adjustedCloseTime: form.type === HOLIDAY_TYPE.ADJUSTED ? form.adjustedCloseTime : null,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, body });
        showToast(t(`${TK}.holidayUpdated`), "success");
      } else {
        await createMutation.mutateAsync(body);
        showToast(t(`${TK}.holidayCreated`), "success");
      }
      setModalOpen(false);
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), "error");
    }
  };

  const handleDelete = async (holiday: MerchantVoiceHolidayDto) => {
    const ok = await showConfirm(
      t(`${TK}.holidayDeleteConfirmMessage`, { reason: holiday.reason || "—" }),
      t(`${TK}.holidayDeleteConfirmTitle`),
    );
    if (!ok) return;

    setPendingDeleteId(holiday.id);
    try {
      await deleteMutation.mutateAsync(holiday.id);
      showToast(t(`${TK}.holidayDeleted`), "success");
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), "error");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const modalTitle = isViewOnly
    ? t(`${TK}.holidayModalViewTitle`)
    : editingId
      ? t(`${TK}.holidayModalEditTitle`)
      : t(`${TK}.holidayModalTitle`);

  return (
    <article className="settings-card" data-settings-card="holidays">
      <div className="settings-holiday-card-head">
        <div>
          <div className="settings-card-title">
            <span className="settings-card-title-icon">
              <CalendarXIcon />
            </span>
            {t(`${TK}.holidaysTitle`)}
          </div>
          <div className="settings-card-sub">{t(`${TK}.holidaysSub`)}</div>
        </div>
        <button className="booking-primary-button" type="button" onClick={openAddModal}>
          <PlusIcon />
          {t(`${TK}.holidayAddButton`)}
        </button>
      </div>

      {holidays.length > 0 ? (
        <table className="settings-holiday-table">
          <thead>
            <tr>
              <th>{t(`${TK}.holidayColDate`)}</th>
              <th>{t(`${TK}.holidayColReason`)}</th>
              <th>{t(`${TK}.holidayColType`)}</th>
              <th>{t(`${TK}.holidayColActions`)}</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => (
              <tr key={holiday.id}>
                <td className="settings-holiday-table-date">
                  {formatBookingHubDateDisplay(holiday.holidayDate, currentLanguage)}
                </td>
                <td className="settings-holiday-table-reason">{holiday.reason}</td>
                <td>
                  <span
                    className={`settings-holiday-badge ${holiday.type === HOLIDAY_TYPE.CLOSED ? "is-closed" : "is-adjusted"}`}
                  >
                    {holiday.type === HOLIDAY_TYPE.CLOSED
                      ? t(`${TK}.holidayTypeClosed`)
                      : t(`${TK}.holidayTypeAdjusted`)}
                  </span>
                </td>
                <td>
                  <div className="settings-holiday-table-actions">
                    <button
                      className="settings-holiday-link-action"
                      type="button"
                      onClick={() => openEditModal(holiday)}
                    >
                      {t(`${TK}.holidayActionEdit`)}
                    </button>
                    <button
                      className="settings-holiday-link-action"
                      type="button"
                      onClick={() => openViewModal(holiday)}
                    >
                      {t(`${TK}.holidayActionView`)}
                    </button>
                    <button
                      className="settings-holiday-link-action"
                      type="button"
                      disabled={pendingDeleteId === holiday.id}
                      onClick={() => void handleDelete(holiday)}
                    >
                      {pendingDeleteId === holiday.id ? (
                        <SpinnerIcon className="booking-inline-spinner" />
                      ) : (
                        t(`${TK}.holidayActionDelete`)
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {holidays.length > 0 ? (
        <div className="settings-holiday-toggle-row">
          <span className="settings-holiday-toggle-label">{t(`${TK}.holidayCardAutoNotify`)}</span>
          <button
            className={`toggle-pill${holidayAutoNotifyEnabled ? " is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={holidayAutoNotifyEnabled}
            aria-label={t(`${TK}.holidayCardAutoNotify`)}
            disabled={updateBookingSettingsMutation.isPending}
            onClick={() => void toggleHolidayAutoNotify()}
          />
        </div>
      ) : null}

      {modalOpen ? (
        <div className="settings-holiday-modal" role="presentation" onClick={closeModal}>
          <div
            className="settings-holiday-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="settings-holiday-modal-head">
              <div>
                <div className="settings-holiday-modal-title">{modalTitle}</div>
                <div className="settings-holiday-modal-sub">{t(`${TK}.holidayModalSub`)}</div>
              </div>
              <button
                className="settings-holiday-modal-close"
                type="button"
                aria-label={t(`${TK}.holidayModalCloseAria`)}
                onClick={closeModal}
              >
                <XLgIcon />
              </button>
            </div>

            <div className="settings-holiday-modal-body">
              <div className="settings-holiday-field-grid">
                <label className="settings-holiday-field">
                  <span className="settings-label">{t(`${TK}.holidayModalDate`)}</span>
                  <input
                    className="settings-input"
                    type="date"
                    min={today}
                    disabled={isViewOnly}
                    value={form.holidayDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, holidayDate: event.target.value }))}
                  />
                </label>
                <label className="settings-holiday-field">
                  <span className="settings-label">{t(`${TK}.holidayModalStatus`)}</span>
                  <select
                    className="settings-select"
                    disabled={isViewOnly}
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, type: event.target.value as HolidayType }))
                    }
                  >
                    <option value={HOLIDAY_TYPE.CLOSED}>{t(`${TK}.holidayTypeClosed`)}</option>
                    <option value={HOLIDAY_TYPE.ADJUSTED}>{t(`${TK}.holidayTypeAdjusted`)}</option>
                  </select>
                </label>
              </div>

              {!isViewOnly && affectedCount > 0 ? (
                <div className="settings-holiday-warning">
                  <AlertTriangleIcon />
                  <span>{t(`${TK}.holidayAffectedBookingsWarning`, { count: affectedCount })}</span>
                </div>
              ) : null}

              <div className="settings-holiday-field-grid">
                <label className="settings-holiday-field">
                  <span className="settings-label">{t(`${TK}.holidayModalAdjustedOpen`)}</span>
                  <input
                    className="settings-input"
                    type="time"
                    lang="en-US-u-hc-h12"
                    step={60}
                    disabled={isViewOnly || form.type === HOLIDAY_TYPE.CLOSED}
                    value={form.type === HOLIDAY_TYPE.CLOSED ? "00:00" : form.adjustedOpenTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, adjustedOpenTime: event.target.value }))
                    }
                  />
                </label>
                <label className="settings-holiday-field">
                  <span className="settings-label">{t(`${TK}.holidayModalAdjustedClose`)}</span>
                  <input
                    className="settings-input"
                    type="time"
                    lang="en-US-u-hc-h12"
                    step={60}
                    disabled={isViewOnly || form.type === HOLIDAY_TYPE.CLOSED}
                    value={form.type === HOLIDAY_TYPE.CLOSED ? "23:59" : form.adjustedCloseTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, adjustedCloseTime: event.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="settings-holiday-field">
                <span className="settings-label">{t(`${TK}.holidayModalReason`)}</span>
                <input
                  className="settings-input"
                  type="text"
                  maxLength={200}
                  disabled={isViewOnly}
                  value={form.reason}
                  placeholder={t(`${TK}.holidayModalReasonPlaceholder`)}
                  onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                />
              </label>

              {!isViewOnly ? (
                <div className="settings-holiday-suggestion-row">
                  {HOLIDAY_REASON_SUGGESTIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="settings-holiday-suggestion-chip"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, reason: t(`${TK}.holidaySuggestion.${key}`) }))
                      }
                    >
                      {t(`${TK}.holidaySuggestion.${key}`)}
                    </button>
                  ))}
                </div>
              ) : null}

              {formError ? <span className="settings-holiday-error">{formError}</span> : null}
            </div>

            <div className="settings-holiday-modal-actions">
              {isViewOnly ? (
                <button className="booking-secondary-button" type="button" onClick={closeModal}>
                  {t(`${TK}.holidayModalClose`)}
                </button>
              ) : (
                <>
                  <button className="booking-secondary-button" type="button" onClick={closeModal}>
                    {t(`${TK}.holidayModalCancel`)}
                  </button>
                  <button
                    className="booking-primary-button"
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSave()}
                  >
                    {isSaving ? (
                      <SpinnerIcon className="booking-inline-spinner" />
                    ) : (
                      <>
                        <CheckLgIcon />
                        {editingId ? t(`${TK}.holidayModalUpdate`) : t(`${TK}.holidayModalSave`)}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
