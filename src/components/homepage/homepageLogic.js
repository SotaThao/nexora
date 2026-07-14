/**
 * Homepage interactive logic — simulator, Tax IQ, i18n, modals.
 * Wired from HomePageBridgeContext via getHomePageHandlers().
 */
import { getStoredAppLanguage, setStoredAppLanguage } from '../../utils/appLanguage.js'
import { homepageTranslations } from './i18n/homepageTranslations'
import {
  INTRO_VIDEO_ID,
  openIntroYouTubeVideo,
  shouldOpenYouTubeExternally,
} from '../../utils/youtubeIntroVideo.js'

let __homepageClickOutside = null

export function getInitialHomePageLanguage() {
  return getStoredAppLanguage()
}

const translations = homepageTranslations


const taxWriteOffsData = [
  {
    key: "mileage",
    name_vi: "🚗 Dặm Đường Di Chuyển (Mileage)",
    name_en: "🚗 Business Mileage Deductions",
    value: 1005,
    desc_vi: "Khấu trừ chi phí xăng xe đi lại giữa các tiệm hoặc mua đồ dùng làm việc theo định mức IRS năm 2026.",
    desc_en: "Deduct standard business mileage accrued for client visits, supply runs, and travel between multi-salons."
  },
  {
    key: "nail supplies sơn móng",
    name_vi: "💅 Dụng cụ, Sơn gel & Thiết bị chuyên dụng",
    name_en: "💅 Nail Supplies & Specialized Kits",
    value: 450,
    desc_vi: "Tất cả các loại sơn móng, đèn UV hơ gel, máy mài móng, cọ vẽ nghệ thuật dùng trực tiếp cho khách hàng.",
    desc_en: "Deduct nail supplies, nail polishes, gel kits, specialized brushes, UV LED lamps, and table drills purchased for clients."
  },
  {
    key: "thuê bàn",
    name_vi: "🏢 Chi phí thuê ghế/bàn làm việc (Booth Rent)",
    name_en: "🏢 Chair or Booth Rental Fees",
    value: 1200,
    desc_vi: "Chi phí thuê mặt bằng hoặc booth làm việc định kỳ trả cho chủ salon của các nhà thầu độc lập 1099.",
    desc_en: "Deduct monthly or weekly chair rental fees paid directly to the salon owner by 1099 independent contractors."
  },
  {
    key: "license",
    name_vi: "🎓 Bằng cấp, Đào tạo & Gia hạn Giấy phép",
    name_en: "🎓 Continuing Education & Licensing",
    value: 150,
    desc_vi: "Lệ phí gia hạn bằng Cosmetology, Nail Tech với State Board hoặc các khóa đào tạo nâng cao tay nghề.",
    desc_en: "Deduct State Board Cosmetology license renewal fees, professional liability insurances, and specialty masterclass courses."
  },
  {
    key: "uniforms",
    name_vi: "🧥 Đồng phục bảo hộ & Tạp dề làm việc",
    name_en: "🧥 Work Uniforms & Protective Gear",
    value: 180,
    desc_vi: "Các loại tạp dề, khẩu trang, găng tay y tế chuyên dụng không thể mặc đi chơi ngoài đời thường.",
    desc_en: "Deduct specialized work aprons, heavy-duty protective gloves, high-grade masks, and branded salon wear."
  },
  {
    key: "advertising marketing",
    name_vi: "📣 Quảng cáo mạng xã hội & Danh thiếp",
    name_en: "📣 Marketing & Social Media Promos",
    value: 300,
    desc_vi: "Chi phí chạy quảng cáo Facebook, Instagram cá nhân để thu hút tệp khách hàng riêng đến salon đặt lịch.",
    desc_en: "Deduct local marketing expenses, business card printing, website hosting, and Instagram/Facebook client ads."
  },
  {
    key: "phone",
    name_vi: "📱 Điện thoại & Gói dữ liệu (Business Use)",
    name_en: "📱 Cell Phone & Mobile Data Plan",
    value: 672,
    desc_vi: "70% chi phí điện thoại và gói data được khấu trừ nếu dùng để liên lạc với khách hàng và quản lý lịch đặt.",
    desc_en: "Deduct up to 70% of your monthly phone and mobile data plan used for client communications and appointment scheduling."
  },
  {
    key: "tools equipment",
    name_vi: "🔧 Dụng cụ & Thiết bị chuyên nghiệp",
    name_en: "🔧 Professional Tools & Equipment",
    value: 800,
    desc_vi: "Máy khoan móng điện, đèn UV chuyên dụng, bộ cọ vẽ cao cấp và các thiết bị đầu tư dùng hàng ngày tại tiệm.",
    desc_en: "Deduct professional nail tools including electric drills, UV curing lamps, art brush sets, and equipment purchased for daily salon operations."
  }
];

const mockUsersDatabase = {
  "7145550199": { name: "Jennifer H.", phone: "(714) 555-0199", points: 2450, referralCode: "REF-HONG", reward: "FREE Art Gel Voucher", tier: "Gold" },
  "6265550144": { name: "Michael T.", phone: "(626) 555-0144", points: 1500, referralCode: "REF-MINH", reward: "20% Off Scalp Treatment", tier: "Silver" },
  "4085550188": { name: "Tiffany N.", phone: "(408) 555-0188", points: 4200, referralCode: "REF-PHUONG", reward: "Free Herbal Mask Treatment", tier: "Diamond" }
};

const appState = {
  selectedStaff: 'Chloe',
  selectedTipAmount: 10,
  pointsMultiplier: 10,
  currentLanguage: getInitialHomePageLanguage(),

  customer: {
    isRegistered: true,
    name: "Jennifer H.",
    phone: "(714) 555-0199",
    points: 2450,
    referralCode: "REF-HONG"
  },

  // Số liệu của Thợ Chloe
  chloeTodayEarnings: 385.00,
  chloeTxCount: 14,
  chloeDeductions: 42.50,

  // Thống kê của Chủ cửa hàng
  totalOwnerSavings: 415.50,
  totalOwnerTipsRouted: 13850,
  b2bPartnersCount: 2
};

