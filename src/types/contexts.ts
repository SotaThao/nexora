import type { ReactNode } from 'react'

export type AppLanguage = 'en' | 'vi'

export type TranslationVariables = Record<string, string | number>

export type TFunction = (key: string, variables?: TranslationVariables) => string

export interface LanguageContextValue {
  currentLanguage: AppLanguage
  setLanguage: (lang: AppLanguage) => void
  t: TFunction
  renderLabel: (text: ReactNode) => ReactNode
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface NotificationContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showConfirm: (message: string, title?: string) => Promise<boolean>
}

export interface KybGateContextValue {
  requireKyb: () => void
  isOpen: boolean
  dismiss: () => void
}

import type { LooseObject } from './domain'

/** Flexible domain record for API-backed blobs not yet fully modeled. */
export type DomainRecord = LooseObject

export interface StaffAccountContextValue {
  staffId: string | null
  account: DomainRecord
  staffMember: DomainRecord
  businessName: string
  tips?: DomainRecord[]
  pendingTips?: DomainRecord[]
  kpis?: DomainRecord
  linkedBusinesses?: DomainRecord[]
  notifications?: Array<DomainRecord & { read?: boolean }>
  unreadCount?: number
  transactions?: DomainRecord[] | null
  reviews?: DomainRecord[] | null
  merchantSetup?: DomainRecord | null
  userProfile?: DomainRecord | null
  staffProfile?: DomainRecord | null
  staffBusinesses?: DomainRecord[] | null
  confirmTip?: (tipId: string) => void
  confirmAllPending?: (tipIds?: string[]) => void
  setPayoutMethod?: (key: string, patch: LooseObject) => void
  saveProfile?: (patch: DomainRecord) => void
  setBusinessDisplayName?: (linkId: string, name: string) => void
  setPushPreference?: (key: string, value: boolean) => void
  markNotificationRead?: (notiId: string) => void
  [key: string]: unknown
}
