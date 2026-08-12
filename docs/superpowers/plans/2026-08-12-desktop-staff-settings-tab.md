# Desktop Staff Settings Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move merchant Staff management into a desktop Settings tab and refresh the complete desktop Settings tab UI with the text-only News Library visual language while preserving mobile behavior.

**Architecture:** Add a small responsive route boundary that maps legacy Staff URLs to Settings URLs on desktop and maps Settings Staff URLs back to legacy URLs on mobile. Reuse one pair of Staff list/detail content components in both route families, derive Staff data loading from the full pathname, and filter Staff only from the desktop sidebar rather than from shared menu data. Isolate the News Library-style, text-only tablist and centered content shell in a focused `SettingsDesktopTabs` component so accessibility and keyboard behavior are testable without growing the already-large Settings view.

**Tech Stack:** React 18, TypeScript, React Router 6, TanStack Query 5, Vitest 2, Testing Library, Tailwind CSS.

## Global Constraints

- Remove the Staff entry from the desktop owner sidebar only.
- Add the desktop Staff tab immediately after Account.
- Keep `/dashboard/staff` and `/dashboard/staff/:staffId` working as mobile and compatibility routes.
- Use `/dashboard/settings/staff` and `/dashboard/settings/staff/:staffId` as canonical desktop routes.
- Preserve `staffId` and use history replacement for responsive compatibility redirects.
- Do not change Staff APIs, permissions, mutations, business rules, list UI, or detail UI.
- Do not change the mobile bottom navigation, mobile drawer, or mobile Staff UI.
- Restyle Account, Staff, KYB, Affiliate, and Privacy across desktop Settings only; keep mobile Settings unchanged.
- Settings tabs contain text only, use wrapping intrinsic widths, and do not render icons or equal-width grid columns.
- Match News Library semantics and visual tokens: centered `max-w-6xl`, rounded bordered tabs, brand active state, surface panel card, `tablist`/`tab`/`tabpanel`, roving `tabIndex`, and Left/Right keyboard activation.
- Preserve the user's pre-existing compact-profile-card edits in `MobileMenuDrawer.tsx` and `sidebarMenuStyles.js`; do not stage either file for this feature.
- Do not add dependencies.

## File Structure

### New files

- `src/components/dashboard/routes/staffRoutePaths.ts` — Staff route-family types, path builders, and path classification.
- `src/components/dashboard/routes/staffRoutePaths.test.ts` — pure route contract and data-scope tests.
- `src/components/dashboard/routes/ResponsiveStaffRoute.tsx` — responsive redirect/render boundary.
- `src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx` — desktop/mobile list/detail redirect tests.
- `src/components/dashboard/routes/StaffManagementRouteContent.tsx` — shared Staff list and detail outlet content.
- `src/components/dashboard/routes/StaffManagementRouteContent.test.tsx` — list-to-detail and invalid-detail route-family tests.
- `src/components/settings/SettingsDesktopTabs.tsx` — text-only News Library-style tablist and active panel shell.
- `src/components/settings/SettingsDesktopTabs.test.tsx` — tab styling, ARIA, keyboard, focus, and panel-shell tests.
- `src/components/SettingsView.desktop.test.tsx` — desktop Settings Staff tab behavior.
- `src/components/dashboard/layout/MobileBottomNav.test.tsx` — mobile Staff bottom-nav preservation test.
- `src/components/dashboard/layout/DashboardHeader.desktop.test.tsx` — Staff search detail navigation regression test.

### Modified files

- `src/app/AppRouter.tsx` — register the desktop Staff detail route.
- `src/components/dashboard/routes/index.tsx` — apply responsive route boundaries and inject shared Staff content into Settings.
- `src/components/Dashboard.tsx` — enable Staff data and refetch behavior for both route families.
- `src/components/dashboard/constants.tsx` — add the Staff Settings tab/path and a desktop-only sidebar collection.
- `src/components/dashboard/constants.test.ts` — verify Staff Settings path building and normalization.
- `src/components/dashboard/menuVisibility.test.ts` — verify desktop-only hiding while shared mobile data retains Staff.
- `src/components/dashboard/hooks/useDashboardNavigation.ts` — recognize `settings/staff` for active Settings state.
- `src/components/dashboard/layout/DashboardSidebar.tsx` — consume desktop-only menu items.
- `src/components/SettingsView.desktop.tsx` — configure all desktop Settings tabs, render Staff content, and use the shared tablist/panel shell.
- `src/components/settings/constants.ts` — add the desktop `Staff` tab key.
- `src/components/dashboard/layout/DashboardHeader.desktop.tsx` — avoid overwriting Staff detail navigation with a list navigation.

---

### Task 1: Responsive Staff Route Contract

**Files:**
- Create: `src/components/dashboard/routes/staffRoutePaths.ts`
- Create: `src/components/dashboard/routes/staffRoutePaths.test.ts`
- Create: `src/components/dashboard/routes/ResponsiveStaffRoute.tsx`
- Create: `src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx`

**Interfaces:**
- Produces: `type StaffRouteFamily = 'legacy' | 'settings'`.
- Produces: `buildStaffRoutePath(family: StaffRouteFamily, staffId?: string | null): string`.
- Produces: `ResponsiveStaffRoute({ family, staffId, children })`.
- Consumes: existing `useIsMobileUI()` and React Router `Navigate`.

- [ ] **Step 1: Write failing path-builder tests**

```ts
import { buildStaffRoutePath, STAFF_ROUTE_FAMILY } from './staffRoutePaths'

describe('merchant Staff route paths', () => {
  it('builds list and detail paths for both route families', () => {
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Legacy)).toBe('/dashboard/staff')
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Legacy, 'NEX-STAFF-1')).toBe(
      '/dashboard/staff/NEX-STAFF-1',
    )
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Settings)).toBe(
      '/dashboard/settings/staff',
    )
    expect(buildStaffRoutePath(STAFF_ROUTE_FAMILY.Settings, 'NEX STAFF/1')).toBe(
      '/dashboard/settings/staff/NEX%20STAFF%2F1',
    )
  })
})
```