function bootHomePageContent() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  changeLanguage(appState.currentLanguage);
  updateSavingsCalc(15000);
  updateCustomerDashboardUI(); // Tự động đồng bộ lên giao diện ngay khi tải trang
  filterTaxWriteoffs(""); // Hiển thị mặc định danh sách tra cứu thuế ban đầu
  calculateNailTax();     // Tính toán thuế động ban đầu

  __homepageClickOutside = function (event) {
    const dropdownBtn = document.getElementById('lang-dropdown-btn');
    const dropdownMenu = document.getElementById('language-dropdown-menu');
    if (
      dropdownMenu &&
      !dropdownMenu.classList.contains('hidden') &&
      dropdownBtn &&
      !dropdownBtn.contains(event.target) &&
      !dropdownMenu.contains(event.target)
    ) {
      toggleLanguageDropdown();
    }
  };
  document.addEventListener('click', __homepageClickOutside);
}

function toggleLanguageDropdown() {
  const dropdownMenu = document.getElementById('language-dropdown-menu');
  const chevron = document.getElementById('lang-dropdown-chevron');
  const isHidden = dropdownMenu.classList.contains('hidden');

  if (isHidden) {
    dropdownMenu.classList.remove('hidden');
    chevron.classList.add('rotate-180');
  } else {
    dropdownMenu.classList.add('hidden');
    chevron.classList.remove('rotate-180');
  }
}

function t(key) {
  return (translations[appState.currentLanguage] || translations.en)[key] || key;
}

/** Apply a homepage i18n key to a DOM node (for dynamically injected header controls). */
export function applyHomePageI18n(el, key) {
  if (!el || !key) return
  el.setAttribute('data-i18n', key)
  const text = t(key)
  if (text) el.textContent = text
}

function selectLanguage(lang) {
  toggleLanguageDropdown();
  changeLanguage(lang);
}

// 📱 XỬ LÝ TOGGLE MENU DI ĐỘNG (MOBILE HAMBURGER)
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-navigation-menu');
  const icon = document.getElementById('mobile-menu-icon');
  const toggle = document.getElementById('mobile-menu-toggle');
  const isHidden = menu.classList.contains('hidden');

  if (isHidden) {
    menu.classList.remove('hidden');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close mobile menu');
    icon.classList.add('rotate-90');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />';
  } else {
    menu.classList.add('hidden');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open mobile menu');
    icon.classList.remove('rotate-90');
    icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />';
  }
}

// 🌐 BỘ LỌC DỊCH THUẬT DYNAMIC i18n
export function changeLanguage(lang) {
  appState.currentLanguage = lang

  setStoredAppLanguage(lang)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'vi' ? 'vi' : 'en'
  }

  // Thay đổi văn bản ngôn ngữ nút Header
  const currentText = document.getElementById('lang-current-text')
  if (currentText) currentText.textContent = lang === 'vi' ? 'VI' : 'EN'

  // Quét tất cả phần tử có thuộc tính "data-i18n" và dịch
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translations[lang][key];
      } else {
        el.innerHTML = translations[lang][key];
      }
    }
  });

  // Cập nhật lại UI động của Simulator
  updateCustomerDashboardUI();
  syncStaffPortalUI();
  syncOwnerDashboardUI();
  calculateNailTax(); // Tính toán lại biểu mẫu thuế động
  filterTaxWriteoffs(document.getElementById('tax-iq-search-input')?.value || ''); // Làm mới danh mục tra cứu thuế
}

