import type { LooseObject } from './domain'

export interface StaffFormState {
  fullName: string
  nickname: string
  position: string
  avatar: string
  phone: string
  email: string
  venmo: string
  cashapp: string
  zelle: string
  vlinkpay: string
  nexoraStaffId?: string
  showInTipsFlow: boolean
  payoutConfigs: LooseObject
  [key: string]: unknown
}

export const EMPTY_STAFF_FORM: StaffFormState = {
  fullName: '',
  nickname: '',
  position: '',
  avatar: '',
  phone: '',
  email: '',
  venmo: '',
  cashapp: '',
  zelle: '',
  vlinkpay: '',
  nexoraStaffId: '',
  showInTipsFlow: true,
  payoutConfigs: {},
}
