# Hướng dẫn migration JavaScript → TypeScript (React 18 + Vite)

Tài liệu này mô tả quy trình đã áp dụng cho **vlink-nexora-fe**: chuyển toàn bộ `src/` từ `.js`/`.jsx` sang `.ts`/`.tsx` **không đổi logic runtime**, giữ nguyên data boundary (`components → hooks → repositories → httpClient`).

Dùng tài liệu này để replicate trên repo tương tự (React + Vite + TanStack Query + REST API).

---

## Mục tiêu & nguyên tắc

| Mục tiêu | Chi tiết |
|----------|----------|
| Build vẫn pass | `pnpm build` (Vite) không phụ thuộc `tsc` — nhưng thêm `pnpm typecheck` riêng |
| Không đổi behavior | Chỉ thêm type, default props, type guard — không refactor logic nghiệp vụ |
| Migration tăng dần | Bật `strict: true` nhưng tắt `strictNullChecks` ban đầu để giảm blast radius |
| Escape hatch có kiểm soát | `LooseObject` cho form/state legacy; thu hẹp dần theo domain |

**Thứ tự ưu tiên sửa lỗi:**

1. Infrastructure + shared types  
2. Data layer (repositories, hooks, query keys)  
3. Auth adapter + contexts  
4. Form hooks (`useStaffManagement`, `useRegisterForm`, …)  
5. Components lớn (Dashboard, modals, Analytics)  
6. Lỗi JSX nhỏ (`rows`, `colSpan`, props thiếu)

---

## Phase 0 — Chuẩn bị

```bash
pnpm add -D typescript @types/react @types/react-dom @types/node glob
```

Thêm script trong `package.json`:

```json
"typecheck": "tsc --noEmit"
```

Theo dõi tiến độ:

```bash
pnpm typecheck 2>&1 | rg "error TS" | wc -l
pnpm typecheck 2>&1 | rg "error TS" | sed 's/(.*//' | sort | uniq -c | sort -rn | head -20
```

---

## Phase 1 — Infrastructure & bulk rename

### 1.1 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": false,
    "strictNullChecks": false,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.2 `tsconfig.node.json` (Vite/Vitest config)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "vitest.e2e.config.ts"]
}
```

### 1.3 `src/vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Global escape hatch for legacy form/state blobs during incremental typing. */
type LooseObject = Record<string, any>
```

### 1.4 Entry & config files

- `index.html`: đổi entry `/src/main.jsx` → `/src/main.tsx`
- Đổi tên: `vite.config.js` → `vite.config.ts`, `vitest.config.js` → `vitest.config.ts`
- Xóa shim trùng tên (ví dụ `constants.ts` re-export `constants.tsx` gây circular import sau khi strip extension)

### 1.5 Bulk rename script (`scripts/migrate-to-ts.mjs`)

```javascript
#!/usr/bin/env node
import { rename, readFile, writeFile } from 'node:fs/promises'
import { glob } from 'glob'

const files = await glob('src/**/*.{js,jsx}')