// 🔔 HIỂN THỊ THÔNG BÁO TOAST
function showToast(message) {
  const toast = document.getElementById('toast-banner');
  const toastMsg = document.getElementById('toast-message');
  if (toast && toastMsg) {
    toastMsg.textContent = message;
    toast.classList.remove('-translate-y-16', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    // Tự động ẩn sau 3,5 giây
    setTimeout(() => {
      toast.classList.add('-translate-y-16', 'opacity-0');
      toast.classList.remove('translate-y-0', 'opacity-100');
    }, 3500);
  }
}

// 🎯 THIẾT LẬP TẠO CHIẾN DỊCH KHUYẾN MÃI B2B NHẮM MỤC TIÊU
function activateB2BTargetedCampaign() {
  const partner = document.getElementById('owner-b2b-partner').value;
  const targetTier = document.getElementById('owner-b2b-tier').value;
  const giftInput = document.getElementById('owner-b2b-gift').value.trim();

  if (!giftInput) {
    showToast(t('toast-gift-form-empty'));
    return;
  }

  // Đẩy log kết nối lên Admin tiệm
  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

  if (appState.currentLanguage === 'vi') {
    newLog.innerHTML = `<span>Tạo chiến dịch B2B cho hạng ${targetTier === 'Gold' ? 'Vàng' : targetTier}</span><span class="text-purple font-bold">Live</span>`;
  } else {
    newLog.innerHTML = `<span>Campaign configured for ${targetTier} Tier</span><span class="text-purple font-bold">Active</span>`;
  }
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  // KÍCH HOẠT DỮ LIỆU CHÉO CHO KHÁCH HÀNG
  const currentCustTier = appState.customer.isRegistered && appState.customer.phone === '(714) 555-0199' ? 'Gold' : 'Silver';

  if (currentCustTier === targetTier) {
    document.getElementById('sim-targeted-campaign-box').classList.remove('hidden');
    document.getElementById('sim-targeted-user-name').textContent = appState.customer.name;
    document.getElementById('sim-targeted-partner-name').textContent = partner;
    document.getElementById('sim-targeted-gift-text').textContent = giftInput;

    showToast(t('toast-b2b-match').replace('{0}', appState.customer.name));
  } else {
    showToast(t('toast-b2b-activated'));
  }
}

// Đổi điểm lấy Quà liên kết B2B
function redeemPartnerGift(giftName, partnerName, pointsCost) {
  if (appState.customer.points < pointsCost) {
    showToast(t('toast-points-short').replace('{0}', pointsCost - appState.customer.points));
    return;
  }

  appState.customer.points -= pointsCost;
  updateCustomerDashboardUI();

  const randomCode = "NEX-" + partnerName.replace(/\s+/g, '').toUpperCase() + "-" + Math.floor(100 + Math.random() * 900);

  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

  if (appState.currentLanguage === 'vi') {
    newLog.innerHTML = `<span>${appState.customer.name} đổi ${pointsCost} XP</span><span class="text-purple font-bold">${partnerName}</span>`;
  } else {
    newLog.innerHTML = `<span>${appState.customer.name} swapped ${pointsCost} XP</span><span class="text-purple font-bold">${partnerName}</span>`;
  }
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  if (pointsCost === 0) {
    document.getElementById('sim-targeted-campaign-box').classList.add('hidden');
  }

  showToast(t('toast-redeem-success').replace('{0}', giftName).replace('{1}', partnerName));
}

// Chủ tiệm Phê duyệt đối tác liên kết B2B mới
function approveB2BPartner() {
  const reqBox = document.getElementById('b2b-pending-request');
  reqBox.style.transform = 'scale(0.9)';
  reqBox.style.opacity = '0';

  setTimeout(() => {
    reqBox.remove();

    const partnerList = document.getElementById('owner-b2b-list');
    const newPartner = document.createElement('div');
    newPartner.className = "flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[10px] animate-fadeIn";

    newPartner.innerHTML = `
        <span class="font-bold text-slate-700">${t('lbl-b2b-partner')}</span>
        <span class="text-green bg-green/10 text-[8px] font-bold px-1.5 py-0.5 rounded">${t('lbl-b2b-status')}</span>
      `;
    partnerList.appendChild(newPartner);

    appState.b2bPartnersCount += 1;
    document.getElementById('dashboard-partners-count').textContent = t('txt-partners-count').replace('{0}', appState.b2bPartnersCount);

    const dashboardLog = document.getElementById('dashboard-log');
    const newLog = document.createElement('div');
    newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";

    if (appState.currentLanguage === 'vi') {
      newLog.innerHTML = `<span>Liên kết thành công</span><span class="text-green font-bold">Bloom Florist</span>`;
    } else {
      newLog.innerHTML = `<span>Linked successfully</span><span class="text-green font-bold">Bloom Florist</span>`;
    }
    dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

    showToast(t('toast-b2b-linked'));
  }, 350);
}

// Đổi chi nhánh check-in
function changeBranch() {
  const branches = appState.currentLanguage === 'vi'
    ? ["Chi nhánh Quận 1", "Chi nhánh Quận 3", "Chi nhánh Phú Nhuận", "Chi nhánh Thảo Điền"]
    : ["Downtown Branch", "Central District", "Uptown Plaza", "Metro Suite"];

  const current = branches[Math.floor(Math.random() * branches.length)];

  showToast(t('toast-checkin-swapped').replace('{0}', current));

  const branchBadge = document.querySelector("#screen-customer .text-purple.font-black");
  if (branchBadge) branchBadge.textContent = current;
}

// Chuyển chế độ hoạt động trên Điện thoại giả lập
function switchSimulatorMode(mode) {
  const screenCustomer = document.getElementById('screen-customer');
  const screenStaff = document.getElementById('screen-staff');
  const screenOwner = document.getElementById('screen-owner');

  const tabCustomer = document.getElementById('tab-customer');
  const tabStaff = document.getElementById('tab-staff');
  const tabOwner = document.getElementById('tab-owner');

  screenCustomer.classList.add('hidden');
  screenStaff.classList.add('hidden');
  screenOwner.classList.add('hidden');

  [tabCustomer, tabStaff, tabOwner].forEach(t => {
    t.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 text-slate-400 hover:text-white font-bold";
  });

  if (mode === 'customer') {
    screenCustomer.classList.remove('hidden');
    tabCustomer.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
  } else if (mode === 'staff') {
    screenStaff.classList.remove('hidden');
    tabStaff.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
    syncStaffPortalUI();
  } else if (mode === 'owner') {
    screenOwner.classList.remove('hidden');
    tabOwner.className = "flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold";
    syncOwnerDashboardUI();
  }
}

// Chọn thợ đang phục vụ bạn
function selectStaff(staffName) {
  appState.selectedStaff = staffName;
  document.getElementById('selected-staff-label').textContent = staffName;

  const list = ['Chloe', 'Marcus', 'Sarah'];
  list.forEach(name => {
    const btn = document.getElementById('staff-' + name.toLowerCase());
    if (name === staffName) {
      btn.className = "bg-white border-2 border-purple p-2 rounded-xl text-center shadow-sm transition-all relative";
      if (!btn.querySelector('.absolute')) {
        btn.insertAdjacentHTML('beforeend', `<div class="absolute top-1 right-1 bg-purple text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">✓</div>`);
      }
    } else {
      btn.className = "bg-white border border-slate-200 p-2 rounded-xl text-center shadow-sm transition-all hover:border-purple/50";
      const check = btn.querySelector('.absolute');
      if (check) check.remove();
    }
  });

  showToast(t('toast-staff-selected').replace('{0}', staffName));
}

// Thiết lập số tiền tip nhanh
function setTipAmount(amount) {
  appState.selectedTipAmount = parseFloat(amount);
  document.getElementById('custom-tip').value = '';
  highlightActiveTipButton(amount);
}

// Thiết lập số tiền tip tự chọn
function setCustomTip(val) {
  const parsedVal = parseFloat(val);
  if (!isNaN(parsedVal) && parsedVal > 0) {
    appState.selectedTipAmount = parsedVal;
    highlightActiveTipButton(null);
  }
}

function highlightActiveTipButton(presetAmount) {
  const buttons = document.querySelectorAll('.tip-btn');
  buttons.forEach(btn => {
    if (presetAmount !== null && btn.textContent === `$${presetAmount}`) {
      btn.className = "tip-btn bg-purple text-white font-extrabold text-xs py-1.5 rounded-lg active:scale-95 transition-all shadow-md shadow-purple/20";
    } else {
      btn.className = "tip-btn bg-slate-100 font-extrabold text-xs py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 active:scale-95 transition-all";
    }
  });
}

// Hoàn tất bồi dưỡng trên giả lập
function confirmTip(platform) {
  if (!appState.customer.isRegistered) {
    showToast(t('toast-register-required-tip'));
    return;
  }
  const amt = appState.selectedTipAmount;
  const staff = appState.selectedStaff;

  if (staff === 'Chloe') {
    appState.chloeTodayEarnings += amt;
    appState.chloeTxCount += 1;
  }

  const savedFee = amt * 0.03;
  appState.totalOwnerSavings += savedFee;
  appState.totalOwnerTipsRouted += amt;

  const pointsEarned = Math.round(amt * appState.pointsMultiplier);
  appState.customer.points += pointsEarned;

  updateCustomerDashboardUI();

  // Đồng bộ vào log của Admin tiệm
  const dashboardLog = document.getElementById('dashboard-log');
  const newLog = document.createElement('div');
  newLog.className = "flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100 animate-fadeIn";
  newLog.innerHTML = `<span>${staff} ($${amt.toFixed(2)} Tip)</span><span class="text-green font-bold">Via ${platform}</span>`;
  dashboardLog.insertBefore(newLog, dashboardLog.firstChild);

  showToast(t('toast-tip-success').replace('{0}', amt.toFixed(2)).replace('{1}', staff).replace('{2}', platform));
}

// Sao Đánh giá
function handleRating(starsCount) {
  if (!appState.customer.isRegistered) {
    showToast(t('toast-register-required-rating'));
    return;
  }
  const container = document.getElementById('rating-stars-container');
  const stars = container.querySelectorAll('button');

  stars.forEach((star, index) => {
    if (index < starsCount) {
      star.className = "text-2xl text-amber-400 hover:scale-110 transition-transform";
    } else {
      star.className = "text-2xl text-slate-300 hover:scale-110 transition-transform";
    }
  });

  const privateFeedbackBox = document.getElementById('private-feedback-box');
  const publicRoutingBox = document.getElementById('public-routing-box');

  if (starsCount >= 4) {
    privateFeedbackBox.classList.add('hidden');
    publicRoutingBox.classList.remove('hidden');
    appState.customer.points += 15;
    updateCustomerDashboardUI();

    showToast(t('toast-review-public'));
  } else {
    publicRoutingBox.classList.add('hidden');
    privateFeedbackBox.classList.remove('hidden');

    showToast(t('toast-review-private'));
  }
}

// Gửi góp ý riêng tư
function submitPrivateFeedback() {
  const text = document.getElementById('private-feedback-text').value;
  if (text.trim() === '') {
    showToast(t('toast-feedback-empty'));
    return;
  }
  document.getElementById('private-feedback-text').value = '';
  document.getElementById('private-feedback-box').classList.add('hidden');
  appState.customer.points += 15;
  updateCustomerDashboardUI();

  showToast(t('toast-feedback-sent'));
}

// Đăng ký thành viên trên Simulator
function registerSimulatorUser() {
  const name = document.getElementById('cust-reg-name').value;
  const phoneRaw = document.getElementById('cust-reg-phone').value;
  const ref = document.getElementById('cust-reg-ref').value;

  if (!name || !phoneRaw) {
    showToast(t('toast-reg-required'));
    return;
  }

  const phoneDigits = phoneRaw.replace(/\D/g, ''); // Clean digits for US database matching
  const newUserObj = {
    name: name,
    phone: phoneRaw,
    points: 100,
    referralCode: "REF-" + name.replace(/\s+/g, '').toLowerCase()
  };

  mockUsersDatabase[phoneDigits] = newUserObj;
  executeCustomerSessionLogin(newUserObj);

  showToast(t('toast-reg-success'));
}

// Đồng bộ trạng thái đăng nhập hệ thống thành công
function executeCustomerSessionLogin(userObj) {
  appState.customer.isRegistered = true;
  appState.customer.name = userObj.name;
  appState.customer.phone = userObj.phone;
  appState.customer.points = userObj.points;
  appState.customer.referralCode = userObj.referralCode || "REF-TEMP";

  updateCustomerDashboardUI();

  document.getElementById('header-auth-group')?.classList.add('hidden');
  const badge = document.getElementById('header-user-badge');
  badge?.classList.remove('hidden');
  badge?.style.removeProperty('display');
  const userNameEl = document.getElementById('header-user-name');
  if (userNameEl) userNameEl.textContent = t('txt-greeting').replace('{0}', userObj.name);

  document.getElementById('cust-register-view')?.classList.add('hidden');
  document.getElementById('cust-dashboard-view')?.classList.remove('hidden');
}

// Cập nhật giao diện Simulator Dashboard của Khách Hàng
function updateCustomerDashboardUI() {
  document.getElementById('cust-name-label').textContent = appState.customer.name;
  document.getElementById('cust-phone-label').textContent = "Tel: " + appState.customer.phone;
  document.getElementById('cust-points-label').textContent = appState.customer.points.toLocaleString() + " XP";
  document.getElementById('cust-ref-code-label').textContent = appState.customer.referralCode.toUpperCase();
  document.getElementById('cust-avatar').textContent = appState.customer.name.charAt(0).toUpperCase();
  document.getElementById('tip-points-multiplier').textContent = appState.pointsMultiplier + "x";
}

// Thao tác sao chép mã giới thiệu an toàn
function copyReferralCode() {
  const code = document.getElementById('cust-ref-code-label').textContent;
  const dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = code;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  showToast(t('toast-referral-copied').replace('{0}', code));
}

// Đăng xuất và khôi phục giao diện ban đầu
function handleLogout() {
  const wasCustomerRegistered = appState.customer.isRegistered;

  appState.customer.isRegistered = false;
  appState.customer.name = t('header-guest');
  appState.customer.phone = "";
  appState.customer.points = 0;

  document.getElementById('header-auth-group')?.classList.remove('hidden');
  const badge = document.getElementById('header-user-badge');
  badge?.classList.add('hidden');
  badge?.style.removeProperty('display');

  document.getElementById('cust-dashboard-view')?.classList.add('hidden');
  document.getElementById('cust-register-view')?.classList.remove('hidden');

  const regName = document.getElementById('cust-reg-name');
  const regPhone = document.getElementById('cust-reg-phone');
  const regRef = document.getElementById('cust-reg-ref');
  if (regName) regName.value = '';
  if (regPhone) regPhone.value = '';
  if (regRef) regRef.value = '';

  if (wasCustomerRegistered) {
    showToast(t('toast-logged-out'));
  }
}

// Gửi số điện thoại giới thiệu
function submitReferral() {
  const refPhone = document.getElementById('referral-phone').value;
  if (!refPhone) {
    showToast(t('toast-referral-empty'));
    return;
  }
  appState.customer.points += 50;
  updateCustomerDashboardUI();
  document.getElementById('referral-phone').value = '';

  showToast(t('toast-referral-sent'));
}

// Gửi tin nhắn đến quầy lễ tân
function sendInteractionMessage() {
  const msgInput = document.getElementById('interaction-message');
  const text = msgInput.value;
  if (!text.trim()) {
    showToast(t('toast-msg-empty'));
    return;
  }
  msgInput.value = '';

  showToast(t('toast-msg-sent'));
}

function maskUSPhone(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 10);
  let masked = '';
  if (digits.length > 0) masked = '(' + digits.slice(0, 3);
  if (digits.length >= 4) masked += ') ' + digits.slice(3, 6);
  if (digits.length >= 7) masked += '-' + digits.slice(6, 10);
  input.value = masked;
}

