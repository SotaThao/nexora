// HolidayClosuresCard — shared BusinessHoliday management card, reused as-is by both the
// Booking Hub / Salon Settings panel (BookingSettingsPanel.tsx) and POS General Settings
// (pos/PosGeneralSettingsView.tsx). Tailwind + POS iPad Design Standard conventions so it
// renders identically in either surface without depending on booking-hub.css's scoped
// `.booking-hub-view` CSS variables.
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarX, Check, Loader2, Plus, X } from "lucide-react";
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
import { TWELVE_HOUR_INPUT_LANG } from "../../../constants/timeFormat";
import { formatBookingHubDateDisplay } from "./bookingHubFormatters";
import ToggleSwitch from "../../ui/ToggleSwitch";

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

  const timeInputClass =
    "h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-nexoraText outline-none transition-all border-nexoraBorder focus:border-nexoraBrand disabled:cursor-not-allowed disabled:bg-nexoraCanvas disabled:text-nexoraMuted";

  return (
    <div
      className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative"
      data-settings-card="holidays"
    >
      <div className="flex justify-between items-center gap-3 mb-1">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
          <CalendarX className="h-4 w-4 text-violet-500" />
          {t(`${TK}.holidaysTitle`)}
        </h4>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-[11px] font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t(`${TK}.holidayAddButton`)}
        </button>
      </div>
      <p className="text-xs text-nexoraMuted mb-4">{t(`${TK}.holidaysSub`)}</p>

      {holidays.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left font-black uppercase text-[10px] text-nexoraMuted pb-2 pr-2">
                  {t(`${TK}.holidayColDate`)}
                </th>
                <th className="text-left font-black uppercase text-[10px] text-nexoraMuted pb-2 pr-2">
                  {t(`${TK}.holidayColReason`)}
                </th>
                <th className="text-left font-black uppercase text-[10px] text-nexoraMuted pb-2 pr-2">
                  {t(`${TK}.holidayColType`)}
                </th>
                <th className="text-left font-black uppercase text-[10px] text-nexoraMuted pb-2">
                  {t(`${TK}.holidayColActions`)}
                </th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.id}>
                  <td className="py-3 pr-2 font-bold text-nexoraText whitespace-nowrap">
                    {formatBookingHubDateDisplay(holiday.holidayDate, currentLanguage)}
                  </td>
                  <td className="py-3 pr-2 font-bold text-nexoraText">{holiday.reason}</td>
                  <td className="py-3 pr-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        holiday.type === HOLIDAY_TYPE.CLOSED
                          ? "bg-rose-50 text-rose-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {holiday.type === HOLIDAY_TYPE.CLOSED
                        ? t(`${TK}.holidayTypeClosed`)
                        : t(`${TK}.holidayTypeAdjusted`)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-4 whitespace-nowrap">
                      <button
                        type="button"
                        className="font-bold text-nexoraMuted hover:text-nexoraBrand"
                        onClick={() => openEditModal(holiday)}
                      >
                        {t(`${TK}.holidayActionEdit`)}
                      </button>
                      <button
                        type="button"
                        className="font-bold text-nexoraMuted hover:text-nexoraBrand"
                        onClick={() => openViewModal(holiday)}
                      >
                        {t(`${TK}.holidayActionView`)}
                      </button>
                      <button
                        type="button"
                        className="font-bold text-nexoraMuted hover:text-nexoraBrand disabled:opacity-60"
                        disabled={pendingDeleteId === holiday.id}
                        onClick={() => void handleDelete(holiday)}
                      >
                        {pendingDeleteId === holiday.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
        </div>
      ) : null}

      {holidays.length > 0 ? (
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-nexoraBorder">
          <span className="text-xs font-bold text-nexoraText">{t(`${TK}.holidayCardAutoNotify`)}</span>
          <ToggleSwitch
            checked={holidayAutoNotifyEnabled}
            onChange={() => void toggleHolidayAutoNotify()}
            ariaLabel={t(`${TK}.holidayCardAutoNotify`)}
            activeColor="bg-nexoraBrand"
          />
        </div>
      ) : null}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="nexora-modal-card max-w-[620px] w-full"
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-nexoraText">{modalTitle}</h2>
                <p className="text-xs text-nexoraMuted mt-0.5">{t(`${TK}.holidayModalSub`)}</p>
              </div>
              <button
                type="button"
                aria-label={t(`${TK}.holidayModalCloseAria`)}
                onClick={closeModal}
                className="rounded p-1 text-nexoraMuted hover:bg-nexoraCanvas hover:text-nexoraText"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-nexoraMuted">
                    {t(`${TK}.holidayModalDate`)}
                  </span>
                  <input
                    type="date"
                    min={today}
                    disabled={isViewOnly}
                    value={form.holidayDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, holidayDate: event.target.value }))}
                    className={`${timeInputClass} mt-1`}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-nexoraMuted">
                    {t(`${TK}.holidayModalStatus`)}
                  </span>
                  <select
                    disabled={isViewOnly}
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, type: event.target.value as HolidayType }))
                    }
                    className={`${timeInputClass} mt-1`}
                  >
                    <option value={HOLIDAY_TYPE.CLOSED}>{t(`${TK}.holidayTypeClosed`)}</option>
                    <option value={HOLIDAY_TYPE.ADJUSTED}>{t(`${TK}.holidayTypeAdjusted`)}</option>
                  </select>
                </label>
              </div>

              {!isViewOnly && affectedCount > 0 ? (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-700">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{t(`${TK}.holidayAffectedBookingsWarning`, { count: affectedCount })}</span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-nexoraMuted">
                    {t(`${TK}.holidayModalAdjustedOpen`)}
                  </span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    step={60}
                    disabled={isViewOnly || form.type === HOLIDAY_TYPE.CLOSED}
                    value={form.type === HOLIDAY_TYPE.CLOSED ? "00:00" : form.adjustedOpenTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, adjustedOpenTime: event.target.value }))
                    }
                    className={`${timeInputClass} mt-1`}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase text-nexoraMuted">
                    {t(`${TK}.holidayModalAdjustedClose`)}
                  </span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    step={60}
                    disabled={isViewOnly || form.type === HOLIDAY_TYPE.CLOSED}
                    value={form.type === HOLIDAY_TYPE.CLOSED ? "23:59" : form.adjustedCloseTime}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, adjustedCloseTime: event.target.value }))
                    }
                    className={`${timeInputClass} mt-1`}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black uppercase text-nexoraMuted">
                  {t(`${TK}.holidayModalReason`)}
                </span>
                <input
                  type="text"
                  maxLength={200}
                  disabled={isViewOnly}
                  value={form.reason}
                  placeholder={t(`${TK}.holidayModalReasonPlaceholder`)}
                  onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                  className={`${timeInputClass} mt-1`}
                />
              </label>

              {!isViewOnly ? (
                <div className="flex flex-wrap gap-2">
                  {HOLIDAY_REASON_SUGGESTIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, reason: t(`${TK}.holidaySuggestion.${key}`) }))
                      }
                      className="rounded-full border border-nexoraBorder px-2.5 py-1 text-[11px] font-bold text-nexoraBrand hover:bg-nexoraBrand/10"
                    >
                      {t(`${TK}.holidaySuggestion.${key}`)}
                    </button>
                  ))}
                </div>
              ) : null}

              {formError ? <p className="text-[11px] font-bold text-rose-500">{formError}</p> : null}
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2">
              {isViewOnly ? (
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded px-3 py-1.5 text-[10px] font-bold text-nexoraMuted hover:bg-nexoraCanvas"
                >
                  {t(`${TK}.holidayModalClose`)}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded px-3 py-1.5 text-[10px] font-bold text-nexoraMuted hover:bg-nexoraCanvas"
                  >
                    {t(`${TK}.holidayModalCancel`)}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSave()}
                    className="inline-flex items-center gap-1.5 rounded bg-nexoraBrand px-4 py-1.5 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
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
    </div>
  );
}
