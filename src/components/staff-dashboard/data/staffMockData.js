// Staff-owned data for the staff personal dashboard.
// Only fields the staff owns live here; tips/KPIs/identity are derived from
// merchant data (nexora_transactions + nexora_merchant_setup) — see StaffAccountContext.

// The staff signed in for the demo. Matches an entry in the merchant staffList.
export const DEMO_STAFF_ID = 'NEX-STAFF-MIA0123'

// Payout methods a staff can manage themselves (owner cannot edit these).
export const PAYOUT_METHODS = [
  { key: 'cashapp', label: 'Cash App' },
  { key: 'venmo', label: 'Venmo' },
  { key: 'zelle', label: 'Zelle' },
  { key: 'vlinkpay', label: 'VLINKPAY Wallet' },
  { key: 'crypto', label: 'Crypto Wallet' }
]

export const DEFAULT_PUSH_PREFERENCES = {
  tipConfirmations: true,
  reviews: true,
  businessInvites: true
}

// Build the default staff-owned blob from a merchant staffList entry.
// Pre-fills payout values from the staff's merchant payment accounts.
export function makeDefaultStaffAccount(staffMember = {}) {
  const pa = staffMember.paymentAccounts || {}
  return {
    staffId: staffMember.id || DEMO_STAFF_ID,
    bio: '',
    fullName: staffMember.fullName || '',
    phone: staffMember.phone || '',
    kycStatus: staffMember.kycStatus || 'basic',
    defaultDisplayName: staffMember.nickname || staffMember.fullName || '',
    avatar: staffMember.avatar || '',
    payoutMethods: {
      cashapp: { enabled: !!pa.cashapp, value: pa.cashapp || '' },
      venmo: { enabled: !!pa.venmo, value: pa.venmo || '' },
      zelle: { enabled: !!pa.zelle, value: pa.zelle || '' },
      vlinkpay: { enabled: !!pa.vlinkpay, value: pa.vlinkpay || '' },
      crypto: { enabled: false, value: '' }
    },
    // Per-business display name (nickname), keyed by businessStaffLinkId.
    displayNamesByBusiness: {},
    pushPreferences: { ...DEFAULT_PUSH_PREFERENCES },
    // Tip transaction ids the staff has confirmed as received.
    confirmedTipIds: [],
    // Notification ids the staff has read.
    notificationsRead: []
  }
}

// Seed values for the demo staff's owned fields (used by scripts/seed-staff-demo.js
// and as a local fallback). Bio + a couple of confirmed tips for a realistic view.
export function makeDemoStaffAccount(staffMember = {}) {
  return {
    ...makeDefaultStaffAccount(staffMember),
    bio: 'Hi, I’m Mia. Thank you for supporting my work!',
    confirmedTipIds: []
  }
}