for (const file of files) {
  const isJsx = file.endsWith('.jsx')
  const newPath = file.replace(/\.jsx?$/, isJsx ? '.tsx' : '.ts')
  await rename(file, newPath)

  let content = await readFile(newPath, 'utf8')
  // Strip .js/.jsx/.ts/.tsx from relative imports
  content = content.replace(
    /(from\s+['"]\.\.?\/[^'"]+)\.(jsx?|tsx?)['"]/g,
    "$1'"
  )
  await writeFile(newPath, content, 'utf8')
  console.log(`${file} → ${newPath}`)
}
```

Chạy: `node scripts/migrate-to-ts.mjs`

### 1.6 Shared types — cấu trúc thư mục `src/types/`

| File | Nội dung |
|------|----------|
| `api.ts` | `ApiError`, `HttpRequestInit`, interceptors |
| `auth.ts` | `AuthSession`, `AuthTokens`, `LoginCredentials`, `SignupCredentials` |
| `contexts.ts` | `LanguageContextValue`, `TFunction`, `StaffAccountContextValue` |
| `domain.ts` | Domain DTOs + `isApiError`, `getApiErrorCode`, `asRecord` |
| `repositories.ts` | API DTO snapshots, input types cho repositories |
| `hooks.ts` | Mutation variable types |
| `forms.ts` | `StaffFormState`, `EMPTY_STAFF_FORM`, … |

### 1.7 Core files gõ trước

- `src/lib/httpClient.ts` — generic `get<T>`, `post<T>`, `ApiError` reject
- `src/auth/tokenStore.ts`, `src/auth/AuthProvider.tsx`
- Contexts: `LanguageContext`, `NotificationContext`, `KybGateContext`, `StaffAccountContext`

**Kết quả Phase 1:** `pnpm build` pass; `typecheck` còn ~400 lỗi (chấp nhận được).

---

## Phase 2 — Repositories + data hooks

### Pattern repository

```typescript
import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { StaffMember } from '../../types/domain'

export async function listStaff(): Promise<StaffMember[]> {
  try {
    return await httpClient.get<StaffMember[]>('/api/v1/merchant/staff')
  } catch (err) {
    if (isApiError(err) && err.status === 404) return []
    throw err
  }
}
```

### Pattern data hook

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import type { StaffMember } from '../../types/domain'

export function useMerchantStaff() {
  return useQuery<StaffMember[]>({
    queryKey: qk.merchantStaff(),
    queryFn: () => merchantsRepository.listStaff(),
  })
}

export function useInviteStaff() {
  return useMutation<unknown, Error, InviteStaffInput>({
    mutationFn: (vars) => merchantsRepository.inviteStaff(vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.merchantStaff() }),
  })
}
```

### httpClient — `body` optional cho POST không body

```typescript
export function post<T = unknown>(path: string, body?: unknown, opts: HttpRequestInit = {}) {
  const init: HttpRequestInit = { ...opts, method: 'POST' }
  if (body !== undefined) init.body = JSON.stringify(body)
  return request<T>(path, init)
}
```

**Mục tiêu:** `src/data/**` → **0 lỗi typecheck**.

---

## Phase 3 — Auth, form hooks, components

### 3.1 `apiAuthAdapter.ts`

- Import types: `AuthSession`, `AuthTokens`, `UserProfile`, `StaffProfile`
- Dùng `httpClient.get<UserProfile>(...)`, `httpClient.post<AuthTokens>(...)`
- Catch: `isApiError(err) && err.status === 401` thay vì `err?.status`
- `mapProfileToSession` return type: `AuthSession`

### 3.2 Helpers xử lý lỗi API (bắt buộc dùng thống nhất)

Trong `src/types/domain.ts`:

```typescript
export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errorCode' in err &&
    typeof (err as ApiError).errorCode === 'string'
  )
}

export function getApiErrorCode(err: unknown, fallback = 'HTTP_ERROR'): string {
  return isApiError(err) ? err.errorCode : fallback
}
```

**Thay toàn repo:**

```typescript
// ❌ Trước
err?.errorCode || 'HTTP_ERROR'

// ✅ Sau
getApiErrorCode(err, 'HTTP_ERROR')
```

Mutation `onError: (err: Error)` → dùng `getApiErrorCode(err)` vì TanStack Query typing `Error` không có `errorCode`.

### 3.3 Form validation objects

```typescript
// ❌ Trước — TS2339 property does not exist on type '{}'
const errors = {}
errors.email = 'Required'

// ✅ Sau
const errors: LooseObject = {}
errors.email = 'Required'
```

Script batch (`scripts/fix-ts-phase3.mjs`):

```javascript
content = content
  .replace(/const newErrors = \{\}/g, 'const newErrors: LooseObject = {}')
  .replace(/const nextErrors = \{\}/g, 'const nextErrors: LooseObject = {}')
  .replace(/const errorsMap = \{\}/g, 'const errorsMap: LooseObject = {}')
  .replace(/const staffErrors = \{\}/g, 'const staffErrors: LooseObject = {}')
  .replace(/const finalPaymentAccounts = \{\}/g, 'const finalPaymentAccounts: LooseObject = {}')
```

### 3.4 `StaffFormState` (`src/types/forms.ts`)

```typescript
export interface StaffFormState {
  fullName: string
  nickname: string
  position: string
  avatar: string
  phone: string
  email: string
  venmo: string
  cashapp: string
  zelle: string
  vlinkpay: string
  nexoraStaffId?: string
  showInTipsFlow: boolean
  payoutConfigs: LooseObject
  [key: string]: unknown
}

export const EMPTY_STAFF_FORM: StaffFormState = { /* defaults */ }

// Hook:
const [staffForm, setStaffForm] = useState<StaffFormState>({
  ...EMPTY_STAFF_FORM,
  payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS },
})
```

### 3.5 FileReader → `SetStateAction<string>`

```typescript
reader.onload = () => {
  setEditQrCode(typeof reader.result === 'string' ? reader.result : '')
}
```

### 3.6 Leaderboard / sort — tránh `Object.values` → `unknown`

```typescript
const map: Record<string, { name: string; amount: number; count: number }> = {}
// ...
const list = Object.values(map).sort((a, b) => b.amount - a.amount)
```

### 3.7 Date arithmetic

```typescript
// ❌ end - start (unknown)
const totalTime = end.getTime() - start.getTime()
```

### 3.8 Component props — default optional callbacks

```typescript
export default function Dashboard({
  setupData = null,
  onKybSuccess = () => {},
  onStartSetup = () => {},
  // ...
}) { }
```

Hook params optional:

```typescript
export function useStaffManagement({
  staffData,
  isStaffLoading,
  businessName,
  viewingStaffDetailId = null,
  setViewingStaffDetailId = (_id: string | null) => {},
}) { }
```

### 3.9 JSX attribute types

| Lỗi | Sửa |
|-----|-----|
| `rows="3"` | `rows={3}` |
| `colSpan="8"` | `colSpan={8}` |
| `allowFullScreen=""` | `allowFullScreen` |
| `type={dynamicString}` | Props: `React.ButtonHTMLAttributes<HTMLButtonElement>` |

### 3.10 `CountryCodeSelect` — `onChange` optional

```typescript
export default function CountryCodeSelect({
  value,
  onChange = (_code: string) => {},
  disabled = false,
}: {
  value: string
  onChange?: (code: string) => void
  disabled?: boolean
}) { }
```

### 3.11 `LanguageContext` — interpolation

```typescript
return Object.entries(variables).reduce((acc, [k, v]) => {
  return acc.replace(new RegExp(`{${k}}`, 'g'), String(v))
}, value)
// Fallback khi key không tìm thấy:
return String(value)
```

### 3.12 `ErrorBoundary` — class component typing

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode
  resetKey?: string
}
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetKey?: string
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState>
```

### 3.13 Payment method fallback object

Khi `find()` trả về union với object literal, thêm đủ field optional:

```typescript
const getMethod = (key) =>
  apiPaymentMethods.find(m => m.type?.toLowerCase() === key.toLowerCase()) ||
  { type: key, isActive: false, isConfigured: false, accountInfo: '', id: undefined, imageUrl: null, accountName: null }
