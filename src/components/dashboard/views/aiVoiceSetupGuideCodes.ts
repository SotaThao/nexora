export type GuideCarrier =
  | 'verizon'
  | 'att'
  | 'tmobile'
  | 'cricket'
  | 'metro'
  | 'visible'
  | 'landline'
  | 'voip'

export type GuideMode = 'ring' | 'now'
export type GuideNetwork = 'verizon' | 'att' | 'tmobile' | 'landline' | 'voip'
export type GuideLang = 'vi' | 'en'

export type GuideModeCodes = {
  on: string
  off: string
  vi: string
  en: string
}

export const GUIDE_PANIC_CODES: Record<GuideCarrier, string> = {
  verizon: '*73',
  att: '##002#',
  tmobile: '##002#',
  cricket: '##002#',
  metro: '##002#',
  visible: '*73',
  landline: '*73',
  voip: '—',
}

export const GUIDE_NETWORK_ALIASES: Partial<Record<GuideCarrier, GuideNetwork>> = {
  cricket: 'att',
  metro: 'tmobile',
  visible: 'verizon',
}

export const GUIDE_MVNO: Partial<Record<GuideCarrier, true>> = {
  cricket: true,
  metro: true,
  visible: true,
}

export const GUIDE_CODES: Record<GuideNetwork, Record<GuideMode, GuideModeCodes>> = {
  verizon: {
    ring: {
      on: '*71 → {AI}',
      off: '*73',
      vi: 'Nhấc máy, bấm *71, rồi bấm số AI. Verizon <strong>không cho chỉnh số giây</strong> — mạng tự đặt, thường khoảng 4–5 hồi chuông.',
      en: 'Dial *71 then the AI number. Verizon <strong>does not let you set the delay</strong> — the network picks it, usually 4–5 rings.',
    },
    now: {
      on: '*72 → {AI}',
      off: '*73',
      vi: 'Nhấc máy, bấm *72, rồi bấm số AI. Nghe hai tiếng bíp là xong.',
      en: 'Dial *72 then the AI number. Two beeps means it worked.',
    },
  },
  att: {
    ring: {
      on: '**61*1{AI}*11*20#',
      off: '##61#',
      vi: 'Bấm nguyên chuỗi, có dấu <strong>#</strong> ở cuối. Số <strong>20</strong> gần cuối là số giây chờ — đổi thành 15 nếu voicemail hay bắt trước.',
      en: 'Dial the whole string including the final <strong>#</strong>. The <strong>20</strong> near the end is the delay in seconds — use 15 if voicemail keeps winning.',
    },
    now: {
      on: '**21*1{AI}#',
      off: '##21#',
      vi: 'Bấm nguyên chuỗi, có dấu <strong>#</strong> ở cuối.',
      en: 'Dial the whole string including the final <strong>#</strong>.',
    },
  },
  tmobile: {
    ring: {
      on: '**61*1{AI}**20#',
      off: '##61#',
      vi: 'Bấm nguyên chuỗi, có dấu <strong>#</strong> ở cuối. Số <strong>20</strong> là số giây chờ — chỉ nhận 5, 10, 15, 20, 25, 30.',
      en: 'Dial the whole string including the final <strong>#</strong>. The <strong>20</strong> is the delay in seconds — only 5, 10, 15, 20, 25, 30 are accepted.',
    },
    now: {
      on: '**21*1{AI}#',
      off: '##21#',
      vi: 'Bấm nguyên chuỗi, có dấu <strong>#</strong> ở cuối.',
      en: 'Dial the whole string including the final <strong>#</strong>.',
    },
  },
  landline: {
    ring: {
      on: '*92 → {AI} → #',
      off: '*93',
      vi: 'Nhấc máy, bấm *92, chờ tiếng bíp, bấm số AI rồi dấu #. Mã này <strong>không tự đặt số giây</strong> — nhà cung cấp quyết, muốn đổi phải gọi họ.',
      en: 'Lift the handset, dial *92, wait for the tone, enter the AI number then #. This code <strong>does not set the delay</strong> — the provider does; call them to change it.',
    },
    now: {
      on: '*72 → {AI} → #',
      off: '*73',
      vi: 'Nhấc máy, bấm *72, chờ tiếng bíp, bấm số AI rồi dấu #.',
      en: 'Lift the handset, dial *72, wait for the tone, enter the AI number then #.',
    },
  },
  voip: {
    ring: {
      on: '—',
      off: '—',
      vi: 'Không dùng mã bấm. Xem hướng dẫn màu xanh bên dưới.',
      en: 'No star codes. See the note below.',
    },
    now: {
      on: '—',
      off: '—',
      vi: 'Không dùng mã bấm. Xem hướng dẫn màu xanh bên dưới.',
      en: 'No star codes. See the note below.',
    },
  },
}

export type GuideBilingualLabel = Record<GuideLang, string>

export const GUIDE_CARRIER_OPTIONS: ReadonlyArray<{
  value: GuideCarrier
  label: GuideBilingualLabel
}> = [
  { value: 'verizon', label: { vi: 'Verizon', en: 'Verizon' } },
  { value: 'att', label: { vi: 'AT&T', en: 'AT&T' } },
  { value: 'tmobile', label: { vi: 'T-Mobile', en: 'T-Mobile' } },
  {
    value: 'cricket',
    label: { vi: 'Cricket (mạng AT&T)', en: 'Cricket (AT&T network)' },
  },
  {
    value: 'metro',
    label: {
      vi: 'Metro / Mint (mạng T-Mobile)',
      en: 'Metro / Mint (T-Mobile network)',
    },
  },
  {
    value: 'visible',
    label: {
      vi: 'Visible / Total (mạng Verizon)',
      en: 'Visible / Total (Verizon network)',
    },
  },
  {
    value: 'landline',
    label: { vi: 'Điện thoại bàn · Landline', en: 'Landline' },
  },
  {
    value: 'voip',
    label: { vi: 'Internet · VoIP', en: 'Internet · VoIP' },
  },
]

export const GUIDE_MODE_OPTIONS: ReadonlyArray<{
  value: GuideMode
  label: GuideBilingualLabel
}> = [
  {
    value: 'ring',
    label: {
      vi: 'Chuông reo 3 hồi rồi mới qua AI',
      en: 'Ring 3 times, then AI answers',
    },
  },
  {
    value: 'now',
    label: {
      vi: 'AI bắt máy ngay từ đầu',
      en: 'AI answers immediately',
    },
  },
]

export function resolveGuideNetwork(carrier: GuideCarrier): GuideNetwork {
  return GUIDE_NETWORK_ALIASES[carrier] ?? (carrier as GuideNetwork)
}

export function getGuideModeCodes(carrier: GuideCarrier, mode: GuideMode): GuideModeCodes {
  return GUIDE_CODES[resolveGuideNetwork(carrier)][mode]
}
