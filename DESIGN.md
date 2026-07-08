# Nexora Touch Design System - Style Reference
> Premium service-commerce dashboard with a light operational core, a dark navigation spine, and high-energy blue-violet brand actions.

**Theme:** Hybrid. Admin, staff, onboarding, customer, and payment flows are light-first. Sidebars and selected marketing modules use dark surfaces. The public homepage owns a separate marketing token layer.

Nexora Touch reads as a precise financial operations product for salon and local-service workflows. The main app uses a soft blue-gray canvas, white panels, compact typography, and crisp borders so repeated merchant tasks stay scannable. Brand energy comes from electric blue, violet, cyan, and small gold accents rather than broad decorative color fields. Depth is deliberately shallow: cards, dropdowns, drawers, and mobile nav use thin borders plus soft shadows, while sidebars use translucent white overlays on navy. The homepage is more expressive, using Plus Jakarta Sans, purple-blue gradients, animated button sweeps, and larger section rhythm. The signature break is the dark `nexoraSidebar` rail paired with vivid active gradients and neon menu icon glow.

## Sources Of Truth

| Source | Purpose |
|--------|---------|
| `tailwind.config.js` | Primary app tokens: colors, font families, type scale, spacing, radii, shadows, gradients |
| `src/index.css` | Global focus, app component classes, glass styles, print QR card, scrollbar, icon glow, keyframes |
| `src/components/homepage/homepage.css` | Homepage-only `--nx-*` tokens, motion, button states, responsive behavior |
| `src/components/ui/*` | Shared atoms: `Panel`, `IconButton`, `SecondaryButton`, `KpiCard`, `Pagination`, `LanguageSwitcher` |
| `src/components/dashboard/layout/*` | Merchant shell, sidebar, header, mobile drawer, mobile bottom nav |
| `src/components/staff-dashboard/layout/*` | Staff shell, sidebar, header, bottom nav |
| `src/components/CustomerFlow.tsx`, `src/components/DirectPaymentFlow.tsx`, `src/components/SetupWizard.tsx`, `src/components/RegisterWizard.tsx` | Public payment, customer, onboarding, and registration structure |

## Design Structure

| Layer | Scope | Token Family | Structure |
|-------|-------|--------------|-----------|
| Public homepage | `/` marketing page | `--nx-*`, `navy`, `purple`, `blue`, `green`, `gold` | Full-width sections, generous vertical rhythm, rich CTAs, animated surfaces |
| Admin merchant app | `/dashboard/*` | `nexora*`, `luxury*`, selected `brandCyan` | Fixed desktop sidebar, sticky header, contained cards, dense tables/lists |
| Staff app | `/staff/*` | `nexora*`, `brandCyan` | Same shell language as merchant app, narrower content max-width by default |
| Customer and direct payment flows | `/touch/*`, direct payment routes | `nexora*`, payment provider tokens | Centered mobile-first card flow with language switcher and secure footer |
| Onboarding and registration | `/onboarding`, `/register` | `nexora*`, `nexoraElectric -> nexoraViolet` | Stepper, white wizard card, gradient progress/action system |
| Legacy/luxury components | Shared or older dark modules | `luxury*`, `flox*`, `brandCyan` | Glass panels, gold/cyan accents, dark mode alternatives |

Do not mix homepage `--nx-*` tokens into dashboard screens unless the component is explicitly inside `.nx-homepage`. Do not use `luxury*` as the default admin surface system; those tokens are retained for dark/luxury modules and legacy components.

## Tokens - Colors

### Nexora Admin Semantic Tokens

| Name | Value | Token | Role |
|------|-------|-------|------|
| Canvas | `#F7F9FC` | `--color-nexora-canvas` / `bg-nexoraCanvas` | Main app background for dashboard, staff, onboarding, payment flows |
| Surface | `#FFFFFF` | `--color-nexora-surface` / `bg-nexoraSurface` | Cards, panels, dropdowns, headers |
| Surface Muted | `#F3F6FA` | `--color-nexora-surface-muted` / `bg-nexoraSurfaceMuted` | Search fields, hover fills, disabled surfaces |
| Border | `#DDE5EF` | `--color-nexora-border` / `border-nexoraBorder` | Card, input, dropdown, table, and header borders |
| Rule | `#E7ECF3` | `--color-nexora-rule` / `divide-nexoraRule` | Dividers and section rules |
| Text | `#0B1220` | `--color-nexora-text` / `text-nexoraText` | Primary text on light UI |
| Muted | `#4D5870` | `--color-nexora-muted` / `text-nexoraMuted` | Secondary copy and helper text |
| Subtle | `#7A8296` | `--color-nexora-subtle` / `text-nexoraSubtle` | Placeholders, metadata, inactive labels |
| Sidebar | `#081F49` | `--color-nexora-sidebar` / `bg-nexoraSidebar` | Merchant and staff desktop/mobile navigation rail |
| Sidebar Panel | `#202641` | `--color-nexora-sidebar-panel` / `bg-nexoraSidebarPanel` | Sidebar nested panel tone |
| Brand | `#4648D8` | `--color-nexora-brand` / `bg-nexoraBrand` | Primary app action, active focus, loaders, icons |
| Brand Dark | `#393BC8` | `--color-nexora-brand-dark` / `bg-nexoraBrandDark` | Primary action hover |
| Brand Soft | `#E9E9FF` | `--color-nexora-brand-soft` / `bg-nexoraBrandSoft` | Selected rows, focus/stepper rings, unread notification background |
| Success | `#00B873` | `--color-nexora-success` / `text-nexoraSuccess` | Confirmed states, successful payments |
| Warning | `#F59E0B` | `--color-nexora-warning` / `text-nexoraWarning` | Warning banners and attention states |
| Danger | `#EF4444` | `--color-nexora-danger` / `text-nexoraDanger` | Errors and destructive states |
| Teal | `#12B886` | `--color-nexora-teal` / `text-nexoraTeal` | Alternate positive indicator |
| Lavender | `#A8A9F3` | `--color-nexora-lavender` / `text-nexoraLavender` | Soft badges and decorative accents |