```

### 3.14 Mock/stub hooks (API-only mode)

```typescript
export function useReplaceAllPendingAccounts() {
  return {
    mutate: (_list?: unknown) => {},
    mutateAsync: async (_list?: unknown) => {},
  }
}
```

### 3.15 `PersonalOnboardingInput` — đủ field theo interface

```typescript
await completePersonalOnboardingMutation.mutateAsync({
  accountData: { fullName, nickname, phone, position },
  paymentAccounts: {},  // required by interface
  payoutConfigs: payouts,
})
```

---

## Domain types mở rộng thường gặp

### `AuthSession`

Thêm field backend thực tế map vào session:

`hasStaffProfile`, `staffCode`, `accountStatus`, `hasCompletedOnboarding`, `accountType: string`

### `UserProfile`

```typescript
export interface UserProfile {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
  fullName?: string
  phoneNumber?: string
  profileImage?: { url?: string } | string
  userType?: string
  profileType?: string
  status?: string
  staffCode?: string
  [key: string]: unknown
}
```

### `StaffAccountView` (legacy blob + API shape)

```typescript
export interface StaffAccountView {
  profile: UserProfile
  paymentMethods: PaymentMethodDto[]
  staffCode?: string
  payoutMethods?: Record<string, { enabled?: boolean; value?: string; qrCode?: string; accountName?: string }>
  defaultDisplayName?: string
  phone?: string
  email?: string
  bio?: string
  avatar?: string
  // ...
}
```

### `NotificationRecord` — field legacy UI

```typescript
export interface NotificationRecord {
  id: string
  type: string
  title: string
  read: boolean
  message: string
  time: string
  staffId?: string
  linkTab?: string
  body?: string
  [key: string]: unknown
}
```

---

## Checklist verification

```bash
# 1. Zero TS errors
pnpm typecheck

