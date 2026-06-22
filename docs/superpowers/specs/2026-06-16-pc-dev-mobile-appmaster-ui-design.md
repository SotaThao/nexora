# Design: PC dùng UI nhánh `dev`, Mobile dùng UI nhánh `app-master`

- **Ngày:** 2026-06-16
- **Nhánh:** `enhance/ui-mobile-web-app` (đã merge `app-master`)
- **Trạng thái:** Draft — chờ duyệt

## 1. Mục tiêu & Bối cảnh

Sau khi merge `app-master` vào nhánh hiện tại, yêu cầu sản phẩm là:

- **PC / desktop** (web, viewport ≥ 1024px): hiển thị **UI của nhánh `dev`** (giữ nguyên giao diện desktop cũ).
- **Mobile**: hiển thị **UI của nhánh `app-master`**. "Mobile" = **app native (Capacitor iOS/Android)** *hoặc* **trình duyệt web màn hình nhỏ** (viewport < 1024px).
- Áp dụng cho **cả 2 dashboard**: business/merchant (`Dashboard.tsx`) và personal/staff (`StaffDashboard.tsx`).

Quyết định kiến trúc đã chốt với người dùng:
- Switch ở **runtime** (không tách build).
- Trigger: `Capacitor.isNativePlatform()` **HOẶC** viewport `< 1024px` (khớp breakpoint `lg` của Tailwind đang dùng).
- **Hướng A**: tách 2 cây UI và switch — nhưng tinh chỉnh để **logic/data giữ một nguồn duy nhất**, chỉ fork phần *trình bày*.

## 2. Phát hiện quan trọng từ khảo sát

`app-master` **không thuần là "UI mobile"**. Diff `dev` ↔ `app-master` gồm 3 nhóm thay đổi khác nhau, phải xử lý khác nhau:

| Nhóm | Ví dụ | Cách xử lý |
|------|-------|-----------|
| **(1) Redesign UI mobile** — sửa cả layout desktop | `DashboardHeader`, `Overview`, `StaffView`, `MobileBottomNav`, `StaffHeader`, `StaffBottomNav` | **FORK** desktop (dev) / mobile (app-master) |
| **(2) Tích hợp native** — abstraction chạy cả web lẫn native | `ImageFileInput`, `native/imagePicker.ts`, `PayoutSetupModal`, `StaffModal` (dùng Capacitor Camera, có fallback `handleWebChange` web) | **DÙNG CHUNG** (bản app-master), không fork |
| **(3) Logic tích hợp API** — đã có trong nhánh hiện tại | `useStaffManagement` (`linkId` mapping), `routes/index.tsx` (pagination props), contexts, data hooks | **DÙNG CHUNG** (bản hiện tại) |
| **(4) Regression** — cần khôi phục bản dev | `InviteShareModal` (thay i18n bằng tiếng Anh hardcode), mojibake `ΓÇö`/BOM trong comment | **REVERT về bản `dev`** (i18n) / dọn mojibake, dùng chung |

Hệ quả: desktop (dev) và mobile (app-master) **chia sẻ chung toàn bộ logic, data, native** — chỉ khác **component trình bày**.

## 3. Kiến trúc

### 3.1. Hook phát hiện — `src/hooks/useIsMobileUI.ts` (MỚI)

```ts
// Trả về true khi nên render UI app-master (mobile).
// Native app luôn = mobile; web theo viewport < 1024px.
export function useIsMobileUI(): boolean
```

Hành vi:
- Khởi tạo: `Capacitor.isNativePlatform() || window.matchMedia('(max-width: 1023px)').matches`.
- Đăng ký listener `matchMedia(...).change` (và cleanup) để chuyển realtime khi resize trên web.
- Native: bỏ qua viewport, luôn trả `true`.
- SSR-safe: không có ở repo này (Vite SPA) nên không cần guard window, nhưng vẫn `typeof window` defensively.

Phụ thuộc: `@capacitor/core` (đã cài).

### 3.2. Điểm fork — "switcher" mỏng tại từng component trình bày

Mỗi component thuộc Nhóm (1) trở thành 1 switcher, **giữ nguyên đường dẫn và tên export cũ** để không phải sửa nơi gọi (routes, layout):

```tsx
// src/components/dashboard/overview/Overview.tsx  (switcher — thay nội dung cũ)
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import OverviewDesktop from './Overview.desktop'
import OverviewMobile from './Overview.mobile'

export default function Overview(props) {
  return useIsMobileUI() ? <OverviewMobile {...props} /> : <OverviewDesktop {...props} />
}
```

- `*.mobile.tsx` = nội dung **app-master hiện tại** (đổi tên file hiện hành).
- `*.desktop.tsx` = nội dung lấy từ nhánh **`dev`** (`git show dev:<path>`).
- Cả hai nhận **cùng props** từ routes/layout. Bản desktop (dev) **bỏ qua props mobile thừa** (pagination, `onNavigateMenu`…) — vô hại, vì props không dùng sẽ bị React lờ đi.
- TypeScript: switcher nhận `props: any` (hoặc type chung lỏng) để khớp cả 2 — nhất quán với pattern `LooseObject` đang dùng trong repo.

> Vì sao fork ở lá chứ không ở gốc dashboard: phần root (`Dashboard.tsx`/`StaffDashboard.tsx`) chứa nhiều wiring dùng chung (context provider, data fetching, state, sidebar không đổi). Fork ở lá giữ **một nguồn sự thật** cho logic và **giảm tối đa trùng lặp** — chỉ nhân đôi đúng phần hiển thị khác nhau.

### 3.3. Component-only mobile (không có bản desktop)