### Extended Brand Tokens

| Name | Value | Token | Role |
|------|-------|-------|------|
| Electric | `#2B59FF` | `--color-nexora-electric` / `nexoraElectric` | Gradient start, badges, role chips, active stepper track |
| Electric Mid | `#5A5CFF` | `--color-nexora-electric-mid` / `nexoraElectricMid` | Stepper and gradient midpoint |
| Violet | `#8E4DF8` | `--color-nexora-violet` / `nexoraViolet` | Gradient end, avatar fallback, active nav |
| Teal Alt | `#0da59a` | `--color-nexora-teal-alt` / `nexoraTealAlt` | Link/success accent alternative |
| Danger Dark | `#D32F2F` | `--color-nexora-danger-dark` / `nexoraDangerDark` | Strong danger headings |
| Brand Cyan | `#32D7FF` | `--color-brand-cyan` / `brandCyan` | Sidebar subnav active state, dark scrollbar thumb, chart gradients |
| Ink Blue | `#071025` | `--color-ink-blue` / `inkBlue` | App root text fallback |
| Muted Grey | `#687385` | `--color-muted-grey` / `mutedGrey` | Secondary legacy text |

### Homepage Tokens

| Name | Value | Token | Role |
|------|-------|-------|------|
| Homepage Navy | `#0f1638` | `--nx-color-navy` / `navy` | Dark homepage sections, secondary action buttons |
| Homepage Ink | `#101322` | `--nx-color-ink` / `ink` | Primary homepage text |
| Homepage Muted | `#667085` | `--nx-color-muted` / `muted` | Homepage body copy |
| Homepage Line | `#e9ecf4` | `--nx-color-line` / `line` | Homepage borders |
| Homepage BG | `#f7f8fc` | `--nx-color-bg` | Homepage page background |
| Homepage Surface | `#ffffff` | `--nx-color-surface` | Homepage cards and modals |
| Homepage Purple | `#6c4df6` | `--nx-color-purple` / `purple` | Homepage primary CTA and nav hover |
| Homepage Blue | `#16b7ff` | `--nx-color-blue` / `blue` | Gradient end, dark-section highlight |
| Homepage Green | `#05b86a` | `--nx-color-green` / `green` | Positive savings/result values |
| Homepage Gold | `#ffb547` | `--nx-color-gold` / `gold` | Rating and special highlights |
| Purple 700 | `#4f35d7` | `--nx-purple-700` | Homepage purple hover |
| Purple 800 | `#3f2ab2` | `--nx-purple-800` | Deep purple state |
| Navy 700 | `#182257` | `--nx-navy-700` | Homepage navy hover |
| Navy 800 | `#0b102b` | `--nx-navy-800` | Deep navy state |
| Hover Soft | `#f3f0ff` | `--nx-hover-soft` | Light outline hover |
| Hover Blue | `#effaff` | `--nx-hover-blue` | Blue hover tint |

### Luxury And Flox Foundation

| Name | Value | Token | Role |
|------|-------|-------|------|
| Luxury Black | `#050505` | `luxuryBlack` | Dark/luxury canvas |
| Luxury Coal | `#11100d` | `luxuryCoal` | Dark elevated surface |
| Luxury Bronze | `#8c6d31` | `luxuryBronze` | Muted metallic accent |
| Luxury Gold | `#d4af37` | `luxuryGold` | Premium gold accent, dark sidebar plan CTA |
| Luxury Gold Light | `#f3e5ab` | `luxuryGoldLight` | Gold hover/champagne state |
| Luxury Gold Dark | `#aa7c11` | `luxuryGoldDark` | Gold border/active state |
| Luxury Amber | `#ffbf00` | `luxuryAmber` | Warm highlight |
| Flox Midnight Ink | `#020817` | `floxMidnightInk` | Deep foundation dark |
| Flox Snow White | `#ffffff` | `floxSnowWhite` | White foundation |
| Flox Slate Gray | `#e2e8f0` | `floxSlateGray` | Light border/divider |
| Flox Anthracite | `#1b1b1b` | `floxAnthracite` | Technical charcoal |
| Flox Light Fog | `#f3f3f3` | `floxLightFog` | Light neutral surface |
| Flox Obsidian Black | `#0c0c0c` | `floxObsidianBlack` | High-contrast action background |
| Flox Electric Violet | `#711aff` | `floxElectricViolet` | Legacy high-energy accent |
| Flox Vivid Rose | `#ff4fae` | `floxVividRose` | Legacy vivid accent |

### Payment Provider Tokens

