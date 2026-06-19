import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const capAppRoot = join(process.cwd(), 'ios/App/CapApp-SPM')
const sourceFile = join(capAppRoot, 'Sources/CapApp-SPM/CapApp-SPM.swift')
const debugConfig = join(process.cwd(), 'ios/debug.xcconfig')

const files = [
  {
    path: sourceFile,
    content: 'public let isCapacitorApp = true\n',
  },
  {
    path: join(capAppRoot, '.gitignore'),
    content: `.DS_Store
/.build
/Packages
/*.xcodeproj
xcuserdata/
DerivedData/
.swiftpm/config/registries.json
.swiftpm/xcode/package.xcworkspacedata
.netrc
`,
  },
  {
    path: join(capAppRoot, 'README.md'),
    content: `# CapApp-SPM

This package is used to host SPM dependencies for your Capacitor project

Do not modify the contents of it or there may be unintended consequences.
`,
  },
  {
    path: debugConfig,
    content: 'CAPACITOR_DEBUG = true\n',
  },
]

for (const file of files) {
  if (existsSync(file.path)) continue
  mkdirSync(dirname(file.path), { recursive: true })
  writeFileSync(file.path, file.content)
}
