import { PosOrderStatus } from '../../../../../constants/posOrderStatus'

export const CHECKIN_STATUS_TEXT_COLORS: Record<string, string> = {
  [PosOrderStatus.Waiting]: 'text-emerald-800',
  [PosOrderStatus.InService]: 'text-emerald-800',
  [PosOrderStatus.Completed]: 'text-gray-600',
  [PosOrderStatus.Cancelled]: 'text-rose-800',
}

export const CHECKIN_STATUS_BADGE_COLORS: Record<string, string> = {
  [PosOrderStatus.Waiting]: 'bg-emerald-50 text-emerald-800',
  [PosOrderStatus.InService]: 'bg-emerald-50 text-emerald-800',
  [PosOrderStatus.Completed]: 'bg-gray-100 text-gray-600',
  [PosOrderStatus.Cancelled]: 'bg-rose-50 text-rose-800',
}
