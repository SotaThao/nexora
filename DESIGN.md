# Nexora Design System — Style Reference
> Developer console meets premium luxury dashboard. Achromatic surfaces accented by 24K Polished Gold and Shimmering Cyan.

**Core Concept:**
Nexora utilizes a high-end, clean document layout with strict layout rules. It features premium glassmorphic canvases, precise monospace details, and vibrant accents (Gold and Cyan) to establish a premium financial technology and tipping identity.

---

## 1. Tokens — Colors

We maintain Nexora's iconic brand color palette while integrating standard semantic roles from the design system layout rules:

### Brand Colors (Unchanged)
* **luxuryBlack** (`#050505`): Obsidian Deep Black. Primary canvas background for dark mode.
* **luxuryCoal** (`#11100d`): Deep Charcoal Slate. Elevated surface background for dark mode.
* **luxuryGold** (`#d4af37`): 24K Polished Gold. Primary brand accent color.
* **luxuryGoldLight** (`#f3e5ab`): Shimmering Champagne. Hover accent color.
* **luxuryGoldDark** (`#aa7c11`): Burnished Antique Gold. Active state borders.
* **brandCyan** (`#32D7FF`): Vibrant Shimmering Cyan. Secondary brand accent and hover highlights.
* **inkBlue** (`#0B1C30`): Deep Ink Blue. Primary text color in light mode.
* **mutedGrey** (`#565E74`): Slate Grey. Inactive elements and secondary text.

### Semantic Mapping

| Role | Light Mode Value | Dark Mode Value | Tailwind class |
|------|------------------|-----------------|----------------|
| Page Canvas | `#F8FAFC` | `#050505` | `bg-white/bg-luxuryBlack` |
| Elevated Surface | `#ffffff` (80% glass) | `#11100d` (85% glass) | `glass-light/glass-dark` |
| Text Primary | `#0B1C30` (`inkBlue`) | `#ffffff` | `text-inkBlue/text-white` |
| Text Muted | `#565E74` | `#94a3b8` | `text-mutedGrey/text-slate-400` |
| Borders / Dividers | `rgba(231, 234, 240, 0.5)` | `rgba(212, 175, 55, 0.18)` | `border-floxSlateGray/border-luxuryGold/18` |
| Primary Accent | `#d4af37` | `#d4af37` | `text-luxuryGold` |
| Secondary Accent | `#32D7FF` | `#32D7FF` | `text-brandCyan` |

---

## 2. Tokens — Typography

### Primary Typeface: GeistSans
* **Substitute:** Inter
* **Weights:** Regular (400), Medium (500), Bold (700)
* **Role:** Standard interface font. Compact letter-spacing ensures a technical and premium feel.

### Technical Typeface: GeistMono
* **Substitute:** Fira Code
* **Weights:** Medium (500)
* **Role:** Code snippets, payment IDs, and terminal-like logs.

### Type Scale

| Role | Size | Line Height | Letter Spacing | Tailwind Utility |
|------|------|-------------|----------------|------------------|
| caption | 12px | 1.5 | -0.12px | `text-flox-caption` |
| body-sm | 14px | 1.5 | -0.14px | `text-flox-body-sm` |
| body | 16px | 1.5 | -0.176px | `text-flox-body` |
| subheading | 18px | 1.35 | -0.216px | `text-flox-subheading` |
| heading | 24px | 1.33 | -0.48px | `text-flox-heading` |
| display | 76px | 1.0 | -3.496px | `text-flox-display` |

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

### Border Radius Scale
* `flox-cards`: 12px (Cards, modal containers)
* `flox-badges`: 12px (Status indicators, badges)
* `flox-inputs`: 6px (Input boxes)
* `flox-buttons`: 6px (Navigation items, small buttons)
* `flox-navItems`: 6px (Sidebar, topbar nav items)

---

## 4. Components Reference

Custom CSS classes have been defined in `src/index.css` to build clean layouts matching this spec:

### A. Buttons

1. **Ghost Button** (`.btn-ghost`)
   * **Specs:** Transparent background, `inkBlue` text, 1px Slate Gray border, 6px radius, padding 4px V / 6px H.
   * **Hover:** Light gray tint bg in light mode; subtle gold tint in dark mode.
2. **Outline Ghost Button** (`.btn-outline-ghost`)
   * **Specs:** Transparent background, `anthracite`/gold text, Light Fog/gold-border, 12px radius, padding 12px V / 25px H.
3. **Primary Action Button** (`.btn-primary-action`)
   * **Specs:** Obsidian Black background (Light mode) / Gold background (Dark mode), high contrast text, 12px radius, padding 12px V / 25px H. Includes subtle inner glow shadow in light mode.
4. **Gradient CTA Button** (`.btn-gradient-cta`)
   * **Specs:** Nexora brand Gold-to-Cyan gradient background, White text, 12px radius, padding 12px V / 25px H.

### B. Cards & Containers

1. **Elevated Card** (`.card-elevated`)
   * **Specs:** White background (Light) / Luxury Coal (Dark), 12px radius, 24px padding. High-depth layered shadow stack in light mode; subtle gold border glow in dark mode.
2. **Code Block Card** (`.card-code-block`)
   * **Specs:** Standard code container. Monospace text (GeistMono/Fira Code), 12px radius, 24px padding.
3. **Bordered List Item** (`.bordered-list-item`)
   * **Specs:** Transparent background, separated by clear borders of Slate Gray / gold-border.

---

## 5. Implementation Best Practices

### Do's
* Use `.glass-dark` and `.glass-light` for responsive dashboards.
* Restrict layout borders to `flox-buttons` (6px) for inputs/buttons and `flox-cards` (12px) for cards.
* Use `font-mono` (`GeistMono`) only for logs, transactional metadata, and currency codes.
* Bound font sizes strictly to the `text-flox-*` typography family.

### Don'ts
* Do not introduce arbitrary colors outside the Nexora theme.
* Do not use generic tailwind rounded classes like `rounded-md` or `rounded-xl`; always use design-system variables (`rounded-flox-inputs`, `rounded-flox-cards`).
* Do not use standard violet gradient colors; map all CTA visual accents to `nexora-gradient-gold-cyan`.