- [ ] **Step 2: Run the path-builder test and verify RED**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts`

Expected: FAIL because `staffRoutePaths.ts` does not exist.

- [ ] **Step 3: Implement the route-family constants and builder**

```ts
export const STAFF_ROUTE_FAMILY = {
  Legacy: 'legacy',
  Settings: 'settings',
} as const

export type StaffRouteFamily =
  (typeof STAFF_ROUTE_FAMILY)[keyof typeof STAFF_ROUTE_FAMILY]

const STAFF_ROUTE_BASE: Record<StaffRouteFamily, string> = {
  [STAFF_ROUTE_FAMILY.Legacy]: '/dashboard/staff',
  [STAFF_ROUTE_FAMILY.Settings]: '/dashboard/settings/staff',
}

export function buildStaffRoutePath(
  family: StaffRouteFamily,
  staffId?: string | null,
): string {
  const base = STAFF_ROUTE_BASE[family]
  const id = String(staffId ?? '').trim()
  return id ? `${base}/${encodeURIComponent(id)}` : base
}
```

- [ ] **Step 4: Run the path-builder test and verify GREEN**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing responsive-boundary tests**

```tsx
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import ResponsiveStaffRoute from './ResponsiveStaffRoute'
import { buildStaffRoutePath, STAFF_ROUTE_FAMILY } from './staffRoutePaths'

vi.mock('../../../hooks/useIsMobileUI', () => ({
  useIsMobileUI: vi.fn(),
}))

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>
}

function renderBoundary({
  initialPath,
  family,
  staffId,
  children,
}: {
  initialPath: string
  family: 'legacy' | 'settings'
  staffId?: string
  children: ReactNode
}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ResponsiveStaffRoute family={family} staffId={staffId}>
        {children}
      </ResponsiveStaffRoute>
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('ResponsiveStaffRoute', () => {
  it('redirects a legacy detail URL to Settings on desktop', () => {
    vi.mocked(useIsMobileUI).mockReturnValue(false)
    renderBoundary({
      initialPath: '/dashboard/staff/NEX-1',
      family: STAFF_ROUTE_FAMILY.Legacy,
      staffId: 'NEX-1',
      children: <div>legacy content</div>,
    })
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/dashboard/settings/staff/NEX-1',
    )
    expect(screen.queryByText('legacy content')).not.toBeInTheDocument()
  })

  it('redirects a Settings detail URL to legacy Staff on mobile', () => {
    vi.mocked(useIsMobileUI).mockReturnValue(true)
    renderBoundary({
      initialPath: '/dashboard/settings/staff/NEX-1',
      family: STAFF_ROUTE_FAMILY.Settings,
      staffId: 'NEX-1',
      children: <div>settings content</div>,
    })
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/staff/NEX-1')
    expect(screen.queryByText('settings content')).not.toBeInTheDocument()
  })

  it.each([
    [false, STAFF_ROUTE_FAMILY.Settings, 'desktop settings content'],
    [true, STAFF_ROUTE_FAMILY.Legacy, 'mobile legacy content'],
  ] as const)('renders the matching route family', (isMobile, family, copy) => {
    vi.mocked(useIsMobileUI).mockReturnValue(isMobile)
    const initialPath = buildStaffRoutePath(family)
    renderBoundary({ initialPath, family, children: <div>{copy}</div> })
    expect(screen.getByText(copy)).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent(initialPath)
  })
})
```

- [ ] **Step 6: Run the boundary test and verify RED**

Run: `pnpm test src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx`

Expected: FAIL because `ResponsiveStaffRoute.tsx` does not exist.

- [ ] **Step 7: Implement the responsive route boundary**

```tsx
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import {
  buildStaffRoutePath,
  STAFF_ROUTE_FAMILY,
  type StaffRouteFamily,
} from './staffRoutePaths'

type ResponsiveStaffRouteProps = {
  family: StaffRouteFamily
  staffId?: string | null
  children: ReactNode
}

