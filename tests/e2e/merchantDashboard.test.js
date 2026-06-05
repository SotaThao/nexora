import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launch } from 'cloakbrowser';

describe('Nexora Merchant Dashboard Views E2E Test Suite (CloakBrowser)', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch stealth Chromium using CloakBrowser
    const isCI = !!process.env.CI;
    browser = await launch({
      headless: isCI,
      slowMo: isCI ? 0 : 500, // 500ms delay between steps locally so it's easy to watch
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('Verify and interact with all Merchant Dashboard Views', async () => {
    // 1. Navigate to home & login to Dashboard
    await page.goto('http://localhost:3000');
    await page.waitForSelector('text=NEXORA');

    // Click "Enter Dashboard" button to quickly bypass onboarding & login as kyb_approved
    const enterDashboardBtn = page.locator('button:has-text("Enter Dashboard"), button:has-text("Vào thẳng Dashboard")');
    await enterDashboardBtn.click();

    // Verify successful login
    await page.waitForSelector('text=Golden Glow Nail Spa');
    let content = await page.textContent('body');
    expect(content).toContain('Golden Glow Nail Spa');

    // Toggle language to Vietnamese (VI) to match the expected Vietnamese texts in the test assertions
    const langViBtn = page.getByRole('button', { name: 'VI', exact: true });
    await langViBtn.click();
    await page.waitForTimeout(500); // Allow language state to update

    // 2. Verify Touchpoint Manager Tab
    const touchpointsTab = page.locator('button:has-text("Touchpoint Manager"), button:has-text("Quản Lý Điểm Chạm")');
    await touchpointsTab.click();
    await page.waitForSelector('text=Tổng Điểm Chạm');
    content = await page.textContent('body');
    expect(content).toMatch(/Total Touchpoints|Tổng Điểm Chạm/);
    expect(content).toMatch(/Reception Front Desk/);

    // 3. Verify Devices Tab (now nested as a sub-tab under Touchpoint Manager)
    const devicesSubTab = page.locator('main button:has-text("Thiết Bị Vật Lý"), main button:has-text("Hardware Devices")');
    await devicesSubTab.click();
    await page.waitForSelector('text=Thiết Bị QR');
    content = await page.textContent('body');
    expect(content).toMatch(/QR Devices|Thiết Bị QR/);

    // Test Add New Device Modal
    const addDeviceBtn = page.locator('button:has-text("Add New Device"), button:has-text("Thêm Thiết Bị Mới")');
    await addDeviceBtn.click();
    
    // Wait for the modal and fill details
    await page.waitForSelector('text=Đăng Ký Phần Cứng QR / NFC');
    await page.fill('input[placeholder*="NFC-003"]', 'NFC-E2E-TEST');
    await page.fill('input[placeholder*="Counter"]', 'E2E Test Chair');
    
    // Submit
    const submitDeviceBtn = page.locator('button:has-text("Confirm"), button:has-text("Xác nhận")');
    await submitDeviceBtn.click();
    await page.waitForTimeout(500); // Allow modal to close and state to update

    // Verify E2E Test Chair appears in device listings
    content = await page.textContent('body');
    expect(content).toContain('E2E Test Chair');

    // 4. Verify Tips & Savings Tab
    const tipsTab = page.locator('button:has-text("Tips"), button:has-text("Tiền Típ")');
    await tipsTab.click();
    await page.waitForSelector('text=Tổng Doanh Thu Típ');
    content = await page.textContent('body');
    expect(content).toMatch(/Tổng Doanh Thu Típ/);

    // Click "Tiết kiệm phí" sub-tab (hardcoded in TipsView)
    const savingsSubTab = page.locator('main button:has-text("Tiết kiệm phí")');
    await savingsSubTab.click();
    await page.waitForSelector('text=Tính Phí Tiết Kiệm');
    
    // Drag slider or adjust slider value
    const slider = page.locator('input[type="range"]');
    if (await slider.isVisible()) {
      await slider.evaluate((el) => {
        el.value = '4.0';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
    
    // Verify estimated savings updates
    content = await page.textContent('body');
    expect(content).toMatch(/Ước tính số tiền tiết kiệm/);

    // 5. Verify Analytics Tab
    const analyticsTab = page.locator('button:has-text("Analytics"), button:has-text("Phân Tích")');
    await analyticsTab.click();
    await page.waitForSelector('text=Bảng Xếp Hạng Nhân Viên');
    content = await page.textContent('body');
    expect(content).toMatch(/Bảng Xếp Hạng Nhân Viên/);

    // 6. Verify Support Tab
    const supportTab = page.locator('button:has-text("Support"), button:has-text("Hỗ Trợ")');
    await supportTab.click();
    await page.waitForSelector('text=Gửi Yêu Cầu Hỗ Trợ');

    // Submit ticket details
    await page.fill('input[placeholder*="NFC Terminal"], input[placeholder*="Ví dụ:"]', 'E2E Ticket Subject');
    await page.fill('textarea[placeholder*="Provide details"], textarea[placeholder*="Cung cấp thông tin"]', 'E2E Ticket Description details.');
    
    const submitSupportBtn = page.locator('button:has-text("Submit Ticket"), button:has-text("Gửi Yêu Cầu")');
    await submitSupportBtn.click();

    // Verify success banner/toast appears
    await page.waitForSelector('text=gửi thành công');
    content = await page.textContent('body');
    expect(content).toMatch(/submitted successfully|gửi thành công/);

    // FAQ Accordion interaction
    const faqQuestion = page.locator('button:has-text("How direct tips work?"), button:has-text("Tiền típ trực tiếp hoạt động thế nào?")');
    await faqQuestion.click();
    await page.waitForTimeout(300); // Wait for transition
    content = await page.textContent('body');
    expect(content).toMatch(/Venmo, Zelle, Cash App/i);
  });
});
