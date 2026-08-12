import {
  buildDashboardSettingsPath,
  DASHBOARD_MENU_ID,
  DASHBOARD_SETTINGS_TAB,
  DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS,
  DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID,
  MERCHANT_SIDEBAR_MENU_ITEMS,
  normalizeDashboardSettingsTab,
} from './constants'

describe('desktop Staff Settings navigation', () => {
  it('builds and normalizes the Staff Settings route', () => {
    expect(buildDashboardSettingsPath(DASHBOARD_SETTINGS_TAB.staff)).toBe(
      '/dashboard/settings/staff',
    )
    expect(normalizeDashboardSettingsTab('staff')).toBe('staff')
  })

  it('hides Staff only from the desktop sidebar collection', () => {
    expect(DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).not.toContain(
      DASHBOARD_MENU_ID.staff,
    )
    expect(MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).toContain(
      DASHBOARD_MENU_ID.staff,
    )
  })

  it('anchors desktop Payments & Payouts after Dashboard instead of removed Staff', () => {
    expect(DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID).toBe(DASHBOARD_MENU_ID.overview)
    expect(DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).toContain(
      DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID,
    )
  })
})
