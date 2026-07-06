/**
 * Patches Android OneSignal native config after cap sync:
 * - AndroidManifest.xml: OneSignal_suppress_launch_urls (stop opening Launch URL in browser)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const manifestPath = join(
  process.cwd(),
  'android/app/src/main/AndroidManifest.xml',
)

const SUPPRESS_META =
  '        <meta-data android:name="OneSignal_suppress_launch_urls" android:value="true" />'

export function ensureAndroidOneSignalManifest() {
  if (!existsSync(manifestPath)) {
    console.warn('[onesignal] Skipping AndroidManifest patch — file not found')
    return
  }

  let xml = readFileSync(manifestPath, 'utf8')

  if (xml.includes('OneSignal_suppress_launch_urls')) {
    return
  }

  const applicationClose = '</application>'
  if (!xml.includes(applicationClose)) {
    console.warn('[onesignal] AndroidManifest missing </application> — cannot patch')
    return
  }

  xml = xml.replace(applicationClose, `${SUPPRESS_META}\n    ${applicationClose}`)
  writeFileSync(manifestPath, xml)
  console.log('[onesignal] Patched AndroidManifest: OneSignal_suppress_launch_urls')
}

if (import.meta.url.endsWith(process.argv[1] ?? '')) {
  ensureAndroidOneSignalManifest()
}