| Name | Value | Token | Role |
|------|-------|-------|------|
| Zelle | `#7414CA` | `walletZelle` | Zelle payment button and provider identity |
| Zelle Dark | `#5f10a6` | `walletZelleDark` | Zelle hover |
| PayPal | `#003087` | `walletPaypal` | PayPal provider identity |
| PayPal Dark | `#002466` | `walletPaypalDark` | PayPal hover |
| Venmo | `#008CFF` | `walletVenmo` | Venmo payment button |
| Venmo Dark | `#007ad6` | `walletVenmoDark` | Venmo hover |
| Cash App | `#00D632` | `walletCashapp` | Cash App payment button |
| Cash App Dark | `#00b52a` | `walletCashappDark` | Cash App hover |
| Yelp | `#D32323` | `walletYelp` | Yelp external review identity |

### Decorative / Gradient

| Name | Value | Token | Role |
|------|-------|-------|------|
| App Active Gradient | `linear-gradient(to right, #2B59FF, #8E4DF8)` | `from-nexoraElectric to-nexoraViolet` | Primary gradient actions, sidebar active nav, avatar fallback |
| Stepper Gradient | `linear-gradient(to right, #2B59FF, #5A5CFF, #8E4DF8)` | `from-nexoraElectric via-nexoraElectricMid to-nexoraViolet` | Wizard progress |
| Flox Gradient A | `linear-gradient(92deg, rgb(130, 71, 255) -9.21%, rgb(244, 123, 255) 104.14%)` | `bg-flox-gradient-a` | Legacy purple-pink accent |
| Flox Gradient B | `linear-gradient(95deg, rgb(255, 114, 207) -13.39%, rgb(138, 21, 255) 114.46%)` | `bg-flox-gradient-b` | Legacy pink-purple accent |
| Nexora Gold | `linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)` | `bg-nexora-gradient-gold` | Luxury metallic accent |
| Nexora Gold Cyan | `linear-gradient(92deg, #d4af37 -9.21%, #32D7FF 104.14%)` | `bg-nexora-gradient-gold-cyan` | Legacy CTA gradient |
| Homepage Brand | `linear-gradient(135deg, #d93cff 0%, #6c4df6 45%, #16c9ff 100%)` | `--nx-gradient-brand` | Homepage hero/visual gradient |
| Homepage Button | `linear-gradient(90deg, #6c4df6 0%, #4f46e5 100%)` | `--nx-gradient-button` | Homepage CTA base |
| Homepage Text Grad | `linear-gradient(90deg, #6c4df6, #16b7ff)` | `.text-grad` | Gradient text on homepage |

## Tokens - Typography

### Inter - Admin and app interface typeface - `--font-sans`
- **Substitute:** system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Weights:** 400, 500, 600, 700, 800, 900 observed through Tailwind utilities
- **Sizes:** 9px, 10px, 11px, 12px, 13px, 14px, 16px, 18px, 20px, 24px, 30px, 36px, 76px
- **Line height:** 1.0, 1.2, 1.33, 1.35, 1.5, 1.7 observed
- **Letter spacing:** `tracking-tight`, `tracking-wide`, `tracking-wider`, `tracking-widest`; Flox scale uses negative tracking
- **OpenType features:** none defined
- **Role:** Dashboard, staff app, onboarding, customer payment flow, form labels, tables, cards

### Plus Jakarta Sans - Homepage marketing typeface - `--font-homepage`
- **Substitute:** Inter, system-ui, sans-serif
- **Weights:** 300, 400, 500, 600, 700, 800 imported
- **Sizes:** 7px, 8px, 9px, 10px, 12px, 14px, 16px, 20px, 24px, 30px, 36px, 48px, 60px observed
- **Line height:** 1.08, 1.14, 1.3, 1.5, 1.7 observed in homepage responsive rules
- **Letter spacing:** normal for body, `tracking-tight` for display, uppercase labels use wide/widest tracking
- **OpenType features:** none defined
- **Role:** Public homepage sections, pricing, modals, simulator, marketing copy

### GeistMono / Fira Code - Technical and transactional monospace - `--font-mono`
- **Substitute:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
- **Weights:** 400, 500, 700 observed
- **Sizes:** 7px, 8px, 9px, 10px, 12px, 14px observed
- **Line height:** 1.5 and compact receipt/QR metadata values
- **Letter spacing:** inherited unless overridden
- **Role:** Payment IDs, QR URLs, receipt text, code/technical cards, currency/reference metadata

### Type Scale

| Role | Size | Line Height | Letter Spacing | Token / Utility |
|------|------|-------------|----------------|-----------------|
| micro | 9px-10px | 1.0-1.5 | wide/wider | `text-[9px]`, `text-[10px]` |
| caption | 12px | 1.5 | -0.01em | `text-flox-caption`, `text-xs` |
| body-sm | 14px | 1.5 | -0.01em | `text-flox-body-sm`, `text-sm` |
| body | 16px | 1.5 | -0.011em | `text-flox-body`, `text-base` |
| subheading | 18px | 1.35 | -0.012em | `text-flox-subheading`, `text-lg` |
| heading | 24px | 1.33 | -0.02em | `text-flox-heading`, `text-2xl` |
| display | 76px | 1.0 | -0.046em | `text-flox-display` |
| homepage hero mobile | clamp(2rem, 9vw, 3.25rem) | 1.08 | inherited | homepage mobile override |
| homepage section mobile | clamp(1.55rem, 6.5vw, 2rem) | 1.14 | inherited | homepage mobile override |

