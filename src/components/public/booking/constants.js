/** Public customer booking page — copy, lang, and UI keys. */
import { VoiceLeadSource } from '../../../data/publicVoiceBooking/domain'

export const PUBLIC_BOOKING_ROUTE = {
  path: '/b/:businessKey',
  param: 'businessKey',
  langQuery: 'lang',
  sourceQuery: 'src',
  /** Prefill customer phone from SMS / deep links. */
  phoneQuery: 'phone',
  /** Prefill customer name from SMS / deep links. */
  nameQuery: 'name',
  /** Merchant profile phone on SMS campaign booking links (`?p=`). */
  profilePhoneQuery: 'p',
}

export const PUBLIC_BOOKING_LANG = {
  en: 'en',
  vi: 'vi',
}

export const PUBLIC_BOOKING_DEFAULT_LANG = PUBLIC_BOOKING_LANG.en

export const PUBLIC_BOOKING_DEFAULT_SOURCE = VoiceLeadSource.Web

export const PUBLIC_BOOKING_EM_DASH = '—'

export const PUBLIC_BOOKING_BODY_CLASS = 'public-booking-active'

export const PUBLIC_BOOKING_THEME_COLOR = '#f5efff'

/** Synthetic staff id — omit `staffId` on create when selected (HTML `any`). */
export const PUBLIC_BOOKING_ANY_STAFF_ID = 'any'

/** DOM ids used for scroll-to-error and aria wiring. */
export const PUBLIC_BOOKING_FIELD_ID = {
  phone: 'booking-phone',
  name: 'booking-name',
  services: 'service-options',
  staff: 'staff-options',
  date: 'date-options',
  time: 'time-options',
}

const LANG_ALIAS_TO_CODE = {
  vi: PUBLIC_BOOKING_LANG.vi,
  vn: PUBLIC_BOOKING_LANG.vi,
  vie: PUBLIC_BOOKING_LANG.vi,
  vietnamese: PUBLIC_BOOKING_LANG.vi,
  en: PUBLIC_BOOKING_LANG.en,
  eng: PUBLIC_BOOKING_LANG.en,
  english: PUBLIC_BOOKING_LANG.en,
}

/** Accepts en / vi (and common aliases). Missing/unknown → English. */
export function parsePublicBookingLang(raw) {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase()
  return LANG_ALIAS_TO_CODE[value] || PUBLIC_BOOKING_DEFAULT_LANG
}

/** `?src=` → API `source` query; empty/missing → Web. */
export function parsePublicBookingSource(raw, fallback = PUBLIC_BOOKING_DEFAULT_SOURCE) {
  const value = String(raw ?? '').trim()
  return value || fallback
}

