/** Public customer booking page — copy, lang, and UI keys. */
import { VoiceLeadSource } from '../../../data/publicVoiceBooking/domain'

export const PUBLIC_BOOKING_ROUTE = {
  path: '/b/:businessKey',
  param: 'businessKey',
  langQuery: 'lang',
  sourceQuery: 'src',
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
    brandIcon: '💅',
    step1PhoneHeading: 'Please enter your phone number',
    step1ServiceHeading: 'Which services would you like?',
    phoneLabel: 'Phone number',
    phonePlaceholder: '(832) 555-0198',
    nameLabel: 'Full name',
    namePlaceholder: 'e.g. Mary Smith',
    noServiceSelectedAlt: 'No service selected yet',
    serviceCount: (count, minutes) =>
      `${count} service${count === 1 ? '' : 's'} · ${minutes} min`,
    durationMinutes: (minutes) => `${minutes} min`,
    staffSectionTitle: 'Technician',
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
    phoneError: 'Phone number format is incorrect. Please enter a valid phone number.',
    nameError: 'Please enter your full name.',
    serviceError: 'Please select at least one service.',
    staffError: 'Please choose a technician.',
    dateError: 'Please select a date.',
    timeError: 'Please select a time.',
    slotUnavailable:
      'That time is outside salon hours or unavailable. Please choose another.',
    closedDayError: 'The salon is closed on this day. Please choose another date.',
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
    brandIcon: '💅',
    step1PhoneHeading: 'Vui lòng nhập số điện thoại',
    step1ServiceHeading: 'Quý khách muốn sử dụng những dịch vụ nào?',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '(832) 555-0198',
    nameLabel: 'Họ và tên',
    namePlaceholder: 'Ví dụ: Mary Smith',
    noServiceSelectedAlt: 'Chưa chọn dịch vụ',
    serviceCount: (count, minutes) => `${count} dịch vụ · ${minutes} phút`,
    durationMinutes: (minutes) => `${minutes} phút`,
    staffSectionTitle: 'Chuyên viên thực hiện',
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
    phoneError: 'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại hợp lệ.',
    nameError: 'Vui lòng nhập họ và tên.',
    serviceError: 'Vui lòng lựa chọn ít nhất một dịch vụ.',
    staffError: 'Vui lòng lựa chọn một chuyên viên.',
    dateError: 'Vui lòng lựa chọn ngày hẹn.',
    timeError: 'Vui lòng lựa chọn khung giờ.',
    slotUnavailable:
      'Khung giờ này ngoài giờ mở cửa hoặc không khả dụng. Vui lòng lựa chọn lại.',
    closedDayError: 'Tiệm đóng cửa vào ngày này. Vui lòng chọn ngày khác.',
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
