import { Capacitor } from '@capacitor/core'
import OneSignal, { LogLevel, type PushSubscriptionChangedState } from '@onesignal/capacitor-plugin'
import { pushDeviceStore, type PushDevicePlatform } from '../auth/pushDeviceStore'
import { tokenStore } from '../auth/tokenStore'
import { pushDevicesRepository } from '../data/repositories/pushDevices'
import { logger } from '../utils/logger'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim() ?? ''
const SHOW_PUSH_DEBUG_ALERT = import.meta.env.DEV
  || import.meta.env.VITE_ONESIGNAL_DEBUG_ALERT === 'true'

let initialized = false
let subscriptionListenerBound = false
let syncInFlight: Promise<void> | null = null
let lastAlertedPlayerId: string | null = null

function alertPushDebug(message: string) {
  if (!SHOW_PUSH_DEBUG_ALERT) return
  window.alert(message)
}

function alertPlayerIdForTest(playerId: string, details = '') {
  if (!SHOW_PUSH_DEBUG_ALERT) return
  if (lastAlertedPlayerId === playerId && !details) return
  lastAlertedPlayerId = playerId

  const suffix = details ? `\n\n${details}` : ''
  window.alert(`OneSignal playerId:\n${playerId}${suffix}`)
}

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

async function persistPushSubscriptionFromSdk(options: { alert?: boolean } = {}): Promise<string | null> {
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

  if (options.alert !== false) {
    alertPlayerIdForTest(
      playerId,
      [
        `platform: ${platform}`,
        pushToken ? `pushToken: ${pushToken.slice(0, 12)}...` : 'pushToken: (chưa có)',
        onesignalUserId ? `onesignalUserId: ${onesignalUserId}` : 'onesignalUserId: (chưa có)',
        'Đã lưu vào pushDeviceStore',
      ].join('\n'),
    )
  }

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

  alertPlayerIdForTest(playerId, 'Subscription change event')
  await flushPushDeviceRegistration()
}

function bindPushSubscriptionListener() {
  if (subscriptionListenerBound || !initialized) return

  OneSignal.User.pushSubscription.addEventListener('change', (event) => {
    void handlePushSubscriptionChange(event)
  })

  OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
    if (!granted) {
      alertPushDebug('OneSignal: người dùng từ chối quyền notification')
      return
    }
    void persistPushSubscriptionFromSdk()
  })

  subscriptionListenerBound = true
}

async function registerPushOnAppLaunch(): Promise<void> {
  // Let the WebView finish first paint so iOS/Android can show the permission prompt.
  await sleep(400)

  const accepted = await OneSignal.Notifications.requestPermission(false)
  if (!accepted) {
    alertPushDebug('OneSignal: chưa được cấp quyền notification.\nVào Settings → Notifications để bật.')
    return
  }

  const playerId = await waitForPushSubscription()
  if (playerId) {
    await persistPushSubscriptionFromSdk()
    return
  }

  alertPushDebug(
    'OneSignal: đã cấp quyền nhưng chưa có playerId.\n'
    + 'Kiểm tra cấu hình APNs/FCM trên OneSignal dashboard.',
  )
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
      alertPlayerIdForTest(record.playerId, 'API register: thành công')
    } else {
      alertPlayerIdForTest(record.playerId, 'API register: chưa sync (endpoint chưa sẵn sàng hoặc lỗi)')
    }
  })()
    .catch((error) => {
      logger.warn('Push device sync failed', error)
      alertPushDebug(`OneSignal API sync lỗi:\n${error instanceof Error ? error.message : 'unknown'}`)
    })
    .finally(() => {
      syncInFlight = null
    })

  await syncInFlight
}

export async function initOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initialized) return

  if (!ONESIGNAL_APP_ID) {
    const message = 'OneSignal: thiếu VITE_ONESIGNAL_APP_ID trong file env của build.'
    logger.warn(message)
    alertPushDebug(message)
    return
  }

  try {
    if (import.meta.env.DEV || SHOW_PUSH_DEBUG_ALERT) {
      OneSignal.Debug.setLogLevel(LogLevel.Verbose)
    }

    await OneSignal.initialize(ONESIGNAL_APP_ID)
    initialized = true
    bindPushSubscriptionListener()
    await registerPushOnAppLaunch()
  } catch (error) {
    logger.error('OneSignal initialization failed', error)
    alertPushDebug(
      `OneSignal init lỗi:\n${error instanceof Error ? error.message : 'unknown'}`,
    )
  }
}

export async function syncOneSignalUser(userId: string | null | undefined): Promise<void> {
  if (!Capacitor.isNativePlatform() || !initialized) return

  try {
    if (userId) {
      await OneSignal.login(String(userId))
      const playerId = await persistPushSubscriptionFromSdk({ alert: false })
        || await waitForPushSubscription()
      if (playerId) {
        await persistPushSubscriptionFromSdk()
      } else if (SHOW_PUSH_DEBUG_ALERT) {
        alertPushDebug('OneSignal: đã login nhưng chưa có playerId.')
      }
      await flushPushDeviceRegistration()
      return
    }

    pushDeviceStore.clearSyncState()
    await OneSignal.logout()
  } catch (error) {
    logger.warn('OneSignal user sync failed', error)
    alertPushDebug(`OneSignal login/logout lỗi:\n${error instanceof Error ? error.message : 'unknown'}`)
  }
}
