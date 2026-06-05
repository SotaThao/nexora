// Standalone E2E verification script using CloakBrowser directly.
// This bypasses Vitest launcher errors while executing the exact same E2E test flows.
//
// Usage: node scripts/test-staff-e2e.js
// Assumes dev server is running on http://localhost:3000.

import { launch } from 'cloakbrowser';

async function run() {
  console.log("🚀 Launching CloakBrowser in headless mode...");
  const browser = await launch({
    headless: true,
  });
  const page = await browser.newPage();
  
  try {
    console.log("🌐 Navigating to http://localhost:3000 ...");
    await page.goto('http://localhost:3000');
    
    // 1. Wait for the login screen
    await page.waitForSelector('text=NEXORA', { timeout: 15000 });
    console.log("✓ Login screen rendered successfully.");

    // Toggle language to English (EN) for consistent text checks
    console.log("👉 Switching language to English...");
    const langEnBtn = page.getByRole('button', { name: 'EN', exact: true });
    await langEnBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Language toggled to English.");

    // ==========================================
    // TEST FLOW A: DEMO STAFF LOGIN SIMULATION
    // ==========================================
    console.log("\n--- TEST FLOW A: Demo Staff Login ---");
    
    // Click "Staff Login (Personal Dashboard)" to login
    const staffLoginBtn = page.locator('button:has-text("Staff Login (Personal Dashboard)")');
    if (!(await staffLoginBtn.isVisible())) {
      throw new Error("Staff Login button not found on screen.");
    }
    await staffLoginBtn.click();
    console.log("✓ Clicked 'Staff Login (Personal Dashboard)' button.");

    // Verify landing on Staff Dashboard
    await page.waitForSelector('text=Mia Tran', { timeout: 15000 });
    let content = await page.textContent('body');
    if (!content.includes('Mia Tran') || !content.includes('Golden Glow Nail Spa & Salon')) {
      throw new Error("Failed to verify Mia Tran profile or salon name on dashboard.");
    }
    console.log("✓ Successfully loaded Staff Personal Dashboard for Mia Tran.");

    // Navigate to "My QR"
    console.log("👉 Navigating to 'My QR' tab...");
    const qrTab = page.locator('button:has-text("My QR")').first();
    await qrTab.click();
    await page.waitForSelector('text=My Personal QR', { timeout: 10000 });
    content = await page.textContent('body');
    if (!content.includes('NEX-STAFF-MIA0123')) {
      throw new Error("Staff ID 'NEX-STAFF-MIA0123' missing on My QR page.");
    }
    console.log("✓ Verified My QR tab. Personal QR Code & Staff ID verified.");

    // Navigate to "Tips"
    console.log("👉 Navigating to 'Tips' tab...");
    const tipsTab = page.locator('button:has-text("Tips")').first();
    await tipsTab.click();
    await page.waitForSelector('text=Tip Activity', { timeout: 10000 });
    console.log("✓ Verified Tips history tab loaded successfully.");

    // Navigate to "Pay"
    console.log("👉 Navigating to 'Pay' tab...");
    const payTab = page.locator('button:has-text("Pay")').first();
    await payTab.click();
    await page.waitForSelector('text=Payment Methods', { timeout: 10000 });
    content = await page.textContent('body');
    if (!content.includes('Cash App') || !content.includes('Venmo')) {
      throw new Error("Missing payout methods (Cash App / Venmo) on Pay tab.");
    }
    console.log("✓ Verified Payout Methods configuration tab.");

    // Navigate to "Profile"
    console.log("👉 Navigating to 'Profile' tab...");
    const profileTab = page.locator('button:has-text("Profile")').first();
    await profileTab.click();
    await page.waitForSelector('text=Staff Profile', { timeout: 10000 });
    console.log("✓ Verified Profile & Custom Business Nicknames tab.");

    // Sign Out
    console.log("👉 Signing out...");
    const logoutBtn = page.locator('button:has-text("Sign Out")').first();
    await logoutBtn.click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Signed out successfully. Returned to Login screen.");

    // ==========================================
    // TEST FLOW B: ROLE-BASED REGISTRATION & ROUTING
    // ==========================================
    console.log("\n--- TEST FLOW B: Custom Staff Registration & Routing ---");

    // Click "Register New Store"
    const registerBtn = page.locator('button:has-text("Register New Store")').first();
    await registerBtn.click();
    await page.waitForSelector('text=Choose Account Type', { timeout: 10000 });
    console.log("✓ Rendered Step 0: Role Selection.");

    // Select Technician / Staff Member
    const staffCard = page.locator('button:has-text("Technician / Staff Member")');
    await staffCard.click();
    console.log("✓ Selected Personal (Staff) role.");

    // Click Next
    const nextBtn0 = page.locator('button:has-text("Next")').last();
    await nextBtn0.click();
    await page.waitForSelector('text=Step 1: Create New Account', { timeout: 10000 });
    console.log("✓ Rendered Step 1: Credentials Form.");

    // Generate unique credentials
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const staffEmail = `e2e_staff_${uniqueId}@nexora.com`;
    const staffName = `John Doe ${uniqueId}`;
    const staffPass = 'password123';

    // Fill in Details
    console.log(`👉 Filling registration details for ${staffName}...`);
    await page.locator('input[placeholder*="Mia Tran"]').fill(staffName);
    await page.locator('input[placeholder="partner@yourstore.com"]').fill(staffEmail);
    await page.locator('input[placeholder*="Re-enter email"]').fill(staffEmail);
    await page.locator('input[type="password"]').fill(staffPass);
    
    // Submit registration form
    await page.locator('button[type="submit"]').click();
    
    // Wait for Success screen
    await page.waitForSelector('text=Staff Account Registered!', { timeout: 10000 });
    console.log("✓ Rendered Step 2: Staff Success screen.");

    // Get the generated Staff ID
    const staffIdText = await page.locator('span:has-text("NEX-STAFF-")').textContent();
    console.log(`✓ Custom registered Staff ID: ${staffIdText}`);

    // Click "Log In to Staff Dashboard" to return to Login
    const loginBackBtn = page.locator('button:has-text("Log In to Staff Dashboard")');
    await loginBackBtn.click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Returned to Login screen.");

    // Login using the registered credentials
    console.log(`👉 Logging in as ${staffEmail}...`);
    await page.locator('input[type="email"]').fill(staffEmail);
    await page.locator('input[type="password"]').fill(staffPass);
    await page.locator('button:has-text("Đăng nhập qua VLINKPAY SSO")').click();

    // Verify routing straight to Staff Dashboard and displaying the registered full name
    await page.waitForSelector(`text=${staffName}`, { timeout: 15000 });
    content = await page.textContent('body');
    if (!content.includes(staffIdText)) {
      throw new Error(`Logged in staff page does not display registered Staff ID: ${staffIdText}`);
    }
    console.log(`✓ Verified role routing: Successfully loaded dashboard showing name "${staffName}" and Staff ID "${staffIdText}"!`);

    // Logout
    console.log("👉 Signing out of the new staff account...");
    await page.locator('button:has-text("Sign Out")').first().click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Signed out successfully.");

    console.log("\n🎉 ★★★ ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ★★★");
    
  } catch (err) {
    console.error("\n❌ E2E Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log("🔒 Browser session closed.");
  }
}

run();
