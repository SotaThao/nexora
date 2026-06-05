# NEXORA TOUCH — Production-Ready React Refactor Plan (for Subagents)

> **Branch gốc:** `main` (mọi task tách branch riêng từ `main`).
> **Stack:** Vite + React 18, **JSX thuần (không TypeScript)**, **relative imports** (KHÔNG có alias `@/`), TailwindCSS, state bằng `useState`/Context + `src/utils/storage.js`.
> **Lệnh verify bắt buộc sau mỗi task:** `npx vite build` (phải PASS) **và** `npx vitest run` (không được giảm số test pass so với trước task).
> **Khuôn mẫu tham chiếu (ĐÃ LÀM, chuẩn):** thư mục `src/components/dashboard/` — `data/ · constants.jsx · utils.jsx · layout/ · ui/ · overview/ · views/ · modals/ · hooks/`. Mọi task tách component PHẢI bắt chước cấu trúc này.

---

## 0. QUY TẮC CHUNG CHO MỌI SUBAGENT (đọc trước khi làm)

1. **Tách = di chuyển VERBATIM.** Khi đưa 1 component/handler ra file mới: copy nguyên văn body (JSX, logic, chuỗi tiếng Việt, khoảng trắng) — KHÔNG đổi tên, KHÔNG "cải tiến", KHÔNG reformat. Chỉ thêm `import` cần thiết + `export default`.
2. **Chỉ thêm import thực sự dùng.** Sau khi tách, xóa import đã thừa ở file gốc (verify bằng build — import thừa không vỡ build nhưng phải dọn).
3. **Không đụng logic đồng bộ localStorage/sync effects** trừ khi task ghi rõ. Các effect sync (vd trong `Dashboard.jsx`) đã từng gây bug flicker — giữ nguyên.
4. **Component < 500 dòng.** Nếu sau tách vẫn >500, tách tiếp sub-section.
5. **Mỗi task = 1 branch = 1 PR.** Branch đặt theo `refactor/<task-id>_<mô-tả>`. Subject commit = tên branch (theo commit rule của repo). PR base = `test` (theo Rule 3.5), trừ khi điều phối viên chỉ định khác.
6. **Build + test sau mỗi bước nhỏ**, không gộp nhiều component rồi mới build.
7. **Đường dẫn import theo độ sâu thư mục:**
   - File ở `src/components/<feat>/views|modals|...` → atoms: `../../ui/X`; contexts: `../../../contexts/X`; utils repo: `../../../utils/X`.
   - Tham chiếu khuôn mẫu trong `src/components/dashboard/**` để copy đúng kiểu path.
8. **Không tạo dead code.** Nếu phát hiện component/biến không được dùng ở đâu → báo lại điều phối viên, không tự xóa ngoài scope.

---

## PHASE 0 — Production Hardening (P0, ưu tiên cao nhất, rủi ro thấp)

### TASK P0-1 — Drop console + tối ưu build trong `vite.config.js`
- **Agent:** frontend-developer
- **File:** `vite.config.js`
- **Mục tiêu:** Loại `console`/`debugger` khỏi bundle production + chia vendor chunk.
- **Steps:**
  1. Thêm vào `defineConfig`:
     ```js
     esbuild: { drop: ['console', 'debugger'] },
     build: {
       chunkSizeWarningLimit: 900,
       rollupOptions: {
         output: {
           manualChunks: {
             react: ['react', 'react-dom'],
             icons: ['lucide-react']
           }
         }
       }
     }
     ```
  2. Giữ nguyên `plugins`, `envPrefix`, `server`.
- **Acceptance:** `npx vite build` PASS; trong `dist/assets` có chunk `react`/`icons` tách riêng; bundle chính nhỏ hơn trước.
- **Verify:** build + `npx vitest run` (vitest dùng cấu hình riêng, không ảnh hưởng — vẫn phải PASS).
- **Risk:** Thấp. Lưu ý: `drop console` chỉ ở build prod; dev vẫn log.
- **Deps:** none.

