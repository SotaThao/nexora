/** Owner settings tab keys (desktop SettingsView). */
export const SettingsDesktopTab = {
  Account: 'account',
  Staff: 'staff',
  Kyb: 'kyb',
  Affiliate: 'affiliate',
  Notification: 'notification',
  Privacy: 'privacy',
} as const

/** Mobile profile drill-down section for notification preferences. */
export const SettingsMobileProfileSection = {
  Notifications: 'notifications',
} as const

/**
 * Desktop (website) Settings: notification preferences tab — hidden until re-enabled.
 * Mobile Settings keeps the notification entry visible.
 */
export const SETTINGS_SHOW_NOTIFICATION_TAB = false