export default function ResponsiveStaffRoute({
  family,
  staffId,
  children,
}: ResponsiveStaffRouteProps) {
  const isMobile = useIsMobileUI()
  const targetFamily = isMobile
    ? STAFF_ROUTE_FAMILY.Legacy
    : STAFF_ROUTE_FAMILY.Settings

  if (family !== targetFamily) {
    return <Navigate to={buildStaffRoutePath(targetFamily, staffId)} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 8: Run both tests and verify GREEN**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit the route contract**

```bash
git add src/components/dashboard/routes/staffRoutePaths.ts src/components/dashboard/routes/staffRoutePaths.test.ts src/components/dashboard/routes/ResponsiveStaffRoute.tsx src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx
git commit -m "feat: add responsive staff route contract"
```

### Task 2: Shared Staff Content and Route Wiring

**Files:**
- Create: `src/components/dashboard/routes/StaffManagementRouteContent.tsx`
- Create: `src/components/dashboard/routes/StaffManagementRouteContent.test.tsx`
- Modify: `src/components/dashboard/routes/index.tsx:112-203,378-395`
- Modify: `src/app/AppRouter.tsx:288-289,332-333`

**Interfaces:**
- Consumes: `StaffRouteFamily` and `buildStaffRoutePath` from Task 1.
- Produces: `StaffListRouteContent({ routeFamily })`.
- Produces: `StaffDetailRouteContent({ routeFamily })`.
- Produces: responsive legacy `StaffRoute`/`StaffDetailRoute` and Settings-injected equivalents.

- [ ] **Step 1: Write failing shared-content tests**

Mock `StaffView` so the test asserts navigation behavior without mounting the large Staff UI:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import {
  StaffDetailRouteContent,
  StaffListRouteContent,
} from './StaffManagementRouteContent'
import { STAFF_ROUTE_FAMILY } from './staffRoutePaths'

vi.mock('../views/StaffView', () => ({
  default: ({ onViewDetail }: { onViewDetail: (member: LooseObject) => void }) => (
    <button type="button" onClick={() => onViewDetail({ staffCode: 'NEX-1' })}>
      Open Staff
    </button>
  ),
}))

vi.mock('../../../data/hooks/useMerchantStaff', () => ({
  useMerchantStaffByCode: vi.fn(),
}))

vi.mock('../../StaffDetailView', () => ({
  default: () => <div>Staff detail</div>,
}))

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>
}

const outletContext = {
  filteredStaff: [],
  pendingStaff: [],
  staff: [],
  staffLoading: false,
  staffListLoading: false,
  staffListFetching: false,
  activeStaffPage: 1,
  activeStaffPageSize: 10,
  activeStaffTotalPages: 1,
  activeStaffTotalCount: 0,
  activeStaffHasNext: false,
  activeStaffHasPrev: false,
  setActiveStaffPage: vi.fn(),
  setInviteShareDefaultName: vi.fn(),
  setInviteShareDefaultContact: vi.fn(),
  setIsInviteShareOpen: vi.fn(),
}

describe('StaffManagementRouteContent', () => {
  it('keeps desktop list-to-detail navigation inside Settings', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/settings/staff']}>
        <Routes>
          <Route element={<Outlet context={outletContext} />}>
            <Route
              path="/dashboard/settings/staff"
              element={<StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />}
            />
            <Route path="*" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open Staff' }))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/dashboard/settings/staff/NEX-1',
    )
  })

  it('returns an invalid desktop detail to the Settings Staff list', () => {
    vi.mocked(useMerchantStaffByCode).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useMerchantStaffByCode>)

    render(
      <MemoryRouter initialEntries={['/dashboard/settings/staff/missing']}>
        <Routes>
          <Route element={<Outlet context={outletContext} />}>
            <Route
              path="/dashboard/settings/staff/:staffId"
              element={<StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />}
            />
            <Route path="/dashboard/settings/staff" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/settings/staff')
  })
})
```

- [ ] **Step 2: Run the shared-content test and verify RED**

Run: `pnpm test src/components/dashboard/routes/StaffManagementRouteContent.test.tsx`

Expected: FAIL because `StaffManagementRouteContent.tsx` does not exist.

- [ ] **Step 3: Extract the existing Staff list and detail content**

Create `StaffManagementRouteContent.tsx` with the existing prop wiring and route-family-aware destinations:

```tsx
import { useMemo } from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import StaffDetailView from '../../StaffDetailView'
import StaffView from '../views/StaffView'
import { normaliseMember } from '../hooks/useStaffManagement'
import { SkeletonList } from '../../ui/skeleton'
import {
  buildStaffRoutePath,
  type StaffRouteFamily,
} from './staffRoutePaths'

export function StaffListRouteContent({
  routeFamily,
}: {
  routeFamily: StaffRouteFamily
}) {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()

  return (
    <StaffView
      staff={ctx.filteredStaff}
      pendingStaff={ctx.pendingStaff}
      allStaff={ctx.staff}
      isLoading={ctx.staffListLoading ?? ctx.staffLoading}
      isFetching={ctx.staffListFetching}
      onApproveClick={ctx.openApproveStaff}
      onAdd={ctx.openAddStaff}
      onViewStaff={ctx.openViewStaff}
      onDelete={ctx.deleteStaff}
      onQr={ctx.previewQr}
      onToggle={ctx.toggleStaff}
      onToggleTipsFlow={ctx.toggleStaffTipsFlow}
      onViewDetail={(member) =>
        navigate(buildStaffRoutePath(routeFamily, member.staffCode || member.id))
      }
      onResendInvite={ctx.handleResendInvite}
      businessName={ctx.businessName}
      businessSlug={ctx.businessSlug}
      inviteLinkSetting={ctx.inviteLinkSetting}
      isInviteLinkSettingLoading={ctx.isInviteLinkSettingLoading}
      onAcceptJoin={ctx.handleAcceptJoinRequest}
      onDeclineJoin={ctx.handleDeclineJoinRequest}
      onAcceptUnlink={ctx.handleAcceptUnlinkRequest}
      onDeclineUnlink={ctx.handleDeclineUnlinkRequest}
      onOpenInviteShare={() => {
        ctx.setInviteShareDefaultName('')
        ctx.setInviteShareDefaultContact('')
        ctx.setIsInviteShareOpen(true)
      }}
      pageNumber={ctx.activeStaffPage}
      pageSize={ctx.activeStaffPageSize}
      totalPages={ctx.activeStaffTotalPages}
      totalCount={ctx.activeStaffTotalCount}
      hasNextPage={ctx.activeStaffHasNext}
      hasPreviousPage={ctx.activeStaffHasPrev}
      onPageChange={ctx.setActiveStaffPage}
      togglingStaffId={ctx.togglingStaffId}
    />
  )
}

export function StaffDetailRouteContent({
  routeFamily,
}: {
  routeFamily: StaffRouteFamily
}) {
  const ctx = useOutletContext<LooseObject>()
  const { staffId: staffKey } = useParams()
  const { data: staffMember, isLoading, isError } = useMerchantStaffByCode(staffKey)
  const fallbackMember = useMemo(
    () => ctx.staff.find((member) =>
      String(member.id) === String(staffKey) ||
      String(member.staffProfileId) === String(staffKey) ||
      String(member.staffCode) === String(staffKey) ||
      String(member.linkId) === String(staffKey)),
    [ctx.staff, staffKey],
  )
  const resolvedMember = staffMember ?? fallbackMember

  if (isLoading || (!resolvedMember && ctx.staffLoading)) {
    return <div className="nexora-card p-6"><SkeletonList count={3} showAvatar lines={2} /></div>
  }

  if ((isError && !fallbackMember) || !resolvedMember) {
    return <Navigate to={buildStaffRoutePath(routeFamily)} replace />
  }

  return (
    <StaffDetailView
      staffMember={normaliseMember(resolvedMember)}
      staffProfileId={resolvedMember.staffProfileId ?? null}
      onBack={null}
      onViewStaff={ctx.openViewStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
  )
}
```

- [ ] **Step 4: Run the shared-content test and verify GREEN**

Run: `pnpm test src/components/dashboard/routes/StaffManagementRouteContent.test.tsx`

Expected: PASS.

- [ ] **Step 5: Wire responsive legacy routes and Settings Staff content**

In `routes/index.tsx`, replace the current Staff list/detail implementations with boundaries around shared content:

```tsx
export function StaffRoute() {
  return (
    <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Legacy}>
      <StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Legacy} />
    </ResponsiveStaffRoute>
  )
}

