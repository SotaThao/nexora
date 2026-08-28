# Hướng Dẫn Hệ Thống Automation Test & Design Linter

Tài liệu này hướng dẫn cách sử dụng, vận hành hệ thống kiểm thử tự động và bộ kiểm tra Design System (Tokens) tích hợp trong dự án **Nexora Touch**.

---

## 📌 Các Tính Năng Chính

### 1. Kiểm tra Thiết kế & Tránh Hardcode (`lint:tokens`)
Để bảo vệ ngôn ngữ thiết kế cao cấp (luxury brand) của Nexora và ngăn chặn việc nhà phát triển sử dụng các màu sắc, kích thước tùy tiện hoặc hardcode giá trị hex:
* **Script thực thi:** `npm run lint:tokens`
* **Nhiệm vụ:** Quét qua các tệp nguồn thay đổi để phát hiện:
  * Thuộc tính `style={{ ... }}` chứa mã màu cứng (VD: `#d4af37` hoặc màu cơ bản `'red'`).
  * Các class màu tùy tiện của Tailwind (VD: `bg-[#ff0000]`).
  * Các class màu mặc định của Tailwind không nằm trong bộ Token (VD: `bg-blue-500`, `text-red-600`).
  * Sizing/Spacing không chuẩn (VD: `w-[15px]` thay vì sử dụng spacing token `flox-8`, `flox-12`, v.v.).

### 2. Phân Tích Phạm Vi Ảnh Hưởng (`test:impact`)
Để tăng tốc độ kiểm thử trong quá trình lập trình hoặc trước khi tạo Pull Request, hệ thống hỗ trợ quét xem các tệp nào thay đổi để đề xuất các bộ test phù hợp:
* **Script thực thi:** `npm run test:impact`
* **Nhiệm vụ:**
  * Dùng Git để lọc ra các tệp trong `src/` có thay đổi.
  * Bản đồ hóa (Mapping) tệp code với tệp Unit Test tương ứng — quy ước hiện tại là test đặt cùng thư mục với source (co-located, VD: `src/components/**/*.test.tsx`, `src/data/**/*.test.ts`, xem `AGENTS.md`).
  * Đề xuất câu lệnh chạy test tối ưu hóa cho riêng phạm vi sửa đổi.

---

## 🚀 Hướng Dẫn Chạy Kiểm Thử

### Cài đặt môi trường
Trước khi chạy test, đảm bảo đã cài đặt đầy đủ các gói thư viện:
```bash
npm install
```
E2E chạy qua `pnpm test:e2e`, cấu hình tại `vitest.e2e.config.ts`; trình duyệt/công cụ cụ thể phụ thuộc vào cách script đó được cấu hình trên máy bạn.

### Lệnh chạy nhanh

| Lệnh | Chức năng | Phạm vi |
| :--- | :--- | :--- |
| `npm run lint:tokens` | Kiểm tra vi phạm màu/layout hardcode | Các file thay đổi trong `src/` |
| `npm run test:impact` | Phân tích tác động và đề xuất lệnh chạy | Các file thay đổi trong `src/` |
| `npm run test` | Chạy toàn bộ Unit Tests bằng Vitest | Test co-located trong `src/components/**`, `src/data/**` |
| `npm run test:watch` | Chạy Unit Tests ở chế độ tự động cập nhật | Test co-located trong `src/components/**`, `src/data/**` |
| `npm run test:e2e` | Chạy bộ E2E test | Theo cấu hình `vitest.e2e.config.ts` |

### Chạy test khoanh vùng (Targeted Testing)
* **Unit Tests cho các file vừa sửa đổi:**
  ```bash
  npx vitest run --related <đường-dẫn-file-1>,<đường-dẫn-file-2>
  ```
* **Chạy một bộ test E2E cụ thể (ví dụ bộ Dashboard):**
  ```bash
  pnpm test:e2e -- -t 'SSO Login'
  ```

---

## 🤖 Hướng dẫn dành cho AI Coding Agent

Quy tắc kỹ thuật chính của repo này nằm ở [`AGENTS.md`](./AGENTS.md) — đọc file đó trước tiên, áp dụng cho mọi AI coding agent (Claude Code, Cursor, Codex, Copilot, Gemini, v.v.), không riêng gì agent nào. Phần dưới đây là hướng dẫn bổ sung riêng cho automation test & design lint, không thay thế `AGENTS.md`.

Khi bạn (Agent) được yêu cầu phát triển tính năng mới hoặc thực hiện kiểm thử:
1. **Áp dụng quy trình 3-layer test** (Layer 1 UI, Layer 2 API call, Layer 3 flow) theo mô tả trong `AGENTS.md`'s "Verify against the story" section.
2. **Trước khi bàn giao code:**
   * Bạn bắt buộc phải chạy `npm run lint:tokens` để đảm bảo code sạch, không chứa mã màu hay kích thước hardcode.
   * Nếu có vi phạm, hãy sửa lại code để sử dụng đúng biến màu của dự án (được cấu hình trong [tailwind.config.js](./tailwind.config.js)).
3. **Viết Test mới:**
   * Viết Unit test co-located cùng source (VD: `src/components/Foo.test.tsx` cạnh `Foo.tsx`) theo quy ước hiện tại của repo (xem `AGENTS.md`).
   * Viết E2E test chạy qua `pnpm test:e2e` — không có thư viện `CloakBrowser` nào trong dependencies của repo này, tham chiếu cũ đó đã lỗi thời.
   * Không hardcode ngôn ngữ trong test; hãy sử dụng các chuỗi đa ngôn ngữ (i18n) từ `src/locales/en.json` / `src/locales/vi.json` hoặc regex linh hoạt.