Typography rules:
- Use `font-sans`/Inter in app screens and `Plus Jakarta Sans` only inside `.nx-homepage`.
- Use uppercase `text-[10px]` or `text-[11px]` with `font-black`/`font-extrabold` for labels, table headings, badges, and metadata.
- Use `font-mono` only for technical references, payment IDs, QR URLs, codes, and receipt-like content.
- Do not introduce new display sizes into compact dashboard panels; use `text-lg`, `text-xl`, `text-2xl`, or the Flox scale.

## Tokens - Spacing & Shapes

**Base unit:** 4px

**Density:** Compact for dashboards and forms; comfortable/generous for homepage sections.

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| flox-4 | 4px | `--spacing-flox-4` / `flox-4` |
| flox-8 | 8px | `--spacing-flox-8` / `flox-8` |
| flox-12 | 12px | `--spacing-flox-12` / `flox-12` |
| flox-16 | 16px | `--spacing-flox-16` / `flox-16` |
| flox-24 | 24px | `--spacing-flox-24` / `flox-24` |
| flox-40 | 40px | `--spacing-flox-40` / `flox-40` |
| flox-80 | 80px | `--spacing-flox-80` / `flox-80` |
| flox-120 | 120px | `--spacing-flox-120` / `flox-120` |
| 4.5 | 18px | `--spacing-4-5` / `4.5` |
| mobile bottom nav | 68px | fixed nav height |
| desktop sidebar | 288px | `w-72`, `lg:pl-72` |
| touch/payment card width | 448px | `max-w-md` |
| staff default content width | 768px | `max-w-3xl` |
| staff payments width | 1152px-1280px | `max-w-6xl xl:max-w-7xl` |
| merchant setup width | 1152px | `max-w-6xl` |
| auth/register width | 896px | `max-w-4xl` |

### Border Radius

| Name | Value | Token |
|------|-------|-------|
| inputs | 6px | `rounded-flox-inputs` |
| buttons | 6px | `rounded-flox-buttons` |
| nav items | 6px | `rounded-flox-navItems` |
| icon/button lg | 8px | `rounded-lg` |
| homepage sm | 10px | `--nx-radius-sm` |
| cards/badges | 12px | `rounded-flox-cards`, `rounded-flox-badges`, `rounded-xl` |
| homepage md | 14px | `--nx-radius-md` |
| modal/shell | 16px | `rounded-2xl` |
| homepage lg | 18px | `--nx-radius-lg` |
| large card | 24px | `rounded-3xl`, `--nx-radius-xl` |
| homepage 2xl | 32px | `--nx-radius-2xl` |
| pill/full | 9999px | `rounded-full` |

| Element | Value |
|---------|-------|
| Dashboard cards | 12px-16px |
| Dashboard primary buttons | 8px |
| Form inputs | 8px-12px depending form density |
| Sidebar nav items | 8px |
| Homepage cards | 18px-32px |
| Homepage buttons | 14px or full pill |
| Customer/payment flow card | 16px |
| QR print card | 0.25in |

### Shadows

| Name | Value | Token |
|------|-------|-------|
| premium | `0 18px 55px rgba(12,22,44,0.12)` | `shadow-premium` |
| flox-subtle | `rgba(255, 255, 255, 0.2) 0px -2px 1px 0px inset, rgba(255, 255, 255, 0.1) 0px 4px 16px 0px inset, rgba(0, 0, 0, 0.08) 0px 6px 16px 0px` | `shadow-flox-subtle` |
| flox-sm | `rgba(0, 0, 0, 0.04) 0px 2px 8px 0px, rgba(0, 0, 0, 0.08) 0px 8px 24px 0px, rgba(0, 0, 0, 0.12) 0px 16px 48px 0px` | `shadow-flox-sm` |
| nexora-card | `0 2px 8px rgba(15, 23, 42, 0.08)` | `shadow-nexora-card` |
| nexora-soft | `0 8px 24px rgba(15, 23, 42, 0.06)` | `shadow-nexora-soft` |
| homepage-xs | `0 1px 2px rgba(16, 19, 34, 0.06)` | `--nx-shadow-xs` |
| homepage-sm | `0 6px 18px rgba(16, 19, 34, 0.08)` | `--nx-shadow-sm` |
| homepage-md | `0 14px 34px rgba(16, 19, 34, 0.12)` | `--nx-shadow-md` |
| homepage-lg | `0 24px 56px rgba(16, 19, 34, 0.16)` | `--nx-shadow-lg` |
| homepage-brand | `0 22px 50px rgba(108, 77, 246, 0.24)` | `--nx-shadow-brand` |
| mobile-bottom-nav | `0 -8px 28px rgba(15,23,42,0.08)` | inline style |
| focus-ring | `0 0 0 2px rgba(70, 72, 216, 0.2)` | global input focus |
| homepage-focus-ring | `0 0 0 4px rgba(108, 77, 246, 0.16)` | `--nx-focus-ring` |
| homepage-strong-ring | `0 0 0 4px rgba(108, 77, 246, 0.18), 0 10px 24px rgba(108, 77, 246, 0.12)` | `--nx-ring-strong` |

