/**
 * Patches iOS OneSignal native config after cap sync:
 * - Info.plist: UIBackgroundModes + OneSignal_app_groups_key
 * - App.entitlements: aps-environment (development) + App Group
 * - AppRelease.entitlements: aps-environment (production) + App Group
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const APP_GROUP = 'group.net.vlinkgroup.nexora.onesignal'
const iosAppDir = join(process.cwd(), 'ios/App/App')
const plistPath = join(iosAppDir, 'Info.plist')
const debugEntitlementsPath = join(iosAppDir, 'App.entitlements')
const releaseEntitlementsPath = join(iosAppDir, 'AppRelease.entitlements')

function ensurePlistKey(xml, key, block) {
  if (xml.includes(`<key>${key}</key>`)) return xml
  return xml.replace('</dict>\n</plist>', `${block}\n</dict>\n</plist>`)
}

function buildEntitlementsXml(apsEnvironment) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>aps-environment</key>
	<string>${apsEnvironment}</string>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>${APP_GROUP}</string>
	</array>
</dict>
</plist>
`
}

function ensureEntitlementsFile(path, apsEnvironment) {
  const next = buildEntitlementsXml(apsEnvironment)
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, next)
    return
  }

  const current = readFileSync(path, 'utf8')
  if (current === next) return
  writeFileSync(path, next)
}

export function ensureIosOneSignalPlist() {
  if (!existsSync(plistPath)) {
    console.warn('[onesignal] Skipping Info.plist patch — ios/App/App/Info.plist not found')
    return
  }

  let xml = readFileSync(plistPath, 'utf8')

  xml = ensurePlistKey(
    xml,
    'UIBackgroundModes',
    `	<key>UIBackgroundModes</key>
	<array>
		<string>remote-notification</string>
	</array>`,
  )

  xml = ensurePlistKey(
    xml,
    'OneSignal_app_groups_key',
    `	<key>OneSignal_app_groups_key</key>
	<string>${APP_GROUP}</string>`,
  )

  writeFileSync(plistPath, xml)
  ensureEntitlementsFile(debugEntitlementsPath, 'development')
  ensureEntitlementsFile(releaseEntitlementsPath, 'production')
  console.log('[onesignal] Patched iOS plist + entitlements for push notifications')
}

if (import.meta.url.endsWith(process.argv[1] ?? '')) {
  ensureIosOneSignalPlist()
}
