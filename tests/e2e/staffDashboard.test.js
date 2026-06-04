import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launch } from 'cloakbrowser';

describe('Staff Personal Dashboard E2E Test Suite (CloakBrowser)', () => {
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

  it('Verify Staff Personal Dashboard Flow', async () => {
    // 1. Navigate to home & login to Staff Dashboard
    await page.goto('http://127.0.0.1:3000');
    await page.waitForSelector('text=NEXORA');

    // Click "Staff Login (Personal Dashboard)" button to log in
    const staffLoginBtn = page.locator('button:has-text("Staff Login (Personal Dashboard)"), button:has-text("Đăng nhập Staff")');
    await staffLoginBtn.click();

    // Verify it navigates to the staff dashboard view
    await page.waitForSelector('text=Mia Tran');
    let content = await page.textContent('body');
    expect(content).toContain('Mia Tran');
    expect(content).toContain('Golden Glow Nail Spa');

    // Toggle language to English (EN) to keep E2E assertions consistent
    const langEnBtn = page.getByRole('button', { name: 'EN', exact: true });
    await langEnBtn.click();
    await page.waitForTimeout(500); // Allow language state to update

    // 2. Verify Home KPIs
    content = await page.textContent('body');
    expect(content).toContain('Mia Tran');
    expect(content).toContain('Pending Confirmations');

    // 3. Navigate to "My QR"
    const qrTab = page.locator('button:has-text("My QR"), button:has-text("QR Của Tôi")').filter({ visible: true }).first();
    await qrTab.click();
    await page.waitForSelector('text=My Personal QR');
    content = await page.textContent('body');
    expect(content).toContain('NEX-STAFF-MIA0123');

    // 4. Navigate to "Tips"
    const tipsTab = page.locator('button:has-text("Tips"), button:has-text("Lịch Sử Tip")').filter({ visible: true }).first();
    await tipsTab.click();
    await page.waitForSelector('text=Tip Activity');
    content = await page.textContent('body');
    expect(content).toContain('Tip Activity');

    // 5. Navigate to "Pay"
    const payTab = page.locator('button:has-text("Pay"), button:has-text("Ví Nhận Tiền")').filter({ visible: true }).first();
    await payTab.click();
    await page.waitForSelector('text=Payment Methods');
    content = await page.textContent('body');
    expect(content).toContain('Payment Methods');
    expect(content).toContain('Cash App');
    expect(content).toContain('Venmo');

    // 6. Navigate to "Account"
    const profileTab = page.locator('button:has-text("Account"), button:has-text("Tài Khoản")').filter({ visible: true }).first();
    await profileTab.click();
    await page.waitForSelector('text=Personal Account');
    content = await page.textContent('body');
    expect(content).toContain('Personal Account');

    // 7. Verify notifications
    const notiTab = page.locator('button:has-text("Notifications"), button:has-text("Thông báo")').filter({ visible: true }).first();
    if (await notiTab.isVisible()) {
      await notiTab.click();
      await page.waitForSelector('text=Notifications');
      content = await page.textContent('body');
      expect(content).toContain('Notifications');
    }

    // 8. Go back to Home and test Confirm Tip Action
    const homeTab = page.locator('button:has-text("Home"), button:has-text("Trang chủ")').filter({ visible: true }).first();
    await homeTab.click();
    await page.waitForSelector('text=Pending Confirmations');

    // Click confirm button for the first pending tip if visible
    const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Xác nhận")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await page.waitForTimeout(500); // Allow state to update
    }

    // 9. Sign out
    const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Đăng xuất")');
    await logoutBtn.click();
    await page.waitForSelector('text=NEXORA');
  });
});
