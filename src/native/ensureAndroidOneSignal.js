/**
 * Patches Android OneSignal native config after cap sync:
 * - AndroidManifest.xml: com.onesignal.suppressLaunchURLs (SDK 5.x reads this key)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const manifestPath = join(
  process.cwd(),
  'android/app/src/main/AndroidManifest.xml',
)

const SUPPRESS_META =
  '        <meta-data android:name="com.onesignal.suppressLaunchURLs" android:value="true" />'

const LEGACY_SUPPRESS_META =
  '        <meta-data android:name="OneSignal_suppress_launch_urls" android:value="true" />'

export function ensureAndroidOneSignalManifest() {
  if (!existsSync(manifestPath)) {
    console.warn('[onesignal] Skipping AndroidManifest patch — file not found')
    return
  }

  let xml = readFileSync(manifestPath, 'utf8')
  let changed = false

  if (xml.includes(LEGACY_SUPPRESS_META)) {
    xml = xml.replace(LEGACY_SUPPRESS_META, SUPPRESS_META)
    changed = true
  }

  if (!xml.includes('com.onesignal.suppressLaunchURLs')) {
    const applicationClose = '</application>'
    if (!xml.includes(applicationClose)) {
      console.warn('[onesignal] AndroidManifest missing </application> — cannot patch')
      return
    }

    xml = xml.replace(applicationClose, `${SUPPRESS_META}\n    ${applicationClose}`)
    changed = true
  }

  if (changed) {
    writeFileSync(manifestPath, xml)
    console.log('[onesignal] Patched AndroidManifest: com.onesignal.suppressLaunchURLs')
  }
}

if (import.meta.url.endsWith(process.argv[1] ?? '')) {
  ensureAndroidOneSignalManifest()
}