export function StaffDetailRoute() {
  const { staffId } = useParams()
  return (
    <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Legacy} staffId={staffId}>
      <StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Legacy} />
    </ResponsiveStaffRoute>
  )
}
```

Update `SettingsRoute` so only `tab=staff` receives Staff content and the responsive boundary:

```tsx
export function SettingsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { tab = 'profile', staffId } = useParams()
  const navigate = useNavigate()
  const isStaffTab = tab === DASHBOARD_SETTINGS_TAB.staff
  const settings = (
    <SettingsView
      onBlockedFeatureClick={ctx.requireKyb}
      setupData={ctx.setupData}
      hasKyb={ctx.hasKyb}
      verificationStatus={ctx.verificationStatus}
      userEmail={ctx.userEmail}
      onKybRequired={ctx.requireKyb}
      initialTab={tab}
      onTabChange={(nextTab) => navigate(buildDashboardSettingsPath(nextTab))}
      onKybSuccess={ctx.onKybSuccess}
      staffContent={isStaffTab
        ? staffId
          ? <StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
          : <StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
        : null}
    />
  )

  return isStaffTab ? (
    <ResponsiveStaffRoute
      family={STAFF_ROUTE_FAMILY.Settings}
      staffId={staffId}
    >
      {settings}
    </ResponsiveStaffRoute>
  ) : settings
}
```

In `AppRouter.tsx`, add the explicit detail route before or after the existing ranked Settings routes:

```tsx
<Route
  path={`${DASHBOARD_MENU_ID.settings}/${DASHBOARD_SETTINGS_TAB.staff}/:staffId`}
  element={<SettingsRoute />}
/>
```

- [ ] **Step 6: Run route-content tests and type checking**

Run: `pnpm test src/components/dashboard/routes/StaffManagementRouteContent.test.tsx src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx`

Expected: PASS.

Run: `pnpm typecheck`

Expected: exit code 0.

- [ ] **Step 7: Commit route wiring**

```bash
git add src/components/dashboard/routes/StaffManagementRouteContent.tsx src/components/dashboard/routes/StaffManagementRouteContent.test.tsx src/components/dashboard/routes/index.tsx src/app/AppRouter.tsx
git commit -m "feat: mount desktop staff under settings"
```

### Task 3: Staff Data Loading for Both Route Families

**Files:**
- Modify: `src/components/dashboard/routes/staffRoutePaths.ts`
- Modify: `src/components/dashboard/routes/staffRoutePaths.test.ts`
- Modify: `src/components/Dashboard.tsx:1-2,112-216,478-516`

**Interfaces:**
- Produces: `isStaffManagementPath(pathname: string): boolean`.
- Produces: `resolveMerchantDataMenu(pathname: string, activeMenu: string): string`.
- Consumes: the route contract from Task 1.

- [ ] **Step 1: Add failing path-classification and refetch-scope tests**

```ts
import {
  isStaffManagementPath,
  resolveMerchantDataMenu,
} from './staffRoutePaths'

it.each([
  '/dashboard/staff',
  '/dashboard/staff/NEX-1',
  '/dashboard/settings/staff',
  '/dashboard/settings/staff/NEX-1',
])('classifies %s as Staff management', (pathname) => {
  expect(isStaffManagementPath(pathname)).toBe(true)
  expect(resolveMerchantDataMenu(pathname, 'settings')).toBe('staff')
})

it.each([
  '/dashboard/settings/profile',
  '/dashboard/settings/affiliate',
  '/dashboard/pos/staff',
  '/staff/profile',
])('does not classify %s as merchant Staff management', (pathname) => {
  expect(isStaffManagementPath(pathname)).toBe(false)
})

it('keeps the active menu for unrelated routes', () => {
  expect(resolveMerchantDataMenu('/dashboard/settings/profile', 'settings')).toBe('settings')
})
```

- [ ] **Step 2: Run the path tests and verify RED**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts`

Expected: FAIL because the two functions are not exported.

- [ ] **Step 3: Implement strict pathname classification**

```ts
const LEGACY_STAFF_PATH = /^\/dashboard\/staff(?:\/[^/]+)?\/?$/
const SETTINGS_STAFF_PATH = /^\/dashboard\/settings\/staff(?:\/[^/]+)?\/?$/

export function isStaffManagementPath(pathname: string): boolean {
  return LEGACY_STAFF_PATH.test(pathname) || SETTINGS_STAFF_PATH.test(pathname)
}

export function resolveMerchantDataMenu(
  pathname: string,
  activeMenu: string,
): string {
  return isStaffManagementPath(pathname) ? 'staff' : activeMenu
}
```

- [ ] **Step 4: Run the path tests and verify GREEN**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts`

Expected: PASS.

- [ ] **Step 5: Use the route scope for all Staff query gates**

In `Dashboard.tsx`, activate the existing `useLocation` import and derive one source of truth:

```tsx
const location = useLocation()
const isStaffManagementScreen = isStaffManagementPath(location.pathname)
const merchantDataMenu = resolveMerchantDataMenu(location.pathname, activeMenu)
```

Replace the existing Staff-specific checks with:

```tsx
const needsMerchantStaffList =
  hasSearchQuery ||
  isAddTouchpointModalOpen ||
  isStaffManagementScreen ||
  ['overview', 'reviews', 'reports', 'tips', 'analytics', 'touchpoints'].includes(activeMenu)