### Motion

| Name | Value | Token / Rule | Role |
|------|-------|--------------|------|
| fast | `140ms` | `--nx-duration-fast` | Press/active transitions |
| base | `220ms` | `--nx-duration-base` | Standard homepage transitions |
| slow | `360ms` | `--nx-duration-slow` | Modal movement |
| ease out | `cubic-bezier(0.16, 1, 0.3, 1)` | `--nx-ease-out` | Homepage entrance/hover |
| standard | `cubic-bezier(0.2, 0, 0, 1)` | `--nx-ease-standard` | Homepage controls |
| app focus | `0.15s ease-in-out` | global inputs | Focus ring and border state |
| app button hover | `0.2s ease-in-out` | legacy buttons/sidebar icon glow | Compact interaction |
| homepage hover lift | `translateY(-3px)` | `--nx-hover-lift` | Primary homepage buttons |
| homepage press | `translateY(0) scale(0.975)` | `--nx-press` | Button active state |
| button sweep | `left 1.05s cubic-bezier(0.19, 1, 0.22, 1)` | `::after` on homepage buttons | Light-sweep hover |

Reduced motion disables homepage animations and transitions through `@media (prefers-reduced-motion: reduce)`.

## Components

### App Root
**Role:** Non-homepage page frame.

`min-h-dvh bg-nexoraCanvas text-inkBlue font-sans antialiased`. Public homepage bypasses this frame and renders `.nx-homepage`.

### Merchant / Staff Desktop Shell
**Role:** Main authenticated app structure.

Desktop sidebar is `fixed inset-y-0 left-0 w-72 bg-nexoraSidebar px-5 py-7 text-white`. Content starts at `lg:pl-72`. Header is sticky top with `min-h-16`, `border-b border-nexoraBorder`, `bg-nexoraSurface`, and `px-4 sm:px-5`. Main content uses contained widths: merchant views vary by route, staff defaults to `max-w-3xl` and expands to `max-w-6xl xl:max-w-7xl` for payment-heavy views.

### Sidebar Navigation Item
**Role:** Primary app navigation.

Inactive: `text-white/85 hover:bg-white/5 hover:text-white`, `h-12`, `rounded-lg`, `px-4`, `text-sm font-bold`. Active: `bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20`. Nested subnav uses `h-9`, `text-xs font-bold`, active `text-brandCyan` with a `1.5px` dot in `brandCyan`.

### Sidebar Profile / Plan Panel
**Role:** Identity and subscription summary inside dark rail.

`rounded-xl border border-white/15 bg-white/5 p-4`. Text hierarchy uses white primary, `white/60` metadata, `white/45` uppercase section labels. Plan manage button uses `text-luxuryGold` with `border-white/15` and `hover:bg-white/5`.

### Mobile Drawer
**Role:** Navigation on small screens.

Overlay `bg-nexoraText/60`. Drawer is `w-[min(84vw,320px)] bg-nexoraSidebar px-5 py-6 text-white shadow-2xl`. Close handle is a 28px white circular button straddling the drawer edge.

### Mobile Bottom Nav
**Role:** Primary mobile merchant/staff navigation.

Fixed bottom, `height: 68px`, `border-t border-nexoraBorder`, `bg-white/95`, `backdrop-blur-md`, `box-shadow: 0 -8px 28px rgba(15,23,42,0.08)`. Items use 22px icons and `text-[11px] font-bold`; active color is `nexoraBrand`, inactive is `nexoraSubtle`.

### Nexora Card / Panel
**Role:** Default app card surface.

Class `.nexora-card`: `rounded-xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card`. Shared `Panel` wraps content in this class. Use for dashboard panels, settings cards, staff panels, and reusable surfaces.

### KPI Card
**Role:** Clickable metric tile.

`nexora-card p-5 min-h-[140px] text-left`, hover `-translate-y-0.5 shadow-premium`. Active state: `border-nexoraBrand ring-1 ring-nexoraBrand bg-nexoraSurface`. Label is `text-[11px] font-black uppercase tracking-wider text-nexoraSubtle`; value is `text-2xl font-black text-nexoraText tracking-tight`.

### Primary App Button
**Role:** Main dashboard action.

Class `.nexora-primary-button`: `inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-5 text-sm font-bold text-white shadow-nexora-soft transition hover:bg-nexoraBrandDark`. Use for direct CRUD actions such as adding touchpoints.

### Gradient App Button
**Role:** High-emphasis form progression and authentication.

`bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white font-extrabold rounded-lg`, usually `min-h-11`, `px-6`, `py-2.5`, uppercase or compact labels. Hover uses `opacity-90`; disabled uses `opacity-60 cursor-not-allowed`.

### Secondary Gradient Border Button
**Role:** Secondary action that still carries brand emphasis.

Shared `SecondaryButton`: outer button `min-h-11 w-full rounded-lg bg-gradient-to-r from-nexoraElectric to-nexoraViolet p-px hover:opacity-90`. Inner span is `min-h-10 rounded-[7px] bg-white px-4 py-2 text-xs font-bold`; label uses gradient clipped text.

### Icon Button
**Role:** Header utilities and square icon actions.

Class `.nexora-icon-button`: `inline-flex h-10 w-10 items-center justify-center rounded-lg text-nexoraText transition hover:bg-nexoraSurfaceMuted`. The shared `IconButton` requires an accessible `aria-label`/`title`.

