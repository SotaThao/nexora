/**
 * Icon tile background/foreground per `moduleKey` — shared so the dashboard
 * ("Edit" module list + "Live preview") and the public `/o/:slug` landing page
 * render the exact same color for a given module. They used to diverge: the
 * public page colored tiles per `moduleKey` while the dashboard used one flat
 * neutral class for every module, so a module like Check-in (teal/mint on the
 * public page) showed grey in the preview — see issue #1809.
 */
import { OneQrModuleKey } from '../../constants/oneQr'

const ICON_COLOR_BY_MODULE_KEY: Partial<Record<OneQrModuleKey, string>> = {
  [OneQrModuleKey.CheckIn]: 'bg-nexoraTeal/10 text-nexoraTealAlt',
  [OneQrModuleKey.Payment]: 'bg-nexoraElectric/10 text-nexoraElectric',
  [OneQrModuleKey.Booking]: 'bg-nexoraViolet/10 text-nexoraViolet',
  [OneQrModuleKey.Rewards]: 'bg-nexoraTeal/10 text-nexoraTealAlt',
}

const DEFAULT_ICON_COLOR = 'bg-nexoraBrandSoft/70 text-nexoraBrand'

export function resolveOneQrModuleIconColor(moduleKey: string): string {
  return ICON_COLOR_BY_MODULE_KEY[moduleKey as OneQrModuleKey] ?? DEFAULT_ICON_COLOR
}