const needsPendingStaffList = activeMenu === 'overview' || isStaffManagementScreen
const needsDashboardReviews =
  activeMenu === 'overview' ||
  activeMenu === 'reviews' ||
  hasSearchQuery ||
  isStaffManagementScreen
const needsInviteLink = isStaffManagementScreen
const isStaffTab = isStaffManagementScreen
useRefetchMerchantMenuQueries(merchantDataMenu)
```

Change the waiting list gate to:

```tsx
enabled: needsPendingStaffList && isStaffManagementScreen,
```

Keep the pending-list merge rule keyed to Overview; every non-Overview Staff route uses the combined pending and waiting lists.

- [ ] **Step 6: Run the route tests and type checking**

Run: `pnpm test src/components/dashboard/routes/staffRoutePaths.test.ts src/components/dashboard/routes/StaffManagementRouteContent.test.tsx`

Expected: PASS.

Run: `pnpm typecheck`

Expected: exit code 0.

- [ ] **Step 7: Commit data gating**

```bash
git add src/components/dashboard/routes/staffRoutePaths.ts src/components/dashboard/routes/staffRoutePaths.test.ts src/components/Dashboard.tsx
git commit -m "fix: load staff data inside settings"
```

### Task 4: Desktop Settings Navigation, News Library UI, and Sidebar Removal

**Files:**
- Modify: `src/components/settings/constants.ts`
- Create: `src/components/settings/SettingsDesktopTabs.tsx`
- Create: `src/components/settings/SettingsDesktopTabs.test.tsx`
- Modify: `src/components/dashboard/constants.tsx:485-508,551-553`
- Modify: `src/components/dashboard/constants.test.ts`
- Modify: `src/components/dashboard/menuVisibility.test.ts`
- Modify: `src/components/dashboard/hooks/useDashboardNavigation.ts:43-52`
- Modify: `src/components/dashboard/layout/DashboardSidebar.tsx:6-27,276-340`
- Modify: `src/components/SettingsView.desktop.tsx:150-274`
- Create: `src/components/SettingsView.desktop.test.tsx`
- Create: `src/components/dashboard/layout/MobileBottomNav.test.tsx`

**Interfaces:**
- Produces: `SettingsDesktopTab.Staff = 'staff'`.
- Produces: `DASHBOARD_SETTINGS_TAB.staff = 'staff'`.
- Produces: `DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS` without Staff.
- Produces: `DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID` so removing Staff does not remove the desktop Payments & Payouts group currently rendered after it.
- Produces: `SettingsDesktopTabs({ tabs, activeTab, onTabChange, ariaLabel, children })` with text-only News Library styling and accessible keyboard navigation.
- Consumes: `staffContent: ReactNode | null` from `SettingsRoute` in Task 2.

- [ ] **Step 1: Write failing constants and menu-visibility tests**

Add to `constants.test.ts`:

```ts
it('builds and normalizes the Staff Settings route', () => {
  expect(buildDashboardSettingsPath(DASHBOARD_SETTINGS_TAB.staff)).toBe(
    '/dashboard/settings/staff',
  )
  expect(normalizeDashboardSettingsTab('staff')).toBe('staff')
})
```

Replace `menuVisibility.test.ts` with assertions that distinguish desktop from shared mobile data:

```ts
import {
  DASHBOARD_MENU_ID,
  DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS,
  DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID,
  MERCHANT_SIDEBAR_MENU_ITEMS,
  MENU_ITEMS,
} from './constants'

describe('dashboard menu visibility', () => {
  it('keeps Tax IQ hidden from the merchant sidebar menu', () => {
    expect(MENU_ITEMS.some((item) => item.id === DASHBOARD_MENU_ID.taxiq)).toBe(true)
    expect(MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).not.toContain(
      DASHBOARD_MENU_ID.taxiq,
    )
  })

  it('hides Staff only from the desktop sidebar collection', () => {
    expect(DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).not.toContain(
      DASHBOARD_MENU_ID.staff,
    )
    expect(MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).toContain(
      DASHBOARD_MENU_ID.staff,
    )
  })

  it('anchors desktop Payments & Payouts after Dashboard instead of removed Staff', () => {
    expect(DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID).toBe(DASHBOARD_MENU_ID.overview)
    expect(DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS.map((item) => item.id)).toContain(
      DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID,
    )
  })
})
```

- [ ] **Step 2: Run constants tests and verify RED**

Run: `pnpm test src/components/dashboard/constants.test.ts src/components/dashboard/menuVisibility.test.ts`

Expected: FAIL because the Staff Settings key and desktop-only menu collection do not exist.

- [ ] **Step 3: Add Staff Settings constants and desktop-only menu data**

```ts
export const SettingsDesktopTab = {
  Account: 'account',
  Staff: 'staff',
  Kyb: 'kyb',
  Affiliate: 'affiliate',
  Notification: 'notification',
  Privacy: 'privacy',
} as const
```

```tsx
export const DASHBOARD_SETTINGS_TAB = {
  profile: 'profile',
  staff: 'staff',
  kyb: 'kyb',
  affiliate: 'affiliate',
} as const

export function buildDashboardSettingsPath(tab: string): string {
  const normalizedTab = normalizeDashboardSettingsTab(tab)
  return `${DASHBOARD_ROOT_PATH}/settings/${normalizedTab}`
}

export function normalizeDashboardSettingsTab(tab: string): string {
  if (
    tab === DASHBOARD_SETTINGS_TAB.staff ||
    tab === DASHBOARD_SETTINGS_TAB.kyb ||
    tab === DASHBOARD_SETTINGS_TAB.affiliate
  ) return tab
  return DASHBOARD_SETTINGS_TAB.profile
}

export const DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS =
  MERCHANT_SIDEBAR_MENU_ITEMS.filter(
    (item) => item.id !== DASHBOARD_MENU_ID.staff,
  )

