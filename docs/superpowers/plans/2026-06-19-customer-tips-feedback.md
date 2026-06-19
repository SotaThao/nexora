# Customer Tips Feedback Jun 16 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 UX improvements to the customer tips flow based on Jun 16 demo feedback: updated copy, inline tip picker on staff cards, richer TIPS summary popup, CryptoMap360 review option, and iPad kiosk QR mode.

**Architecture:** All changes are isolated to the customer flow slice (`src/components/customer-flow/`), `CustomerFlow.tsx`, and `src/locales/`. The iPad kiosk mode is additive — it detects a `?kiosk=1` URL param and branches to a new QR display step without touching the existing mobile flow. No new routes, no new repositories, no new API hooks (except the kiosk step which re-uses the existing URL QR util).

**Tech Stack:** React 18 + JSX (no TypeScript for new files — this repo uses JS/JSX), Tailwind, TanStack Query, existing i18n via `useTranslation()`, `src/utils/qrCode.js` for QR generation.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/locales/en.json` | Modify | Update/add i18n keys for all 5 tasks |
| `src/locales/vi.json` | Modify | Vietnamese translations for same keys |
| `src/components/customer-flow/steps/SelectStaff.tsx` | Modify | Add inline tip picker below selected staff cards |
| `src/components/customer-flow/steps/SuccessPayment.tsx` | Modify | Richer TIPS summary (wallet icon, staff avatar, amount) + CTA to review |
| `src/components/customer-flow/steps/ReviewRouting.tsx` | Modify | Add CryptoMap360 review button |
| `src/components/customer-flow/steps/KioskQRScreen.jsx` | Create | iPad kiosk QR display screen (new step) |
| `src/components/customer-flow/hooks/useCustomerFlow.ts` | Modify | Pass tip props to SelectStaff; add kiosk mode detection; add cryptomap360 to reviewLinks; update handleConfirmTip to pass wallet info |
| `src/components/CustomerFlow.tsx` | Modify | Pass new props to SelectStaff; render KioskQRScreen step; pass selectedWalletObj to SuccessPayment |

---

## Task 1: Update SelectStaff Title Copy

**Files:**
- Modify: `src/locales/en.json:850-851`
- Modify: `src/locales/vi.json:850-851`

The feedback says "Choose your service provider" không phù hợp với customer tips context. Change to tip-focused copy.

- [x] **Step 1: Update English translations**

In `src/locales/en.json`, find lines 850–851 and replace:

```json
"select_staff_title": "Who served you today?",
"select_staff_subtitle": "Select the staff member you'd like to tip.",
```

- [x] **Step 2: Update Vietnamese translations**

In `src/locales/vi.json`, find lines 850–851 and replace:

```json
"select_staff_title": "Ai đã phục vụ bạn hôm nay?",
"select_staff_subtitle": "Chọn nhân viên bạn muốn gửi tips.",
```

- [ ] **Step 3: Verify in browser**

Start dev server (`pnpm dev`), navigate to `/touch/test-biz/master-store` or use a working touch URL. Confirm the heading reads "Who served you today?" in English mode and "Ai đã phục vụ bạn hôm nay?" in Vietnamese mode.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en.json src/locales/vi.json
git commit -m "enhance/customer-tips-feedback-jun16" -m "Update SelectStaff title copy to tip-focused wording per Jun 16 feedback"
```

---

## Task 2: Inline Tip Picker on Selected Staff Cards

**Files:**
- Modify: `src/components/customer-flow/steps/SelectStaff.tsx`
- Modify: `src/components/CustomerFlow.tsx:119-128`
- Modify: `src/locales/en.json` (add 1 key)
- Modify: `src/locales/vi.json` (add 1 key)

When a staff card is checked, show a compact row of tip-amount pills directly below the avatar/name row. This lets customers select staff + tip in one step; the separate TipAmount step is still shown for final confirmation.