### Search Input
**Role:** Dashboard header search.

Class `.nexora-search-input`: `h-11 w-full rounded-full border border-transparent bg-nexoraSurfaceMuted pl-12 pr-4 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand`. Search dropdown is `rounded-xl border border-nexoraBorder bg-white shadow-2xl divide-y divide-nexoraBorder`.

### Form Field
**Role:** Text input/select/textarea across app flows.

Default: `rounded-lg` or `rounded-xl`, `border-nexoraBorder`, `bg-nexoraCanvas` or white, `text-sm text-nexoraText`, placeholder `nexoraSubtle`. Global focus outside homepage: `outline: none`, `box-shadow: 0 0 0 2px rgba(70, 72, 216, 0.2)`, `border-color: nexoraBrand`, transition `0.15s ease-in-out`. Mobile inputs are forced to at least 16px to prevent iOS zoom.

### Language Switcher
**Role:** Small language control on app and public flows.

Compact control uses `rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1`, `text-[9px] font-bold uppercase`. Standalone flow switchers use a pill `bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexoraBorder shadow-sm`; active language is `bg-nexoraBrand text-white`.

### Notifications Dropdown
**Role:** Inbox-like action list.

Trigger is 40px icon/avatar button with `border-nexoraBorder`, active `border-nexoraBrand ring-2 ring-nexoraBrand/30`. Dropdown is `w-80 max-h-[460px] rounded-xl border border-nexoraBorder bg-white shadow-2xl`. Header uses `bg-nexoraSurfaceMuted`; unread rows use `bg-nexoraBrandSoft/40`; read rows use white with muted text.

### Profile Dropdown
**Role:** Account actions.

`rounded-xl border border-nexoraBorder bg-white shadow-lg/2xl`, divided by `nexoraRule` or `nexoraBorder`. Items use `text-xs` to `text-sm`, `font-bold`/`font-semibold`, hover `bg-nexoraSurfaceMuted` or `bg-nexoraCanvas`; destructive action uses red text and red hover tint.

### Modal / Dialog / Drawer Surface
**Role:** Overlayed decision or detail surface.

Overlay: `bg-nexoraText/60` or `bg-black/60` with `backdrop-blur-sm`. Modal: white background, `rounded-2xl` or `rounded-3xl`, `border-nexoraBorder`, `shadow-2xl`, constrained width (`max-w-sm`, `max-w-md`, `max-w-lg`). Mobile bottom detail panels use `rounded-t-2xl` and `max-h-[92dvh]`.

### Customer / Direct Payment Card
**Role:** Public mobile-first flow card.

Container: `min-h-dvh bg-nexoraCanvas text-nexoraText font-sans flex flex-col justify-between pb-8`, with a top `from-blue-50/50 to-transparent` glow. Main card: `w-full max-w-md bg-white border border-nexoraBorder rounded-2xl p-6 shadow-premium space-y-6`. Footer uses secure icon `text-nexoraBrand` and `text-nexoraSubtle`.

### Wizard Stepper
**Role:** Registration/onboarding progress.

Track line: `h-[3px] bg-slate-200/60`; progress uses `from-nexoraElectric via-nexoraElectricMid to-nexoraViolet`. Step node is 40px circle. Active node: `bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.18)] ring-4 ring-nexoraBrandSoft/80 scale-110`. Completed node: gradient fill with white check.

### Homepage Button
**Role:** Marketing CTA.

Base selector: `.btn-action`, `.btn-action-secondary`, `.btn-action-outline`, `.ds-button`, `.nx-homepage button`. Buttons are `position: relative`, `overflow: hidden`, `isolation: isolate`, `border-radius: 0.9rem`. Hover adds a diagonal `::after` light sweep. Primary uses `#6c4df6`, hover `#563bd8`, shadow `0 10px 24px rgba(108, 77, 246, 0.28)`. Secondary uses `#0f1638`, hover `#101322`. Accent uses `#df810b`, hover `#c47309`. Outline uses white background, `#d8deea` border, hover `#f8f7ff` and purple border.

### Homepage Surface / Card
**Role:** Marketing content blocks and pricing cards.

`.ds-surface`, `.ds-content-card`, and `.ds-pricing-card` transition color, background, border, shadow, transform, opacity, and filter. Hover: `translateY(-4px)`, border `rgba(108, 77, 246, 0.28)`, shadow `--nx-shadow-md`. Pricing hover: `translateY(-6px) scale(1.01)` and `--nx-shadow-lg`. On touch devices hover transform is disabled.

### Homepage Field
**Role:** Marketing form input/select/textarea.

Inputs use `color: --nx-text-on-light`, white background, caret purple. Hover sets border `rgba(108, 77, 246, 0.48)` and ring `0 0 0 4px rgba(108, 77, 246, 0.07)`. Focus uses border `--nx-color-purple` and `0 0 0 4px rgba(108, 77, 246, 0.14)`.

### Glass Utilities
**Role:** Legacy translucent surfaces.

`.glass-light`: `background: rgba(255, 255, 255, 0.8)`, `backdrop-filter: blur(15px)`, border `rgba(231, 234, 240, 0.5)`. `.glass-dark`: `background: rgba(17, 16, 13, 0.85)`, `backdrop-filter: blur(25px)`, border `rgba(212, 175, 55, 0.18)`.