### TASK P0-2 — Thêm `ErrorBoundary` top-level
- **Agent:** frontend-developer
- **File mới:** `src/components/ui/ErrorBoundary.jsx`
- **Mục tiêu:** Lỗi render không sập trắng toàn app.
- **Steps:**
  1. Tạo class component `ErrorBoundary` (`getDerivedStateFromError` + `componentDidCatch` log qua logger/console.error chỉ dev). Fallback UI: card xin lỗi + nút "Tải lại" (`window.location.reload()`), dùng class Tailwind sẵn có (`nexora-card`...), i18n nếu tiện (`useTranslation` không dùng được trong class → text song ngữ tĩnh hoặc wrap functional).
  2. Bọc nội dung gốc trong `src/main.jsx` (hoặc `App` export) bằng `<ErrorBoundary>`.
- **Acceptance:** Ném lỗi giả trong 1 component con → thấy fallback, không trắng trang. Build + test PASS.
- **Risk:** Thấp.
- **Deps:** none.

### TASK P0-3 — Lazy-load các view nặng + `<Suspense>`
- **Agent:** frontend-developer
- **File:** `src/App.jsx` (chỉ phần import + render; KHÔNG tái cấu trúc state ở task này)
- **Mục tiêu:** Tách bundle theo view, giảm initial JS.
- **Steps:**
  1. Đổi import tĩnh sang lazy cho các view nặng:
     ```js
     const SetupWizard = React.lazy(() => import('./components/SetupWizard'))
     const Dashboard = React.lazy(() => import('./components/Dashboard'))
     const CustomerFlow = React.lazy(() => import('./components/CustomerFlow'))
     const RegisterWizard = React.lazy(() => import('./components/RegisterWizard'))
     const StaffRegistrationWizard = React.lazy(() => import('./components/StaffRegistrationWizard'))
     const StaffDashboard = React.lazy(() => import('./components/staff-dashboard/StaffDashboard'))
     ```
  2. Bọc khối render view bằng `<Suspense fallback={<LoadingScreen/>}>` (LoadingScreen đơn giản: logo + spinner).
  3. Giữ nguyên toàn bộ state/handler khác của App.jsx.
- **Acceptance:** Build tạo nhiều chunk (mỗi view 1 file `.js` riêng trong `dist/assets`); app chạy, chuyển view vẫn hoạt động (test PASS). 
- **Risk:** Trung bình-thấp — đảm bảo Suspense bọc đủ mọi nhánh render view.
- **Deps:** Nên làm SAU P0-2 (ErrorBoundary bắt lỗi lazy load fail). Trước Phase 1 nếu App.jsx chưa tách; nếu Phase 1 (P1-App) làm trước thì lazy-load gắn vào router.

---

## PHASE 1 — Tách `App.jsx` (1032 dòng) → router + login + simulation

### TASK P1-APP — Decompose `App.jsx`
- **Agent:** frontend-developer (1 agent, KHÔNG song song — file đơn)
- **Cấu trúc đích:**
  ```
  src/app/
  ├── LoginScreen.jsx          # form login + SSO mock UI
  ├── SimulationPanel.jsx      # khối simulation controls (pending accounts, sim events)
  ├── AppRouter.jsx            # switch theo `view` → render view (nơi đặt lazy + Suspense)
  └── mockSso.js               # MOCK_SSO_KYB_PROFILE, MOCK_SSO_NO_KYB_EMAIL, ... (data thuần)
  src/App.jsx                  # còn lại: state orchestration + provider wiring + dùng 3 file trên
  ```
- **Steps:**
  1. Đọc `src/App.jsx` đầy đủ, lập bản đồ state/handler/JSX (giống cách đã làm với Dashboard).
  2. Đưa các hằng MOCK_* ra `src/app/mockSso.js` (named exports).
  3. Tách JSX login (màn `view==='login'`) ra `LoginScreen.jsx` — nhận props: `email,setEmail,password,setPassword,loginError,onLogin,onSsoLogin,...` (đúng các biến đang dùng).
  4. Tách khối simulation controls ra `SimulationPanel.jsx`.
  5. Tách phần switch render view ra `AppRouter.jsx` (nhận `view` + tất cả props mỗi view cần). Đặt `React.lazy` + `<Suspense>` tại đây (gộp P0-3 nếu P0-3 chưa làm).
  6. `App.jsx` giữ state + effect + truyền props xuống 3 component.
