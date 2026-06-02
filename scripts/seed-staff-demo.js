// Repeatable demo seed for the Staff personal dashboard.
// Upserts merchant setup + transactions + the demo staff account into the
// Supabase `nexora_sync` KV table so the PO demo has real, synced data.
//
// Usage: node scripts/seed-staff-demo.js
// Requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { INITIAL_STAFF, INITIAL_TRANSACTIONS, INITIAL_REVIEWS } from '../src/components/dashboard/data/mockData.js'
import { DEMO_STAFF_ID, makeDemoStaffAccount } from '../src/components/staff-dashboard/data/staffMockData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STORAGE_PREFIX = 'nexora_v3_'

// Minimal .env loader (no dotenv dependency).
function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, '../.env'), 'utf8')
    const env = {}
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
    return env
  } catch (e) {
    return {}
  }
}

const env = loadEnv()
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const supabase = createClient(url, anonKey)
const now = Date.now()
const withStamp = (obj) => ({ ...obj, _client_updated_at: now })

const merchantSetup = withStamp({
  businessInfo: {
    name: 'Golden Glow Nail Spa & Salon',
    industry: 'Nail Salon',
    address: '1088 Gold Coast Hwy, Palm Beach, QLD 4221',
    phone: '+1 (555) 789-2026',
    website: 'https://goldenglownails.com',
    logo: null,
    paymentAccounts: {
      venmo: '@goldenglow-spa',
      cashapp: '$goldenglownails',
      zelle: 'payment@goldenglownails.com',
      vlinkpay: 'VLP-8893-GG'
    }
  },
  staffList: INITIAL_STAFF
})

const miaMember = INITIAL_STAFF.find((s) => s.id === DEMO_STAFF_ID) || INITIAL_STAFF[0]
const staffAccount = withStamp({ [DEMO_STAFF_ID]: makeDemoStaffAccount(miaMember) })

// Transactions/reviews are stored as bare arrays (matching the app's
// JSON.stringify(INITIAL_TRANSACTIONS)); merchant setup & staff account are objects.
const rows = [
  { id: `${STORAGE_PREFIX}nexora_merchant_setup`, data: merchantSetup },
  { id: `${STORAGE_PREFIX}nexora_transactions`, data: INITIAL_TRANSACTIONS },
  { id: `${STORAGE_PREFIX}nexora_reviews`, data: INITIAL_REVIEWS },
  { id: `${STORAGE_PREFIX}nexora_staff_account`, data: staffAccount }
].map((r) => ({ ...r, updated_at: new Date(now).toISOString() }))

async function main() {
  console.log(`Seeding ${rows.length} rows into nexora_sync …`)
  for (const row of rows) {
    const { error } = await supabase.from('nexora_sync').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error(`✗ ${row.id}:`, error.message)
      process.exitCode = 1
    } else {
      console.log(`✓ ${row.id}`)
    }
  }
  console.log('Done. Demo staff:', DEMO_STAFF_ID)
}

main()
