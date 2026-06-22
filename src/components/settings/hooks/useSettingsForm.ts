import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../contexts/LanguageContext";
import {
  useUpdateBusiness,
  useUpdateBusinessInfo,
  useUpdateReviewLinks,
} from "../../../data/hooks/useMerchantSetup";
import {
  useProfileSettings,
  useUpdateAddress,
  useUpdateAvatar,
  useUpdateBasicInfo,
  useUpdateUserProfile,
} from "../../../data/hooks/useProfileSettings";
import { qk } from "../../../data/queryKeys";
import { logger } from "../../../utils/logger";
import { getUserProfileImageUrl } from "../../../utils/userProfileImage";
import {
  isValidEmail,
  isValidHttpUrl,
  isValidPhone,
} from "../../../utils/validation";

type SettingsFormErrors = Record<string, string>;

const formValue = (input: unknown) => String(input ?? "").trim();

const isAdultDob = (input: unknown) => {
  const dob = formValue(input);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return birthDate <= today && age >= 18;
};

const validateBasicForm = (form: LooseObject): SettingsFormErrors => {
  const errors: SettingsFormErrors = {};
  const fullName = formValue(form.fullName);
  if (!fullName) errors.fullName = "required";
  else if (fullName.length < 2 || !/\p{L}/u.test(fullName)) errors.fullName = "invalid";
  if (!formValue(form.dob)) errors.dob = "required";
  else if (!isAdultDob(form.dob)) errors.dob = "adultDob";
  if (!formValue(form.phone)) errors.phone = "required";
  else if (!isValidPhone(form.phone)) errors.phone = "phone";
  return errors;
};

const validateAddressForm = (form: LooseObject): SettingsFormErrors => {
  const errors: SettingsFormErrors = {};
  ["street", "city", "zipCode", "country"].forEach((field) => {
    if (!formValue(form[field])) errors[field] = "required";
  });
  if (formValue(form.street) && formValue(form.street).length < 3) errors.street = "invalid";
  if (formValue(form.city) && formValue(form.city).length < 2) errors.city = "invalid";
  if (formValue(form.state) && formValue(form.state).length < 2) errors.state = "invalid";
  if (
    formValue(form.zipCode) &&
    !/^[\p{L}\d][\p{L}\d -]{1,11}$/u.test(formValue(form.zipCode))
  ) {
    errors.zipCode = "postalCode";
  }
  if (formValue(form.country) && formValue(form.country).length < 2) errors.country = "invalid";
  return errors;
};

const validateBusinessForm = (form: LooseObject): SettingsFormErrors => {
  const errors: SettingsFormErrors = {};
  if (!formValue(form.businessName)) errors.businessName = "required";
  else if (formValue(form.businessName).length < 2) errors.businessName = "invalid";
  if (!formValue(form.businessPhone)) errors.businessPhone = "required";
  else if (!isValidPhone(form.businessPhone)) errors.businessPhone = "phone";
  if (!formValue(form.businessEmail)) errors.businessEmail = "required";
  else if (!isValidEmail(form.businessEmail)) errors.businessEmail = "email";
  if (formValue(form.businessWebsite) && !isValidHttpUrl(form.businessWebsite)) {
    errors.businessWebsite = "url";
  }
  return errors;
};

const validateReviewsForm = (form: LooseObject): SettingsFormErrors => {
  const errors: SettingsFormErrors = {};
  if (formValue(form.googleReview) && !isValidHttpUrl(form.googleReview)) errors.googleReview = "url";
  if (formValue(form.yelpReview) && !isValidHttpUrl(form.yelpReview)) errors.yelpReview = "url";
  return errors;
};

const DEFAULT_PROFILE = {
  username: "",
  email: "",
  referralId: "",
  avatar: null,
  fullName: "",
  dob: "",
  phone: "",
  sponsorReferralId: "",
  sponsorUsername: "",
  sponsorEmail: "",
  sponsorPhone: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  businessName: "",
  businessPhone: "",
  businessEmail: "",
  businessWebsite: "",
  paymentAccounts: {
    zelle: "",
    bankwire: "",
    paypal: "",
    venmo: "",
    cashapp: "",
    applecash: "",
    vlinkpay: "",
  },
  payoutToggles: {
    zelle: false,
    bankwire: false,
    paypal: false,
    venmo: false,
    cashapp: false,
    applecash: false,
  },
  payoutQrCodes: {
    zelle: "",
    bankwire: "",
    paypal: "",
    venmo: "",
    cashapp: "",
    applecash: "",
  },
  googleReview: "",
  yelpReview: "",
};

