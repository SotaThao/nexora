// StaffProfile — personal profile (staff-owned: display name + bio) and
// per-business display names. Identity basics come from the merchant record.
import {
  Camera,
  Trash2,
  Loader2,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import useAuth from "../../../auth/useAuth";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useNotification } from "../../../contexts/NotificationContext";
import { useStaffAccount } from "../../../contexts/StaffAccountContext";
import { useUploadImage } from "../../../data/hooks/useMerchantSetup";
import { useDeleteAccount } from "../../../data/hooks/useProfileSettings";
import { useStaffProfileView } from "../../../data/hooks/useStaffProfileView";
import { logger } from "../../../utils/logger";
import CountryCodeSelect, {
  formatNationalNumber,
  getDefaultDialCode,
  isValidPhoneE164,
  parsePhone,
} from "../../CountryCodeSelect";
import Tooltip from "../../ui/Tooltip";
import { useStaffLinkedBusinesses } from "../hooks/useStaffLinkedBusinesses";

const panel =
  "rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm";
const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle";
const inputCls =
  "w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand transition-all";
const readOnlyCls =
  "w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm font-medium text-nexoraMuted select-text";
export default function StaffProfile() {
  const { currentLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast: notify, showConfirm } = useNotification();
  const { staffMember, saveProfile, setBusinessDisplayName } =
    useStaffAccount();
  const { linkedBusinesses } = useStaffLinkedBusinesses();
  const { data: profileView, isLoading: isProfileLoading } =
    useStaffProfileView();
  const { onLogout } = useOutletContext<LooseObject>() || {};
  const deleteAccountMutation = useDeleteAccount();
  const [searchParams] = useSearchParams();

  const tabFromUrl = searchParams.get("tab");

  useEffect(() => {
    if (tabFromUrl === "kyc") {
      navigate("/staff/profile", { replace: true });
    }
  }, [tabFromUrl, navigate]);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState(() =>
    getDefaultDialCode(currentLanguage),
  );
  const [saved, setSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);
  const uploadImageMutation = useUploadImage();
  const displayAvatar = avatarPreview || profileView.avatar;

  useEffect(() => {
    setDisplayName(profileView.displayName || "");
    setBio(profileView.bio || "");
    setFullName(profileView.fullName || "");
    const savedPhone = profileView.phone || "";
    const parsed = parsePhone(savedPhone);
    setDialCode(parsed.countryCode);
    setPhone(formatNationalNumber(parsed.nationalNumber, parsed.countryCode));
    setSaved(false);
  }, [
    profileView.displayName,
    profileView.bio,
    profileView.fullName,
    profileView.phone,
  ]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      profileView.avatar &&
      avatarPreview &&
      avatarPreview === profileView.avatar
    ) {
      setAvatarPreview(null);
    }
  }, [profileView.avatar, avatarPreview]);

  const showToast = (
    msg: string,
    type: "success" | "error" | "warning" | "info" = "success",
  ) => {
    notify(msg, type);
  };

  const fullPhone = `${dialCode} ${phone}`.trim();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim())
      errs.fullName = t("staff_dashboard.profile.error_full_name_required");
    if (!displayName.trim())
      errs.displayName = t(
        "staff_dashboard.profile.error_display_name_required",
      );
    if (!phone.trim())
      errs.phone = t("staff_dashboard.profile.error_phone_required");
    else if (!isValidPhoneE164(fullPhone, dialCode))
      errs.phone = t("staff_dashboard.profile.error_phone_invalid");
    if (bio.length > 300)
      errs.bio = t("staff_dashboard.profile.error_bio_too_long");
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    saveProfile({
      defaultDisplayName: displayName,
      bio,
      fullName,
      phone: fullPhone,
    });
    setSaved(true);
    showToast(
      t(
        "components.staff_dashboard.views.StaffProfile.accountChangesSavedSuccessfully",
      ),
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountMutation.isPending) return

    const confirmed = await showConfirm(
      t('components.settings.tabs.ProfileTab.deleteAccountConfirmMessage'),
      t('components.settings.tabs.ProfileTab.deleteAccountConfirmTitle'),
    )
    if (!confirmed) return

    try {
      await deleteAccountMutation.mutateAsync()
      await logout()
      navigate('/login', { replace: true })
    } catch {
      showToast(t('components.settings.tabs.ProfileTab.deleteAccountFailed'))
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);

    try {
      const uploaded = await uploadImageMutation.mutateAsync(file);
      const photoUrl = uploaded.imageUrl || uploaded.fileUrl || "";
      if (!photoUrl) {
        throw new Error("IMAGE_UPLOAD_FAILED");
      }
      saveProfile({ avatar: photoUrl });
      setAvatarPreview(photoUrl);
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      showToast(
        t(
          "components.staff_dashboard.views.StaffProfile.avatarUpdatedSuccessfully",
        ),
      );
    } catch (err) {
      logger.error("[StaffProfile] Failed to upload avatar", err);
      setAvatarPreview(profileView.avatar || null);
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      showToast(t("errors.image_upload_failed"));
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition cursor-pointer bg-nexoraBrand text-white shadow-sm"
        >
          {t("components.staff_dashboard.views.StaffProfile.account")}
        </button>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-4 py-2 rounded-lg text-xs font-extrabold uppercase cursor-not-allowed bg-nexoraSurfaceMuted text-nexoraMuted opacity-60"
        >
          {t("components.staff_dashboard.views.StaffProfile.kyc")}
        </button>
      </div>

      {isProfileLoading ? (
            <section className={panel}>
              <div className="animate-pulse space-y-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-nexoraSurfaceMuted" />
                <div className="h-10 rounded-xl bg-nexoraSurfaceMuted" />
                <div className="h-10 rounded-xl bg-nexoraSurfaceMuted" />
                <div className="h-24 rounded-xl bg-nexoraSurfaceMuted" />
              </div>
            </section>
          ) : (
            <>
              <section className={panel}>
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-extrabold text-nexoraText">
                  {t("staff_dashboard.profile.title")}
                  <Tooltip
                    content={t("staff_dashboard.profile.title_tooltip")}
                  />
                </h3>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    {displayAvatar ? (
                      <img
                        src={displayAvatar}
                        alt={fullName}
                        className={`h-24 w-24 rounded-full object-cover border-2 border-nexoraBorder shadow-md transition-all group-hover:opacity-85 ${uploadImageMutation.isPending ? "opacity-60" : ""}`}
                      />
                    ) : (
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand border-2 border-dashed border-nexoraBrand/30 text-3xl font-extrabold transition-all group-hover:bg-nexoraBrand/20 ${uploadImageMutation.isPending ? "opacity-60" : ""}`}
                      >
                        {(fullName || displayName || "S").charAt(0)}
                      </div>
                    )}
                    <label
                      className={`absolute inset-0 rounded-full bg-black/45 text-white text-[10px] font-black uppercase flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${uploadImageMutation.isPending ? "pointer-events-none opacity-100" : ""}`}
                    >
                      <Camera className="h-5 w-5 mb-1" />
                      {uploadImageMutation.isPending
                        ? t("common.loading")
                        : t(
                            "components.staff_dashboard.views.StaffProfile.change",
                          )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={uploadImageMutation.isPending}
                      />
                    </label>
                  </div>
                  <span className="mt-2 text-xs font-bold text-nexoraText">
                    {fullName || displayName}
                  </span>
                  <span className="text-[10px] text-nexoraSubtle">
                    {t("staff_dashboard.staff_id")}:{" "}
                    {profileView.staffCode || staffMember.id}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>
                      {t("staff_dashboard.profile.full_name")}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`${inputCls} ${errors.fullName ? "border-rose-500 focus:border-rose-500" : ""}`}
                      value={fullName}
                      placeholder={t("staff_dashboard.profile.ph_full_name")}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setSaved(false);
                        setErrors((p) => {
                          const n = { ...p };
                          delete n.fullName;
                          return n;
                        });
                      }}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-[10px] font-bold text-rose-500">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>
                      {t("staff_dashboard.profile.display_name")}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`${inputCls} ${errors.displayName ? "border-rose-500 focus:border-rose-500" : ""}`}
                      value={displayName}
                      placeholder={t("staff_dashboard.profile.ph_display_name")}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setSaved(false);
                        setErrors((p) => {
                          const n = { ...p };
                          delete n.displayName;
                          return n;
                        });
                      }}
                    />
                    {errors.displayName && (
                      <p className="mt-1 text-[10px] font-bold text-rose-500">
                        {errors.displayName}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelCls}>
                        {t("staff_dashboard.profile.phone")}{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <CountryCodeSelect
                          value={dialCode}
                          onChange={(newCode) => {
                            const digits = phone.replace(/\D/g, "");
                            setDialCode(newCode);
                            setPhone(formatNationalNumber(digits, newCode));
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.phone;
                              return n;
                            });
                          }}
                        />
                        <input
                          type="text"
                          className={`h-10 w-full min-w-0 rounded-r-lg border border-l-0 bg-nexoraSurface px-3.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand transition-all ${errors.phone ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15" : "border-nexoraBorder"}`}
                          value={phone}
                          placeholder={t("staff_dashboard.profile.ph_phone")}
                          onChange={(e) => {
                            const formatted = formatNationalNumber(
                              e.target.value,
                              dialCode,
                            );
                            setPhone(formatted);
                            setSaved(false);
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.phone;
                              return n;
                            });
                          }}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-[10px] font-bold text-rose-500">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>
                        {t("staff_dashboard.profile.email")}
                      </label>
                      <div className={readOnlyCls}>
                        {profileView.email || staffMember.email || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-visible">
                    <label className={`${labelCls} !flex items-center gap-1.5 overflow-visible`}>
                      {t("staff_dashboard.profile.bio")}
                      <Tooltip
                        align="start"
                        placement="top"
                        content={t("staff_dashboard.profile.bio_tooltip")}
                      />
                    </label>
                    <textarea
                      className={`${inputCls} h-24 resize-none ${errors.bio ? "border-rose-500 focus:border-rose-500" : ""}`}
                      value={bio}
                      placeholder={t("staff_dashboard.profile.ph_bio")}
                      onChange={(e) => {
                        setBio(e.target.value);
                        setSaved(false);
                        setErrors((p) => {
                          const n = { ...p };
                          delete n.bio;
                          return n;
                        });
                      }}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.bio ? (
                        <p className="text-[10px] font-bold text-rose-500">
                          {errors.bio}
                        </p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={`text-[10px] ${bio.length > 300 ? "text-rose-500 font-bold" : "text-nexoraSubtle"}`}
                      >
                        {bio.length}/300
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-nexoraSubtle">
                  {t("staff_dashboard.profile.identity_note")}
                </p>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSavingProfile}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("common.loading")}</span>
                    </>
                  ) : (
                    <span>
                      {saved
                        ? t("staff_dashboard.profile.saved")
                        : t("staff_dashboard.profile.save")}
                    </span>
                  )}
                </button>
              </section>

              {linkedBusinesses.length > 0 ? (
                <section className={panel}>
                  <h3 className="mb-3 text-base font-extrabold text-nexoraText">
                    {t("staff_dashboard.profile.business_names")}
                  </h3>
                  <div className="space-y-3">
                    {linkedBusinesses.map((biz) => (
                      <div key={biz.businessStaffLinkId}>
                        <label className={labelCls}>{biz.businessName}</label>
                        <input
                          className={inputCls}
                          value={biz.displayName}
                          placeholder={t(
                            "staff_dashboard.profile.ph_business_display_name",
                          )}
                          onChange={(e) =>
                            setBusinessDisplayName(
                              biz.businessStaffLinkId,
                              e.target.value,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={panel}>
                <h3 className="mb-3 text-base font-extrabold text-nexoraDangerDark dark:text-red-400">
                  {t('components.staff_dashboard.views.StaffProfile.deleteAccountTitle')}
                </h3>
                <p className="mb-4 text-xs text-nexoraSubtle">
                  {t('components.settings.tabs.ProfileTab.deleteAccountConfirmMessage')}
                </p>
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleteAccountMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                  {deleteAccountMutation.isPending
                    ? t('common.processing')
                    : t('components.settings.tabs.ProfileTab.deleteAccount')}
                </button>
              </section>

              <section className={panel}>
                <h3 className="mb-3 text-base font-extrabold text-nexoraDangerDark dark:text-red-400">
                  {t('components.staff_dashboard.views.StaffProfile.signOutAccount')}
                </h3>
                <p className="mb-4 text-xs text-nexoraSubtle">
                  {t('components.staff_dashboard.views.StaffProfile.signOutFromThe')}
                </p>
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  {t('staff_dashboard.sign_out')}
                </button>
              </section>
            </>
          )}
    </div>
  );
}
