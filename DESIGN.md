# Nexora Design System — Style Reference

> Developer console meets premium luxury dashboard. Achromatic surfaces accented by 24K Polished Gold and Shimmering Cyan. Plus, the light-mode Nexora Touch Admin semantic interface.

**Core Concept:**
Nexora utilizes a high-end layout with strict design rules. It features premium glassmorphic canvases, precise monospace details, vibrant accents (Gold and Cyan), and a dedicated light-mode Touch Admin system to establish a premium financial technology and tipping identity.

---

## 1. Tokens — Colors

We maintain Nexora's brand and Flox color palettes while integrating standard semantic roles from the design system layout rules:

### A. Nexora Brand Colors
Used primarily in the main user-facing interfaces and dark mode dashboards.

* **luxuryBlack** (`#050505`): Obsidian Deep Black. Primary canvas background for dark mode.
* **luxuryCoal** (`#11100d`): Deep Charcoal Slate. Elevated surface background for dark mode.
* **luxuryBronze** (`#8c6d31`): Muted Metallic Bronze.
* **luxuryGold** (`#d4af37`): 24K Polished Gold. Primary brand accent color.
* **luxuryGoldLight** (`#f3e5ab`): Shimmering Champagne. Hover accent color.
* **luxuryGoldDark** (`#aa7c11`): Burnished Antique Gold. Active state borders.
* **luxuryAmber** (`#ffbf00`): Golden Amber Glow.
* **brandCyan** (`#32D7FF`): Vibrant Shimmering Cyan. Secondary brand accent and hover highlights.
* **inkBlue** (`#071025`): Deep Ink Blue. Primary text color in light mode.
* **mutedGrey** (`#687385`): Slate/Muted Grey. Inactive elements and secondary text.

### B. Flox Token Colors
Core foundation utility tokens.

* **floxMidnightInk** (`#020817`): Deep midnight blue-black.
* **floxSnowWhite** (`#ffffff`): Pure white.
* **floxSlateGray** (`#e2e8f0`): Slate gray border/divider highlight.
* **floxAnthracite** (`#1b1b1b`): Technical charcoal.
* **floxLightFog** (`#f3f3f3`): Light gray surface tint.
* **floxObsidianBlack** (`#0c0c0c`): High contrast solid black.
* **floxElectricViolet** (`#711aff`): High energy violet highlight.
* **floxVividRose** (`#ff4fae`): Bright pink accent.

### C. Nexora Touch Admin Semantic Tokens
Used specifically for the Light Mode Admin Dashboard, settings modules, onboarding wizards, and touch panels.

* **nexoraCanvas** (`#F7F9FC`): Soft light gray canvas background.
* **nexoraSurface** (`#FFFFFF`): Clean white container background.
* **nexoraSurfaceMuted** (`#F3F6FA`): Light blue-gray for hover states and secondary elements.
* **nexoraBorder** (`#DDE5EF`): Main component boundary borders.
* **nexoraRule** (`#E7ECF3`): Clean separator and table dividing lines.
* **nexoraText** (`#0B1220`): High legibility charcoal black for primary text.
* **nexoraMuted** (`#4D5870`): Muted slate gray for secondary typography.
* **nexoraSubtle** (`#7A8296`): Placeholder, inactive, or subtle labels.
* **nexoraSidebar** (`#101633`): Dark Navy background for the main navigation sidebar.
* **nexoraSidebarPanel** (`#202641`): Accent container background inside the sidebar.
* **nexoraBrand** (`#4648D8`): Tech Blue primary brand accent.
* **nexoraBrandDark** (`#393BC8`): Darker blue active/hover accent.
* **nexoraBrandSoft** (`#E9E9FF`): Very soft purple-blue tint for select backgrounds.
* **nexoraSuccess** (`#00B873`): Vibrant green indicating positive state / success.
* **nexoraWarning** (`#F59E0B`): Amber orange for warning alerts.
* **nexoraDanger** (`#EF4444`): Crimson red for error states and delete actions.
* **nexoraTeal** (`#12B886`): Alternate emerald/teal indicator.
* **nexoraLavender** (`#A8A9F3`): Soft lavender tint for badges and decorative elements.