// Tra cứu Loyalty ngoài trang web
function lookupExternalLoyalty() {
  const phoneInput = document.getElementById('external-lookup-phone').value.trim();
  const phoneDigits = phoneInput.replace(/\D/g, '');

  if (!phoneDigits) {
    showToast(t('toast-phone-empty'));
    return;
  }

  Swal.fire({
    title: '🚀 Coming Soon!',
    html: `<p style="color:#667085;font-size:14px;margin-top:8px;">Customer profile lookup for <strong style="color:#6c4df6">${phoneInput}</strong> is under development.<br><br>This feature will be available in the next release.</p>`,
    confirmButtonText: 'Got it!',
    confirmButtonColor: '#6c4df6',
    background: '#ffffff',
    customClass: {
      title: 'swal-title',
      popup: 'swal-popup-rounded'
    }
  });
}

// Đồng bộ số liệu Thợ Chloe
function syncStaffPortalUI() {
  document.getElementById('staff-earnings-label').textContent = `$${appState.chloeTodayEarnings.toFixed(2)}`;

  document.getElementById('staff-tx-count').textContent = t('txt-tx-count').replace('{0}', appState.chloeTxCount);

  const taxWithholding = appState.chloeTodayEarnings * 0.15;
  document.getElementById('staff-tax-estimate').textContent = `$${taxWithholding.toFixed(2)}`;
  document.getElementById('staff-tax-deductions').textContent = `$${appState.chloeDeductions.toFixed(2)}`;
}

