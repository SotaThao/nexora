import type { StaffScreenId } from './hooks/useStaffActiveScreen'

/**
 * Per-tab API ownership. Each route view mounts its own hooks — APIs run only
 * when the user navigates to that screen (React Router <Outlet>).
 */
export const STAFF_SCREEN_API: Record<StaffScreenId, readonly string[]> = {
  home: [
    'GET /api/v1/staff/dashboard/summary',
    'GET /api/v1/staff/tips?Status=Initiated',
    'POST /api/v1/staff/tips/confirm-receipt',
    'GET /api/v1/staff/businesses',
  ],
  qr: [
    'GET /api/v1/staff/businesses',
    'GET /api/v1/userprofile/me → join-public-invite payload',
    'POST /api/v1/staff/join-public-invite',
  ],
  tips: ['GET /api/v1/staff/tips?PageNumber&PageSize&Status&DateFrom&DateTo'],
  reviews: ['GET /api/v1/staff/reviews?PageNumber&PageSize'],
  pay: ['GET /api/v1/staff/payment-methods (Zelle, PayPal, Venmo, CashApp, AppleCash, …)'],
  profile: ['GET /api/v1/staff/businesses'],
  notifications: [
    'GET /api/v1/Notifications?PageNumber&PageSize',
    'GET /api/v1/Notifications/unread-count',
    'PUT /api/v1/Notifications/{id}/read',
    'PUT /api/v1/Notifications/read-all',
  ],
}