export const DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID = DASHBOARD_MENU_ID.overview
```

- [ ] **Step 4: Run constants tests and verify GREEN**

Run: `pnpm test src/components/dashboard/constants.test.ts src/components/dashboard/menuVisibility.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing text-only tablist behavior tests**

```tsx
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import SettingsDesktopTabs, { type SettingsDesktopTabItem } from './SettingsDesktopTabs'

const tabs: SettingsDesktopTabItem[] = [
  { key: 'account', label: 'Account' },
  { key: 'staff', label: 'Staff' },
  { key: 'kyb', label: 'KYB' },
  { key: 'affiliate', label: 'Affiliate' },
  { key: 'privacy', label: 'Privacy' },
]

function Harness() {
  const [activeTab, setActiveTab] = useState('account')
  return (
    <SettingsDesktopTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      ariaLabel="Settings sections"
    >
      <div>{activeTab} content</div>
    </SettingsDesktopTabs>
  )
}

describe('SettingsDesktopTabs', () => {
  it('renders text-only News Library-style tabs and a centered panel shell', () => {
    render(<Harness />)
    const tablist = screen.getByRole('tablist', { name: 'Settings sections' })
    const renderedTabs = within(tablist).getAllByRole('tab')

    expect(renderedTabs.map((tab) => tab.textContent)).toEqual([
      'Account', 'Staff', 'KYB', 'Affiliate', 'Privacy',
    ])
    renderedTabs.forEach((tab) => expect(tab.querySelector('svg')).toBeNull())
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass('bg-nexoraBrand', 'text-white')
    expect(screen.getByRole('tab', { name: 'Staff' })).toHaveClass('bg-nexoraSurface')
    expect(tablist.parentElement).toHaveClass('mx-auto', 'max-w-6xl')
    expect(screen.getByRole('tabpanel')).toHaveClass(
      'rounded-lg', 'border-nexoraBorder', 'shadow-nexora-card',
    )
  })

  it('activates and focuses adjacent tabs with Left and Right arrows', () => {
    render(<Harness />)
    const accountTab = screen.getByRole('tab', { name: 'Account' })
    accountTab.focus()
    fireEvent.keyDown(accountTab, { key: 'ArrowRight' })

    const staffTab = screen.getByRole('tab', { name: 'Staff' })
    expect(staffTab).toHaveFocus()
    expect(staffTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('staff content')

    fireEvent.keyDown(staffTab, { key: 'ArrowLeft' })
    expect(accountTab).toHaveFocus()
    expect(accountTab).toHaveAttribute('aria-selected', 'true')
  })
})
```

- [ ] **Step 6: Run the tablist test and verify RED**

Run: `pnpm test src/components/settings/SettingsDesktopTabs.test.tsx`

Expected: FAIL because `SettingsDesktopTabs.tsx` does not exist.

- [ ] **Step 7: Implement the focused News Library-style tablist and panel shell**

```tsx
import type { KeyboardEvent, ReactNode } from 'react'

export type SettingsDesktopTabItem = {
  key: string
  label: string
}

type SettingsDesktopTabsProps = {
  tabs: readonly SettingsDesktopTabItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  ariaLabel: string
  children: ReactNode
}

export default function SettingsDesktopTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  children,
}: SettingsDesktopTabsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + tabs.length) % tabs.length
    const nextTab = tabs[nextIndex]
    onTabChange(nextTab.key)
    document.getElementById(`settings-tab-${nextTab.key}`)?.focus()
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((item, index) => {
          const isActive = item.key === activeTab
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`settings-tab-${item.key}`}
              aria-controls="settings-active-panel"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(item.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={[
                'inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-xs font-black leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2',
                isActive
                  ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                  : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:text-nexoraText',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <section
        id="settings-active-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab}`}
        tabIndex={0}
        className="overflow-hidden rounded-lg border border-nexoraBorder bg-nexoraSurface shadow-nexora-card"
      >
        <div className="p-4 sm:p-5">{children}</div>
      </section>
    </section>
  )
}
```

- [ ] **Step 8: Run the tablist test and verify GREEN**

Run: `pnpm test src/components/settings/SettingsDesktopTabs.test.tsx`

Expected: PASS.

- [ ] **Step 9: Write a failing Settings integration test**

Create `SettingsView.desktop.test.tsx`. Mock `useSettingsForm`, auth, and the large non-Staff panels, then verify order, route callback, and injected Staff content:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SettingsViewDesktop from './SettingsView.desktop'

vi.mock('../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('./settings/hooks/useSettingsForm', () => ({
  default: () => ({
    effectiveVerificationStatus: 'kyb_approved',
    profile: {},
    showToast: vi.fn(),
    handleCopy: vi.fn(),
    copiedId: null,
  }),
}))

vi.mock('../auth/useAuth', () => ({
  default: () => ({ session: { accountType: 'business' } }),
}))

vi.mock('./settings/tabs/ProfileTab', () => ({ default: () => <div>Account content</div> }))
vi.mock('./settings/tabs/KybTab', () => ({ default: () => <div>KYB content</div> }))

describe('SettingsViewDesktop navigation', () => {
  it('renders all text-only tabs in order and activates injected Staff content', () => {
    const onTabChange = vi.fn()
    render(
      <MemoryRouter>
        <SettingsViewDesktop
          initialTab="profile"
          onTabChange={onTabChange}
          staffContent={<div>Staff management content</div>}
        />
      </MemoryRouter>,
    )

    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'components.SettingsView.account',
      'dashboard.menu.staff',
      'components.SettingsView.kyb',
      'components.SettingsView.affiliateLink',
      'staff_dashboard.profile.menu_privacy_security',
    ])
    tabs.forEach((tab) => expect(tab.querySelector('svg')).toBeNull())

    fireEvent.click(screen.getByRole('tab', { name: 'dashboard.menu.staff' }))
    expect(onTabChange).toHaveBeenCalledWith('staff')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Staff management content')
    expect(screen.getByRole('tab', { name: 'dashboard.menu.staff' })).toHaveAttribute(
      'aria-selected', 'true',
    )
  })
})
```

