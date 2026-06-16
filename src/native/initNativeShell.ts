import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'

export async function initNativeShell() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  document.documentElement.classList.add('capacitor-native')
  document.documentElement.dataset.capacitorPlatform = Capacitor.getPlatform()

  try {
    await CapacitorUpdater.notifyAppReady()
  } catch {
    // Updater may be unavailable during early boot on some builds.
  }

  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark })
    await SystemBars.show()
  } catch {
    // SystemBars is unavailable on some webview builds during early boot.
  }
}
