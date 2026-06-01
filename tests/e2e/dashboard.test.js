import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launch } from 'cloakbrowser';

describe('Nexora Touch E2E Test Suite (CloakBrowser)', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch stealth Chromium using CloakBrowser
    const isCI = !!process.env.CI;
    browser = await launch({
      headless: isCI,
      slowMo: isCI ? 0 : 1000, // 1 second delay between steps locally so it's easy to watch
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

    // Wait for the customer portal page to load (Tip amount selection)
    await page.waitForSelector('text=Add a Tip');

    // Select $15 tip
    const tipBtn = page.locator('button:has-text("$15")');
    await tipBtn.click();

    // Click "Next" button to go to payment method selection
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Tiếp theo")');
    await nextBtn.click();

    // Select payment method - Venmo
    await page.waitForSelector('text=How would you like to pay?');
    const venmoBtn = page.locator('button:has-text("Venmo")');
    await venmoBtn.click();

    // Wait for payment processing and verification routing success screen
    await page.waitForSelector('text=Thank You!');

    // Click Done to proceed to Leave Review step
    const doneBtn = page.locator('button:has-text("Done"), button:has-text("Hoàn tất")');
    await doneBtn.click();

    // Now on Leave Review page - wait for title
    await page.waitForSelector('text=How was your experience?');

    // Select 5 stars rating (click the 5th star button)
    const starBtns = page.locator('button:has(svg.lucide-star)');
    await starBtns.nth(4).click();

    // Select tag compliments (e.g. "Highly Professional")
    const tagBtn = page.locator('button:has-text("Highly Professional"), button:has-text("Chuyên nghiệp")');
    if (await tagBtn.isVisible()) {
      await tagBtn.click();
    }

    // Type comment
    await page.fill('textarea[placeholder*="nails"]', 'Excellent service by Mia!');

    // Submit review
    const submitBtn = page.locator('button:has-text("Submit Review")');
    await submitBtn.click();

    // Now on Google/Yelp routing screen - verify Google review button is visible (since rating was 5★)
    await page.waitForSelector('text=If you loved your experience');
    const googleBtn = page.locator('a:has-text("Review us on Google"), a:has-text("Đánh giá Google")');
    expect(await googleBtn.isVisible()).toBe(true);
  });

  it('Flow 3: Customer Flow - Scenario B (Negative 2★ Review)', async () => {
    // Navigate directly to the customer portal URL
    await page.goto('http://localhost:3000/?flow=customer&tech=staff/mia-t&biz=Golden+Glow+Nail+Spa');

    // Wait for the customer portal page to load (Tip amount selection)
    await page.waitForSelector('text=Add a Tip');

    // Select $5 tip
    const tipBtn = page.locator('button:has-text("$5")');
    await tipBtn.click();

    // Click "Next" button to go to payment method selection
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Tiếp theo")');
    await nextBtn.click();

    // Select payment method - Venmo
    await page.waitForSelector('text=How would you like to pay?');
    const venmoBtn = page.locator('button:has-text("Venmo")');
    await venmoBtn.click();

    // Wait for success screen
    await page.waitForSelector('text=Thank You!');

    // Click Done to proceed to Leave Review step
    const doneBtn = page.locator('button:has-text("Done"), button:has-text("Hoàn tất")');
    await doneBtn.click();

    // Now on Leave Review page - wait for title
    await page.waitForSelector('text=How was your experience?');

    // Select 2 stars rating (click the 2nd star button)
    const starBtns = page.locator('button:has(svg.lucide-star)');
    await starBtns.nth(1).click();

    // Type comment
    await page.fill('textarea[placeholder*="nails"]', 'The service was very rushed.');

    // Submit review
    const submitBtn = page.locator('button:has-text("Submit Review")');
    await submitBtn.click();

    // Should transition directly to Final Done screen (Google routing is bypassed for low ratings)
    await page.waitForSelector('text=Thank You!');
    const finalMsg = page.locator('p:has-text("Thank you for your support!")');
    expect(await finalMsg.isVisible()).toBe(true);

    // Verify that Google/Yelp buttons are NOT on the page
    const googleBtn = page.locator('a:has-text("Review us on Google")');
    expect(await googleBtn.isVisible()).toBe(false);
  });

  it('Flow 4: Customer Flow - Edge Case: Store QR (Select Staff Member & Search)', async () => {
    // Navigate directly to the customer portal URL without tech slug (Store QR)
    await page.goto('http://localhost:3000/?flow=customer&biz=Golden+Glow+Nail+Spa');

    // Wait for the staff selection screen to render
    await page.waitForSelector('text=Choose your service provider');

    // Search for "Mia"
    await page.fill('input[placeholder*="Search"]', 'Mia');

    // Click "Mia Tran" from the list
    const miaCard = page.locator('button:has-text("Mia Tran")');
    await miaCard.waitFor({ state: 'visible' });
    await miaCard.click();

    // Give React state a moment to toggle selection and enable the Next button
    await page.waitForTimeout(500);

    // Click "Next" button to proceed to tipping screen
    const nextBtn = page.locator('button:has-text("Next"), button:has-text("Tiếp theo")');
    await nextBtn.waitFor({ state: 'visible' });
    await nextBtn.click();

    // Verify it navigates to the tip selection step for Mia Tran
    await page.waitForSelector('text=Add a Tip');
    const content = await page.textContent('body');
    expect(content).toContain('Mia T.');

  });

  it('Flow 5: Customer Flow - Edge Case: Inactive/Disabled Staff Filtering', async () => {
    // Navigate directly to the customer portal URL without tech slug (Store QR)
    await page.goto('http://localhost:3000/?flow=customer&biz=Golden+Glow+Nail+Spa');

    // Wait for the staff selection screen to render
    await page.waitForSelector('text=Choose your service provider');

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
    await page.waitForSelector('text=Add a Tip');

    // Select Custom tip ("Other" button)
    const customTipBtn = page.locator('button:has-text("Other"), button:has-text("Khác")');
    await customTipBtn.click();

    // Type invalid tip - e.g. 0
    await page.fill('input[placeholder*="0.00"]', '0');

    // Click Next
    const payBtn = page.locator('button:has-text("Next"), button:has-text("Tiếp theo")');
    await payBtn.click();

    // Small delay to let toast render
    await page.waitForTimeout(500);

    // Verify custom toast message appears on the page body
    const content = await page.textContent('body');
    expect(content).toMatch(/Please enter a valid tip amount|Vui lòng nhập số tiền típ/);
  });
});