export default function useSettingsForm({
  setupData,
  hasKyb,
  userEmail,
  onKybRequired,
  initialTab,
  onTabChange,
  onKybSuccess,
  verificationStatus,
  openKybPortal,
}) {
  const { t, currentLanguage } = useTranslation();
  const queryClient = useQueryClient();
  const profileSettingsQuery = useProfileSettings();
  const updateUserProfileMutation = useUpdateUserProfile();
  const updateBasicInfoMutation = useUpdateBasicInfo();
  const updateAddressMutation = useUpdateAddress();
  const updateAvatarMutation = useUpdateAvatar();
  const updateBusinessMutation = useUpdateBusiness();
  const updateBusinessInfoMutation = useUpdateBusinessInfo();
  const updateReviewLinksMutation = useUpdateReviewLinks();
  const [activeTab, setActiveTab] = useState(initialTab); // profile | kyb

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab) => {
    if (tab === 'profile' && activeTab === 'kyb') {
      queryClient.invalidateQueries({ queryKey: qk.userProfile() });
      queryClient.invalidateQueries({ queryKey: qk.verifiedStatus() });
    }
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const openKybPortalFlow = () => {
    if (openKybPortal) openKybPortal();
  };

  // Settings profile state loaded from local storage or default
  const [profile, setProfile] = useState(() => {
    if (!hasKyb) {
      return {
        ...DEFAULT_PROFILE,
        username: "",
        fullName: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        businessName: "",
        businessPhone: "",
        businessEmail: "",
        businessWebsite: "",
        paymentAccounts: {
          zelle: "",
          bankwire: "",
          paypal: "",
          venmo: "",
          cashapp: "",
          applecash: "",
          vlinkpay: "",
        },
        payoutToggles: {
          zelle: false,
          bankwire: false,
          paypal: false,
          venmo: false,
          cashapp: false,
          applecash: false,
        },
        payoutQrCodes: {
          zelle: "",
          bankwire: "",
          paypal: "",
          venmo: "",
          cashapp: "",
          applecash: "",
        },
      };
    }
    return DEFAULT_PROFILE;
  });
  const [copiedId, setCopiedId] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  // Edit states for different cards
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState<LooseObject>({});
  const [basicErrors, setBasicErrors] = useState<SettingsFormErrors>({});

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<LooseObject>({});
  const [addressErrors, setAddressErrors] = useState<SettingsFormErrors>({});

  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [businessForm, setBusinessForm] = useState<LooseObject>({});
  const [businessErrors, setBusinessErrors] = useState<SettingsFormErrors>({});

  const [isEditingReviews, setIsEditingReviews] = useState(false);
  const [reviewsForm, setReviewsForm] = useState({
    googleReview: "",
    yelpReview: "",
  });
  const [reviewsErrors, setReviewsErrors] = useState<SettingsFormErrors>({});

  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editQrCode, setEditQrCode] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    if (!hasKyb) return;
    setIsEditingBasic(false);
    setIsEditingAddress(false);
    setIsEditingBusiness(false);
  }, [hasKyb]);

  // Load profile settings + business profile into the form.
  //
  // IMPORTANT: account/owner fields come from profileSettingsQuery (the user
  // profile), while the STORE/BUSINESS fields (name, address, phone, review
  // links, payout accounts) come from setupData (the merchant business record,
  // GET /api/v1/merchant/business). These two sources must be MERGED, not
  // treated as mutually exclusive: profileSettingsQuery shares the
  // ['userProfile'] query key and carries no business fields, so the old
  // `if (profileSettingsQuery.data) ... else if (setupData)` chain meant the
  // business name was never read once the user profile loaded. Business fields
  // are applied last so they always reflect the saved business record (and are
  // shown regardless of KYB status).
  useEffect(() => {
    setProfile((prev) => {
      let next = { ...prev };
      if (profileSettingsQuery.data) {
        const d = profileSettingsQuery.data as LooseObject;
        const profileImageUrl = getUserProfileImageUrl(profileSettingsQuery.data);
        next = {
          ...next,
          ...d,
          avatar: profileImageUrl || next.avatar || null,
          phone: (d.phoneNumber as string) || (d.phone as string) || next.phone || '',
          street: (d.address as string) || (d.street as string) || next.street || '',
          dob: (d.dateOfBirth as string) || (d.dob as string) || next.dob || '',
          referralId: (d.referralCode as string) || (d.referralId as string) || next.referralId || '',
        };
      }
      if (setupData) {
        next = {
          ...next,
          fullName: setupData.businessInfo?.ownerName || next.fullName || "",
          avatar: next.avatar || setupData.businessInfo?.logo || null,
          businessName: setupData.businessInfo?.name || "",
          businessPhone: setupData.businessInfo?.phone || "",
          businessWebsite: setupData.businessInfo?.website || "",
          businessEmail:
            setupData.reviewLinks?.feedbackEmail || next.businessEmail || "",
          street: setupData.businessInfo?.address || next.street || "",
          googleReview: setupData.reviewLinks?.googleReview || "",
          yelpReview: setupData.reviewLinks?.yelpReview || "",
          paymentAccounts:
            setupData.businessInfo?.paymentAccounts || next.paymentAccounts,
          payoutQrCodes:
            setupData.businessInfo?.payoutQrCodes || next.payoutQrCodes,
        };
      }
      if (!setupData && !profileSettingsQuery.data && !hasKyb) {
        next = {
          ...next,
          email: userEmail || next.email || "",
          businessEmail: userEmail || next.businessEmail || "",
        };
      }
      return next;
    });
  }, [profileSettingsQuery.data, setupData, hasKyb, userEmail]);

  const saveProfile = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(t("components.settings.hooks.useSettingsForm.copiedToClipboard"));
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- Edit Actions ---
  const startEditBasic = () => {
    if (hasKyb) return;
    setBasicErrors({});
    setBasicForm({
      fullName: profile.fullName,
      dob: profile.dob,
      phone: profile.phone,
    });
    setIsEditingBasic(true);
  };

  // Build the base DTO from persisted API data so required fields are never empty.
  const getApiProfileBase = () => {
    const d = profileSettingsQuery.data || {};
    return {
      firstName: (d.firstName as string) || '',
      lastName: (d.lastName as string) || '',
      phoneNumber: (d.phoneNumber as string) || '',
      city: (d.city as string) || '',
      state: (d.state as string) || '',
      country: (d.country as string) || '',
      zipCode: (d.zipCode as string) || '',
      address: (d.address as string) || '',
    };
  };

  const saveBasic = (e) => {
    e.preventDefault();
    if (hasKyb) return;
    const errors = validateBasicForm(basicForm);
    setBasicErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const fullName = String(basicForm.fullName || '').trim();
    const phone = String(basicForm.phone || '').trim();
    const dto = {
      firstName: fullName.split(' ')[0] || fullName,
      lastName: fullName.split(' ').slice(1).join(' ') || undefined,
      phoneNumber: phone || undefined,
      dateOfBirth: basicForm.dob || undefined,
    };
    updateBasicInfoMutation.mutate(dto, {
      onSuccess: () => {
        saveProfile({
          ...profile,
          fullName,
          dob: basicForm.dob,
          phone,
        });
        showToast(t("components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully"));
        setIsEditingBasic(false);
      },
    });
  };

  const startEditAddress = () => {
    if (hasKyb) return;
    setAddressErrors({});
    setAddressForm({
      street: profile.street,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      country: profile.country,
    });
    setIsEditingAddress(true);
  };

  const saveAddress = (e) => {
    e.preventDefault();
    if (hasKyb) return;
    const errors = validateAddressForm(addressForm);
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const dto = {
      address: String(addressForm.street || '').trim() || undefined,
      city: String(addressForm.city || '').trim() || undefined,
      state: String(addressForm.state || '').trim() || undefined,
      zipCode: String(addressForm.zipCode || '').trim() || undefined,
      country: String(addressForm.country || '').trim() || undefined,
    };
    updateAddressMutation.mutate(dto, {
      onSuccess: () => {
        saveProfile({
          ...profile,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zipCode: addressForm.zipCode,
          country: addressForm.country,
        });
        showToast(t("components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully"));
        setIsEditingAddress(false);
      },
    });
  };

  const startEditBusiness = () => {
    if (hasKyb) return;
    setBusinessErrors({});
    setBusinessForm({
      businessName: profile.businessName,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      businessWebsite: profile.businessWebsite,
    });
    setIsEditingBusiness(true);
  };

  const saveBusiness = (e) => {
    e.preventDefault();
    if (hasKyb) return;
    const errors = validateBusinessForm(businessForm);
    setBusinessErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const businessName = String(businessForm.businessName || "").trim();
    const businessPhone = String(businessForm.businessPhone || "").trim();
    const businessEmail = String(businessForm.businessEmail || "").trim();
    const businessWebsite = String(businessForm.businessWebsite || "").trim();
    updateBusinessInfoMutation.mutate(
      {
        name: businessName,
        phone: businessPhone || undefined,
        feedbackEmail: businessEmail || undefined,
        website: businessWebsite || undefined,
      },
      {
        onSuccess: () => {
          saveProfile({
            ...profile,
            businessName,
            businessPhone,
            businessEmail,
            businessWebsite,
          });
          showToast(t("components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully"));
          setIsEditingBusiness(false);
        },
      },
    );
  };

  const startEditReviews = () => {
    setReviewsErrors({});
    setReviewsForm({
      googleReview: profile.googleReview || "",
      yelpReview: profile.yelpReview || "",
    });
    setIsEditingReviews(true);
  };

  const saveReviews = (e) => {
    e.preventDefault();
    const errors = validateReviewsForm(reviewsForm);
    setReviewsErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const googleReview = reviewsForm.googleReview.trim();
    const yelpReview = reviewsForm.yelpReview.trim();
    updateReviewLinksMutation.mutate(
      {
        googleReviewUrl: googleReview,
        yelpUrl: yelpReview,
      },
      {
        onSuccess: () => {
          saveProfile({
            ...profile,
            googleReview,
            yelpReview,
          });
          showToast(t("components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully"));
          setIsEditingReviews(false);
        },
      },
    );
  };

  const handleToggleMethod = (key) => {
    const updatedToggles = {
      ...profile.payoutToggles,
      [key]: !profile.payoutToggles?.[key],
    };
    const updatedProfile = {
      ...profile,
      payoutToggles: updatedToggles,
    };
    saveProfile(updatedProfile);
  };

  const handleEditPayoutAccount = (key) => {
    setEditingMethod(key);
    setEditValue(profile.paymentAccounts?.[key] || "");
    setEditQrCode(profile.payoutQrCodes?.[key] || "");
    setModalError("");
  };

  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditQrCode(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const handleModalTakePhoto = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        editValue || "",
      )}`;
      setEditQrCode(mockQr);
      setIsCapturing(false);
    }, 800);
  };

  const handleModalClearQr = () => {
    setEditQrCode("");
  };

  const savePayoutAccount = (e) => {
    e.preventDefault();
    const updatedAccounts = {
      ...profile.paymentAccounts,
      [editingMethod]: editValue,
    };
    const updatedQrCodes = {
      ...profile.payoutQrCodes,
      [editingMethod]: editQrCode,
    };
    const updatedToggles = {
      ...profile.payoutToggles,
      [editingMethod]:
        editValue.trim() !== ""
          ? true
          : !!profile.payoutToggles?.[editingMethod],
    };
    const updatedProfile = {
      ...profile,
      paymentAccounts: updatedAccounts,
      payoutQrCodes: updatedQrCodes,
      payoutToggles: updatedToggles,
    };
    saveProfile(updatedProfile);
    setEditingMethod(null);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await updateAvatarMutation.mutateAsync(file);
      setProfile((prev) => ({ ...prev, avatar: result.avatarUrl }));
      showToast(
        t(
          "components.staff_dashboard.views.StaffProfile.avatarUpdatedSuccessfully",
        ),
      );
    } catch (err) {
      logger.error("[useSettingsForm] Failed to upload profile avatar", err);
      showToast(t("errors.image_upload_failed"));
    } finally {
      e.target.value = "";
    }
  };

  const formatDOB = (dobString) => {
    if (!dobString) return "";
    try {
      const date = new Date(dobString);
      return date.toLocaleDateString(
        currentLanguage === "vi" ? "vi-VN" : "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      );
    } catch (e) {
      return dobString;
    }
  };

  const getStatusCardDetails = () => {
    switch (verificationStatus) {
      case "basic":
        return {
          bgClass: "bg-blue-50/70 border-blue-200 text-blue-900",
          icon: ShieldAlert,
          iconBg: "bg-blue-500",
          title: t(
            "components.settings.hooks.useSettingsForm.basicAccountStatus",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.yourProfileIsActive",
          ),
          ctaText: t(
            "components.settings.hooks.useSettingsForm.completeBusinessVerification",
          ),
          ctaAction: openKybPortalFlow,
        };
      case "lite_pending":
        return {
          bgClass: "bg-amber-50/70 border-amber-200 text-amber-900",
          icon: ShieldAlert,
          iconBg: "bg-amber-500",
          title: t(
            "components.settings.hooks.useSettingsForm.liteVerificationPendingReview",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.liteVerificationPendingReview2",
          ),
          ctaText: null,
        };
      case "verified_lite":
        return {
          bgClass: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
          icon: ShieldCheck,
          iconBg: "bg-emerald-500",
          title: t("components.settings.hooks.useSettingsForm.verifiedLite"),
          description: t(
            "components.settings.hooks.useSettingsForm.verifiedLiteP2pTipping",
          ),
          ctaText: t(
            "components.settings.hooks.useSettingsForm.completeBusinessVerification",
          ),
          ctaAction: openKybPortalFlow,
        };
      case "kyb_required":
        return {
          bgClass: "bg-orange-50/70 border-orange-200 text-orange-900",
          icon: ShieldAlert,
          iconBg: "bg-orange-500",
          title: t(
            "components.settings.hooks.useSettingsForm.businessVerificationRequired",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.businessVerificationRequiredYou",
          ),
          ctaText: t(
            "components.settings.hooks.useSettingsForm.completeBusinessVerification",
          ),
          ctaAction: openKybPortalFlow,
        };
      case "kyb_pending":
        return {
          bgClass: "bg-indigo-50/70 border-indigo-200 text-indigo-900",
          icon: ShieldAlert,
          iconBg: "bg-indigo-500",
          title: t(
            "components.settings.hooks.useSettingsForm.businessVerificationPending",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.businessVerificationPendingVlinkpay",
          ),
          ctaText: null,
        };
      case "kyb_approved":
      case "verified_pro":
        return {
          bgClass: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
          icon: ShieldCheck,
          iconBg: "bg-emerald-500",
          title: t(
            "components.settings.hooks.useSettingsForm.businessProfileVerifiedKyb",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.businessProfileVerifiedKyb2",
          ),
          subText: "",
          ctaText: null,
        };
      case "suspended":
        return {
          bgClass: "bg-red-50/70 border-red-200 text-red-900",
          icon: ShieldAlert,
          iconBg: "bg-red-500",
          title: t(
            "components.settings.hooks.useSettingsForm.accountSuspended",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.accountSuspendedPleaseContact",
          ),
          ctaText: null,
        };
      case "pro_pending":
        return {
          bgClass: "bg-blue-50/70 border-blue-200 text-blue-900",
          icon: ShieldAlert,
          iconBg: "bg-blue-500",
          title: t(
            "components.settings.hooks.useSettingsForm.proVerificationPendingReview",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.yourProVerificationUpgrade",
          ),
          ctaText: null,
        };
      case "kyb_rejected":
        return {
          bgClass: "bg-rose-50/70 border-rose-200 text-rose-900",
          icon: ShieldAlert,
          iconBg: "bg-rose-500",
          title: t(
            "components.settings.hooks.useSettingsForm.verificationRejectedByCompliance",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.yourBusinessVerificationApplication",
          ),
          ctaText: t(
            "components.settings.hooks.useSettingsForm.reSubmitVerification",
          ),
          ctaAction: openKybPortalFlow,
        };
      case "under_review":
        return {
          bgClass: "bg-amber-50/70 border-amber-200 text-amber-900",
          icon: ShieldAlert,
          iconBg: "bg-amber-500",
          title: t(
            "components.settings.hooks.useSettingsForm.underReviewInfoRequested",
          ),
          description: t(
            "components.settings.hooks.useSettingsForm.underReviewAdditionalCompliance",
          ),
          ctaText: t(
            "components.settings.hooks.useSettingsForm.uploadAdditionalDocuments",
          ),
          ctaAction: openKybPortalFlow,
        };
      default:
        return null;
    }
  };

  return {
    // tab state
    activeTab,
    handleTabChange,
    // profile state
    profile,
    copiedId,
    toastMessage,
    // edit states
    isEditingBasic,
    setIsEditingBasic,
    basicForm,
    setBasicForm,
    basicErrors,
    setBasicErrors,
    isEditingAddress,
    setIsEditingAddress,
    addressForm,
    setAddressForm,
    addressErrors,
    setAddressErrors,
    isEditingBusiness,
    setIsEditingBusiness,
    businessForm,
    setBusinessForm,
    businessErrors,
    setBusinessErrors,
    isEditingReviews,
    setIsEditingReviews,
    reviewsForm,
    setReviewsForm,
    reviewsErrors,
    setReviewsErrors,
    editingMethod,
    setEditingMethod,
    editValue,
    setEditValue,
    editQrCode,
    setEditQrCode,
    isCapturing,
    modalError,
    setModalError,
    // handlers
    saveProfile,
    showToast,
    handleCopy,
    startEditBasic,
    saveBasic,
    startEditAddress,
    saveAddress,
    startEditBusiness,
    saveBusiness,
    startEditReviews,
    saveReviews,
    handleToggleMethod,
    handleEditPayoutAccount,
    handleModalFileChange,
    handleModalTakePhoto,
    handleModalClearQr,
    savePayoutAccount,
    handleAvatarChange,
    formatDOB,
    getStatusCardDetails,
    currentLanguage,
  };
}