// AI Tax Optimization cho Thợ
function optimizeStaffDeductions() {
  if (appState.chloeDeductions > 42.50) {
    showToast(t('toast-tax-optimized'));
    return;
  }

  appState.chloeDeductions = 112.80;
  syncStaffPortalUI();

  showToast(t('toast-tax-ai'));
}

// TRA CỨU & LỌC CHI PHÍ KHẤU TRỪ THUẾ
function filterTaxWriteoffs(query) {
  const resultsContainer = document.getElementById('tax-iq-search-results');
  resultsContainer.innerHTML = "";
  const q = query.toLowerCase().trim();

  const filtered = taxWriteOffsData.filter(item => {
    return item.key.includes(q) ||
      item.name_vi.toLowerCase().includes(q) ||
      item.name_en.toLowerCase().includes(q) ||
      item.desc_vi.toLowerCase().includes(q) ||
      item.desc_en.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center p-3 text-xs text-slate-500">
        ${t('tax-search-empty')}
      </div>`;
    return;
  }

  filtered.forEach(item => {
    const title = appState.currentLanguage === 'vi' ? item.name_vi : item.name_en;
    const desc = appState.currentLanguage === 'vi' ? item.desc_vi : item.desc_en;
    const div = document.createElement('div');
    div.className = "bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 animate-fadeIn space-y-1";
    div.innerHTML = `
      <div class="flex justify-between items-center text-xs">
        <strong class="text-slate-100">${title}</strong>
        <span class="text-purple font-extrabold text-[10px]">+$${item.value} Max Write-off</span>
      </div>
      <p class="text-[9px] text-slate-400 leading-normal">${desc}</p>
    `;
    resultsContainer.appendChild(div);
  });
}

function calculateNailTax() {
  const income = parseFloat(document.getElementById('tax-iq-custom-income').value) || 0;
  const filingStatus = document.getElementById('tax-iq-filing-status').value;
  const workerType = document.getElementById('tax-iq-worker-type').value;
  const children = parseInt(document.getElementById('tax-iq-children').value) || 0;

  let seTax = 0;
  if (workerType === '1099' || workerType === 'booth' || workerType === 'owner' || workerType === 'multi') {
    seTax = income * 0.153;
  }

  let totalDeductions = 0;
  if (document.getElementById('chk-deduct-mileage').checked) totalDeductions += 1005;
  if (document.getElementById('chk-deduct-supplies').checked) totalDeductions += 450;
  if (document.getElementById('chk-deduct-license').checked) totalDeductions += 150;
  if (document.getElementById('chk-deduct-rent').checked) totalDeductions += 1200;
  if (document.getElementById('chk-deduct-phone').checked) totalDeductions += 672;

  let standardDeduction = 15000;
  if (filingStatus === 'married') standardDeduction = 30000;
  if (filingStatus === 'hoh') standardDeduction = 22500;

  const taxableIncome = Math.max(income - totalDeductions - standardDeduction, 0);

  let federalTax = 0;
  if (filingStatus === 'single' || filingStatus === 'married_sep') {
    if (taxableIncome <= 11600) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 47150) {
      federalTax = (11600 * 0.10) + ((taxableIncome - 11600) * 0.12);
    } else {
      federalTax = (11600 * 0.10) + ((47150 - 11600) * 0.12) + ((taxableIncome - 47150) * 0.22);
    }
  } else if (filingStatus === 'married') {
    if (taxableIncome <= 23200) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 94300) {
      federalTax = (23200 * 0.10) + ((taxableIncome - 23200) * 0.12);
    } else {
      federalTax = (23200 * 0.10) + ((94300 - 23200) * 0.12) + ((taxableIncome - 94300) * 0.22);
    }
  } else {
    if (taxableIncome <= 16550) {
      federalTax = taxableIncome * 0.10;
    } else if (taxableIncome <= 63100) {
      federalTax = (16550 * 0.10) + ((taxableIncome - 16550) * 0.12);
    } else {
      federalTax = (16550 * 0.10) + ((63100 - 16550) * 0.12) + ((taxableIncome - 63100) * 0.22);
    }
  }

  const childTaxCredit = children * 2000;
  const baselineGrossTax = (income * 0.153) + (Math.max(income - standardDeduction, 0) * 0.12);
  const totalTaxLiability = federalTax + seTax;
  const finalTaxDue = Math.max(totalTaxLiability - childTaxCredit, 0);
  const simulatedSaved = Math.max(baselineGrossTax - finalTaxDue, 0);

  const fmt = v => '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });

  document.getElementById('tax-iq-gross-income').textContent = fmt(income);
  document.getElementById('tax-iq-total-deductions').textContent = fmt(totalDeductions);
  document.getElementById('tax-iq-taxable-income').textContent = fmt(Math.max(taxableIncome, 0));

  const labelTaxDue = document.getElementById('tax-iq-title-due');
  const finalTaxEl = document.getElementById('tax-iq-final-tax');
  labelTaxDue.textContent = t('tax-iq-sum-liability');
  finalTaxEl.className = "text-green text-sm font-black transition-all duration-300";
  finalTaxEl.textContent = fmt(finalTaxDue);

  document.getElementById('tax-iq-saved-amount').textContent = fmt(simulatedSaved);
  updateMissingSummary();
}

function selectTaxRole(role) {
  const staffBtn = document.getElementById('role-btn-staff');
  const ownerBtn = document.getElementById('role-btn-owner');
  const activeClass = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-purple bg-purple/10 text-white transition-all ds-control btn-exp-action';
  const inactiveClass = 'flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900/40 text-slate-400 transition-all ds-control btn-exp-action';
  const workerSelect = document.getElementById('tax-iq-worker-type');
  if (role === 'staff') {
    staffBtn.className = activeClass;
    ownerBtn.className = inactiveClass;
    workerSelect.innerHTML = '<option value="1099">1099 Independent Contractor</option><option value="w2">W2 Employee</option><option value="booth">Booth Renter</option><option value="multi-salon">Multi-salon Worker</option>';
  } else {
    ownerBtn.className = activeClass;
    staffBtn.className = inactiveClass;
    workerSelect.innerHTML = '<option value="owner">Salon Owner</option><option value="multi">Multi-location Owner</option><option value="w2staff">Owner with W2 Staff</option><option value="1099staff">Owner with 1099 Contractors</option><option value="mixed">Mixed Staff Model</option>';
  }
  calculateNailTax();
}

// ── Receipt / Expense state ─────────────────────────────────────────────
const expenseState = {
  mileage:  { status: 'needs_log',     amount: 1005, checkboxId: 'chk-deduct-mileage',  doneLabelKey: 'tax-act-trip-done',     doneActionKey: 'tax-act-view-log' },
  supplies: { status: 'missing',       amount: 450,  checkboxId: 'chk-deduct-supplies', doneLabelKey: 'tax-act-receipt-done',  doneActionKey: 'tax-act-view-receipt' },
  license:  { status: 'ready',         amount: 150,  checkboxId: 'chk-deduct-license',  doneLabelKey: 'tax-act-ready-done',    doneActionKey: 'tax-act-view-receipt' },
  rent:     { status: 'missing_proof', amount: 1200, checkboxId: 'chk-deduct-rent',     doneLabelKey: 'tax-act-proof-done',    doneActionKey: 'tax-act-view-proof' },
  phone:    { status: 'partial',       amount: 672,  checkboxId: 'chk-deduct-phone',    doneLabelKey: 'tax-act-confirmed-done',doneActionKey: 'tax-act-view-details' },
};

function simulateReceiptUpload(key) {
  const exp = expenseState[key];
  if (!exp || exp.status === 'ready') return;
  const btn = document.querySelector(`[data-expense-action="${key}"]`);
  if (btn) { btn.textContent = t('tax-act-uploading'); btn.disabled = true; }
  showToast(t('tax-act-verifying'));
  setTimeout(() => {
    exp.status = 'ready';
    updateExpenseBadge(key);
    const cb = document.getElementById(exp.checkboxId);
    if (cb && !cb.checked) { cb.checked = true; }
    calculateNailTax();
    updateMissingSummary();
    showToast(t('tax-act-verified'));
  }, 1200);
}

function updateExpenseBadge(key) {
  const exp = expenseState[key];
  const badge = document.querySelector(`[data-expense-badge="${key}"]`);
  const btn   = document.querySelector(`[data-expense-action="${key}"]`);
  if (badge) {
    badge.className = 'text-[8px] bg-green/15 text-green border border-green/30 font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap';
    badge.textContent = t(exp.doneLabelKey);
  }
  if (btn) {
    btn.textContent = t(exp.doneActionKey);
    btn.disabled = false;
    btn.className = btn.className.replace('text-purple', 'text-slate-400');
    btn.onclick = () => showToast(t(exp.doneLabelKey));
  }
}

function updateMissingSummary() {
  const missing = Object.values(expenseState)
    .filter(e => e.status === 'missing' || e.status === 'missing_proof').length;
  const el = document.getElementById('summary-missing-count');
  const row = document.getElementById('summary-missing-row');
  if (el) el.textContent = missing + (missing === 1 ? ' item' : ' items');
  if (row) row.classList.toggle('hidden', missing === 0);
}

function toggleTaxSummary() {
  const detail = document.getElementById('tax-summary-detail');
  const isHidden = detail.style.display === 'none';
  detail.style.display = isHidden ? 'block' : 'none';
  chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
}

function reviewWithTaxIQ() {
  document.getElementById('chk-deduct-mileage').checked = true;
  document.getElementById('chk-deduct-supplies').checked = true;
  document.getElementById('chk-deduct-license').checked = true;
  document.getElementById('chk-deduct-rent').checked = true;
  document.getElementById('chk-deduct-phone').checked = true;
  calculateNailTax();
  showToast(t('toast-tax-ai'));
}

function optimizeStaffDeductionsAI() {
  reviewWithTaxIQ();
}

// Tải báo cáo thuế
function downloadTaxReport() {
  showToast(t('toast-tax-download'));
}

// Trình chiếu video giới thiệu từ YouTube
function playIntroVideo() {
  if (shouldOpenYouTubeExternally()) {
    openIntroYouTubeVideo()
    return
  }

  const cover = document.getElementById('video-cover');
  const iframe = document.getElementById('intro-video-iframe');
  if (cover) {
    cover.style.opacity = '0';
    setTimeout(() => {
      cover.style.display = 'none';
    }, 500);
  }
  if (iframe) {
    iframe.src = `https://www.youtube.com/embed/${INTRO_VIDEO_ID}?autoplay=1&mute=1&playlist=${INTRO_VIDEO_ID}&loop=1`;
  }
}

// MODAL HANDLERS
function openAuthModal(tab) {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-95');
  modal.querySelector('.transform').classList.add('scale-100');
  switchAuthTab(tab);
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-100');
  modal.querySelector('.transform').classList.add('scale-95');
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('auth-tab-login');
  const registerTab = document.getElementById('auth-tab-register');
  const loginForm = document.getElementById('auth-form-login');
  const registerForm = document.getElementById('auth-form-register');
  const activeClass = "flex-1 py-2.5 text-center font-extrabold text-sm rounded-xl bg-white text-navy shadow-sm transition-all ds-control ds-button";
  const inactiveClass = "flex-1 py-2.5 text-center font-extrabold text-sm text-white/60 hover:text-white rounded-xl transition-all ds-control ds-button";

  if (tab === 'login') {
    loginTab.className = activeClass;
    registerTab.className = inactiveClass;
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.className = activeClass;
    loginTab.className = inactiveClass;
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

function openDemoModal() {
  const modal = document.getElementById('demo-modal');
  modal.classList.remove('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-95');
  modal.querySelector('.transform').classList.add('scale-100');
}

// Đóng Popup đăng ký Demo
function closeDemoModal() {
  const modal = document.getElementById('demo-modal');
  modal.classList.add('opacity-0', 'pointer-events-none');
  modal.querySelector('.transform').classList.remove('scale-100');
  modal.querySelector('.transform').classList.add('scale-95');
  const form = document.getElementById('demo-form');
  if (form) {
    form.reset();
    form.querySelectorAll('.border-red-400').forEach(el => el.classList.remove('border-red-400'));
    form.querySelectorAll('[id$="-err"]').forEach(el => el.classList.add('hidden'));
  }
}

function handleAuthLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('auth-login-email').value.trim().toLowerCase();

  const userData = mockUsersDatabase[emailInput] || {
    name: "Khách Demo",
    email: emailInput,
    points: 500,
    referralCode: "REF-DEMO",
    reward: "Voucher quà tặng",
    tier: "Hạng Bạc"
  };

  executeCustomerSessionLogin(userData);
  closeAuthModal();
  showToast(t('toast-login-success'));
}

function handleAuthRegister(event) {
  event.preventDefault();
  const email = document.getElementById('auth-reg-email').value.trim().toLowerCase();
  const refCode = document.getElementById('auth-reg-ref').value.trim();
  const name = email.split('@')[0];

  const newUser = {
    name: name,
    email: email,
    points: 100,
    referralCode: "REF-" + name.replace(/\s+/g, '').toUpperCase().slice(0, 5),
    usedReferral: refCode || null,
    reward: "Quà tặng chào mừng",
    tier: "Hạng Bạc"
  };

  mockUsersDatabase[email] = newUser;
  executeCustomerSessionLogin(newUser);
  closeAuthModal();
  showToast(t('toast-register-success'));
}

function handleDemoSubmit(event) {
  event.preventDefault();

  const fields = [
    { id: 'demo-name', errId: 'demo-name-err', isEmail: false },
    { id: 'demo-salon', errId: 'demo-salon-err', isEmail: false },
    { id: 'demo-email', errId: 'demo-email-err', isEmail: true },
    { id: 'demo-city', errId: 'demo-city-err', isEmail: false },
  ];

  let valid = true;
  fields.forEach(({ id, errId, isEmail }) => {
    const input = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = input.value.trim();
    let hasError = false;

    if (!val) {
      hasError = true;
      err.textContent = t('err-required');
    } else if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      hasError = true;
      err.textContent = t('err-email-invalid');
    }

    if (hasError) {
      input.classList.add('border-red-400');
      err.classList.remove('hidden');
      valid = false;
    } else {
      input.classList.remove('border-red-400');
      err.classList.add('hidden');
    }
  });

  if (!valid) return;

  closeDemoModal();
  showToast(t('toast-demo-success'));
}

// Thay đổi hệ số điểm thưởng của chủ tiệm
function changePointsRule(change) {
  appState.pointsMultiplier = Math.max(1, appState.pointsMultiplier + change);
  document.getElementById('points-multiplier-label').textContent = appState.pointsMultiplier + "x";
  document.getElementById('tip-points-multiplier').textContent = appState.pointsMultiplier + "x";
  showToast(t('toast-points-rule').replace('{0}', appState.pointsMultiplier));
}

function toggleStaffStatus(staffName, isOnline) {
  showToast(`${staffName} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
}

function syncOwnerDashboardUI() {
  document.getElementById('dashboard-savings-label').textContent = `$${appState.totalOwnerSavings.toFixed(2)}`;
  document.getElementById('dashboard-tips-total').textContent = `$${appState.totalOwnerTipsRouted.toLocaleString()} routed`;
  document.getElementById('dashboard-partners-count').textContent = t('txt-partners-count').replace('{0}', appState.b2bPartnersCount);
}

function updateSavingsCalc(value) {
  const slider = document.getElementById('tips-volume-slider');
  if (slider) slider.value = value;

  document.getElementById('slider-val-label').textContent = `$${parseInt(value).toLocaleString()}`;

  const lostAnnual = value * 0.03 * 12;
  const savedAnnual = value * 0.03 * 12;

  document.getElementById('lost-annual-label').textContent = `$${lostAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  document.getElementById('saved-annual-label').textContent = `$${savedAnnual.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const RECEIPT_CATEGORIES = [
  { id: 'chk-deduct-mileage',  label: '🚗 Mileage',           keywords: ['mileage','gas','fuel','parking','uber','lyft','auto','gasoline'] },
  { id: 'chk-deduct-supplies', label: '💅 Nail Supplies',      keywords: ['polish','gel','uv','lamp','brush','nail','supply','supplies','acrylic','cuticle','salon','beauty','kit','glitter','powder'] },
  { id: 'chk-deduct-rent',     label: '🏢 Booth Rent',         keywords: ['rent','booth','lease','studio','space'] },
  { id: 'chk-deduct-phone',    label: '📱 Phone & Internet',   keywords: ['phone','mobile','wireless','internet','data','cell','at&t','verizon','t-mobile','sprint','boost','monthly plan'] },
  { id: 'chk-deduct-license',  label: '🎓 License & Cert',     keywords: ['license','permit','certification','board','cosmetology','renewal','fee'] }
];
let _scanDetected = [];

function openReceiptScanModal() {
  document.getElementById('receipt-scan-modal').classList.add('open');
  _scanShowState('upload');
  // reset file input
  const fi = document.getElementById('receipt-file-input');
  if (fi) fi.value = '';
}

function closeReceiptScanModal() {
  document.getElementById('receipt-scan-modal').classList.remove('open');
}

function _scanShowState(state) {
  ['upload','processing','results'].forEach(s => {
    document.getElementById('scan-state-' + s).style.display = s === state ? '' : 'none';
  });
}

function triggerReceiptCapture() {
  const fi = document.getElementById('receipt-file-input');
  fi.setAttribute('capture', 'environment');
  fi.click();
}

function triggerReceiptUpload() {
  const fi = document.getElementById('receipt-file-input');
  fi.removeAttribute('capture');
  fi.click();
}

async function handleReceiptFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    document.getElementById('scan-preview-img').src = e.target.result;
    _scanShowState('processing');
    document.getElementById('scan-ocr-status').textContent = 'Loading OCR engine…';
    document.getElementById('scan-ocr-bar').style.width = '5%';
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          const statusEl = document.getElementById('scan-ocr-status');
          const barEl = document.getElementById('scan-ocr-bar');
          if (m.status === 'loading tesseract core') {
            statusEl.textContent = 'Loading OCR engine…';
            barEl.style.width = '15%';
          } else if (m.status === 'initializing api') {
            statusEl.textContent = 'Initializing…';
            barEl.style.width = '30%';
          } else if (m.status === 'recognizing text') {
            const pct = Math.round(10 + m.progress * 85);
            barEl.style.width = pct + '%';
            statusEl.textContent = `Reading text… ${Math.round(m.progress * 100)}%`;
          }
        }
      });
      document.getElementById('scan-ocr-bar').style.width = '100%';
      _scanShowResults(result.data.text);
    } catch (err) {
      document.getElementById('scan-ocr-status').textContent = '⚠ OCR error: ' + err.message;
    }
  };
  reader.readAsDataURL(file);
}

function _parseReceipt(text) {
  const lower = text.toLowerCase();
  const detected = RECEIPT_CATEGORIES.filter(c => c.keywords.some(kw => lower.includes(kw)));
  const amounts = [];
  const rx = /\$?\s*(\d{1,4}(?:,\d{3})*\.\d{2})/g;
  let m;
  while ((m = rx.exec(text)) !== null) {
    const v = parseFloat(m[1].replace(/,/g, ''));
    if (v > 0) amounts.push(v);
  }
  const total = amounts.reduce((s, v) => s + v, 0);
  return { detected, total };
}

function _scanShowResults(rawText) {
  const parsed = _parseReceipt(rawText);
  _scanDetected = parsed.detected;
  const list = document.getElementById('scan-results-list');
  list.innerHTML = parsed.detected.length === 0
    ? '<p style="font-size:9px;color:#94a3b8;text-align:center;padding:12px 0">No deductible categories detected.<br>Try a clearer photo.</p>'
    : parsed.detected.map(c => `<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(0,167,111,0.08);border:1px solid rgba(0,167,111,0.25);border-radius:8px;margin-bottom:4px"><span style="color:#00a76f;font-size:11px;line-height:1">✓</span><span style="font-size:9px;color:#e2e8f0;font-weight:700">${c.label}</span></div>`).join('');
  const tot = document.getElementById('scan-results-total');
  tot.textContent = parsed.total > 0 ? `$${parsed.total.toLocaleString('en-US',{maximumFractionDigits:2})} detected` : 'Amounts not detected';
  document.getElementById('scan-raw-text').textContent = rawText.trim().substring(0, 300) + (rawText.length > 300 ? '…' : '');
  _scanShowState('results');
}

function applyScannedDeductions() {
  _scanDetected.forEach(c => {
    // check the checkbox
    const el = document.getElementById(c.id);
    if (el) el.checked = true;
    // update expenseState + badge (strip 'chk-deduct-' prefix to get key)
    const key = c.id.replace('chk-deduct-', '');
    if (expenseState[key]) {
      expenseState[key].status = 'ready';
      updateExpenseBadge(key);
    }
  });
  calculateNailTax();
  updateMissingSummary();
  closeReceiptScanModal();
  const n = _scanDetected.length;
  showToast(n > 0 ? `✅ ${n} deduction${n>1?'s':''} detected & applied from receipt` : 'No deductions detected — try a clearer image');
}

const __homepageHandlers = {
  toggleLanguageDropdown,
  t,
  selectLanguage,
  toggleMobileMenu,
  changeLanguage,
  showToast,
  activateB2BTargetedCampaign,
  redeemPartnerGift,
  approveB2BPartner,
  changeBranch,
  switchSimulatorMode,
  selectStaff,
  setTipAmount,
  setCustomTip,
  highlightActiveTipButton,
  confirmTip,
  handleRating,
  submitPrivateFeedback,
  registerSimulatorUser,
  executeCustomerSessionLogin,
  updateCustomerDashboardUI,
  copyReferralCode,
  handleLogout,
  submitReferral,
  sendInteractionMessage,
  maskUSPhone,
  lookupExternalLoyalty,
  syncStaffPortalUI,
  optimizeStaffDeductions,
  filterTaxWriteoffs,
  calculateNailTax,
  selectTaxRole,
  simulateReceiptUpload,
  updateExpenseBadge,
  updateMissingSummary,
  toggleTaxSummary,
  reviewWithTaxIQ,
  optimizeStaffDeductionsAI,
  downloadTaxReport,
  playIntroVideo,
  openAuthModal,
  closeAuthModal,
  switchAuthTab,
  openDemoModal,
  closeDemoModal,
  handleAuthLogin,
  handleAuthRegister,
  handleDemoSubmit,
  changePointsRule,
  toggleStaffStatus,
  syncOwnerDashboardUI,
  updateSavingsCalc,
  openReceiptScanModal,
  closeReceiptScanModal,
  _scanShowState,
  triggerReceiptCapture,
  triggerReceiptUpload,
  _parseReceipt,
  _scanShowResults,
  applyScannedDeductions,
  handleReceiptFile,
}

export function getHomePageHandlers() {
  return __homepageHandlers
}

export function bootHomePage() {
  bootHomePageContent()
}

export {
  __homepageHandlers as homePageHandlers,
}

export function initHomePage(navigate) {
  if (typeof window === 'undefined') return () => {}

  window.navigateToApp = (path) => navigate(path)
  if (__homepageHandlers) {
    Object.assign(window, __homepageHandlers)
  }

  bootHomePageContent()

  return teardownHomePage
}

export function teardownHomePage() {
  delete window.navigateToApp
  if (__homepageHandlers) {
    for (const name of Object.keys(__homepageHandlers)) {
      delete window[name]
    }
  }
  if (__homepageClickOutside) {
    document.removeEventListener('click', __homepageClickOutside)
    __homepageClickOutside = null
  }
}