---

## 2. Tokens — Typography

### Primary Typeface: Inter (Substitute for GeistSans)
* **Weights:** Regular (400), Medium (500), Bold (700)
* **Role:** Standard interface font. Compact letter-spacing ensures a technical and premium feel.

### Technical Typeface: GeistMono (Substitute: Fira Code)
* **Weights:** Medium (500)
* **Role:** Code snippets, payment IDs, terminal logs, currency codes, and transactional metadata.

### Type Scale (Tailwind Extensions)

| Role | Size | Line Height | Letter Spacing | Tailwind Utility |
|------|------|-------------|----------------|------------------|
| caption | 12px | 1.5 | -0.01em (-0.12px) | `text-flox-caption` |
| body-sm | 14px | 1.5 | -0.01em (-0.14px) | `text-flox-body-sm` |
| body | 16px | 1.5 | -0.011em (-0.176px) | `text-flox-body` |
| subheading | 18px | 1.35 | -0.012em (-0.216px) | `text-flox-subheading` |
| heading | 24px | 1.33 | -0.02em (-0.48px) | `text-flox-heading` |
| display | 76px | 1.0 | -0.046em (-3.496px) | `text-flox-display` |

---

## 3. Tokens — Spacing & Radii

**Base Unit:** 4px  
**Layout Density:** Compact / Monospace alignment.

### Spacing Scale
* `flox-4`: 4px
* `flox-8`: 8px
* `flox-12`: 12px
* `flox-16`: 16px
* `flox-24`: 24px
* `flox-40`: 40px
* `flox-80`: 80px
* `flox-120`: 120px
* **Custom:** `4.5` (18px / 1.125rem)

### Border Radius Scale
* `flox-cards` (`rounded-flox-cards`): 12px (Cards, modal containers)
* `flox-badges` (`rounded-flox-badges`): 12px (Status indicators, badges)
* `flox-inputs` (`rounded-flox-inputs`): 6px (Input boxes)
* `flox-buttons` (`rounded-flox-buttons`): 6px (Navigation items, small buttons)
* `flox-navItems` (`rounded-flox-navItems`): 6px (Sidebar, topbar nav items)

---

## 4. Tokens — Shadows & Gradients

### Box Shadows
* `premium`: `0 18px 55px rgba(12,22,44,0.12)` (Soft, deep elevation shadow)
* `flox-subtle`: Glassmorphic inner-glow shadow stack.
* `flox-sm`: High legibility contrast layered shadows.
* `nexora-card`: `0 2px 8px rgba(15, 23, 42, 0.08)` (Light surface card shadow)
* `nexora-soft`: `0 8px 24px rgba(15, 23, 42, 0.06)` (Soft hovering shadow)

### Background Gradients
* `flox-gradient-a`: `linear-gradient(92deg, #8247ff -9.21%, #f47bff 104.14%)` (Purple-to-Pink)
* `flox-gradient-b`: `linear-gradient(95deg, #ff72cf -13.39%, #8a15ff 114.46%)` (Pink-to-Purple)
* `nexora-gradient-gold`: `linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)` (Metallic Gold)
* `nexora-gradient-gold-cyan`: `linear-gradient(92deg, #d4af37 -9.21%, #32D7FF 104.14%)` (Gold-to-Cyan)

---

## 5. Components Reference

