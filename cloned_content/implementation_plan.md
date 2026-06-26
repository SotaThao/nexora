# Build & Deploy Nexora Next.js App

We are going to take the pixel-perfect Tip & Review UI from our HTML prototype and build a scalable Next.js application, automatically extracting assets from Figma, and preparing it for Vercel deployment.

> [!IMPORTANT]
> **User Review Required**
> Please review this plan. Once approved, I will automatically execute these steps. 

## Open Questions

> [!WARNING]
> 1. To push the code to `https://github.com/SotaThao/nexora`, do you already have Git credentials set up on this Windows machine? If not, I can initialize the repo locally and you can push it manually.
> 2. For the Vercel deployment, do you have the Vercel CLI installed and logged in? If not, the easiest way is for you to link your GitHub repo directly on the Vercel website after I push the code.

## Proposed Changes

### 1. Project Initialization
- Create a new Next.js project locally in a directory named `nexora`.
- Run `npx -y create-next-app@latest nexora --js --eslint --app --no-tailwind --src-dir --import-alias "@/*"`
- Move into the directory.

### 2. Figma Asset Extraction
- Connect to Figma using the MCP tools.
- Identify the exact Node IDs for the Payment Method icons (Zelle, Venmo, Cash App, Apple Cash, Paypal, VLINKPAY) and Store logos.
- Use `figma_get_component` and `figma_execute` to retrieve the assets and export them as SVG/PNG files into the `nexora/public/images` directory.

### 3. Component Translation
#### [NEW] `src/app/globals.css`
- Port the pixel-perfect Vanilla CSS we perfected in `tip-flow.html` into the global styles to ensure 100% visual fidelity without Tailwind side-effects.

#### [NEW] `src/app/page.js`
- Translate the HTML structure into a dynamic React component.
- Implement the state management for Scenarios 1-4 (Staff selection, Tip amount selection, Payment method toggle, and split logic).
- Use the actual exported assets via `<img src="/images/..." />` instead of CSS mockups.

### 4. GitHub Push
- Initialize a git repository.
- Add remote: `git remote add origin https://github.com/SotaThao/nexora.git`
- Commit all code and push to the `main` branch.

## Verification Plan

### Automated Tests
- I will run `npm run build` to ensure the Next.js production build succeeds without errors.

### Manual Verification
- Start the local dev server using `npm run dev`.
- Visually verify that all assets (Zelle, Venmo, etc.) are loading correctly and the UI matches the Figma design 100%.
- Ask you to check the Vercel dashboard to verify the deployment.