`MobileBottomNav`, `StaffBottomNav` chỉ render khi mobile. Chúng đã được layout/root gọi sau guard responsive (`lg:hidden`). Giữ nguyên — không cần switcher, nhưng đảm bảo guard hiển thị dùng cùng tiêu chí `useIsMobileUI()` để nhất quán với native.

## 4. Phân loại file chi tiết

### Business dashboard

| File | Phân loại | Hành động |
|------|-----------|-----------|
| `components/Dashboard.tsx` | Root wiring + chọn header/nav | Giữ chung; nội bộ gọi switcher header + guard bottom-nav theo `useIsMobileUI()` |
| `dashboard/layout/DashboardHeader.tsx` | (1) redesign | **FORK** → `.desktop` (dev) / `.mobile` (app-master) |
| `dashboard/layout/DashboardSidebar.tsx` | Không đổi dev↔app-master | Giữ chung (desktop dùng) |
| `dashboard/layout/MobileBottomNav.tsx` | (1) mobile-only | Giữ (mobile-only), guard bằng `useIsMobileUI()` |
| `dashboard/layout/MobileMenuDrawer.tsx` | Không trong diff | Giữ chung (mobile) |
| `dashboard/overview/Overview.tsx` | (1) redesign | **FORK** |
| `dashboard/views/StaffView.tsx` | (1) redesign | **FORK** |
| `dashboard/views/ComingSoon.tsx` | (1) | **FORK** (diff nhỏ — xác nhận desktop khác trước khi fork; nếu chỉ thêm class responsive thì giữ chung) |
| `dashboard/routes/index.tsx` | (3) wiring + pagination | Giữ chung (truyền superset props) |
| `dashboard/hooks/useStaffManagement.ts` | (3) logic + (4) mojibake | Giữ chung, **dọn mojibake** |
| `dashboard/modals/InviteShareModal.tsx` | (4) regression i18n | **REVERT về `dev`** (i18n), dùng chung |
| `dashboard/modals/PayoutSetupModal.tsx` | (2) native | Giữ chung (app-master) |
| `dashboard/modals/StaffModal.tsx` | (2) native | Giữ chung (app-master) |

### Personal/staff dashboard

| File | Phân loại | Hành động |
|------|-----------|-----------|
| `staff-dashboard/StaffDashboard.tsx` | Root wiring | Giữ chung; gọi switcher header + guard bottom-nav |
| `staff-dashboard/layout/StaffHeader.tsx` | (1) redesign | **FORK** |
| `staff-dashboard/layout/StaffBottomNav.tsx` | (1) mobile-only | Giữ (mobile-only), guard `useIsMobileUI()` |
| `staff-dashboard/layout/StaffSidebar.tsx` | Không đổi | Giữ chung (desktop) |
| `staff-dashboard/views/StaffMyQR.tsx` | Thêm type alias | Giữ chung |
| `staff-dashboard/constants.tsx` | Thêm `STAFF_BOTTOM_NAV_ITEMS` | Giữ chung |

## 5. Dọn dẹp regression (Nhóm 4)

- Khôi phục `InviteShareModal.tsx` về bản `dev` (dùng i18n keys), đảm bảo các key `components.dashboard.modals.InviteShareModal.*` còn trong `vi.json`/`en.json`.
- Sửa mojibake trong comment các file đã merge: `ΓÇö` → `—`, gỡ BOM thừa (`useStaffManagement.ts` và các file khác nếu grep ra). Chỉ sửa comment/chuỗi, không đổi logic.
- Quét rộng: `grep -rn "ΓÇö\|ΓÇÖ\|Γ\|ï»¿" src/` để bắt mojibake do merge mang vào; xử lý các chỗ ngoài danh sách trên nếu có.

## 6. Verify (Definition of Done)

- `pnpm build` xanh, không lỗi TypeScript.
- `pnpm lint:tokens` xanh (không hardcode token).
- Chạy `pnpm dev`, dùng preview tools:
  - **Business desktop** (viewport ≥ 1024px): dashboard khớp UI `dev` (header/overview/staff).
  - **Business mobile** (viewport < 1024px): khớp UI `app-master` (bottom nav, header mobile).
  - **Personal desktop / mobile**: tương tự với staff dashboard.
  - Resize qua lại 1023↔1024px → UI chuyển đúng, không lỗi console.
- Test 3 lớp (skill `feature-focused-tester`) cho `useIsMobileUI` + các switcher: Layer 1 render theo platform giả lập, Layer 2 không đụng (thuần UI), Layer 3 smoke flow dashboard.
- Không còn `ΓÇö`/mojibake; không có `console.*` mới.

## 7. Phạm vi loại trừ (YAGNI)

- **Không** tách build web vs native (đã chọn runtime).
- **Không** refactor sidebar/menu drawer (không đổi giữa 2 nhánh).
- **Không** dọn toàn bộ backlog i18n (~211 chuỗi) — chỉ revert regression do app-master gây ra trong phạm vi merge này.
- **Không** đổi data layer/repositories/queryKeys.

## 8. Rủi ro & Giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Drift logic giữa desktop/mobile do nhân đôi | Chỉ fork component trình bày; logic/data ở lá dùng props từ nguồn chung |
| Bản dev desktop nhận props mobile thừa gây warning | Props không dùng được React lờ; switcher truyền `{...props}` đồng nhất |
| `ComingSoon`/diff nhỏ fork thừa | Xác nhận desktop thực sự khác trước khi fork; nếu không, giữ chung |
| Bundle to hơn do ship cả 2 cây | Cả 2 dashboard đã `lazy()`; cân nhắc lazy-import nhánh không active nếu cần |
| Mojibake sót | Grep toàn `src/` trước khi đóng |
