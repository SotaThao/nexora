// Standalone E2E verification script testing registration edge cases & routing.
// Usage: node scripts/test-registration-edge-cases.js
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
    
    // Wait for the login screen
    await page.waitForSelector('text=NEXORA', { timeout: 15000 });
    console.log("✓ Login screen rendered.");

    // Switch language to English (EN) for consistent text assertion
    console.log("👉 Switching language to English...");
    const langEnBtn = page.getByRole('button', { name: 'EN', exact: true });
    await langEnBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Language toggled to English.");

    // Navigating to Registration Screen
    console.log("👉 Navigating to Register Wizard...");
    const registerBtn = page.locator('button:has-text("Register New Store")').first();
    await registerBtn.click();
    await page.waitForSelector('text=Choose Account Type', { timeout: 10000 });
    console.log("✓ Step 0 (Role Selection) rendered successfully.");

    // Select Personal (Staff) role card
    const staffCard = page.locator('button:has-text("Technician / Staff Member")');
    await staffCard.click();
    console.log("✓ Selected Personal (Staff) role.");

    // Proceed to Step 1
    const nextBtn0 = page.locator('button:has-text("Next")').last();
    await nextBtn0.click();
    await page.waitForSelector('text=Step 1: Create New Account', { timeout: 10000 });
    console.log("✓ Step 1 (Credentials Form) rendered.");

    // ==========================================
    // EDGE CASE 1: EMPTY FIELD VALIDATIONS
    // ==========================================
    console.log("\n--- Edge Case 1: Empty Field Validation Checks ---");
    // Clear any autofilled fields and click submit
    await page.locator('input[placeholder*="Mia Tran"]').fill('');
    await page.locator('input[placeholder="partner@yourstore.com"]').fill('');
    await page.locator('input[placeholder*="Re-enter email"]').fill('');
    await page.locator('input[type="password"]').fill('');
    
    console.log("👉 Submitting empty form...");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    // Verify error messages
    const textContent = await page.textContent('body');
    if (!textContent.includes('Full name is required')) {
      throw new Error("Validation failed: 'Full name is required' error not displayed.");
    }
    if (!textContent.includes('Email is required')) {
      throw new Error("Validation failed: 'Email is required' error not displayed.");
    }
    if (!textContent.includes('Please confirm your email')) {
      throw new Error("Validation failed: 'Please confirm your email' error not displayed.");
    }
    if (!textContent.includes('Password is required')) {
      throw new Error("Validation failed: 'Password is required' error not displayed.");
    }
    console.log("✓ All empty field validations verified successfully.");

    // ==========================================
    // EDGE CASE 2: INVALID EMAIL FORMAT
    // ==========================================
    console.log("\n--- Edge Case 2: Invalid Email Format Check ---");

    const inputsInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input')).map(el => ({
        placeholder: el.placeholder,
        value: el.value,
        type: el.type
      }));
    });
    console.log("Inputs info on page:", inputsInfo);

    await page.locator('input[placeholder*="Mia Tran"]').fill('Edge Tester');
    await page.locator('input[placeholder="partner@yourstore.com"]').fill('invalidemail');
    await page.locator('input[placeholder*="Re-enter email"]').fill('invalidemail');
    await page.locator('input[type="password"]').fill('password123');

    console.log("👉 Submitting invalid email form...");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    console.log("Current page body text:", await page.textContent('body'));

    // Debug print current errors on screen
    const errorsHtml = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.text-red-500')).map(el => el.textContent);
    });
    console.log("Current errors on screen:", errorsHtml);

    let updatedContent = await page.textContent('body');
    if (!updatedContent.includes('Invalid email address format')) {
      throw new Error("Validation failed: 'Invalid email address format' error not displayed.");
    }
    console.log("✓ Email format validation verified.");

    // ==========================================
    // EDGE CASE 3: EMAIL MISMATCH
    // ==========================================
    console.log("\n--- Edge Case 3: Email Mismatch Check ---");
    await page.locator('input[placeholder="partner@yourstore.com"]').fill('tester@test.com');
    await page.locator('input[placeholder*="Re-enter email"]').fill('different@test.com');

    console.log("👉 Submitting mismatched email form...");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    updatedContent = await page.textContent('body');
    if (!updatedContent.includes('Emails do not match')) {
      throw new Error("Validation failed: 'Emails do not match' error not displayed.");
    }
    console.log("✓ Email mismatch validation verified.");

    // ==========================================
    // EDGE CASE 4: SHORT PASSWORD
    // ==========================================
    console.log("\n--- Edge Case 4: Short Password Check ---");
    await page.locator('input[placeholder="partner@yourstore.com"]').fill('tester@test.com');
    await page.locator('input[placeholder*="Re-enter email"]').fill('tester@test.com');
    await page.locator('input[type="password"]').fill('123');

    console.log("👉 Submitting short password form...");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(500);

    updatedContent = await page.textContent('body');
    if (!updatedContent.includes('Password must be at least 6 characters long')) {
      throw new Error("Validation failed: 'Password must be at least 6 characters long' error not displayed.");
    }
    console.log("✓ Password length validation verified.");

    // ==========================================
    // VALID REGISTRATION FLOW
    // ==========================================
    console.log("\n--- Valid Registration Flow ---");
    const uniqueId = Math.floor(1000 + Math.random() * 9000);
    const validEmail = `edge_tester_${uniqueId}@nexora.com`;
    const validName = `Edge Tester ${uniqueId}`;
    const validPass = 'securepass123';

    await page.locator('input[placeholder*="Mia Tran"]').fill(validName);
    await page.locator('input[placeholder="partner@yourstore.com"]').fill(validEmail);
    await page.locator('input[placeholder*="Re-enter email"]').fill(validEmail);
    await page.locator('input[type="password"]').fill(validPass);

    console.log("👉 Submitting valid details...");
    await page.locator('button[type="submit"]').click();

    // Verify Success screen
    await page.waitForSelector('text=Staff Account Registered!', { timeout: 10000 });
    console.log("✓ Step 2 (Staff Success Screen) loaded successfully.");

    // Verify KYB alert is absent
    const pageBody = await page.textContent('body');
    if (pageBody.includes('KYB PENDING') || pageBody.includes('CHƯA XÁC THỰC KYB')) {
      throw new Error("Validation failed: KYB status indicator is incorrectly shown on Staff success page.");
    }
    console.log("✓ Verified that KYB verification warnings are bypassed for Staff registration.");

    // Retrieve generated Staff ID
    const staffIdText = await page.locator('span:has-text("NEX-STAFF-")').textContent();
    console.log(`✓ Generated Staff ID: ${staffIdText}`);

    // Return to login screen
    console.log("👉 Returning to Login screen...");
    await page.locator('button:has-text("Log In to Staff Dashboard")').click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Returned to Login screen successfully.");

    // ==========================================
    // EDGE CASE 5: ROUTING & IDENTITY RESOLUTION
    // ==========================================
    console.log("\n--- Edge Case 5: Login Routing & Profile Context Check ---");
    console.log(`👉 Logging in as ${validEmail}...`);
    await page.locator('input[type="email"]').fill(validEmail);
    await page.locator('input[type="password"]').fill(validPass);
    await page.locator('button:has-text("Đăng nhập qua VLINKPAY SSO")').click();

    // Verify landing on Staff Dashboard and rendering custom staff name and Staff ID
    await page.waitForSelector(`text=${validName}`, { timeout: 15000 });
    let dashboardContent = await page.textContent('body');
    if (!dashboardContent.includes(staffIdText)) {
      throw new Error(`Profile dashboard does not contain the generated Staff ID: ${staffIdText}`);
    }
    console.log("✓ Verified routing and identity resolution: Custom profile name and Staff ID rendered correctly.");

    // Sign out
    console.log("👉 Signing out...");
    await page.locator('button:has-text("Sign Out")').first().click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Logged out successfully.");

    // ==========================================
    // EDGE CASE 6: SIMULATION PANEL INTEGRATION
    // ==========================================
    console.log("\n--- Edge Case 6: Simulation Panel Checking ---");
    
    // Check that the newly registered email shows up in the simulation panel database
    const simAccountRow = page.locator('div.p-2').filter({ hasText: validEmail }).first();
    if (!(await simAccountRow.isVisible())) {
      throw new Error("Simulated Accounts Database list is missing the newly registered account.");
    }
    console.log("✓ Custom registered account is present in the Simulation Panel.");

    // Verify role badge matches personal
    const personalBadge = simAccountRow.locator('span:has-text("personal")');
    if (!(await personalBadge.isVisible())) {
      throw new Error("Simulated account does not display the 'personal' role badge.");
    }
    console.log("✓ Simulated account displays 'personal' role badge.");

    // Verify CYCLE button is hidden for personal role
    const cycleBtn = simAccountRow.locator('button:has-text("CYCLE")');
    if (await cycleBtn.isVisible()) {
      throw new Error("Simulation error: Verification CYCLE button should be hidden for personal staff accounts.");
    }
    console.log("✓ Verification CYCLE button is correctly hidden for Personal accounts.");

    // Click the automatic LOGIN button in the simulation panel
    console.log("👉 Triggering quick login via Simulation Panel...");
    const loginBtn = simAccountRow.locator('button:has-text("LOGIN")');
    await loginBtn.click();

    // Verify automatic login routes directly to correct dashboard
    await page.waitForSelector(`text=${validName}`, { timeout: 15000 });
    dashboardContent = await page.textContent('body');
    if (!dashboardContent.includes(staffIdText)) {
      throw new Error("Auto login did not route to correct staff dashboard layout.");
    }
    console.log("✓ Quick login routed successfully to correct Staff Dashboard!");

    // Final clean signout
    await page.locator('button:has-text("Sign Out")').first().click();
    await page.waitForSelector('text=NEXORA', { timeout: 10000 });
    console.log("✓ Final signout complete.");

    console.log("\n🎉 ★★★ ALL EDGE CASE VERIFICATIONS PASSED SUCCESSFULLY! ★★★");

  } catch (err) {
    console.error("\n❌ E2E Edge Cases Verification failed:", err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log("🔒 Browser session closed.");
  }
}

run();