- [ ] **Step 10: Run the Settings integration test and verify RED**

Run: `pnpm test src/components/SettingsView.desktop.test.tsx`

Expected: FAIL because the Staff tab, shared tablist, and `staffContent` rendering do not exist.

- [ ] **Step 11: Integrate Staff and the shared tab UI into desktop Settings**

Update the `SettingsViewDesktop` signature and resolver:

```tsx
export default function SettingsViewDesktop({
  setupData,
  hasKyb = true,
  userEmail,
  onKybRequired,
  initialTab = 'profile',
  onTabChange,
  onKybSuccess,
  staffContent = null,
  verificationStatus = hasKyb ? 'kyb_approved' : 'basic',
}) {
```

```tsx
const resolveDesktopTab = (nextTab) => {
  if (nextTab === SettingsDesktopTab.Staff) return SettingsDesktopTab.Staff
  if (nextTab === SettingsDesktopTab.Affiliate) return SettingsDesktopTab.Affiliate
  if (nextTab === SettingsDesktopTab.Kyb) return SettingsDesktopTab.Kyb
  if (nextTab === SettingsDesktopTab.Notification) return SettingsDesktopTab.Notification
  if (nextTab === SettingsDesktopTab.Privacy) return SettingsDesktopTab.Privacy
  return SettingsDesktopTab.Account
}
```

Define the complete ordered tab list without icon properties:

```tsx
const tabs = [
  { key: SettingsDesktopTab.Account, label: t('components.SettingsView.account') },
  { key: SettingsDesktopTab.Staff, label: t('dashboard.menu.staff') },
  { key: SettingsDesktopTab.Kyb, label: isBusinessAccount
    ? t('components.SettingsView.kyb')
    : t('staff_dashboard.profile.kyc_label') },
  { key: SettingsDesktopTab.Affiliate, label: t('components.SettingsView.affiliateLink') },
  ...(SETTINGS_SHOW_NOTIFICATION_TAB
    ? [{ key: SettingsDesktopTab.Notification, label: t('staff_dashboard.profile.menu_notification_preferences') }]
    : []),
  { key: SettingsDesktopTab.Privacy, label: t('staff_dashboard.profile.menu_privacy_security') },
]

const activateTab = (nextTab: string) => {
  setTab(nextTab)
  onTabChange?.(
    nextTab === SettingsDesktopTab.Account
      ? 'profile'
      : nextTab,
  )
}
```

Align the header with the News Library width, remove the old inline tab buttons, and wrap the current content block in `SettingsDesktopTabs`:

```tsx
<div className="w-full space-y-5 px-1 py-2 animate-fadeIn select-none">
  <header className="mx-auto max-w-6xl border-b border-nexoraRule pb-4">
    <h1 className="text-2xl font-black leading-tight text-nexoraText">
      {t('components.SettingsView.settingsConfiguration')}
    </h1>
    <p className="mt-2 text-sm font-medium leading-relaxed text-nexoraMuted">
      {t('components.SettingsView.manageYourOwnerCredentials')}
    </p>
  </header>
```

Immediately after the header, open the shared wrapper with this exact block:

```tsx
<SettingsDesktopTabs
  tabs={tabs}
  activeTab={tab}
  onTabChange={activateTab}
  ariaLabel={t('components.SettingsView.settingsConfiguration')}
>
  {tab === SettingsDesktopTab.Staff && staffContent}
```

Place the current conditional content region—starting at the existing `{tab === 'account' && (` expression and ending after the existing Privacy conditional—directly after the new Staff conditional without changing its internal nodes, callbacks, or `ProfileTab`/`KybTab` props. Close `</SettingsDesktopTabs>` immediately after that region, then close the outer page `<div>`. Delete only the old tab-button container and the old content-area wrapper that the shared component replaces.

Change `DashboardSidebar.tsx` to import and use `DESKTOP_MERCHANT_SIDEBAR_MENU_ITEMS`. The Payments & Payouts section is currently emitted after the Staff item, so change only the desktop anchor condition to keep that section visible after Dashboard:

```tsx
{userRole !== 'staff' && id === DESKTOP_PAYMENTS_PAYOUTS_ANCHOR_ID && (
  <PaymentsPayoutsMenuSection
    activeMenu={activeMenu}
    tabParam={activeSubTab}
    isExpanded={isPaymentsPayoutsExpanded}
    onToggle={handlePaymentsPayoutsToggle}
    onNavigate={handlePaymentsPayoutsNavigate}
  />
)}
```

Do not modify `MobileMenuDrawer.tsx`, `MobileBottomNav.tsx`, `SettingsView.mobile.tsx`, `MENU_ITEMS`, or `MERCHANT_SIDEBAR_MENU_ITEMS`.

Change the Settings path-sync effect in `useDashboardNavigation.ts` to accept the normalized Staff tab:

```tsx
useEffect(() => {
  if (activeMenu !== DASHBOARD_MENU_ID.settings) return
  const tabFromPath = location.pathname.split('/')[3]
  setSettingsTab(normalizeDashboardSettingsTab(tabFromPath || 'profile'))
}, [activeMenu, location.pathname])
```

- [ ] **Step 12: Add a mobile bottom-nav preservation test**

```tsx
import { render, screen } from '@testing-library/react'
import MobileBottomNav from './MobileBottomNav'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

it('keeps Staff in the mobile bottom navigation', () => {
  render(<MobileBottomNav activeMenu="overview" onNavigate={vi.fn()} />)
  expect(
    screen.getByRole('button', { name: 'dashboard.owner_home.nav_staff' }),
  ).toBeInTheDocument()
})
```

- [ ] **Step 13: Run Settings, tablist, menu, and mobile-preservation tests**

Run: `pnpm test src/components/settings/SettingsDesktopTabs.test.tsx src/components/SettingsView.desktop.test.tsx src/components/dashboard/constants.test.ts src/components/dashboard/menuVisibility.test.ts src/components/dashboard/layout/MobileBottomNav.test.tsx`