Custom CSS classes are defined in [src/index.css](file:///c:/Users/AD/Documents/GitHub/vlinknexora/src/index.css) to build clean layouts matching this spec:

### A. Core & Glassmorphic Buttons
1. **Ghost Button** (`.btn-ghost`)
   * **Specs:** Transparent background, `inkBlue` text, 1px Slate Gray border, 6px radius, padding 4px V / 6px H.
   * **Hover:** Light gray tint bg in light mode; subtle gold tint in dark mode.
2. **Outline Ghost Button** (`.btn-outline-ghost`)
   * **Specs:** Transparent background, `floxAnthracite`/Gold text, `floxLightFog`/Gold-border, 12px radius, padding 12px V / 25px H.
3. **Primary Action Button** (`.btn-primary-action`)
   * **Specs:** `floxObsidianBlack` background (Light mode) / Gold background (Dark mode), high contrast text, 12px radius, padding 12px V / 25px H. Includes `flox-subtle` inner glow shadow.
4. **Gradient CTA Button** (`.btn-gradient-cta`)
   * **Specs:** Nexora brand Gold-to-Cyan gradient background (`nexora-gradient-gold-cyan`), White text, 12px radius, padding 12px V / 25px H.

### B. Core & Glassmorphic Containers
1. **Elevated Card** (`.card-elevated`)
   * **Specs:** White background (Light) / Luxury Coal (Dark), 12px radius, 24px padding. Layered shadow stack (`nexora-soft`) in light mode; subtle gold border glow in dark mode.
2. **Code Block Card** (`.card-code-block`)
   * **Specs:** Code container. Monospace text (GeistMono/Fira Code), 12px radius, 24px padding. Muted cyan highlight text color in dark mode.
3. **Bordered List Item** (`.bordered-list-item`)
   * **Specs:** Transparent background, separated by clear borders of Slate Gray / gold-border.

### C. Nexora Touch Admin Core Components
1. **Nexora Card** (`.nexora-card`)
   * **Specs:** Rounded-xl (12px), border `nexoraBorder`, background `nexoraSurface`, shadow `nexora-card`.
2. **Nexora Icon Button** (`.nexora-icon-button`)
   * **Specs:** Inline-flex, `h-10 w-10`, rounded-lg (8px), text `nexoraText`. Hover state transitions to background `nexoraSurfaceMuted`.
3. **Nexora Primary Button** (`.nexora-primary-button`)
   * **Specs:** Inline-flex, `h-10`, items-center, gap-2, rounded-lg (8px), background `nexoraBrand`, text-white, shadow `nexora-soft`. Hover state shifts to `nexoraBrandDark`.
4. **Nexora Search Input** (`.nexora-search-input`)
   * **Specs:** `h-11`, w-full, rounded-full, border transparent, background `nexoraSurfaceMuted`, text-sm, text `nexoraText`, left padding `pl-12` for search icon. Focus boundary shifts border to `nexoraBrand`.
5. **Nexora Sidebar Panel** (`.nexora-sidebar-panel`)
   * **Specs:** Rounded-xl (12px), border `white/10`, background translucent `white/5`.

---

## 6. Implementation Best Practices & Linter Guidelines

To ensure the design system is strictly preserved, we employ a custom linter script in [scripts/verify-tokens.cjs](file:///c:/Users/AD/Documents/GitHub/vlinknexora/scripts/verify-tokens.cjs). It is executed before builds (`pnpm lint:tokens`).

### Do's
* Use `.glass-dark` and `.glass-light` for responsive dashboards.
* Restrict layout borders to `flox-buttons` (6px) for inputs/buttons and `flox-cards` (12px) for cards.
* Use `font-mono` (`GeistMono`) only for logs, transactional metadata, QR codes, and currency codes.
* Bound font sizes strictly to the `text-flox-*` typography family.
* Reference custom tokens (e.g. `bg-nexoraCanvas`, `text-luxuryGold`, `border-nexoraBorder`) when building new features.

### Don'ts
* **No hardcoded CSS hex codes or colors** (e.g., `color: '#ff4fae'`). Use Tailwind classes instead.
* **No arbitrary Tailwind colors** (e.g., `bg-[#711aff]` or `text-rgb(5,5,5)`). Map them to config tokens.
* **No standard generic Tailwind colors** (e.g., `bg-blue-500`, `text-red-600`, `border-slate-200`). Always use theme tokens (e.g. `bg-nexoraBrand`, `text-nexoraDanger`, `border-nexoraBorder`).
* **No arbitrary spacing/sizing brackets** (e.g., `w-[15px]` or `p-[20px]`). Use standard Tailwind spacing or Flox-specific spacing tokens (e.g. `flox-8`, `flox-16`).
