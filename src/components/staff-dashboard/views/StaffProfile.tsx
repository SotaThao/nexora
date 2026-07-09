// StaffProfile — personal profile (staff-owned: display name + bio) and
// per-business display names. Identity basics come from the merchant record.
import {
  ArrowLeft,
  Camera,
  Bell,
  ChevronRight,
  FileText,
  Languages,
  Lock,
  Trash2,
  Loader2,
  LogOut,
  ShieldCheck,
  UserCircle,
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
import StaffNotifications from "./StaffNotifications";

const panel =
  "rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm";
const labelCls =
  "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle";
const inputCls =
  "w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand transition-all";
const readOnlyCls =
  "w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm font-medium text-nexoraMuted select-text";

const compactPanel =
  "rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]";
const profileSections = [
  "personal",
  "verification",
  "tax",
  "notifications",
  "language",
  "privacy",
];

function ProfileMenuItem({ icon: Icon, label, sub = null, onClick = null }: any) {
  return (
    <button
      type="button"
      onClick={onClick || undefined}
      className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F4F2FF] text-nexoraBrandDark">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-nexoraText">{label}</span>
        {sub ? <span className="block truncate text-[10px] font-medium text-nexoraMuted">{sub}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  );
}

function VerificationMenuItem({ label, status, verified, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-slate-500">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-nexoraText">
        {label}
      </span>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${
          verified ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-600"
        }`}
      >
        {status}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  );
}

function LanguageMenuItem({ label, value, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-slate-500">
        <Languages className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-nexoraText">
        {label}
      </span>
      <span className="shrink-0 text-[11px] font-semibold text-slate-500">
        {value}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  );
}

function ProfileSectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#EEE9FF] bg-white text-nexoraText shadow-sm transition active:scale-95"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h1 className="min-w-0 truncate text-base font-semibold text-nexoraText">
        {title}
      </h1>
    </div>
  );
}

export default function StaffProfile() {
  const { currentLanguage, setLanguage, t } = useTranslation();
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
  const sectionFromUrl = searchParams.get("section") || "";
  const activeSection = profileSections.includes(sectionFromUrl)
    ? sectionFromUrl
    : "";

  useEffect(() => {
    if (tabFromUrl === "kyc") {
      navigate("/staff/profile?section=verification", { replace: true });
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
  const profileName = displayName || fullName || staffMember.fullName || "Staff";
  const profileInitial = profileName.trim().charAt(0).toUpperCase() || "S";
  const nexoraId = profileView.staffCode || staffMember.id || "—";
  const isKYCVerified = profileView.isKYCVerified === true;
  const kycStatusLabel = isKYCVerified
    ? t("staff_dashboard.profile.menu_verified")
    : t("staff_dashboard.profile.menu_not_verified");
  const openProfileSection = (section: string) => {
    navigate(`/staff/profile?section=${section}`);
  };
  const closeProfileSection = () => {
    navigate("/staff/profile");
  };

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
              {!activeSection ? (
                <>
              <section className="space-y-2 px-0.5">
                <h1 className="text-base font-semibold leading-tight text-nexoraText">
                  {t("staff_dashboard.profile.screen_title")}
                </h1>
                <div className={`${compactPanel} flex items-center gap-4 rounded-2xl p-3`}>
                  <div className="grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#EDEBFF] text-xl font-semibold text-nexoraBrandDark shadow-sm">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={profileName} className="h-full w-full object-cover" />
                    ) : (
                      profileInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <h2 className="truncate text-base font-semibold leading-tight text-nexoraText">{profileName}</h2>
                    <p className="mt-1 truncate text-[11px] font-medium text-nexoraMuted">
                      {t("staff_dashboard.profile.nexora_id", { id: nexoraId })}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">
                      {t("staff_dashboard.profile.member_since")}
                    </p>
                    <button
                      type="button"
                      onClick={() => openProfileSection("personal")}
                      className="mt-2 inline-flex h-7 min-w-[88px] items-center justify-center rounded-lg bg-[#EEE9FF] px-4 text-[12px] font-semibold text-nexoraBrandDark transition active:scale-95"
                    >
                      {t("staff_dashboard.profile.edit_profile")}
                    </button>
                  </div>
                </div>
              </section>

              <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
                <ProfileMenuItem
                  icon={UserCircle}
                  label={t("staff_dashboard.profile.menu_personal_information")}
                  onClick={() => openProfileSection("personal")}
                />
                <VerificationMenuItem
                  label={t("staff_dashboard.profile.menu_verification")}
                  status={kycStatusLabel}
                  verified={isKYCVerified}
                  onClick={() => openProfileSection("verification")}
                />
                <ProfileMenuItem
                  icon={Bell}
                  label={t("staff_dashboard.profile.menu_notification_preferences")}
                  onClick={() => openProfileSection("notifications")}
                />
                <LanguageMenuItem
                  label={t("staff_dashboard.profile.menu_language")}
                  value={currentLanguage === "vi" ? "Tiếng Việt" : "English"}
                  onClick={() => openProfileSection("language")}
                />
                <ProfileMenuItem
                  icon={Lock}
                  label={t("staff_dashboard.profile.menu_privacy_security")}
                  onClick={() => openProfileSection("privacy")}
                />
              </section>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-100 cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">{t("staff_dashboard.sign_out")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleteAccountMutation.isPending}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-2 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4.5 w-4.5 shrink-0" />
                  <span className="truncate">
                    {deleteAccountMutation.isPending
                      ? t("common.processing")
                      : t("components.settings.tabs.ProfileTab.deleteAccount")}
                  </span>
                </button>
              </div>
                </>
              ) : null}

              {activeSection === "personal" ? (
                <>
              <ProfileSectionHeader
                title={t("staff_dashboard.profile.menu_personal_information")}
                onBack={closeProfileSection}
              />

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
                </>
              ) : null}

              {activeSection === "verification" ? (
                <>
                  <ProfileSectionHeader
                    title={t("staff_dashboard.profile.menu_verification")}
                    onBack={closeProfileSection}
                  />
                  <section className={panel}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          isKYCVerified
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-nexoraText">
                          {kycStatusLabel}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-nexoraMuted">
                          {isKYCVerified
                            ? t("staff_dashboard.profile.verification_body")
                            : t("staff_dashboard.profile.verification_unverified_body")}
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              {activeSection === "notifications" ? (
                <>
                  <ProfileSectionHeader
                    title={t("staff_dashboard.profile.menu_notification_preferences")}
                    onBack={closeProfileSection}
                  />
                  <StaffNotifications showPushPreferences={false} />
                </>
              ) : null}

              {activeSection === "language" ? (
                <>
                  <ProfileSectionHeader
                    title={t("staff_dashboard.profile.menu_language")}
                    onBack={closeProfileSection}
                  />
                  <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
                    <button
                      type="button"
                      onClick={() => setLanguage("en")}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left transition hover:bg-[#F8F7FF]"
                    >
                      <span className="text-[13px] font-semibold text-nexoraText">English</span>
                      <span className="text-[11px] font-bold text-nexoraMuted">
                        {currentLanguage === "en" ? t("staff_dashboard.profile.current_language") : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage("vi")}
                      className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left transition hover:bg-[#F8F7FF]"
                    >
                      <span className="text-[13px] font-semibold text-nexoraText">Tiếng Việt</span>
                      <span className="text-[11px] font-bold text-nexoraMuted">
                        {currentLanguage === "vi" ? t("staff_dashboard.profile.current_language") : ""}
                      </span>
                    </button>
                  </section>
                </>
              ) : null}

              {activeSection === "privacy" ? (
                <>
                  <ProfileSectionHeader
                    title={t("staff_dashboard.profile.menu_privacy_security")}
                    onBack={closeProfileSection}
                  />

                  <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
                    <ProfileMenuItem
                      icon={FileText}
                      label={t("staff_dashboard.profile.terms_title")}
                      sub={t("staff_dashboard.profile.terms_subtitle")}
                      onClick={() =>
                        navigate(
                          `/terms-of-service?returnTo=${encodeURIComponent("/staff/profile?section=privacy")}`,
                        )
                      }
                    />
                    <ProfileMenuItem
                      icon={Lock}
                      label={t("staff_dashboard.profile.privacy_policy_title")}
                      sub={t("staff_dashboard.profile.privacy_subtitle")}
                      onClick={() =>
                        navigate(
                          `/privacy-policy?returnTo=${encodeURIComponent("/staff/profile?section=privacy")}`,
                        )
                      }
                    />
                  </section>
                </>
              ) : null}
            </>
          )}
    </div>
  );
}