Expected: PASS with no accessibility warnings, unhandled errors, or unexpected console output.

- [ ] **Step 14: Commit desktop navigation and Settings UI**

```bash
git add src/components/settings/constants.ts src/components/settings/SettingsDesktopTabs.tsx src/components/settings/SettingsDesktopTabs.test.tsx src/components/dashboard/constants.tsx src/components/dashboard/constants.test.ts src/components/dashboard/menuVisibility.test.ts src/components/dashboard/hooks/useDashboardNavigation.ts src/components/dashboard/layout/DashboardSidebar.tsx src/components/SettingsView.desktop.tsx src/components/SettingsView.desktop.test.tsx src/components/dashboard/layout/MobileBottomNav.test.tsx
git commit -m "feat: refresh desktop settings navigation"
```

### Task 5: Preserve Staff Detail Navigation and Verify the Feature

**Files:**
- Modify: `src/components/dashboard/layout/DashboardHeader.desktop.tsx:238-253`
- Create: `src/components/dashboard/layout/DashboardHeader.desktop.test.tsx`

**Interfaces:**
- Consumes: existing `onViewStaffDetail(staffId)` callback.
- Preserves: mobile header, bottom nav, and drawer implementations unchanged.

- [ ] **Step 1: Write a failing desktop Staff-search test**

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardHeaderDesktop from './DashboardHeader.desktop'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    currentLanguage: 'en',
    t: (key: string) => key,
  }),
}))

vi.mock('../../ui/LanguageSwitcher', () => ({ default: () => null }))
vi.mock('./HeaderEcosystem', () => ({ default: () => null }))

it('opens one Staff detail destination without navigating back to the Staff list', () => {
  const onViewStaffDetail = vi.fn()
  const onNavigateMenu = vi.fn()
  render(
    <MemoryRouter>
      <DashboardHeaderDesktop
        searchQuery="alex"
        setSearchQuery={vi.fn()}
        profile={{}}
        businessName="Nail Salon"
        notifications={[]}
        setNotifications={vi.fn()}
        onMarkAllNotificationsRead={vi.fn()}
        isNotiDropdownOpen={false}
        setIsNotiDropdownOpen={vi.fn()}
        onNavigateMenu={onNavigateMenu}
        staff={[{ id: 'staff-1', fullName: 'Alex Lee', position: 'Nail Artist' }]}
        transactions={[]}
        reviews={[]}
        touchpoints={[]}
        onViewStaffDetail={onViewStaffDetail}
        onApproveStaff={vi.fn()}
        onNavigateSettingsTab={vi.fn()}
        onLogout={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onToggleSidebar={vi.fn()}
      />
    </MemoryRouter>,
  )

  fireEvent.focus(screen.getByPlaceholderText('dashboard.header.search_placeholder'))
  fireEvent.click(screen.getByText('Alex Lee').closest('button') as HTMLButtonElement)

  expect(onViewStaffDetail).toHaveBeenCalledWith('staff-1')
  expect(onNavigateMenu).not.toHaveBeenCalledWith('staff')
})
```

- [ ] **Step 2: Run the header test and verify RED**

Run: `pnpm test src/components/dashboard/layout/DashboardHeader.desktop.test.tsx`

Expected: FAIL because the current handler calls both `onViewStaffDetail` and `onNavigateMenu('staff')`.

- [ ] **Step 3: Remove the second desktop navigation**

Use one final destination in the Staff result handler:

```tsx
onClick={() => {
  onViewStaffDetail(member.id)
  setIsSearchFocused(false)
  setSearchQuery('')
}}
```

Do not modify `DashboardHeader.mobile.tsx` in this desktop-only phase.

- [ ] **Step 4: Run the header test and verify GREEN**

Run: `pnpm test src/components/dashboard/layout/DashboardHeader.desktop.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run all focused feature tests**

Run:

```bash
pnpm test \
  src/components/dashboard/routes/staffRoutePaths.test.ts \
  src/components/dashboard/routes/ResponsiveStaffRoute.test.tsx \
  src/components/dashboard/routes/StaffManagementRouteContent.test.tsx \
  src/components/dashboard/constants.test.ts \
  src/components/dashboard/menuVisibility.test.ts \
  src/components/settings/SettingsDesktopTabs.test.tsx \
  src/components/SettingsView.desktop.test.tsx \
  src/components/dashboard/layout/MobileBottomNav.test.tsx \
  src/components/dashboard/layout/DashboardHeader.desktop.test.tsx
```

Expected: all focused tests PASS with no warnings or unhandled errors.

- [ ] **Step 6: Run repository verification**

Run: `pnpm typecheck`

Expected: exit code 0.

Run: `pnpm test:impact`

Expected: the script lists impacted tests or reports no additional targeted tests without error.

Run: `pnpm test`

Expected: the full Vitest suite passes.

Run: `pnpm run build:dev`

Expected: Vite build completes successfully.

- [ ] **Step 7: Confirm the diff respects the desktop-only boundary**

Run:

```bash
git diff --check
git diff -- src/components/dashboard/layout/MobileBottomNav.tsx src/components/dashboard/layout/DashboardHeader.mobile.tsx src/components/dashboard/views/StaffView.mobile.tsx src/components/SettingsView.mobile.tsx
git diff -- src/components/dashboard/layout/MobileMenuDrawer.tsx
```

Expected: `git diff --check` produces no output. The first mobile-file diff is empty. `MobileMenuDrawer.tsx` may still show the pre-existing compact-profile-card changes owned by the user; this task adds no new hunks to that file and never stages it.

- [ ] **Step 8: Commit the navigation fix and verification tests**

```bash
git add src/components/dashboard/layout/DashboardHeader.desktop.tsx src/components/dashboard/layout/DashboardHeader.desktop.test.tsx
git commit -m "fix: preserve desktop staff detail navigation"
```
