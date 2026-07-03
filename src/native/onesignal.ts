import { Capacitor } from '@capacitor/core'
import OneSignal, {
  LogLevel,
  type NotificationClickEvent,
  type PushSubscriptionChangedState,
} from '@onesignal/capacitor-plugin'
import { pushDeviceStore, type PushDevicePlatform } from '../auth/pushDeviceStore'
import { tokenStore } from '../auth/tokenStore'
import { pushDevicesRepository } from '../data/repositories/pushDevices'
import { logger } from '../utils/logger'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim() ?? ''

let initialized = false
let subscriptionListenerBound = false
let syncInFlight: Promise<void> | null = null
let navigateHandler: ((path: string) => void) | null = null
let pendingNotificationTarget: string | null = null

export function isOneSignalConfigured(): boolean {
  return Boolean(ONESIGNAL_APP_ID)
}

function getNativePlatform(): PushDevicePlatform | null {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') return platform
  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function readPushSubscriptionIds() {
  const [playerId, pushToken, onesignalUserId] = await Promise.all([
    OneSignal.User.pushSubscription.getIdAsync(),
    OneSignal.User.pushSubscription.getTokenAsync(),
    OneSignal.User.getOnesignalId(),
  ])

  return {
    playerId: playerId?.trim() || null,
    pushToken: pushToken?.trim() || null,
    onesignalUserId: onesignalUserId?.trim() || null,
  }
}

async function waitForPushSubscription(maxAttempts = 12, delayMs = 500): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const playerId = (await OneSignal.User.pushSubscription.getIdAsync())?.trim()
    if (playerId) return playerId
    await sleep(delayMs)
  }
  return null
}

async function persistPushSubscriptionFromSdk(): Promise<string | null> {
  const platform = getNativePlatform()
  if (!platform) return null

  const { playerId, pushToken, onesignalUserId } = await readPushSubscriptionIds()
  if (!playerId) return null

  pushDeviceStore.save({
    playerId,
    pushToken,
    onesignalUserId,
    platform,
  })

  return playerId
}

async function handlePushSubscriptionChange(event: PushSubscriptionChangedState) {
  const platform = getNativePlatform()
  if (!platform) return

  const playerId = event.current.id?.trim()
    || (await OneSignal.User.pushSubscription.getIdAsync())?.trim()
    || null

  if (!playerId) return

  pushDeviceStore.save({
    playerId,
    pushToken: event.current.token?.trim() || null,
    onesignalUserId: await OneSignal.User.getOnesignalId(),
    platform,
  })

  await flushPushDeviceRegistration()
}

function resolveNotificationTarget(event: NotificationClickEvent): string | null {
  const target = event.result?.url || event.notification?.launchURL || ''
  return target.trim() || null
}

function routeNotificationTarget(target: string) {
  let path = target

  if (/^https?:\/\//i.test(target)) {
    let url: URL
    try {
      url = new URL(target)
    } catch {
      return
    }

    if (url.origin !== window.location.origin) {
      window.location.assign(target)
      return
    }

    path = `${url.pathname}${url.search}${url.hash}`
  }

  if (navigateHandler) {
    navigateHandler(path)
  } else {
    pendingNotificationTarget = path
  }
}

function bindNotificationClickListener() {
  OneSignal.Notifications.addEventListener('click', (event) => {
    const target = resolveNotificationTarget(event)
    if (target) routeNotificationTarget(target)
  })
}

export function registerNotificationNavigateHandler(handler: (path: string) => void): void {
  navigateHandler = handler
  if (pendingNotificationTarget) {
    const target = pendingNotificationTarget
    pendingNotificationTarget = null
    handler(target)
  }
}

export function unregisterNotificationNavigateHandler(): void {
  navigateHandler = null
}

function bindPushSubscriptionListener() {
  if (subscriptionListenerBound || !initialized) return

  OneSignal.User.pushSubscription.addEventListener('change', (event) => {
    void handlePushSubscriptionChange(event)
  })

  OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
    if (!granted) {
      logger.warn('OneSignal: notification permission denied')
      return
    }
    void persistPushSubscriptionFromSdk()
  })

  bindNotificationClickListener()

  subscriptionListenerBound = true
}

async function registerPushOnAppLaunch(): Promise<void> {
  // Let the WebView finish first paint so iOS/Android can show the permission prompt.
  await sleep(400)

  const accepted = await OneSignal.Notifications.requestPermission(false)
  if (!accepted) {
    logger.warn('OneSignal: notification permission not granted')
    return
  }

  const playerId = await waitForPushSubscription()
  if (playerId) {
    await persistPushSubscriptionFromSdk()
    return
  }

  logger.warn('OneSignal: permission granted but playerId not available yet')
}

export async function flushPushDeviceRegistration(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return
  if (!tokenStore.get()?.accessToken) return
  if (!pushDeviceStore.needsSync()) return

  if (syncInFlight) {
    await syncInFlight
    return
  }

  syncInFlight = (async () => {
    const record = pushDeviceStore.get()
    if (!record?.playerId) return

    const synced = await pushDevicesRepository.registerPushDevice({
      playerId: record.playerId,
      platform: record.platform,
      pushToken: record.pushToken,
      onesignalUserId: record.onesignalUserId,
    })

    if (synced) {
      pushDeviceStore.markSynced(record.playerId)
    } else {
      logger.warn('OneSignal: push device registration not synced', { playerId: record.playerId })
    }
  })()
    .catch((error) => {
      logger.warn('Push device sync failed', error)
    })
    .finally(() => {
      syncInFlight = null
    })

  await syncInFlight
}

export async function initOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  if (!ONESIGNAL_APP_ID) {
    logger.warn('OneSignal: missing VITE_ONESIGNAL_APP_ID in build env')
    return
  }

  try {
    if (import.meta.env.DEV) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose)
    }

    await OneSignal.initialize(ONESIGNAL_APP_ID)
    initialized = true
    bindPushSubscriptionListener()
    await registerPushOnAppLaunch()
  } catch (error) {
    logger.error('OneSignal initialization failed', error)
  }
}

export async function syncOneSignalUser(userId: string | null | undefined): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return

  try {
    if (userId) {
      await OneSignal.login(String(userId))
      const playerId = await persistPushSubscriptionFromSdk()
        || await waitForPushSubscription()
      if (playerId) {
        await persistPushSubscriptionFromSdk()
      } else {
        logger.warn('OneSignal: logged in but playerId not available yet')
      }
      await flushPushDeviceRegistration()
      return
    }

    pushDeviceStore.clearSyncState()
    await OneSignal.logout()
  } catch (error) {
    logger.warn('OneSignal user sync failed', error)
  }
}
