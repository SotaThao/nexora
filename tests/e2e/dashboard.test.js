import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launch } from 'cloakbrowser';

describe('Nexora Touch E2E Test Suite (CloakBrowser)', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch stealth Chromium using CloakBrowser in headed mode for visual demo
    browser = await launch({
      headless: false,
      slowMo: 1000, // 1 second delay between steps so it's easy to watch
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('Flow 1: Quick SSO Login to Dashboard', async () => {
    await page.goto('http://localhost:3000');

    // Wait for the login screen to render
    await page.waitForSelector('text=NEXORA');

    // Click "Enter Dashboard" button (which pre-fills demo data and redirects to dashboard)
    const enterDashboardBtn = page.locator('button:has-text("Enter Dashboard"), button:has-text("Vào thẳng Dashboard")');
    await enterDashboardBtn.click();

    // Verify it navigates to the dashboard view and displays the mock business name
    await page.waitForSelector('text=Golden Glow Nail Spa');
    const content = await page.textContent('body');
    expect(content).toContain('Golden Glow Nail Spa');
  });

  it('Flow 2: Customer Flow - Scenario A (Positive 5★ Review)', async () => {
    // Navigate directly to the customer portal URL for technician Mia Tran
    await page.goto('http://localhost:3000/?flow=customer&tech=staff/mia-t&biz=Golden+Glow+Nail+Spa');

    // Wait for the customer portal page to load
    await page.waitForSelector('text=Tip & Review');

    // Select $15 tip
    const tipBtn = page.locator('button:has-text("$15")');
    await tipBtn.click();

    // Select 5 stars rating (click the 5th star button)
    const starBtns = page.locator('button:has(svg.lucide-star)');
    await starBtns.nth(4).click();

    // Select tag compliments (e.g. "Highly Professional")
    const tagBtn = page.locator('button:has-text("Highly Professional"), button:has-text("Chuyên nghiệp")');
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
    }

    // Type comment
    await page.fill('textarea[placeholder*="feedback"]', 'Excellent service by Mia!');

    // Click "Proceed to Payment" button
    const payBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Thanh toán")');
    await payBtn.click();

    // Select payment method - Venmo
    await page.waitForSelector('text=Select Payment');
    const venmoBtn = page.locator('button:has-text("Pay via Venmo"), button:has-text("Venmo")');
    await venmoBtn.click();

    // Wait for payment processing and verification routing success screen
    await page.waitForSelector('text=Payment Successful');

    // Check that Google review button is visible (since rating was 5★)
    const googleBtn = page.locator('a:has-text("Review on Google"), a:has-text("Đánh giá Google")');
    expect(await googleBtn.isVisible()).toBe(true);

    // Verify the negative private feedback button is NOT visible
    const privateFeedbackBtn = page.locator('button:has-text("Submit Secure Feedback"), button:has-text("Gửi Góp Ý Bảo Mật")');
    expect(await privateFeedbackBtn.isVisible()).toBe(false);
  });

  it('Flow 3: Customer Flow - Scenario B (Negative 2★ Review)', async () => {
    // Navigate directly to the customer portal URL
    await page.goto('http://localhost:3000/?flow=customer&tech=staff/mia-t&biz=Golden+Glow+Nail+Spa');

    // Wait for the customer portal page to load
    await page.waitForSelector('text=Tip & Review');

    // Select $5 tip
    const tipBtn = page.locator('button:has-text("$5")');
    await tipBtn.click();

    // Select 2 stars rating (click the 2nd star button)
    const starBtns = page.locator('button:has(svg.lucide-star)');
    await starBtns.nth(1).click();

    // Type comment
    await page.fill('textarea[placeholder*="feedback"]', 'The service was very rushed.');

    // Click "Proceed to Payment"
    const payBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Thanh toán")');
    await payBtn.click();

    // Select payment method - Venmo
    await page.waitForSelector('text=Select Payment');
    const venmoBtn = page.locator('button:has-text("Pay via Venmo"), button:has-text("Venmo")');
    await venmoBtn.click();

    // Wait for success screen
    await page.waitForSelector('text=Payment Successful');

    // Verify that Google review button is HIDDEN
    const googleBtn = page.locator('a:has-text("Review on Google"), a:has-text("Đánh giá Google")');
    expect(await googleBtn.isVisible()).toBe(false);

    // Verify that private secure feedback button is VISIBLE (since rating was 2★)
    const privateFeedbackBtn = page.locator('button:has-text("Submit Secure Feedback"), button:has-text("Gửi Góp Ý Bảo Mật")');
    expect(await privateFeedbackBtn.isVisible()).toBe(true);
  });

  it('Flow 4: Customer Flow - Edge Case: Store QR (Select Staff Member & Search)', async () => {
    // Navigate directly to the customer portal URL without tech slug (Store QR)
    await page.goto('http://localhost:3000/?flow=customer&biz=Golden+Glow+Nail+Spa');

    // Wait for the staff selection screen to render
    await page.waitForSelector('text=Select Staff Member');

    // Search for "Mia"
    await page.fill('input[placeholder*="Search"]', 'Mia');

    // Click "Mia Tran" from the list
    const miaCard = page.locator('button:has-text("Mia Tran")');
    await miaCard.click();

    // Verify it navigates to the "Tip & Review" form step for Mia Tran
    await page.waitForSelector('text=Tip & Review');
    const content = await page.textContent('body');
    expect(content).toContain('Mia Tran');
  });

  it('Flow 5: Customer Flow - Edge Case: Inactive/Disabled Staff Filtering', async () => {
    // Navigate directly to the customer portal URL without tech slug (Store QR)
    await page.goto('http://localhost:3000/?flow=customer&biz=Golden+Glow+Nail+Spa');

    // Wait for the staff selection screen to render
    await page.waitForSelector('text=Select Staff Member');

    // Search for "Hanna" (Hanna Nguyen is inactive by default in CustomerFlow.jsx)
    await page.fill('input[placeholder*="Search"]', 'Hanna');

    // Verify "No staff members found" is displayed
    await page.waitForSelector('text=No staff members found');
    const content = await page.textContent('body');
    expect(content).toContain('No staff members found');
  });

  it('Flow 6: Customer Flow - Edge Case: Custom Tip Validation', async () => {
    // Navigate directly to the customer portal URL
    await page.goto('http://localhost:3000/?flow=customer&tech=staff/mia-t&biz=Golden+Glow+Nail+Spa');

    // Wait for the customer portal page to load
    await page.waitForSelector('text=Tip & Review');

    // Select Custom tip
    const customTipBtn = page.locator('button:has-text("Custom")');
    await customTipBtn.click();

    // Type invalid tip - e.g. 0
    await page.fill('input[placeholder*="custom tip"]', '0');

    // Listen for alert dialog
    let alertMsg = '';
    page.once('dialog', async dialog => {
      alertMsg = dialog.message();
      await dialog.accept();
    });

    // Click "Proceed to Payment"
    const payBtn = page.locator('button:has-text("Proceed to Payment"), button:has-text("Thanh toán")');
    await payBtn.click();

    // Small delay to let dialog fire
    await page.waitForTimeout(500);

    // Verify alert dialog was fired with correct message
    expect(alertMsg).toMatch(/Please enter a valid tip amount|Vui lòng nhập số tiền típ/);
  });
});