const COPY_BY_LANG = {
  [PUBLIC_BOOKING_LANG.en]: {
    documentTitleSuffix: 'Book',
    brandKicker: 'Book online',
    promotionsHeading: 'Current offers',
    promotionSlideAria: (index, total) => `Offer ${index} of ${total}`,
    promotionRateOff: (rate) => `${rate} off`,
    promotionAllWeek: 'Every day',
    dayShort: {
      Sunday: 'Sun',
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
    },
    brandIcon: '💅',
    customerStepHeading: 'Please enter your phone number',
    step1ServiceHeading: 'Which services would you like?',
    serviceSearchPlaceholder: 'Search services',
    serviceSearchAria: 'Search services',
    serviceSearchClearAria: 'Clear search',
    serviceSearchEmpty: 'No services match your search.',
    serviceViewDetails: 'View details',
    serviceDescriptionEyebrow: 'Service details',
    serviceDescriptionPriceLabel: 'Price',
    serviceDescriptionDurationLabel: 'Duration',
    serviceDescriptionClose: 'Close',
    serviceDescriptionCloseAria: 'Close service details',
    phoneLabel: 'Phone number',
    phonePlaceholder: '(832) 555-0198',
    nameLabel: 'Full name',
    namePlaceholder: 'e.g. Mary Smith',
    noServiceSelectedAlt: 'No service selected yet',
    selectedServicesLabel: 'Selected services',
    removeServiceAria: (label) => `Remove ${label}`,
    serviceCount: (count, minutes) =>
      `${count} service${count === 1 ? '' : 's'} · ${minutes} min`,
    durationMinutes: (minutes) => `${minutes} min`,
    categoryServiceCount: (count) =>
      `${count} service${count === 1 ? '' : 's'}`,
    contactPrice: 'Contact',
    otherCategoryName: 'Other services',
    staffSectionTitle: 'Technician',
    anyStaffName: 'Any technician',
    anyStaffStatus: 'Earliest available',
    dateLabel: 'Date',
    timeLabel: 'Time',
    datePlaceholder: 'Select date',
    timePlaceholder: 'Select time',
    continue: 'Continue',
    continueArrow: '→',
    step2Heading: 'Confirm your booking',
    step2Copy:
      'Please review your details before submitting. The salon will respond and confirm your appointment as soon as possible.',
    reviewName: 'Customer name',
    reviewPhone: 'Phone number',
    reviewServices: 'Services',
    reviewStaff: 'Technician',
    reviewSlot: 'Date & time',
    reviewTotal: 'Estimated total',
    noteLabel: 'Notes to help us serve you better',
    notePlaceholder: 'e.g. Preferred polish color or special requests…',
    backEdit: '← Edit',
    submit: '✓ Submit booking request',
    submitting: 'Submitting…',
    successIcon: '✓',
    successHeading: 'Booking request sent',
    successCopy: (businessName) =>
      `${businessName || 'The salon'} will confirm by text or contact you as soon as possible.`,
    newBooking: '＋ New booking',
    staffAvailable: 'Available',
    returningCustomer: (name) =>
      `Welcome back, ${name}. We already have your details on file.`,
    catalogLoading: 'Loading service catalog…',
    phoneError: 'Enter a valid phone number.',
    nameError: 'Please enter your full name.',
    serviceError: 'Please select at least one service.',
    staffError: 'Please choose a technician.',
    dateError: 'Please select a date.',
    timeError: 'Please select a time.',
    slotUnavailable:
      'That time is outside salon hours or unavailable. Please choose another.',
    closedDayError: 'The salon is closed on this day. Please choose another date.',
    closedDayReasonError: 'The salon is closed on this day ({{reason}}). Please choose another date.',
    adjustedHoursError: 'The salon has adjusted hours on this day ({{reason}}): {{open}} - {{close}}. Please choose a time within this range.',
    reviewError: 'Please fix the missing details before submitting your booking.',
    statusSent: (id) => `Booking request ${id} has been sent.`,
    emDash: PUBLIC_BOOKING_EM_DASH,
    loadingTitle: 'Loading booking page…',
    loadingCopy: 'Please wait a moment.',
    loadErrorTitle: 'Booking page unavailable',
    loadErrorRetry: 'Try again',
    missingBusinessKey: 'This booking link is missing a business key.',
    businessNotFound: 'We could not find an active booking page for this business.',
    serviceNotFound: 'That service is no longer available. Please choose another.',
    staffNotFound: 'That technician is no longer available. Please choose another.',
    tooManyRequests: 'Too many requests. Please wait a moment and try again.',
    validationError: 'Some booking details are invalid. Please check and try again.',
    unexpectedError: 'Something went wrong. Please try again.',
    emptyServices: 'No services are available for booking right now.',
    emptyStaff: 'No technicians are available right now.',
  },
  [PUBLIC_BOOKING_LANG.vi]: {
    documentTitleSuffix: 'Đặt lịch',
    brandKicker: 'Đặt lịch trực tuyến',
    promotionsHeading: 'Ưu đãi đang áp dụng',
    promotionSlideAria: (index, total) => `Ưu đãi ${index} trên ${total}`,
    promotionRateOff: (rate) => `Giảm ${rate}`,
    promotionAllWeek: 'Mỗi ngày',
    dayShort: {
      Sunday: 'CN',
      Monday: 'T2',
      Tuesday: 'T3',
      Wednesday: 'T4',
      Thursday: 'T5',
      Friday: 'T6',
      Saturday: 'T7',
    },
    brandIcon: '💅',
    customerStepHeading: 'Vui lòng nhập số điện thoại',
    step1ServiceHeading: 'Quý khách muốn sử dụng dịch vụ nào?',
    serviceSearchPlaceholder: 'Tìm dịch vụ',
    serviceSearchAria: 'Tìm kiếm dịch vụ',
    serviceSearchClearAria: 'Xóa tìm kiếm',
    serviceSearchEmpty: 'Không có dịch vụ khớp với tìm kiếm.',
    serviceViewDetails: 'Xem chi tiết',
    serviceDescriptionEyebrow: 'Mô tả dịch vụ',
    serviceDescriptionPriceLabel: 'Giá',
    serviceDescriptionDurationLabel: 'Thời gian',
    serviceDescriptionClose: 'Đóng',
    serviceDescriptionCloseAria: 'Đóng mô tả dịch vụ',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '(832) 555-0198',
    nameLabel: 'Họ và tên',
    namePlaceholder: 'Ví dụ: Mary Smith',
    noServiceSelectedAlt: 'Chưa chọn dịch vụ',
    selectedServicesLabel: 'Dịch vụ đã chọn',
    removeServiceAria: (label) => `Bỏ chọn ${label}`,
    serviceCount: (count, minutes) => `${count} dịch vụ · ${minutes} phút`,
    durationMinutes: (minutes) => `${minutes} phút`,
    categoryServiceCount: (count) => `${count} dịch vụ`,
    contactPrice: 'Liên hệ',
    otherCategoryName: 'Dịch vụ khác',
    staffSectionTitle: 'Chuyên viên thực hiện',
    anyStaffName: 'Bất kỳ chuyên viên nào',
    anyStaffStatus: 'Sắp xếp sớm nhất',
    dateLabel: 'Ngày hẹn',
    timeLabel: 'Giờ hẹn',
    datePlaceholder: 'Chọn ngày',
    timePlaceholder: 'Chọn giờ',
    continue: 'Tiếp tục',
    continueArrow: '→',
    step2Heading: 'Xác nhận thông tin đặt lịch',
    step2Copy:
      'Vui lòng kiểm tra lại thông tin trước khi gửi yêu cầu. Tiệm sẽ phản hồi và xác nhận lịch hẹn trong thời gian sớm nhất.',
    reviewName: 'Tên khách hàng',
    reviewPhone: 'Số điện thoại',
    reviewServices: 'Dịch vụ',
    reviewStaff: 'Chuyên viên',
    reviewSlot: 'Ngày & giờ',
    reviewTotal: 'Tổng dự kiến',
    noteLabel: 'Ghi chú để tiệm phục vụ tốt hơn',
    notePlaceholder: 'Ví dụ: Quý khách có mong muốn đặc biệt về màu sơn…',
    backEdit: '← Chỉnh sửa',
    submit: '✓ Gửi yêu cầu đặt lịch',
    submitting: 'Đang gửi…',
    successIcon: '✓',
    successHeading: 'Yêu cầu đặt lịch đã được gửi',
    successCopy: (businessName) =>
      `${businessName || 'Tiệm'} sẽ gửi xác nhận qua tin nhắn hoặc liên hệ với quý khách trong thời gian sớm nhất.`,
    newBooking: '＋ Đặt lịch mới',
    staffAvailable: 'Còn lịch trống',
    returningCustomer: (name) =>
      `Chào mừng quý khách trở lại, ${name}. Hệ thống đã nhận diện thông tin của quý khách.`,
    catalogLoading: 'Đang tải danh mục dịch vụ…',
    phoneError: 'Nhập số điện thoại hợp lệ.',
    nameError: 'Vui lòng nhập họ và tên.',
    serviceError: 'Vui lòng lựa chọn ít nhất một dịch vụ.',
    staffError: 'Vui lòng lựa chọn một chuyên viên.',
    dateError: 'Vui lòng lựa chọn ngày hẹn.',
    timeError: 'Vui lòng lựa chọn khung giờ.',
    slotUnavailable:
      'Khung giờ này ngoài giờ mở cửa hoặc không khả dụng. Vui lòng lựa chọn lại.',
    closedDayError: 'Tiệm đóng cửa vào ngày này. Vui lòng chọn ngày khác.',
    closedDayReasonError: 'Tiệm đóng cửa vào ngày này ({{reason}}). Vui lòng chọn ngày khác.',
    adjustedHoursError: 'Tiệm làm việc giờ điều chỉnh vào ngày này ({{reason}}): {{open}} - {{close}}. Vui lòng chọn giờ trong khung này.',
    reviewError:
      'Vui lòng kiểm tra lại các thông tin còn thiếu trước khi gửi yêu cầu đặt lịch.',
    statusSent: (id) => `Yêu cầu đặt lịch ${id} đã được gửi.`,
    emDash: PUBLIC_BOOKING_EM_DASH,
    loadingTitle: 'Đang tải trang đặt lịch…',
    loadingCopy: 'Vui lòng chờ trong giây lát.',
    loadErrorTitle: 'Không mở được trang đặt lịch',
    loadErrorRetry: 'Thử lại',
    missingBusinessKey: 'Liên kết đặt lịch thiếu mã doanh nghiệp.',
    businessNotFound: 'Không tìm thấy trang đặt lịch đang hoạt động cho doanh nghiệp này.',
    serviceNotFound: 'Dịch vụ này không còn khả dụng. Vui lòng chọn dịch vụ khác.',
    staffNotFound: 'Chuyên viên này không còn khả dụng. Vui lòng chọn lại.',
    tooManyRequests: 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.',
    validationError: 'Thông tin đặt lịch chưa hợp lệ. Vui lòng kiểm tra lại.',
    unexpectedError: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    emptyServices: 'Hiện chưa có dịch vụ nào để đặt lịch.',
    emptyStaff: 'Hiện chưa có chuyên viên nào để chọn.',
  },
}