---

## ⛓️ Tự động hóa qua GitHub Actions (CI)
Quy trình CI trên GitHub (`.github/workflows/frontend.yaml`) đã được tích hợp bước **Lint Design Tokens**. 
Nếu có bất kỳ dòng code nào vi phạm tiêu chuẩn Design System hoặc gây lỗi kiểm thử đơn vị/E2E, hệ thống CI sẽ tự động đánh dấu đỏ (Fail) trên Pull Request để đảm bảo chất lượng code và giao diện luôn ở mức cao nhất trước khi merge vào nhánh `main`.

---

## Multi-Environment CI/CD Configuration

Workflow `/.github/workflows/frontend.yaml` resolves exactly one build mode per branch (via a case statement, not a matrix over all Vite modes) and deploys only on push to the branches below — each build is a Docker image pushed to the DigitalOcean Container Registry, then rolled out via a "Deploy to ArgoCD" job that patches manifests in the separate `vlink-group/devops` repo:

| Branch | GitHub Environment | Build Mode |
| :--- | :--- | :--- |
| `dev` | `TEST` | `test` |
| `staging` | `STAGING` | `staging` |
| `main`, `master` | `PRODUCTION` | `production` |
| `feature/taxiq-pos` | `TEST2` | `test2` |

The `feature/taxiq-pos` row is an experimental, phase-specific branch (own `build:test2` script + ArgoCD devops path) — not a general-purpose environment.

`development` is local-only. Use `.env.development` and `pnpm run build:dev`; it has no branch/environment entry in the workflow, so it cannot trigger CI/CD or deploy to ArgoCD.

### Required GitHub Environment Variables

Create these variables in each GitHub Environment (`TEST`, `STAGING`, `PRODUCTION`):

* `VITE_APP_ENV` (`test`, `staging`, `production`) — wired into CI/Docker but not currently read anywhere in `src/`; reserved.
* `VITE_API_BASE_URL` (canonical API endpoint, no trailing slash)
* `VITE_DATA_SOURCE` (`api` for API runtime, `storage` for mock/storage runtime)
* `VITE_ENABLE_DEMO_TOOLS` (`false` for deployed environments)
* `VITE_RECAPTCHA_KEY` — used in `src/` (`react-google-recaptcha-v3`) and present in all `.env.*` files, but **not currently passed as a Docker build-arg in the workflow** — a real CI gap, not just missing from this list.
* `VITE_VLINKPAY_API_BASE_URL` — used in `src/lib/vlinkPayHttpClient.ts`, present in all `.env.*` files, same CI gap as above (not wired into the workflow's Docker build-args).
* `VITE_VLINKPAY_WEB_URL_BASE`
* `VITE_GOOGLE_MAPS_API_KEY`
* `VITE_MAPBOX_TOKEN` — wired into CI/Docker but not currently read anywhere in `src/`; reserved.
* `VITE_MAP_MARKER_ENGINE` — wired into CI/Docker but not currently read anywhere in `src/`; reserved.
* `VITE_GOOGLE_MAPS_MAP_ID` — wired into CI/Docker but not currently read anywhere in `src/`; reserved.
* `VITE_SENTRY_ENV` (optional) — wired into CI/Docker, but there is no Sentry SDK/usage anywhere in this codebase yet; reserved.

Suggested values:

| Name | Development | Test | Staging | Production |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_APP_ENV` | `development` | `test` | `staging` | `production` |
| `VITE_API_BASE_URL` | local/dev API URL | test API URL | staging API URL | production API URL |
| `VITE_DATA_SOURCE` | `api` or `storage` | `api` | `api` | `api` |
| `VITE_ENABLE_DEMO_TOOLS` | `true` if needed | `false` | `false` | `false` |
| `VITE_RECAPTCHA_KEY` | dev key | test key | staging key | production key |
| `VITE_VLINKPAY_API_BASE_URL` | dev URL | test URL | staging URL | production URL |
| `VITE_SENTRY_ENV` | empty or `development` | `test` | `staging` | `production` |
| `VITE_GOOGLE_MAPS_API_KEY` | dev key | test key | staging key | production key |
| `VITE_MAPBOX_TOKEN` | dev token | test token | staging token | production token |
| `VITE_MAP_MARKER_ENGINE` | `advanced` | `advanced` | `advanced` | `advanced` |
| `VITE_GOOGLE_MAPS_MAP_ID` | dev map id | test map id | staging map id | production map id |
| `VITE_VLINKPAY_WEB_URL_BASE` | dev URL | test URL | staging URL | production URL |

### Optional GitHub Environment Secrets

* `VITE_SENTRY_DSN` — wired into CI/Docker, but there is no Sentry SDK/usage anywhere in this codebase yet; reserved for when Sentry is actually added.
* `DIGITALOCEAN_ACCESS_TOKEN`
* `GH_PAT`

### Local Build Commands

Use these commands to verify each environment build locally:

```bash
pnpm run build:dev
pnpm run build:test
pnpm run build:test2   # feature/taxiq-pos → TEST2 environment
pnpm run build:staging
pnpm run build:prod
```
