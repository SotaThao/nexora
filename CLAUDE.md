# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CryptoMap360 is a cryptocurrency discovery and merchant network visualization platform — a SPA rendering an interactive globe of merchant locations worldwide, with crypto market data and exchange information.

## Commands

### Setup & Development

```bash
# Install dependencies
pnpm install

# Development server (default: http://localhost:3000)
pnpm dev              # Production API environment

# Dev with alternate API environments
pnpm dev:test         # Test API environment
pnpm dev:staging      # Staging API environment

# Linting & formatting
pnpm lint             # ESLint (if available)
pnpm format           # Format code (if available)

# Tests
pnpm test             # Run all tests (vitest run)
```

### Building

```bash
# Default production build
pnpm build            # Optimized build for production API

# Environment-specific builds
pnpm build:dev        # Development API environment
pnpm build:test       # Test API environment
pnpm build:staging    # Staging API environment
pnpm build:prod       # Production with maximum optimizations

# Bundle analysis
ANALYZE=true pnpm build   # Generates docs/bundle-analysis.html for size profiling
```

### Docker

```bash
docker build -t cryptomap360-fe .
docker build --build-arg BUILD_ENV=staging -t cryptomap360-fe:staging .
```

### Development Tips

- **Port**: Configured via `VITE_PORT` in `.env.*` files; defaults to 3000.
- **API environment**: Choose `dev`, `dev:test`, or `dev:staging` based on which backend API you need.
- **Bundle analysis**: Run `ANALYZE=true pnpm build` to identify large dependencies and optimize chunks.

## Code Style & Linting

- **TypeScript**: Strict typing; all interfaces in `src/models/`.
- **File naming**: PascalCase for components/pages, camelCase for hooks/utils/services.
- **Imports**: Use `@/` alias for source files; order: React → third-party → `@/` (config→lib→services→stores→hooks→contexts→models→components→utils) → relative → types → styles.
- **Styling**: Tailwind v4 with `cn()` for conditional classes; no inline styles; design tokens in `src/styles/globals.css`.
- **Components**: Keep under ~500 lines; split when exceeded. Use compound components instead of boolean props.
- **i18n**: All UI text via translation files (`src/locales/en.json`, `src/locales/vi.json`); no hardcoded strings.
- **Comments**: Only for non-obvious WHY; avoid narrating WHAT (code should be self-documenting).

## Architecture

### Repository Structure

```
src/
├── app/
│   ├── components/    # Feature-organized components (auth, map, market, exchange, landing, layout, ui/)
│   ├── pages/         # Page-level components (21 pages)
│   ├── hooks/         # App-specific hooks
│   └── App.tsx        # Main app + all route definitions (16+ routes inline, no separate router file)
├── config/            # API endpoints, env vars, responsive breakpoints, storage keys
├── contexts/          # React Contexts: AuthContext, LanguageContext, HttpClientContext
├── hooks/             # Reusable hooks (GPS, Google Maps ready, responsive layout, iOS zoom)
├── lib/
│   ├── queryClient.ts         # TanStack Query setup (3min stale, 5min GC)
│   ├── httpClient.ts          # Axios instance
│   └── tanstack-query/        # 17 query hooks (useMerchantsQuery, useTopCryptoMarkets, etc.)
├── models/            # TypeScript interfaces (business, auth, filters, location, market, review, cluster)
├── providers/
│   ├── AuthProvider/          # Token validation on mount, profile loading, login/logout
│   └── HttpClientProvider/    # Bearer token injection, 401 token refresh with request queue
├── services/          # 28 service files extending BaseService
├── stores/            # 6 Zustand stores with localStorage persistence
├── utils/             # 30+ utility functions (clustering, formatting, geo, logging)
├── locales/           # i18n: en.json + vi.json (error codes + UI strings)
└── styles/            # TailwindCSS v4 with custom design tokens in globals.css
```

### Data Flow

1. **Server State**: TanStack Query v5 — all query hooks live in `src/lib/tanstack-query/`
2. **Client State**: Zustand stores in `src/stores/` with localStorage persistence via `persist` middleware
3. **API Layer**: All HTTP calls go through `services/` classes extending `BaseService` — never call fetch/axios directly in components

