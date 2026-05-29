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
  * Bản đồ hóa (Mapping) tệp code với tệp Unit Test tương ứng trong `tests/unit/`.
  * Đề xuất câu lệnh chạy test tối ưu hóa cho riêng phạm vi sửa đổi.

---

## 🚀 Hướng Dẫn Chạy Kiểm Thử

### Cài đặt môi trường
Trước khi chạy test, đảm bảo đã cài đặt đầy đủ các gói thư viện và trình duyệt Chromium cho E2E:
```bash
npm install
npx playwright install chromium --with-deps
```

### Lệnh chạy nhanh

| Lệnh | Chức năng | Phạm vi |
| :--- | :--- | :--- |
| `npm run lint:tokens` | Kiểm tra vi phạm màu/layout hardcode | Các file thay đổi trong `src/` |
| `npm run test:impact` | Phân tích tác động và đề xuất lệnh chạy | Các file thay đổi trong `src/` |
| `npm run test` | Chạy toàn bộ Unit Tests bằng Vitest | Thư mục `tests/unit/` |
| `npm run test:watch` | Chạy Unit Tests ở chế độ tự động cập nhật | Thư mục `tests/unit/` |
| `npm run test:e2e` | Khởi động server và chạy kiểm thử E2E | Thư mục `tests/e2e/` (mở browser ảo) |

### Chạy test khoanh vùng (Targeted Testing)
* **Unit Tests cho các file vừa sửa đổi:**
  ```bash
  npx vitest run --related <đường-dẫn-file-1>,<đường-dẫn-file-2>
  ```
* **Chạy một bộ test E2E cụ thể (ví dụ bộ Dashboard):**
  ```bash
  npx start-server-and-test dev http://localhost:3000 "npx vitest run --config vitest.e2e.config.js -t 'SSO Login'"
  ```

---

## 🤖 Hướng dẫn dành cho AI Coding Agent

Khi bạn (Agent) được yêu cầu phát triển tính năng mới hoặc thực hiện kiểm thử:
1. **Kích hoạt Skill:** Gọi hoặc làm theo quy trình trong file [.agents/skills/feature-focused-tester/SKILL.md](file:///c:/Users/AD/Documents/GitHub/vlinknexora/.agents/skills/feature-focused-tester/SKILL.md).
2. **Trước khi bàn giao code:**
   * Bạn bắt buộc phải chạy `npm run lint:tokens` để đảm bảo code sạch, không chứa mã màu hay kích thước hardcode.
   * Nếu có vi phạm, hãy sửa lại code để sử dụng đúng biến màu của dự án (được cấu hình trong [tailwind.config.js](file:///c:/Users/AD/Documents/GitHub/vlinknexora/tailwind.config.js)).
3. **Viết Test mới:**
   * Viết Unit test trong `tests/unit/` và E2E test trong `tests/e2e/`.
   * Sử dụng thư viện `CloakBrowser` cho E2E để giả lập thao tác thật của người dùng.
   * Không hardcode ngôn ngữ trong test; hãy sử dụng các chuỗi đa ngôn ngữ (i18n) từ tệp `locales/` hoặc regex linh hoạt.

---

## ⛓️ Tự động hóa qua GitHub Actions (CI)
Quy trình CI trên GitHub (`.github/workflows/ci.yml`) đã được tích hợp bước **Lint Design Tokens**. 
Nếu có bất kỳ dòng code nào vi phạm tiêu chuẩn Design System hoặc gây lỗi kiểm thử đơn vị/E2E, hệ thống CI sẽ tự động đánh dấu đỏ (Fail) trên Pull Request để đảm bảo chất lượng code và giao diện luôn ở mức cao nhất trước khi merge vào nhánh `main`.