### QR Print Card
**Role:** Printable QR stand output.

Print card is 4in x 6in, white background, `1.5px dashed #cbd5e1`, radius `0.25in`, padding `0.3in 0.35in`. QR wrapper is 2.1in square with white background, slate border, radius `0.15in`, and subtle print shadow. Direct payment print variant centers QR content as one group.

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | App Canvas | `#F7F9FC` | Dashboard/staff/customer/onboarding page background |
| 1 | App Surface | `#FFFFFF` | Cards, panels, modals, dropdowns, headers |
| 2 | Muted Surface | `#F3F6FA` | Search fields, hover surfaces, nested blocks |
| 3 | Border / Rule | `#DDE5EF`, `#E7ECF3` | Separation without heavy visual weight |
| 4 | Sidebar Canvas | `#081F49` | Dark navigation system |
| 5 | Sidebar Overlay | `rgba(255,255,255,0.05)` plus white borders | Profile/plan panels inside sidebar |
| 6 | Homepage Canvas | `#f7f8fc` | Public marketing page background |
| 7 | Homepage Dark Section | `#0f1638` / slate-900 variants | Calculator, modal header, high-contrast marketing moments |
| 8 | Legacy Dark Luxury | `#050505`, `#11100d` | Gold/cyan legacy or dark premium modules |

## Layout

Dashboard layout is an app shell: fixed 288px desktop sidebar, sticky 64px header, scrollable main area, and mobile bottom navigation. Use `bg-nexoraCanvas` for page backgrounds, white `nexora-card` panels for functional content, and `nexoraSurfaceMuted` for nested controls or hover feedback. Merchant pages can use broader layouts, but staff defaults to a narrower `max-w-3xl` work surface unless the route is table/payment-heavy.

Homepage layout is a marketing page with full-width sections, `py-16 sm:py-24` rhythm, `max-w-7xl` style containers, expressive cards, and dark/light section alternation. It must remain isolated under `.nx-homepage` so its button sweep, global hover selectors, and `--nx-*` variables do not leak into the app shell.

Customer and direct payment layouts are centered, mobile-first flows. The card should stay `max-w-md`, use one primary task per step, and keep language switcher plus secure footer outside the card. Onboarding and registration layouts use one large white wizard surface, a visible stepper, and gradient actions for forward progress.

## Imagery

Primary product imagery uses real logo assets from `public/assets` and menu icons from `public/assets/menu`. Sidebar icons may receive neon glow through `.sidebar-icon` and `.sidebar-lucide-icon`; active/hover states brighten the icon and add purple/cyan drop shadows. Homepage imagery and simulator content can be more illustrative, but dashboard imagery should stay utilitarian: logos, avatars, QR previews, provider icons, and business/staff images. QR and receipt imagery must remain high contrast on white for scan/read reliability.

## Do's and Don'ts

### Do
- Use `bg-nexoraCanvas`, `bg-nexoraSurface`, `border-nexoraBorder`, `text-nexoraText`, `text-nexoraMuted`, and `text-nexoraSubtle` as the default admin palette.
- Use `bg-nexoraBrand` for primary single-color app actions and `from-nexoraElectric to-nexoraViolet` for high-emphasis progression/actions.
- Use `nexoraBrandSoft` for selected, unread, focus-ring, and stepper support states, not as a general card background.
- Use `brandCyan` for active subnav text/dots inside dark sidebars.
- Use `luxuryGold` only for premium/luxury accents such as the sidebar plan button or legacy dark modules.
- Keep default cards on white with `border-nexoraBorder` and soft shadows; use muted backgrounds only for nested controls.
- Keep homepage tokens inside `.nx-homepage`; use `--nx-color-purple`, `--nx-color-blue`, and `--nx-gradient-brand` for marketing CTAs and hover polish.
- Keep provider colors mapped to payment-provider tokens; do not recolor Zelle, Venmo, Cash App, PayPal, or Yelp with Nexora brand colors.

### Don't
- Do not add arbitrary hex colors in app components when an existing Tailwind token covers the role.
- Do not use generic `blue-*`, `slate-*`, `red-*`, or `amber-*` as a default design language for new app surfaces; map recurring values to `nexora*` tokens.
- Do not use homepage `--nx-*` motion/button selectors in dashboard, staff, onboarding, customer, or payment screens.
- Do not use `luxuryBlack` or `luxuryCoal` for the light admin app background; those are dark/luxury tokens.
- Do not make dashboard cards decorative; keep them compact, bordered, and data-first.
- Do not place large hero typography inside dashboard cards or sidebars; reserve display sizing for homepage/landing contexts.
- Do not use heavy shadows for routine app cards; reserve `shadow-premium` for major cards, auth shells, customer flow cards, and hover emphasis.
- Do not remove focus-visible rings; inputs and buttons depend on tokenized focus states for keyboard accessibility.

## Agent Prompt Guide

