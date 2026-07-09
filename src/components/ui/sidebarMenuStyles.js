// Shared dark-sidebar shell + menu item styles (merchant + staff).

export const SIDEBAR_SHELL_CLASS =
  'fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex'

export const SIDEBAR_MOBILE_DRAWER_CLASS =
  'mobile-drawer-safe relative flex h-full w-[min(84vw,320px)] flex-col bg-nexoraSidebar px-5 text-white shadow-2xl animate-scaleIn'

export const SIDEBAR_NAV_CLASS = 'mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1'

export const SIDEBAR_PROFILE_CARD_CLASS = 'rounded-xl border border-white/15 bg-white/5 p-4 shrink-0'

export const SIDEBAR_AVATAR_IMAGE_CLASS = 'h-11 w-11 rounded-full border border-white/15 object-cover'

export const SIDEBAR_AVATAR_FALLBACK_CLASS =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-base font-extrabold'

export const SIDEBAR_MENU_ITEM_ROW_CLASS =
  'flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold transition'

export const SIDEBAR_MENU_ITEM_ACTIVE_CLASS =
  'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20'

export const SIDEBAR_MENU_ITEM_INACTIVE_CLASS = 'text-white/85 hover:bg-white/5 hover:text-white'

export function sidebarMenuItemClass(isActive) {
  return `${SIDEBAR_MENU_ITEM_ROW_CLASS} ${
    isActive ? SIDEBAR_MENU_ITEM_ACTIVE_CLASS : SIDEBAR_MENU_ITEM_INACTIVE_CLASS
  }`
}

export const SIDEBAR_MENU_ITEM_ROW_BETWEEN_CLASS =
  'flex h-12 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition'

export function sidebarMenuItemBetweenClass(isActive) {
  return `${SIDEBAR_MENU_ITEM_ROW_BETWEEN_CLASS} ${
    isActive ? SIDEBAR_MENU_ITEM_ACTIVE_CLASS : SIDEBAR_MENU_ITEM_INACTIVE_CLASS
  }`
}

export const SIDEBAR_SUBMENU_WRAP_CLASS = 'ml-9 mt-1 space-y-1 border-l border-white/15 pl-3 animate-fadeIn'

export const SIDEBAR_SUBMENU_ITEM_ACTIVE_CLASS = 'text-brandCyan font-extrabold'

export const SIDEBAR_SUBMENU_ITEM_INACTIVE_CLASS = 'text-white/75 hover:bg-white/5 hover:text-white'

export const SIDEBAR_SUBMENU_ITEM_BASE_CLASS =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition'

export function sidebarSubmenuItemClass(isActive) {
  return `${SIDEBAR_SUBMENU_ITEM_BASE_CLASS} ${
    isActive ? SIDEBAR_SUBMENU_ITEM_ACTIVE_CLASS : SIDEBAR_SUBMENU_ITEM_INACTIVE_CLASS
  }`
}

export const SIDEBAR_SIGN_OUT_WRAP_CLASS = 'mt-auto border-t border-white/15 pt-4 shrink-0'