- **Acceptance:** `App.jsx` < 400 dòng; mỗi file mới < 500 dòng; toàn bộ luồng login → onboarding → dashboard/customer/staff chạy; build + test PASS.
- **Risk:** Trung bình (App giữ nhiều state). Di chuyển JSX verbatim, chỉ thread props.
- **Deps:** Có thể bao trùm P0-3 (lazy-load). Nếu làm P1-APP thì gộp luôn lazy-load vào AppRouter.

---

## PHASE 2 — Tách "god components" (P1) theo khuôn `dashboard/`

> **Có thể chạy SONG SONG nhiều agent** vì khác file. RÀNG BUỘC: mỗi agent chỉ tạo file mới + sửa file của chính component đó; KHÔNG đụng `App.jsx` hay file khác. Sau khi tất cả xong, điều phối viên build+test tổng.

**Khuôn chung mỗi task (áp cho tất cả P2-*):**
1. Đọc file gốc, liệt kê các function/section nội bộ + state.
2. Tạo thư mục `src/components/<feature>/` với `steps|sections|modals|hooks` tùy loại.
3. Di chuyển VERBATIM từng phần ra file riêng, thêm import, `export default`.
4. File gốc trở thành "container" điều phối state + import các phần.
5. Dọn import thừa. Build + test.

### TASK P2-SETUPWIZARD — `SetupWizard.jsx` (2035)
- **Đích:** `src/components/setup-wizard/`
  - `steps/Step1BusinessInfo.jsx`, `Step2ReviewLinks.jsx`, `Step3Staff.jsx`, `Step4TouchPoints.jsx`, `Step5Plan.jsx`, `Step6Download.jsx` (theo các step thực tế trong file)
  - `hooks/useSetupWizard.js` (state form + step + validation + persist)
  - `SetupWizard.jsx` = stepper shell + render step hiện tại.
- **Acceptance:** shell < 400 dòng; mỗi step < 500; wizard chạy đủ các bước; build+test PASS.
- **Risk:** Trung bình (nhiều state form). 

### TASK P2-STAFFREGWIZARD — `StaffRegistrationWizard.jsx` (2053)
- **Đích:** `src/components/staff-registration/`
  - `steps/` (Welcome/PathSelect, OtpVerify, Profile, Payments, Consent, Success — theo file)
  - `hooks/useStaffRegistration.js`
  - shell `StaffRegistrationWizard.jsx`.
- **Acceptance/Risk:** như P2-SETUPWIZARD.

### TASK P2-SETTINGS — `SettingsView.jsx` (2005)
- **Đích:** `src/components/settings/`
  - `tabs/ProfileTab.jsx`, `KybTab.jsx`, `PaymentAccountsSection.jsx`, `ReviewLinksSection.jsx`
  - `hooks/useSettingsForm.js`
  - shell `SettingsView.jsx` (tab switch).
- **Lưu ý:** giữ nguyên logic lưu/đồng bộ localStorage. 

### TASK P2-CUSTOMERFLOW — `CustomerFlow.jsx` (1307)
- **Đích:** `src/components/customer-flow/`
  - `steps/SelectStaff.jsx`, `TipAmount.jsx`, `Payment.jsx`, `Processing.jsx`, `SuccessPayment.jsx`, `LeaveReview.jsx`, `ReviewRouting.jsx`
  - `hooks/useCustomerFlow.js` (step state + selections + session)
  - shell `CustomerFlow.jsx`.
- **Lưu ý:** Đây là luồng khách hàng cốt lõi MVP — test kỹ chọn staff → tip → payment → review routing (4–5★ vs 1–3★).