1. Create a dashboard panel: use `nexora-card p-5`, background `#FFFFFF`, border `#DDE5EF`, text `#0B1220`, secondary text `#4D5870`, and actions using `bg-nexoraBrand #4648D8` with hover `#393BC8`.
2. Create a sidebar nav item: inactive text `white/85`, hover `white/5`, active `linear-gradient(to right, #2B59FF, #8E4DF8)`, 48px height, 8px radius, 16px horizontal padding.
3. Create a homepage CTA: primary background `#6c4df6`, hover `#563bd8`, white text, 0.9rem radius, 10px/24px shadow `rgba(108, 77, 246, 0.28)`, and the existing light-sweep `::after` behavior.
4. Create a customer payment step: full page `#F7F9FC`, centered `max-w-md` white card, 16px radius, `#DDE5EF` border, `shadow-premium`, language switcher pill at top right, secure footer under the card.

## Similar Brands

- **Square Dashboard** - Operational payments UI with compact cards, tables, and clear action hierarchy.
- **Toast / Salon-service SaaS tools** - Merchant workflows with setup, staff, locations, and payment surfaces.
- **Stripe Dashboard** - Light operational UI, precise text hierarchy, subtle borders, and restrained depth.
- **Linear** - Dense app shell, high polish, and controlled accent color use.
- **Vercel** - Simple surface system with sharp interaction states and strong technical typography.

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Admin Colors */
  --color-nexora-canvas: #F7F9FC;
  --color-nexora-surface: #FFFFFF;
  --color-nexora-surface-muted: #F3F6FA;
  --color-nexora-border: #DDE5EF;
  --color-nexora-rule: #E7ECF3;
  --color-nexora-text: #0B1220;
  --color-nexora-muted: #4D5870;
  --color-nexora-subtle: #7A8296;
  --color-nexora-sidebar: #081F49;
  --color-nexora-sidebar-panel: #202641;
  --color-nexora-brand: #4648D8;
  --color-nexora-brand-dark: #393BC8;
  --color-nexora-brand-soft: #E9E9FF;
  --color-nexora-success: #00B873;
  --color-nexora-warning: #F59E0B;
  --color-nexora-danger: #EF4444;
  --color-nexora-teal: #12B886;
  --color-nexora-lavender: #A8A9F3;

  /* Extended Brand */
  --color-nexora-electric: #2B59FF;
  --color-nexora-electric-mid: #5A5CFF;
  --color-nexora-violet: #8E4DF8;
  --color-brand-cyan: #32D7FF;
  --color-luxury-gold: #d4af37;

  /* Typography */
  --font-sans: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-homepage: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
  --font-mono: "GeistMono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Type Scale */
  --text-flox-caption: 12px;
  --leading-flox-caption: 1.5;
  --tracking-flox-caption: -0.01em;
  --text-flox-body-sm: 14px;
  --leading-flox-body-sm: 1.5;
  --tracking-flox-body-sm: -0.01em;
  --text-flox-body: 16px;
  --leading-flox-body: 1.5;
  --tracking-flox-body: -0.011em;
  --text-flox-subheading: 18px;
  --leading-flox-subheading: 1.35;
  --tracking-flox-subheading: -0.012em;
  --text-flox-heading: 24px;
  --leading-flox-heading: 1.33;
  --tracking-flox-heading: -0.02em;
  --text-flox-display: 76px;
  --leading-flox-display: 1;
  --tracking-flox-display: -0.046em;

  /* Spacing */
  --spacing-flox-4: 4px;
  --spacing-flox-8: 8px;
  --spacing-flox-12: 12px;
  --spacing-flox-16: 16px;
  --spacing-flox-24: 24px;
  --spacing-flox-40: 40px;
  --spacing-flox-80: 80px;
  --spacing-flox-120: 120px;

  /* Radius */
  --radius-flox-inputs: 6px;
  --radius-flox-buttons: 6px;
  --radius-flox-cards: 12px;
  --radius-homepage-sm: 10px;
  --radius-homepage-md: 14px;
  --radius-homepage-lg: 18px;
  --radius-homepage-xl: 24px;
  --radius-homepage-2xl: 32px;

  /* Shadows */
  --shadow-premium: 0 18px 55px rgba(12,22,44,0.12);
  --shadow-nexora-card: 0 2px 8px rgba(15, 23, 42, 0.08);
  --shadow-nexora-soft: 0 8px 24px rgba(15, 23, 42, 0.06);
  --shadow-homepage-md: 0 14px 34px rgba(16, 19, 34, 0.12);
  --focus-ring-app: 0 0 0 2px rgba(70, 72, 216, 0.2);
}
```

### Tailwind v3

```js
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nexoraCanvas: '#F7F9FC',
        nexoraSurface: '#FFFFFF',
        nexoraSurfaceMuted: '#F3F6FA',
        nexoraBorder: '#DDE5EF',
        nexoraRule: '#E7ECF3',
        nexoraText: '#0B1220',
        nexoraMuted: '#4D5870',
        nexoraSubtle: '#7A8296',
        nexoraSidebar: '#081F49',
        nexoraBrand: '#4648D8',
        nexoraBrandDark: '#393BC8',
        nexoraBrandSoft: '#E9E9FF',
        nexoraElectric: '#2B59FF',
        nexoraElectricMid: '#5A5CFF',
        nexoraViolet: '#8E4DF8',
        brandCyan: '#32D7FF',
        luxuryGold: '#d4af37',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['GeistMono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'flox-cards': '12px',
        'flox-inputs': '6px',
        'flox-buttons': '6px',
      },
      boxShadow: {
        premium: '0 18px 55px rgba(12,22,44,0.12)',
        'nexora-card': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'nexora-soft': '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
    },
  },
}
```
