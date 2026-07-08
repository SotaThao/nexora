import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { initOneSignal } from './onesignal'
import { initCapgoUpdateListeners } from './capgoUpdateEvents'

function syncSafeAreaInsets() {
  if (typeof document === 'undefined' || !document.body) return

  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);' +
    'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);'
  document.body.appendChild(probe)

  const computed = getComputedStyle(probe)
  const setInset = (name: string, value: string) => {
    if (value && value !== '0px') {
      document.documentElement.style.setProperty(name, value)
    }
  }

  setInset('--safe-area-inset-top', computed.paddingTop)
  setInset('--safe-area-inset-right', computed.paddingRight)
  setInset('--safe-area-inset-bottom', computed.paddingBottom)
  setInset('--safe-area-inset-left', computed.paddingLeft)

  document.body.removeChild(probe)
}

export async function initNativeShell() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  document.documentElement.classList.add('capacitor-native')
  document.documentElement.dataset.capacitorPlatform = Capacitor.getPlatform()

  syncSafeAreaInsets()
  window.addEventListener('resize', syncSafeAreaInsets)
  window.addEventListener('orientationchange', syncSafeAreaInsets)

  try {
    await initCapgoUpdateListeners()
    await CapacitorUpdater.notifyAppReady()
  } catch {
    // Updater may be unavailable during early boot on some builds.
  }

  await initOneSignal()

  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark })
    await SystemBars.show()
  } catch {
    // SystemBars is unavailable on some webview builds during early boot.
  }

  syncSafeAreaInsets()

  try {
    await SplashScreen.hide()
  } catch {
    // SplashScreen may be unavailable during early boot on some builds.
  }
}
