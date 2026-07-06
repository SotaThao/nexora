import { Capacitor } from '@capacitor/core'
import OneSignal, {
  LogLevel,
  type NotificationClickEvent,
  type PushSubscriptionChangedState,
} from '@onesignal/capacitor-plugin'
import { pushDeviceStore, type PushDevicePlatform } from '../auth/pushDeviceStore'
import { tokenStore } from '../auth/tokenStore'
import { pushDevicesRepository } from '../data/repositories/pushDevices'
import { pushDeviceTrace } from './pushDeviceTrace'
import { resolveNotificationToAppPath } from '../utils/resolveNotificationToAppPath'
import { logger } from '../utils/logger'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim() ?? ''

let initialized = false
let initPromise: Promise<void> | null = null
let pendingAuthUserId: string | null | undefined = undefined
let subscriptionListenerBound = false
let notificationClickListenerBound = false
let tokenListenerBound = false
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

async function awaitOneSignalReady(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  if (initialized) return true
  if (!initPromise) return false
  await initPromise
  return initialized
}

function bindTokenStoreListener() {
  if (tokenListenerBound) return
  tokenListenerBound = true

  tokenStore.subscribe((tokens) => {
    if (!tokens?.accessToken) return
    void onAuthenticatedTokenAvailable()
  })
}

async function onAuthenticatedTokenAvailable(): Promise<void> {
  const ready = await awaitOneSignalReady()
  if (!ready || !tokenStore.get()?.accessToken) return

  await ensurePushSubscriptionPersisted()
}

async function ensurePushSubscriptionPersisted(): Promise<string | null> {
  const existing = pushDeviceStore.get()?.playerId
  if (existing) {
    pushDeviceTrace('subscription.alreadyStored', { playerId: existing })
    return existing
  }

  pushDeviceTrace('subscription.readSdk.start')
  const playerId = await persistPushSubscriptionFromSdk()
    || await waitForPushSubscription(8, 500)
  if (playerId) {
    const saved = await persistPushSubscriptionFromSdk()
    pushDeviceTrace('subscription.readSdk.done', { playerId: saved })
    return saved
  }

  pushDeviceTrace('subscription.readSdk.missing')
  return null
}

async function processPendingAuthSync(): Promise<void> {
  if (pendingAuthUserId === undefined) return

  const userId = pendingAuthUserId
  pendingAuthUserId = undefined
  await syncOneSignalUserInternal(userId)
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
  if (!platform) {
    pushDeviceTrace('subscription.persist.skip', { reason: 'not-native-platform' })
    return null
  }

  const { playerId, pushToken, onesignalUserId } = await readPushSubscriptionIds()
  pushDeviceTrace('subscription.sdkValues', {
    playerId: playerId || null,
    hasPushToken: Boolean(pushToken),
    onesignalUserId: onesignalUserId || null,
    platform,
  })
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
}