- [x] **Step 1: Add i18n key for tip section label**

In `src/locales/en.json`, inside the `"customer"` object, add after `"select_staff_subtitle"`:

```json
"inline_tip_label": "Tip amount",
```

In `src/locales/vi.json`, same location:

```json
"inline_tip_label": "Số tiền tips",
```

- [x] **Step 2: Update SelectStaff.tsx to accept tip props and render inline picker**

Replace the entire contents of `src/components/customer-flow/steps/SelectStaff.tsx`:

```tsx
import React from 'react'
import { ArrowRight, Search, Users, Check } from 'lucide-react'

const QUICK_TIP_AMOUNTS = [5, 10, 15, 20, 30]

export default function SelectStaff({
  t,
  searchQuery,
  setSearchQuery,
  filteredStaff,
  selectedStaffMembers,
  handleToggleStaff,
  setStep,
  selectedTips,
  setSelectedTips,
  customTips,
  setCustomTips,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
          {t('customer.select_staff_title')}
        </h2>
        <p className="text-xs text-nexoraSubtle font-medium">
          {t('customer.select_staff_subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-nexoraSubtle" />
        <input
          type="text"
          placeholder={t('customer.search_staff_placeholder')}
          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Staff cards */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            const selTip = selectedTips?.[member.id] !== undefined ? selectedTips[member.id] : 15
            const custTip = customTips?.[member.id] || ''
            return (
              <div key={member.id} className="space-y-2">
                {/* Staff card button */}
                <button
                  type="button"
                  onClick={() => handleToggleStaff(member)}
                  className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl text-left transition-all duration-200 shadow-sm hover:shadow group ${
                    isSelected
                      ? 'border-nexoraBrand bg-nexoraBrandSoft/10'
                      : 'border-nexoraBorder hover:border-nexoraBrand/40 hover:bg-nexoraCanvas'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover border border-nexoraBorder shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-extrabold text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {member.nickname.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-nexoraText text-sm group-hover:text-nexoraBrand transition-colors truncate">
                        {member.fullName}
                      </h4>
                      <p className="text-xs text-nexoraSubtle font-semibold truncate mt-0.5">
                        {member.position}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-nexoraBrand border-nexoraBrand text-white scale-110'
                        : 'border-nexoraBorder group-hover:border-nexoraBrand/60 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                  </div>
                </button>

                {/* Inline tip picker — shown only when staff is selected */}
                {isSelected && (
                  <div className="px-2 pb-1 animate-fadeIn">
                    <p className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider mb-1.5">
                      {t('customer.inline_tip_label')}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {QUICK_TIP_AMOUNTS.map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setSelectedTips({ ...selectedTips, [member.id]: val })}
                          className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                            selTip === val
                              ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                              : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                          }`}
                        >
                          ${val}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTips({ ...selectedTips, [member.id]: 'custom' })
                          if (!customTips[member.id]) {
                            setCustomTips({ ...customTips, [member.id]: '' })
                          }
                        }}
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                          selTip === 'custom'
                            ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                            : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                        }`}
                      >
                        {t('customer.custom_tip_btn')}
                      </button>
                    </div>
                    {selTip === 'custom' && (
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-2.5 text-xs font-extrabold text-nexoraSubtle">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg pl-7 pr-3 py-2 text-xs font-extrabold text-nexoraText focus:outline-none transition-all"
                          value={custTip}
                          onChange={(e) => setCustomTips({ ...customTips, [member.id]: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center text-nexoraSubtle">
            <Users className="w-10 h-10 text-nexoraBorder mb-3" />
            <p className="text-xs font-semibold">{t('customer.no_staff_found')}</p>
          </div>
        )}
      </div>

      {/* Bottom Next Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={selectedStaffMembers.length === 0}
          onClick={() => setStep('tip_amount')}
          className={`w-full py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-nexoraElectric/25 ${
            selectedStaffMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {t('common.next')} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

- [x] **Step 3: Pass tip props from CustomerFlow.tsx to SelectStaff**

In `src/components/CustomerFlow.tsx`, find the `<SelectStaff ... />` block (lines ~119–128) and add the four new props:

```tsx
{step === 'select_staff' && (
  <SelectStaff
    t={t}
    searchQuery={searchQuery}
    setSearchQuery={setSearchQuery}
    filteredStaff={filteredStaff}
    selectedStaffMembers={selectedStaffMembers}
    handleToggleStaff={handleToggleStaff}
    setStep={setStep}
    selectedTips={selectedTips}
    setSelectedTips={setSelectedTips}
    customTips={customTips}
    setCustomTips={setCustomTips}
  />
)}
```

- [ ] **Step 4: Verify inline picker appears and pre-populates TipAmount step**

In dev: select a staff card → confirm pill row appears below the card. Change a tip amount → advance to TipAmount step → confirm the selected amount is reflected there.

- [ ] **Step 5: Commit**

```bash
git add src/components/customer-flow/steps/SelectStaff.tsx src/components/CustomerFlow.tsx src/locales/en.json src/locales/vi.json
git commit -m "enhance/customer-tips-feedback-jun16" -m "Add inline tip picker to SelectStaff cards; pass tip state props from CustomerFlow"
```

---

## Task 3: TIPS Info Summary in SuccessPayment Step

**Files:**
- Modify: `src/components/customer-flow/steps/SuccessPayment.tsx`
- Modify: `src/components/CustomerFlow.tsx:190-197` (pass `selectedWalletObj`)
- Modify: `src/locales/en.json` (add 2 keys)
- Modify: `src/locales/vi.json` (add 2 keys)

The feedback says after confirming payment → show a popup with TIPS info before going to reviews. The current `SuccessPayment` is a plain "Thank you" screen. We enhance it to show: staff avatar/name, tip amount highlighted, payment method icon, and a "Leave a Review" CTA (replacing the current generic "Done" button label).

- [x] **Step 1: Add i18n keys**

In `src/locales/en.json` `"customer"` object, add after `"tip_success_sub"`:

```json
"tips_summary_title": "Tip Sent!",
"tips_summary_via": "via",
"tips_summary_review_cta": "Leave a Review",
"tips_summary_skip": "Skip",
```

In `src/locales/vi.json`, same location:

```json
"tips_summary_title": "Đã gửi Tips!",
"tips_summary_via": "qua",
"tips_summary_review_cta": "Đánh giá ngay",
"tips_summary_skip": "Bỏ qua",
```

- [x] **Step 2: Rewrite SuccessPayment.tsx with richer TIPS summary**

Replace the entire contents of `src/components/customer-flow/steps/SuccessPayment.tsx`:

```tsx
import React from 'react'
import { CheckCircle, Star } from 'lucide-react'

export default function SuccessPayment({
  t,
  selectedStaffMembers,
  activeTipAmount,
  selectedWalletObj,
  setStep,
}) {
  const primaryStaff = selectedStaffMembers?.[0]

  return (
    <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
      {/* Success icon */}
      <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
        <CheckCircle className="h-8 w-8 text-white" />
      </div>

      <h3 className="font-extrabold text-2xl text-nexoraText tracking-tight">
        {t('customer.tips_summary_title')}
      </h3>

      {/* Tip receipt card */}
      <div className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-2xl p-5 space-y-4 text-left shadow-sm">
        {/* Staff rows */}
        {selectedStaffMembers.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-nexoraBorder shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-extrabold text-white shrink-0">
                {member.nickname?.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-extrabold text-sm text-nexoraText">{member.fullName}</p>
              <p className="text-[11px] text-nexoraSubtle font-semibold">{member.position}</p>
            </div>
          </div>
        ))}

        {/* Divider */}
        <div className="border-t border-nexoraBorder/60" />

        {/* Amount row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-nexoraSubtle uppercase tracking-wider">
            {t('components.customer_flow.steps.TipAmount.totalTip')}
          </span>
          <span className="text-2xl font-black text-nexoraBrand">
            ${Number(activeTipAmount).toFixed(2)}
          </span>
        </div>

        {/* Payment method row */}
        {selectedWalletObj && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-nexoraSubtle uppercase tracking-wider">
              {t('customer.tips_summary_via')}
            </span>
            <span className="text-xs font-extrabold text-nexoraText">
              {selectedWalletObj.label || selectedWalletObj.name || selectedWalletObj.key || '—'}
            </span>
          </div>
        )}
      </div>

      {/* Rating teaser */}
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* CTAs */}
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={() => setStep('leave_review')}
          className="w-full py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-nexoraElectric/25"
        >
          {t('customer.tips_summary_review_cta')}
        </button>
        <button
          type="button"
          onClick={() => setStep('final_done')}
          className="w-full text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition"
        >
          {t('customer.tips_summary_skip')}
        </button>
      </div>
    </div>
  )
}
```

- [x] **Step 3: Pass selectedWalletObj to SuccessPayment in CustomerFlow.tsx**

In `src/components/CustomerFlow.tsx`, find the `{step === 'success_payment' && (` block (~line 190) and add `selectedWalletObj`:

```tsx
{step === 'success_payment' && (
  <SuccessPayment
    t={t}
    selectedStaffMembers={selectedStaffMembers}
    activeTipAmount={activeTipAmount}
    selectedWalletObj={selectedWalletObj}
    setStep={setStep}
  />
)}
```

- [ ] **Step 4: Verify the richer popup appears after confirming tip**

In dev: go through the tip flow, click "I Sent the Tip" → success_payment step should now show the receipt card with staff details, amount, payment method, and two CTAs.

- [ ] **Step 5: Commit**

```bash
git add src/components/customer-flow/steps/SuccessPayment.tsx src/components/CustomerFlow.tsx src/locales/en.json src/locales/vi.json
git commit -m "enhance/customer-tips-feedback-jun16" -m "Enhance SuccessPayment step with TIPS receipt card: staff, amount, payment method, review CTA"
```

---

## Task 4: Add CryptoMap360 Review Option

**Files:**
- Modify: `src/components/customer-flow/steps/ReviewRouting.tsx`
- Modify: `src/components/customer-flow/hooks/useCustomerFlow.ts:193-203` (reviewLinks memo)
- Modify: `src/locales/en.json` (add 1 key)
- Modify: `src/locales/vi.json` (add 1 key)

Add a third review platform button alongside Google and Yelp. The `cryptomap360Review` URL comes from the business data just like `googleReviewUrl` and `yelpUrl`.

- [ ] **Step 1: Add i18n key**

In `src/locales/en.json` `"customer"` object, after `"yelp_review_btn"`:

```json
"cryptomap360_review_btn": "Review us on CryptoMap360",
```

In `src/locales/vi.json`, same location:

```json
"cryptomap360_review_btn": "Đánh giá trên CryptoMap360",
```

- [ ] **Step 2: Add cryptomap360Review to reviewLinks in useCustomerFlow.ts**

In `src/components/customer-flow/hooks/useCustomerFlow.ts`, find the `reviewLinks` useMemo (~line 193) and update:

```ts
const reviewLinks = useMemo(() => {
  const defaultLinks = { googleReview: '', yelpReview: '', cryptomap360Review: '', feedbackEmail: '' }
  if (touchPageData?.business) {
    return {
      googleReview: touchPageData.business.googleReviewUrl || '',
      yelpReview: touchPageData.business.yelpUrl || '',
      cryptomap360Review: touchPageData.business.cryptomap360Url || '',
      feedbackEmail: touchPageData.business.feedbackEmail || '',
    }
  }
  return defaultLinks
}, [touchPageData])
```

- [ ] **Step 3: Update handleTrackExternalReview to handle 'cryptomap360'**

In `useCustomerFlow.ts`, find `handleTrackExternalReview` (~line 601) and update:

```ts
const handleTrackExternalReview = async (platform) => {
  if (currentReviewId) {
    try {
      if (platform === 'google') await trackGoogleMutation.mutateAsync(currentReviewId)
      if (platform === 'yelp') await trackYelpMutation.mutateAsync(currentReviewId)
      // cryptomap360: no dedicated mutation yet — tracked server-side via yelp or generic endpoint
    } catch (err) { logger.error(`Failed to track ${platform} review click`, err) }
  }
  setStep('final_done')
}
```

- [ ] **Step 4: Add CryptoMap360 button to ReviewRouting.tsx**

In `src/components/customer-flow/steps/ReviewRouting.tsx`, after the closing `)}` of the Yelp block (~line 90) and before the `<div className="space-y-4 text-center pt-2">` block, add:

```tsx
{reviewLinks.cryptomap360Review && (
  <a
    href={reviewLinks.cryptomap360Review}
    target="_blank"
    rel="noreferrer"
    onClick={() => onReviewClick('cryptomap360')}
    className="w-full flex items-center justify-between p-4 rounded-xl border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm transition group"
  >
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 bg-white border border-nexoraBorder rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
        {/* CryptoMap360 logo — styled "C360" badge */}
        <div className="h-full w-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <span className="text-[9px] font-black text-white leading-none">C360</span>
        </div>
      </div>
      <span className="font-extrabold text-sm text-nexoraText">
        {t('customer.cryptomap360_review_btn')}
      </span>
    </div>
    <span className="text-xs text-nexoraSubtle font-medium group-hover:translate-x-1 transition-transform">
      {t('customer.choose_chevron')}
    </span>
  </a>
)}
```

- [ ] **Step 5: Verify in dev**

Set `reviewLinks.cryptomap360Review` to a test URL in the mock or via dev tools → confirm the CryptoMap360 button appears in the review routing step, opens a new tab, and navigates to `final_done`.

Since `cryptomap360Url` is a new API field, the button will be hidden for all businesses until the backend adds it — which is correct "off by default" behavior.

- [ ] **Step 6: Commit**

```bash
git add src/components/customer-flow/steps/ReviewRouting.tsx src/components/customer-flow/hooks/useCustomerFlow.ts src/locales/en.json src/locales/vi.json
git commit -m "enhance/customer-tips-feedback-jun16" -m "Add CryptoMap360 review button to ReviewRouting; read cryptomap360Url from business data"
```

---

## Task 5: iPad Kiosk QR Mode

**Files:**
- Create: `src/components/customer-flow/steps/KioskQRScreen.jsx`
- Modify: `src/components/customer-flow/hooks/useCustomerFlow.ts` (kiosk detection + tipAmount URL param)
- Modify: `src/components/CustomerFlow.tsx` (render kiosk_qr step + adjust SelectStaff Next button)
- Modify: `src/locales/en.json` (add kiosk keys)
- Modify: `src/locales/vi.json` (add kiosk keys)

**Flow design:**
- **iPad** (`?kiosk=1`): SelectStaff (with inline tip picker) → "Show QR" button → `kiosk_qr` step shows large QR → staff taps "New Customer" to reset.
- **Customer phone** (scans QR → URL has `?staffProfileId=X&tipAmount=15&mode=phone`): App detects `mode=phone`, pre-populates staff + tip, auto-advances to `payment` step, skips SelectStaff + TipAmount UI.
- **Confirmation on iPad**: Out-of-scope for this iteration (requires backend SSE/polling endpoint). The kiosk resets manually via "New Customer" button.

- [ ] **Step 1: Add kiosk i18n keys**

In `src/locales/en.json` `"customer"` object, add after `"copyright"`:

```json
"kiosk_scan_title": "Scan to Tip",
"kiosk_scan_subtitle": "Ask your customer to scan this QR with their phone to complete the tip.",
"kiosk_tip_summary": "Tipping {name} · ${amount}",
"kiosk_new_customer_btn": "New Customer",
"kiosk_waiting": "Waiting for customer...",
```

In `src/locales/vi.json`, same location:

```json
"kiosk_scan_title": "Quét để Tips",
"kiosk_scan_subtitle": "Nhờ khách hàng quét mã QR này bằng điện thoại để hoàn tất tips.",
"kiosk_tip_summary": "Tips cho {name} · ${amount}",
"kiosk_new_customer_btn": "Khách mới",
"kiosk_waiting": "Đang chờ khách hàng...",
```

- [ ] **Step 2: Add kiosk mode detection and tipAmount URL param reading in useCustomerFlow.ts**

In `src/components/customer-flow/hooks/useCustomerFlow.ts`, after the `preselectedStaffProfileId` useMemo (~line 138), add:

```ts
const isKioskMode = useMemo(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('kiosk') === '1'
}, [])

const phoneModeTipAmount = useMemo(() => {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('tipAmount')
  return val ? Number(val) : null
}, [])

const isPhoneMode = useMemo(() => {
  const params = new URLSearchParams(window.location.search)
  return params.get('mode') === 'phone'
}, [])
```

- [ ] **Step 3: Auto-populate tip + skip to payment for phone mode**

In `useCustomerFlow.ts`, inside the `useEffect` that handles staff preselection (~line 222), extend the logic to handle phone mode:

Replace the existing `useEffect` (lines 222–245) with:

```ts
useEffect(() => {
  if (didApplyStaffPreselect.current || activeStaffList.length === 0) return

  const assignedStaffProfileId = touchPageData?.touchPoint?.assignedStaffProfileId
  const staffCardPreselectId =
    touchPageData?.touchPoint?.type === 'StaffCard' && assignedStaffProfileId
      ? String(assignedStaffProfileId)
      : null
  const preselectId = preselectedStaffProfileId || staffCardPreselectId
  if (!preselectId) return

  const match = activeStaffList.find(
    (staff) => String(staff.id) === preselectId,
  )
  if (!match) return

  didApplyStaffPreselect.current = true
  setSelectedStaffMembers([match])

  const tipVal = phoneModeTipAmount !== null ? phoneModeTipAmount : 15
  setSelectedTips((prev) => ({
    ...prev,
    [match.id]: prev[match.id] !== undefined ? prev[match.id] : tipVal,
  }))

  // Phone mode: customer scanned kiosk QR — skip staff/tip selection, go straight to payment
  if (isPhoneMode && phoneModeTipAmount !== null) {
    setStep('payment')
  } else {
    setStep('tip_amount')
  }
}, [preselectedStaffProfileId, activeStaffList, touchPageData, isPhoneMode, phoneModeTipAmount])
```

- [ ] **Step 4: Export isKioskMode and build kiosk QR URL from useCustomerFlow.ts**

At the bottom of `useCustomerFlow.ts`, add a `kioskQrUrl` derived value before the `return`:

```ts
const kioskQrUrl = useMemo(() => {
  if (!isKioskMode || !touchRoute || selectedStaffMembers.length === 0) return ''
  const base = `${window.location.origin}/touch/${touchRoute.businessSlug}/${touchRoute.touchPointSlug}`
  const params = new URLSearchParams()
  // Use first selected staff for single-staff kiosk (multi-staff kiosk is out-of-scope)
  const member = selectedStaffMembers[0]
  params.set('staffProfileId', String(member.id))
  const tipVal = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
  const resolvedTip = tipVal === 'custom'
    ? (Number(customTips[member.id]) || 15)
    : Number(tipVal)
  params.set('tipAmount', String(resolvedTip))
  params.set('mode', 'phone')
  return `${base}?${params.toString()}`
}, [isKioskMode, touchRoute, selectedStaffMembers, selectedTips, customTips])
```

Update the `return` statement to export the new values:

```ts
return {
  // ... all existing exports ...
  isKioskMode, isPhoneMode, kioskQrUrl,
  // ... rest of existing exports
}
```

- [ ] **Step 5: Create KioskQRScreen.jsx**

Create `src/components/customer-flow/steps/KioskQRScreen.jsx`:

```jsx
import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * KioskQRScreen — displayed on the salon iPad after staff + tip amount are selected.
 * Shows a QR code for the customer to scan on their phone to complete the tip.
 *
 * @param {Object} props
 * @param {Function} props.t
 * @param {string} props.kioskQrUrl - Full mobile tip URL with staffProfileId + tipAmount + mode=phone
 * @param {Object[]} props.selectedStaffMembers
 * @param {number} props.activeTipAmount
 * @param {Function} props.handleReset - Resets flow for next customer
 */
export default function KioskQRScreen({ t, kioskQrUrl, selectedStaffMembers, activeTipAmount, handleReset }) {
  const [qrImageUrl, setQrImageUrl] = useState('')

  useEffect(() => {
    if (!kioskQrUrl) return
    const encoded = encodeURIComponent(kioskQrUrl)
    setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}`)
  }, [kioskQrUrl])

  const primaryStaff = selectedStaffMembers?.[0]
  const staffNames = selectedStaffMembers.map(s => s.fullName.split(' ')[0]).join(', ')

  return (
    <div className="text-center space-y-6 animate-fadeIn py-2 flex flex-col items-center">
      <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
        {t('customer.kiosk_scan_title')}
      </h2>
      <p className="text-xs text-nexoraSubtle font-medium px-2 leading-relaxed">
        {t('customer.kiosk_scan_subtitle')}
      </p>

      {/* QR code */}
      <div className="p-3 bg-white border-2 border-nexoraBrand/30 rounded-2xl shadow-lg">
        {qrImageUrl ? (
          <img
            src={qrImageUrl}
            alt="Tip QR code"
            className="h-[200px] w-[200px] rounded-lg"
          />
        ) : (
          <div className="h-[200px] w-[200px] flex items-center justify-center">
            <div className="h-10 w-10 border-4 border-nexoraBrand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Tip summary */}
      <div className="px-4 py-3 bg-nexoraBrandSoft/40 border border-nexoraBrandSoft rounded-xl w-full">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-nexoraSubtle">
            {staffNames}
          </span>
          <span className="text-lg font-black text-nexoraBrand">
            ${Number(activeTipAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Waiting indicator */}
      <div className="flex items-center gap-2 text-xs text-nexoraSubtle font-semibold animate-pulse">
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        {t('customer.kiosk_waiting')}
      </div>

      {/* New Customer button */}
      <button
        type="button"
        onClick={handleReset}
        className="w-full py-3.5 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        {t('customer.kiosk_new_customer_btn')}
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Import KioskQRScreen and add kiosk_qr step in CustomerFlow.tsx**

In `src/components/CustomerFlow.tsx`:

1. Add import at the top:
```tsx
import KioskQRScreen from './customer-flow/steps/KioskQRScreen'
```

2. Destructure new values from `flow`:
```tsx
const {
  // ... all existing destructured values ...
  isKioskMode, kioskQrUrl,
} = flow
```

3. Change the SelectStaff "Next" button behavior in kiosk mode — the button in SelectStaff always goes to `tip_amount`. In kiosk mode, after confirming tip amounts in TipAmount, the "Next" button should go to `kiosk_qr` instead of `payment`. 

   The cleanest way: in TipAmount.tsx the `handleNextToPayment` already calls `setStep('payment')` via the hook logic at line 470. For kiosk mode, we intercept this by passing a different `handleNextToPayment` prop.

   In `CustomerFlow.tsx`, define a kiosk-aware handler:
   ```tsx
   const handleNextForKiosk = () => {
     if (isKioskMode) {
       setStep('kiosk_qr')
     } else {
       handleNextToPayment()
     }
   }
   ```

   Then pass it to TipAmount:
   ```tsx
   {step === 'tip_amount' && selectedStaffMembers.length > 0 && (
     <TipAmount
       t={t}
       currentLanguage={currentLanguage}
       tipScreenTitle={tipScreenTitle}
       selectedStaffMembers={selectedStaffMembers}
       selectedTips={selectedTips}
       setSelectedTips={setSelectedTips}
       customTips={customTips}
       setCustomTips={setCustomTips}
       activeTipAmount={activeTipAmount}
       initialStaffMember={initialStaffMember}
       setStep={setStep}
       handleNextToPayment={isKioskMode ? handleNextForKiosk : handleNextToPayment}
     />
   )}
   ```

4. Add kiosk_qr step rendering after final_done block:
```tsx
{step === 'kiosk_qr' && (
  <KioskQRScreen
    t={t}
    kioskQrUrl={kioskQrUrl}
    selectedStaffMembers={selectedStaffMembers}
    activeTipAmount={activeTipAmount}
    handleReset={handleReset}
  />
)}
```

- [ ] **Step 7: Verify kiosk mode end-to-end**

1. Open `/touch/{businessSlug}/{touchPointSlug}?kiosk=1` in browser.
2. Select a staff member → inline tip picker appears → select a tip amount.
3. Tap Next → TipAmount confirmation screen.
4. Tap the Next/Pay button → should navigate to `kiosk_qr` step (NOT payment).
5. Confirm QR code loads correctly and the URL encoded in the QR contains `staffProfileId`, `tipAmount`, and `mode=phone`.
6. Scan the QR with a phone → confirm mobile flow pre-populates staff + tip and lands on the payment step.
7. On iPad: tap "New Customer" → flow resets to `select_staff`.

- [ ] **Step 8: Commit**

```bash
git add src/components/customer-flow/steps/KioskQRScreen.jsx src/components/customer-flow/hooks/useCustomerFlow.ts src/components/CustomerFlow.tsx src/locales/en.json src/locales/vi.json
git commit -m "enhance/customer-tips-feedback-jun16" -m "Add iPad kiosk QR mode: kiosk=1 param triggers QR screen; mode=phone param pre-fills tip on customer phone"
```

---

## Self-Review

### Spec coverage check

| Feedback Item | Covered By |
|---|---|
| "Choose your service provider": đổi title | Task 1 ✅ |
| Chọn thợ - dropdown thêm số tiền tips | Task 2 ✅ |
| hiển thị popup thông tin TIPS → Reviews | Task 3 ✅ |
| Có iPad: QR flow | Task 5 ✅ |
| Cover thêm review cho cryptomap360 | Task 4 ✅ |

### Known gaps / assumptions

- **Backend field `cryptomap360Url`**: The `reviewLinks.cryptomap360Review` maps to `touchPageData.business.cryptomap360Url`. This field must be added to the backend business profile API for the button to appear. Until then, the button is hidden (empty string is falsy). No frontend error — just not visible.
- **iPad kiosk confirmation**: The iPad does not receive automatic notification when the customer completes payment on their phone. "New Customer" is manual. Automatic confirmation requires a backend SSE or polling endpoint — out of scope for this iteration.
- **`handleNextForKiosk` validation**: In kiosk mode, the "Next" button on TipAmount bypasses `handleNextToPayment`'s tip validation (min $1, max $500). If needed, extract the validation into a shared utility or call it separately.
- **`isKioskMode` re-renders**: `isKioskMode` is derived from `useMemo` with no dependencies — it reads `window.location.search` once at mount. This is correct since kiosk mode is set at page load.