### TASK P2-STAFFMODAL — `dashboard/modals/StaffModal.jsx` (1167, có 22 console.*)
- **Đích:** trong `src/components/dashboard/modals/`
  - tách `StaffReviewsDetailModal.jsx` (phần modal reviews ẩn danh mới thêm)
  - tách form sections nếu cần (`StaffPaymentSection.jsx`...)
  - **DỌN 22 `console.*`** trong file này.
- **Acceptance:** StaffModal < 500; 0 console.* còn lại; build+test PASS.

### TASK P2-NHỎ — các file 500–720 dòng (mỗi cái 1 task nhỏ)
- `TipsView.jsx` (719) → `src/components/tips/` tabs (Overview/Savings/Transactions/Payouts).
- `StaffDetailView.jsx` (689) → tách sections.
- `RegisterWizard.jsx` (620) → tách steps (Role select, Account, Success).
- `dashboard/views/StaffView.jsx` (600) → tách `StaffRow`/`StaffCard` + `StaffFilters`.
- `staff-dashboard/views/StaffMyQR.jsx` (500, 5 console.*) → tách QR sections + dọn console.

---

## PHASE 3 — Chất lượng / nhất quán (P2)

### TASK P3-MOCKDATA — Gom mock data
- Chuyển mọi `MOCK_*` rải rác (App, Dashboard data đã ok) vào `src/<feature>/data/*.js`; cân nhắc cờ `import.meta.env.DEV` để chỉ seed ở dev.

### TASK P3-PERSIST — Hook `usePersistedState`
- Tạo `src/hooks/usePersistedState.js` gói pattern `useState(()=>storage.getItem...)` + effect ghi. Thay thế DẦN ở các nơi đơn giản (KHÔNG đụng sync loop phức tạp của Dashboard ở bước này).

### TASK P3-LOGGER — Logger tập trung (tuỳ chọn)
- `src/utils/logger.js` (no-op ở prod). Thay `console.*` còn lại ngoài các file đã dọn.

### TASK P3-PROPTYPES (tuỳ chọn) — thêm PropTypes cho component dùng lại nhiều (ui/, layout/).

---

## THỨ TỰ & SONG SONG ĐỀ XUẤT

```
Đợt 1 (tuần tự, nhanh):   P0-1 → P0-2 → (P0-3 hoặc gộp vào P1-APP)
Đợt 2 (tuần tự):          P1-APP
Đợt 3 (SONG SONG nhiều agent, mỗi agent 1 file):
        P2-SETUPWIZARD | P2-STAFFREGWIZARD | P2-SETTINGS | P2-CUSTOMERFLOW | P2-STAFFMODAL
Đợt 4 (song song):        các P2-NHỎ
Đợt 5 (tuần tự):          P3-*
```

**Sau mỗi đợt:** điều phối viên chạy `npx vite build` + `npx vitest run` + smoke test thủ công luồng chính (login → dashboard; customer tip+review; staff onboarding).

---

## CHECKLIST BÀN GIAO CHO MỖI SUBAGENT (copy vào prompt giao việc)

```
Repo: C:\Users\AD\Documents\GitHub\vlinknexora (Vite+React 18, JSX thuần, relative imports, KHÔNG TS, KHÔNG alias @/).
Task: <ID + mô tả>. Branch: refactor/<id>_<slug> tách từ main.
Khuôn mẫu cấu trúc: src/components/dashboard/** (đã chuẩn — bắt chước).
Bắt buộc:
- Di chuyển code VERBATIM (không đổi tên/logic/chuỗi). Chỉ thêm import + export default.
- Mỗi file < 500 dòng. Dọn import thừa ở file gốc.
- KHÔNG sửa file ngoài scope task. KHÔNG đụng các effect đồng bộ localStorage trừ khi task ghi rõ.
- Sau khi xong: `npx vite build` PASS và `npx vitest run` không giảm test pass. Báo lại số dòng file gốc trước/sau + danh sách file mới.
Output: danh sách file tạo + import đã thêm + kết quả build/test.
```