function readNotificationAdditionalTarget(
  additionalData: Record<string, unknown> | undefined,
): string {
  if (!additionalData) return ''

  const candidates = ['url', 'path', 'launchUrl', 'launchURL', 'deepLink', 'route']
  for (const key of candidates) {
    const value = additionalData[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

function resolveNotificationTarget(event: NotificationClickEvent): string | null {
  const notification = event.notification as {
    launchURL?: string
    additionalData?: Record<string, unknown>
  }

  const target = event.result?.url
    || notification?.launchURL
    || readNotificationAdditionalTarget(notification?.additionalData)
    || ''

  return target.trim() || null
}

function routeNotificationTarget(target: string) {
  const appPath = resolveNotificationToAppPath(target)

  if (!appPath) {
    pushDeviceTrace('notification.skip', { reason: 'unresolvable-target', target })
    return
  }

  pushDeviceTrace('notification.navigateInApp', { target, appPath })
  if (navigateHandler) {
    navigateHandler(appPath)
  } else {
    pendingNotificationTarget = appPath
  }
}

function bindNotificationClickListener() {
  if (notificationClickListenerBound) return
  notificationClickListenerBound = true

  OneSignal.Notifications.addEventListener('click', (event) => {
    const target = resolveNotificationTarget(event)
    pushDeviceTrace('notification.click', {
      target: target || null,
      resultUrl: event.result?.url || null,
      launchURL: (event.notification as { launchURL?: string }).launchURL || null,
    })
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
    void (async () => {
      await persistPushSubscriptionFromSdk()
    })()
  })

  subscriptionListenerBound = true
}

async function registerPushOnAppLaunch(): Promise<void> {
  // Let the WebView finish first paint so iOS/Android can show the permission prompt.
  await sleep(400)

  const existingPlayerId = await persistPushSubscriptionFromSdk()
  if (existingPlayerId) return

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

export async function flushPushDeviceRegistration(options?: { force?: boolean }): Promise<void> {
  pushDeviceTrace('flush.start', { force: Boolean(options?.force) })

  const ready = await awaitOneSignalReady()
  if (!ready) {
    pushDeviceTrace('flush.skip', { reason: 'onesignal-not-ready' })
    return
  }

  const hasToken = Boolean(tokenStore.get()?.accessToken)
  if (!hasToken) {
    pushDeviceTrace('flush.skip', { reason: 'no-access-token' })
    return
  }

  await ensurePushSubscriptionPersisted()

  const needsSync = pushDeviceStore.needsSync()
  if (!options?.force && !needsSync) {
    pushDeviceTrace('flush.skip', { reason: 'already-synced', needsSync })
    return
  }

  if (syncInFlight) {
    pushDeviceTrace('flush.wait', { reason: 'sync-in-flight' })
    await syncInFlight
    if (!options?.force && !pushDeviceStore.needsSync()) {
      pushDeviceTrace('flush.skip', { reason: 'completed-by-other-call' })
      return
    }
  }

  syncInFlight = (async () => {
    const record = pushDeviceStore.get()
    if (!record?.playerId) {
      pushDeviceTrace('flush.skip', { reason: 'playerId-not-available' })
      return
    }

    pushDeviceTrace('flush.callApi', {
      playerId: record.playerId,
      platform: record.platform,
      hasPushToken: Boolean(record.pushToken),
      onesignalUserId: record.onesignalUserId || null,
    })

    const synced = await pushDevicesRepository.registerPushDevice({
      playerId: record.playerId,
      platform: record.platform,
      pushToken: record.pushToken,
      onesignalUserId: record.onesignalUserId,
    })

    if (synced) {
      pushDeviceStore.markSynced(record.playerId)
      pushDeviceTrace('flush.success', { playerId: record.playerId })
    } else {
      pushDeviceTrace('flush.apiFailed', { playerId: record.playerId })
    }
  })()
    .catch((error) => {
      pushDeviceTrace('flush.error', {
        message: error instanceof Error ? error.message : String(error),
      })
    })
    .finally(() => {
      syncInFlight = null
    })

  await syncInFlight
}

async function runOneSignalInit(): Promise<void> {
  pushDeviceTrace('init.start', {
    hasAppId: Boolean(ONESIGNAL_APP_ID),
    platform: Capacitor.getPlatform(),
  })

  if (!ONESIGNAL_APP_ID) {
    pushDeviceTrace('init.skip', { reason: 'missing-VITE_ONESIGNAL_APP_ID' })
    return
  }

  try {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose)
    }

    bindTokenStoreListener()
    // Register before initialize so cold-start notification taps are not missed.
    bindNotificationClickListener()
    await OneSignal.initialize(ONESIGNAL_APP_ID)
    initialized = true
    pushDeviceTrace('init.onesignalReady')
    bindPushSubscriptionListener()
    await registerPushOnAppLaunch()
    await processPendingAuthSync()
    pushDeviceTrace('init.done')
  } catch (error) {
    pushDeviceTrace('init.error', {
      message: error instanceof Error ? error.message : String(error),
    })
    logger.error('OneSignal initialization failed', error)
  }
}

export function initOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve()
  if (initialized) return Promise.resolve()
  if (!initPromise) {
    initPromise = runOneSignalInit()
  }
  return initPromise
}

async function syncOneSignalUserInternal(userId: string | null | undefined): Promise<void> {
  try {
    if (userId) {
      await OneSignal.login(String(userId))
      return
    }

    pushDeviceStore.clearSyncState()
    await OneSignal.logout()
  } catch (error) {
    logger.warn('OneSignal user sync failed', error)
  }
}

/** Register push device with BE — call from dashboard on each visit. */
export async function registerPushDeviceOnDashboardVisit(userId: string): Promise<void> {
  pushDeviceTrace('dashboard.start', {
    userId,
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  })

  if (!Capacitor.isNativePlatform()) {
    pushDeviceTrace('dashboard.skip', { reason: 'not-native-platform' })
    return
  }

  if (!userId.trim()) {
    pushDeviceTrace('dashboard.skip', { reason: 'empty-userId' })
    return
  }

  await initOneSignal()

  if (!initialized) {
    pushDeviceTrace('dashboard.skip', { reason: 'onesignal-not-initialized' })
    return
  }

  const accessToken = tokenStore.get()?.accessToken
  if (!accessToken) {
    pushDeviceTrace('dashboard.skip', { reason: 'no-access-token' })
    return
  }

  try {
    pushDeviceTrace('dashboard.onesignalLogin', { userId })
    pushDeviceStore.clearSyncState()
    await OneSignal.login(String(userId))
    await ensurePushSubscriptionPersisted()
    await flushPushDeviceRegistration({ force: true })
    pushDeviceTrace('dashboard.done', { userId })
  } catch (error) {
    pushDeviceTrace('dashboard.error', {
      message: error instanceof Error ? error.message : String(error),
    })
    logger.warn('Push device dashboard registration failed', error)
  }
}

export async function syncOneSignalUser(userId: string | null | undefined): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  if (!initialized) {
    pendingAuthUserId = userId ?? null
    await initOneSignal()
    return
  }

  await syncOneSignalUserInternal(userId)
}
