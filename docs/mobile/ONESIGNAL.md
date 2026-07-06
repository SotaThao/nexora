# OneSignal — iOS & Android

Push notifications use `@onesignal/capacitor-plugin` with App ID from `VITE_ONESIGNAL_APP_ID`.

## 1. OneSignal dashboard

1. Create/select app at [onesignal.com](https://onesignal.com).
2. Add **Apple (APNs)** and **Google (FCM)** platforms.
3. Copy **App ID** into env:

```env
VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Use separate OneSignal apps (or keys) per environment if needed (`development`, `staging`, `production`).

## 2. Android (FCM)

1. Create Firebase project → add Android app `net.vlinkgroup.nexora`.
2. Download `google-services.json` → `android/app/google-services.json` (see `google-services.json.example`).
3. Upload Firebase Server Key / service account to OneSignal (Settings → Platforms → Google).
4. Rebuild:

```bash
ONESIGNAL_DISABLE_LOCATION=true pnpm cap:sync
```

`POST_NOTIFICATIONS` is declared in `AndroidManifest.xml` for Android 13+.

## 3. iOS (APNs)

After `cap sync`, open `ios/App/App.xcworkspace` in Xcode.

### App target (`App`)

1. **Apple Developer** → Identifiers → `net.vlinkgroup.nexora`:
   - Enable **Push Notifications**
   - Enable **App Groups** → add `group.net.vlinkgroup.nexora.onesignal`
   - Regenerate provisioning profiles after changes
2. **Signing & Capabilities** (should match entitlements auto-patched by `ensureIosOneSignal.js`):
   - Push Notifications (`aps-environment` in `App.entitlements`)
   - Background Modes → Remote notifications (`Info.plist`)
   - App Groups → `group.net.vlinkgroup.nexora.onesignal`
3. `cap sync` runs `src/native/ensureIosOneSignal.js` which writes:
   - `App.entitlements` → `aps-environment: development` (Debug builds)
   - `AppRelease.entitlements` → `aps-environment: production` (Release builds)

### Notification Service Extension (recommended)

1. File → New → Target → **Notification Service Extension**
2. Product name: `OneSignalNotificationServiceExtension`
3. Add same App Group to the NSE target.
4. Replace `NotificationService.swift` with OneSignal template from [Capacitor SDK setup](https://documentation.onesignal.com/docs/en/capacitor-sdk-setup).
5. Add `OneSignal_app_groups_key` to NSE `Info.plist` if using a custom group.

### APNs in OneSignal

Upload **p8 key** (recommended) or p12 in OneSignal → Settings → Platforms → Apple iOS.

## 4. Build & test

```bash
ONESIGNAL_DISABLE_LOCATION=true pnpm cap:sync
pnpm cap:open:ios    # or cap:open:android
```

1. Run on a **physical device** (push does not work reliably on simulators).
2. Log in — SDK calls `OneSignal.login(session.id)` and requests notification permission.
3. Verify subscription in OneSignal → Audience → Subscriptions.

## 5. Code map

| File | Role |
|------|------|
| `src/native/onesignal.ts` | Initialize SDK, capture player id, POST when authenticated |
| `src/auth/pushDeviceStore.ts` | Persist player id locally; track sync state |
| `src/data/repositories/pushDevices.ts` | `POST /api/v1/UserProfile/push-device` |
| `src/native/OneSignalAuthBridge.tsx` | Sync user id + flush player id after login |
| `src/native/initNativeShell.ts` | Boot-time `initOneSignal()` |
| `capacitor.config.json` | `ios.handleApplicationNotifications: false` |

## 6. Backend registration

When OneSignal assigns a subscription id (player id), the app:

1. Saves it in `pushDeviceStore` (`localStorage` key `nexora_push_device`)
2. After login (JWT available), calls:

```http
POST /api/v1/UserProfile/push-device
Authorization: Bearer <access_token>

{
  "playerId": "<onesignal-subscription-id>",
  "platform": "ios|android",
  "pushToken": "<fcm-or-apns-token>",
  "onesignalUserId": "<optional>"
}
```

Override path via `VITE_PUSH_DEVICE_REGISTER_PATH` if BE uses a different route.

If the endpoint returns 404/501, registration is skipped silently and retried on next login.

## 7. Notification click / Launch URL

### Native: suppress default browser open

OneSignal opens Launch URLs in the **system browser** by default on Android (and can bounce through Safari on iOS). The app disables that so only the JS click handler navigates in-app:

| Platform | Config |
|----------|--------|
| Android | `OneSignal_suppress_launch_urls` in `android/app/src/main/AndroidManifest.xml` (auto-patched by `ensureAndroidOneSignal.js` on `cap sync`) |
| iOS | `OneSignal_suppress_launch_urls` in `Info.plist` (auto-patched by `ensureIosOneSignal.js`) |

Rebuild native after changing these: `pnpm cap:build:test` (or staging/production).

### Payload & routing

Set the notification **Launch URL** (or `additionalData.url` / `path`) to an app-relative path, e.g. `/merchant/payments/<paymentId>` or `/staff/payments/<paymentId>`. Full `https://*.nexoratouch.com/...` URLs are also mapped to in-app paths.

On tap, `src/native/onesignal.ts` reads `event.result.url` / `event.notification.launchURL` / additional data from the `click` listener and routes via React Router (`OneSignalNotificationBridge` in `src/app/AppRouter.tsx`). Cold start is supported — the target is buffered until the bridge mounts.

`/merchant/payments/:paymentId` and `/dashboard/payments/:paymentId` redirect to `/dashboard/reports?tab=direct_payments&paymentId=<id>`; `/staff/payments/:paymentId` opens the staff transactions view directly.