# 2. Production bundle
pnpm build

# 3. Dev smoke
pnpm dev

# 4. (Optional) tests
pnpm test
```

**Gate từng phase:**

| Phase | Gate |
|-------|------|
| 1 | `pnpm build` pass |
| 2 | `src/data/**` 0 errors |
| 3 | toàn repo 0 errors |

---

## Lỗi phổ biến & cách sửa nhanh

| Code | Nguyên nhân | Cách sửa |
|------|-------------|----------|
| TS2339 on `{}` | Empty object inferred | `: LooseObject` |
| TS2339 `errorCode` on `Error` | Mutation catch typing | `getApiErrorCode(err)` |
| TS2339 on `unknown` | `httpClient.get()` không generic | `.get<UserProfile>(...)` |
| TS2322 spread unknown | `Object.values(map)` | `Record<string, T>` |
| TS2362/2363 arithmetic | Date/string math | `.getTime()` |
| TS2345 FileReader | `string \| ArrayBuffer` | `typeof reader.result === 'string' ? ...` |
| TS2353 object literal | useState thiếu field | Interface + default spread |
| TS2739 missing props | Component required props | Default `= () => {}` hoặc truyền prop |
| TS2322 `rows="3"` | HTML attr string | `rows={3}` |
| TS2769 reduce | `string \| number` in replace | `String(v)` |
| TS2551 property | Interface thiếu field | Mở rộng interface hoặc optional chaining + cast |

---

## Scripts hỗ trợ (tùy chọn tái tạo)

| Script | Mục đích |
|--------|----------|
| `scripts/migrate-to-ts.mjs` | Bulk rename `.js/.jsx` → `.ts/.tsx`, strip import extensions |
| `scripts/fix-ts-phase3.mjs` | Patch `const errors = {}` → `LooseObject` |
| `scripts/fix-api-error-code.mjs` | Replace `err?.errorCode` → `getApiErrorCode(err)` |

---

## Bước tiếp theo (không bắt buộc ngay)

1. Bật `"strictNullChecks": true` từng module (`src/data` trước)
2. Thay `LooseObject` bằng interface cụ thể theo user story
3. Bật `"noImplicitAny": true` sau khi form hooks đã typed
4. Thêm test type-safe với `vitest` + `@testing-library/react`

---

## Ghi chú cho team replicate

- **Không** để Vite build phụ thuộc `tsc` — tách `typecheck` riêng để migration không block deploy.
- **Không** refactor logic khi sửa type — chỉ thêm annotation, default, guard.
- Ưu tiên sửa **data boundary** trước UI — giảm lỗi lan truyền `unknown`.
- Giữ `[key: string]: unknown` trên domain types cho field API chưa chốt contract.
- Contract API: luôn đối chiếu Swagger live, không đoán field name.

---

## Tham chiếu repo gốc

- Stack: React 18, Vite 5, TanStack Query 5, Tailwind, JavaScript → TypeScript strict (partial)
- Types: `src/types/*.ts`
- Data layer: `src/data/repositories/`, `src/data/hooks/`
- Auth: `src/auth/adapters/apiAuthAdapter.ts`
- Kết quả cuối: **`pnpm typecheck` = 0 errors**, **`pnpm build` = pass**

*Tài liệu sinh từ quá trình migration vlink-nexora-fe — có thể copy nguyên workflow sang repo cùng kiến trúc.*