export function getPublicBookingCopy(lang) {
  return (
    COPY_BY_LANG[parsePublicBookingLang(lang)] ||
    COPY_BY_LANG[PUBLIC_BOOKING_DEFAULT_LANG]
  )
}

export const PUBLIC_BOOKING_VALIDATION_ERROR = {
  phone: 'phone',
  name: 'name',
  services: 'services',
  staff: 'staff',
  slot: 'slot',
  closedDay: 'closedDay',
}

/** Errors owned by the customer step (2); every other key gates step 1. */
export const PUBLIC_BOOKING_CUSTOMER_ERRORS = [
  PUBLIC_BOOKING_VALIDATION_ERROR.phone,
  PUBLIC_BOOKING_VALIDATION_ERROR.name,
]

export const PUBLIC_BOOKING_STEP = {
  form: 1,
  review: 2,
  success: 3,
}

export const PUBLIC_BOOKING_SUBMIT_ERROR_COPY = {
  VOICE_TENANT_NOT_FOUND: 'businessNotFound',
  VOICE_TENANT_SERVICE_NOT_FOUND: 'serviceNotFound',
  VOICE_TENANT_STAFF_NOT_FOUND: 'staffNotFound',
  COMMON_VALIDATION_ERROR: 'validationError',
  COMMON_BAD_REQUEST: 'validationError',
  COMMON_RATE_LIMIT_EXCEEDED: 'tooManyRequests',
}
