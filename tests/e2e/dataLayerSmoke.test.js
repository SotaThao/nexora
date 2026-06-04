import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { launch } from 'cloakbrowser'

const BASE_URL = 'http://127.0.0.1:3000'
const SCREENSHOT_DIR = join(process.cwd(), 'openspec/changes/restructure-data-layer-for-api/smoke-screenshots')

function assertNoBrowserErrors(errors) {
  expect(errors).toEqual([])
}

describe('Data-layer migration manual smoke coverage', () => {
  let browser

  beforeAll(async () => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true })
    browser = await launch({
      headless: true,
      slowMo: 0,
    })
  })

  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })

  async function newSmokePage(viewport) {
    const page = await browser.newPage()
    const errors = []
    if (viewport) {
      await page.setViewportSize(viewport)
    }
    page.on('pageerror', (err) => {
      errors.push(`pageerror: ${err.message}`)
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`)
      }
    })
    await page.goto(BASE_URL)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()
    return { page, errors }
  }

  it('loads merchant dashboard and settings after quick demo seed', async () => {
    const { page, errors } = await newSmokePage({ width: 1366, height: 900 })

    await page.waitForSelector('text=NEXORA', { timeout: 15000 })
    await page.locator('button:has-text("Enter Dashboard"), button:has-text("Vào thẳng Dashboard")').click()
    await page.waitForSelector('text=Golden Glow Nail Spa', { timeout: 15000 })

    await page.locator('button:has-text("Settings")').first().click()
    await page.waitForSelector('text=Settings Configuration', { timeout: 15000 })
    const content = await page.textContent('body')
    expect(content).toContain('Payout Methods')

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'merchant-settings-desktop.png'), fullPage: true })
    assertNoBrowserErrors(errors)
    await page.close()
  })

  it('loads customer tip flow on mobile and reaches payment selection', async () => {
    const { page, errors } = await newSmokePage({ width: 390, height: 844 })

    await page.goto(`${BASE_URL}/?flow=customer&tech=staff/mia-t&biz=Golden+Glow+Nail+Spa`)
    await page.waitForSelector('text=Add a Tip', { timeout: 15000 })
    await page.locator('button:has-text("$5")').click()
    await page.locator('button:has-text("Next"), button:has-text("Tiếp theo")').click()
    await page.waitForSelector('text=How would you like to pay?', { timeout: 15000 })

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'customer-payment-mobile.png'), fullPage: true })
    assertNoBrowserErrors(errors)
    await page.close()
  })

  it('loads staff dashboard from the simulation panel', async () => {
    const { page, errors } = await newSmokePage({ width: 1280, height: 850 })

    await page.waitForSelector('text=NEXORA', { timeout: 15000 })
    await page.locator('button:has-text("Staff Login (Personal Dashboard)"), button:has-text("Đăng nhập Staff")').click()
    await page.waitForSelector('text=Mia Tran', { timeout: 15000 })
    const content = await page.textContent('body')
    expect(content).toContain('Golden Glow Nail Spa')
    expect(content).toMatch(/Pending Confirmations|Chờ xác nhận/)

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'staff-dashboard-desktop.png'), fullPage: true })
    assertNoBrowserErrors(errors)
    await page.close()
  })

  it('loads register wizard account-type screen', async () => {
    const { page, errors } = await newSmokePage({ width: 1280, height: 850 })

    await page.waitForSelector('text=NEXORA', { timeout: 15000 })
    await page.locator('button:has-text("Register New Store")').click()
    await page.waitForSelector('text=Choose Account Type', { timeout: 15000 })
    const content = await page.textContent('body')
    expect(content).toContain('Personal Account')

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'register-account-type-desktop.png'), fullPage: true })
    assertNoBrowserErrors(errors)
    await page.close()
  })

  it('loads staff invite registration portal', async () => {
    const { page, errors } = await newSmokePage({ width: 390, height: 844 })

    await page.goto(`${BASE_URL}/?flow=staff-invite&biz=Golden+Glow+Nail+Spa`)
    await page.waitForSelector('text=Complete Your Personal Tip Account', { timeout: 15000 })
    const content = await page.textContent('body')
    expect(content).toContain('Golden Glow Nail Spa')

    await page.screenshot({ path: join(SCREENSHOT_DIR, 'staff-invite-mobile.png'), fullPage: true })
    assertNoBrowserErrors(errors)
    await page.close()
  })
})