### Routing

All routes are defined inline in `src/app/App.tsx` (no separate router config yet). Key routes:
- `/` → LandingPage
- `/map`, `/map/:businessId` → MapPage
- `/market`, `/exchange` → MarketPage, ExchangePage
- `/profile/:section` → ProfilePage
- `/r/:token` → ReviewTokenRedirectPage
- `/merchant/review-tokens/:token/activate` → ActivateReviewTokenPage
- Legal hub: `/legal-hub/{terms,privacy,cookies,kyb,disclaimer}`

### Key Services

- `vlinkpayDirectService.ts` — merchant listing submissions and file uploads
- `merchantReviewService.ts` / `reviewService.ts` — review CRUD operations
- `googlePlacesService.ts` — Places autocomplete
- `googleDirectionsService.ts` — routing/directions
- `coingecko.ts` / `coingecko-fallback.service.ts` — market price data with fallback
- `geolocationService.ts` / `ipGeolocationService.ts` — GPS + IP-based location

### API Configuration

```typescript
import { API_BASE, API_ENDPOINTS } from '@/config/api';
// All endpoints defined in src/config/apiEndpoints.ts
// Direct calls to https://api.cryptomap360.com (no proxy)
```

### State Management

```typescript
// Zustand stores — exported from src/stores/index.ts
import { useMerchantsStore, useUserStore } from '@/stores';
// useMerchantsStore: filters (category/crypto/industry/location/verified/Near Me), selected merchant, search query

// TanStack Query
import { queryClient } from '@/lib/queryClient';
// Prefetches merchants + top 20 crypto on app mount
```

### Authentication

- JWT tokens in localStorage; `AuthProvider` validates on mount and loads profile
- `HttpClientProvider` injects Bearer token on every request and queues requests during token refresh
- `auth.store.ts` persists JWT + merchant businesses profile

### Styling

- **TailwindCSS v4** — no `tailwind.config.js`; design tokens defined in `@theme` block in `src/styles/globals.css`
- Primary color: `#f0b90b` (gold), dark background: `#0b0e11`
- Pre-built responsive classes in `src/config/responsiveClasses.ts`
- Desktop/mobile breakpoint: **1280px** (`src/config/breakpoints.ts`)
- Emotion (CSS-in-JS) also used alongside Tailwind in some components

## Environment Variables

Files used: `.env.development`, `.env.test`, `.env.staging`, `.env.production`

Required variables:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_API_BASE=https://api.cryptomap360.com  # API endpoint for the mode
VITE_PORT=3000                              # Dev server port
VITE_MAP_MARKER_ENGINE=overlay              # overlay or advanced
```

All variables must be prefixed with `VITE_` to be available in the browser. **Never commit API keys or tokens** — use `.env.local` for local secrets.

## Core Principles

**YAGNI**, **KISS**, **DRY** — every solution must honor these.

### Component Architecture

- Avoid boolean prop proliferation — use compound components and explicit variants
- Lift state into provider components for sibling access
- Prefer composing `children` over render props
- Use direct imports over barrel files; lazy-load heavy components
- **Component size limit**: keep components under ~500 lines; split into sub-components when exceeded
- **No prop drilling**: if a prop passes through 3+ layers, create a Context provider instead
- Each extracted sub-component goes in its own file within the same feature directory

### Frontend Code Standards

Reference `.cursor/skills/frontend-code-standards/SKILL.md` for full detail:
- **File naming**: PascalCase for components/pages, camelCase for hooks/utils/services, lowercase for shadcn primitives
- **Import ordering**: React → third-party → `@/` internal (config→lib→services→stores→hooks→contexts→models→components→utils) → relative → types → styles
- **Component structure**: Interface → Function → hooks → derived → handlers → JSX
- **TypeScript**: interfaces in `src/models/`, `import type` for type-only, no `any`, generics in `BaseService.get<T>()`
- **Tailwind**: `cn()` for conditional classes, CSS variables from `@theme` tokens, no inline styles, no `@apply`
- **API layer**: always through `src/services/` extending BaseService, never raw fetch in components
- **State**: TanStack Query for server state, Zustand for client state, never duplicate API data into stores
- **Zustand selectors**: use pre-built selectors from `useMerchantsSelectors` — do not access `useMerchantsStore(state => state.X)` directly

### Security Rules

- **No hardcoded secrets**: API tokens must come from `import.meta.env.VITE_*` — never as fallback string literals
- **No raw HTML injection**: never use `dangerouslySetInnerHTML` without wrapping the value in `sanitizeHtml()` from `src/utils/sanitizeHtml.ts` (uses DOMPurify)
- **No `javascript:` / `data:` URLs**: validate URL inputs to allow only `http://` and `https://` protocols
- **Form validation**: use `zod` schemas for all user-facing form inputs
- **Logging**: route all log statements through `src/utils/logger.ts` — never `console.log` directly in services or production paths
- **File uploads**: validate via magic bytes (first 4 bytes), not just `file.type`

### Performance Rules

- **Route-level code splitting**: all pages except `LandingPage` and `MapPage` must use `React.lazy()` with a `<Suspense>` boundary
- **External API calls**: route through `ExternalApiService` (extends `BaseService`) — never raw `fetch()` in service files
- **Coin data**: single source of truth is TanStack Query cache (`staleTime: 3min`); do not duplicate coin data in Zustand stores
- **Distance calculation**: always import from `src/utils/distanceCalculator.ts`; standardize on kilometers, convert to miles only at display layer

### Dead Code Policy

- Do not add new instances of packages already identified as unused: `leaflet`, `react-leaflet`, `react-dnd`, `react-slick`, `react-responsive-masonry`, `d3-geo`, `d3-scale`
- Do not add `@deprecated` functions — delete callers and remove the function in the same PR
- Do not create duplicate `calculateDistance()` implementations; import the canonical one from `src/utils/distanceCalculator.ts`

### TypeScript

- Strict typing; interfaces in `src/models/`
- Path alias: `@/` → `src/`
- All API responses typed via generics: `BaseService.get<T>()`

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/app/App.tsx` | All route definitions |
| `src/services/BaseService.ts` | Axios base class (versioning, app-source headers, 1 retry) |
| `src/stores/useMerchantsStore.ts` | Filter + search + selected merchant state |
| `src/providers/AuthProvider/index.tsx` | Auth lifecycle management |
| `src/providers/HttpClientProvider/index.tsx` | Token injection + 401 refresh queue |
| `src/config/apiEndpoints.ts` | All API endpoint constants |
| `src/locales/en.json` | English translations — add new error codes here |
| `src/locales/vi.json` | Vietnamese translations — add new error codes here |
| `src/styles/globals.css` | TailwindCSS v4 design tokens (`@theme` block) |

## Development Notes

### Caching & Storage

- Merchants cache: localStorage key is `vlinkpay_merchants_cache`
- TanStack Query: `staleTime: 3min`, `gcTime: 5min`

### Google Maps

- Loads asynchronously on app mount
- `useGoogleMapsReady()` hook: exponential backoff (5 retries, 30s timeout)
- **If map fails to load**: stop dev server, restart, refresh browser

### Production & Deployment

- **Console output**: Suppressed in production via `src/utils/consoleOverride.ts`
- **Content Security Policy (CSP)**: Active meta tag in `index.html`
  - **CRITICAL**: If adding any third-party script, API, font, image host, map provider, or analytics origin, update the matching CSP directive in `index.html` **at the same time** or the browser will block it in production
- **Build output**: Generated in `dist/`

### Service Layer

- `BaseService` retries: 1 attempt (optimized for CORS in browsers)
- All API calls: `src/services/` classes extending `BaseService` — never raw fetch/axios in components

### Workflow

- Use `/implement` or `/finish-feature` workflows for complex tasks
- Task management: `@docs/tasks` and `@docs/refactor-tasks` (update status when finished)
