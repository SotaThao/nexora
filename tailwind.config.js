/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nexora Brand Colors (UNCHANGED)
        luxuryBlack: '#050505',      /* Obsidian Deep Black */
        luxuryCoal: '#11100d',       /* Deep Charcoal Slate */
        luxuryBronze: '#8c6d31',     /* Muted Metallic Bronze */
        luxuryGold: '#d4af37',       /* 24K Polished Gold */
        luxuryGoldLight: '#f3e5ab',  /* Shimmering Champagne */
        luxuryGoldDark: '#aa7c11',   /* Burnished Antique Gold */
        luxuryAmber: '#ffbf00',      /* Golden Amber Glow */
        brandCyan: '#32D7FF',        /* Cyan Accent */
        inkBlue: '#071025',          /* Deep Ink Blue */
        mutedGrey: '#687385',        /* Muted Grey */

        // Flox Token Colors
        floxMidnightInk: '#020817',
        floxSnowWhite: '#ffffff',
        floxSlateGray: '#e2e8f0',
        floxAnthracite: '#1b1b1b',
        floxLightFog: '#f3f3f3',
        floxObsidianBlack: '#0c0c0c',
        floxElectricViolet: '#711aff',
        floxVividRose: '#ff4fae',

        // Nexora Touch Admin semantic tokens
        nexoraCanvas: '#F7F9FC',
        nexoraSurface: '#FFFFFF',
        nexoraSurfaceMuted: '#F3F6FA',
        nexoraBorder: '#DDE5EF',
        nexoraRule: '#E7ECF3',
        nexoraText: '#0B1220',
        nexoraMuted: '#4D5870',
        nexoraSubtle: '#7A8296',
        nexoraSidebar: '#101633',
        nexoraSidebarPanel: '#202641',
        nexoraBrand: '#4648D8',
        nexoraBrandDark: '#393BC8',
        nexoraBrandSoft: '#E9E9FF',
        nexoraSuccess: '#00B873',
        nexoraWarning: '#F59E0B',
        nexoraDanger: '#EF4444',
        nexoraTeal: '#12B886',
        nexoraLavender: '#A8A9F3',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Inter', 'sans-serif'],
        mono: ['GeistMono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'flox-caption': ['12px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'flox-body-sm': ['14px', { lineHeight: '1.5', letterSpacing: '-0.01em' }],
        'flox-body': ['16px', { lineHeight: '1.5', letterSpacing: '-0.011em' }],
        'flox-subheading': ['18px', { lineHeight: '1.35', letterSpacing: '-0.012em' }],
        'flox-heading': ['24px', { lineHeight: '1.33', letterSpacing: '-0.02em' }],
        'flox-display': ['76px', { lineHeight: '1', letterSpacing: '-0.046em' }],
      },
      spacing: {
        '4.5': '1.125rem',
        'flox-4': '4px',
        'flox-8': '8px',
        'flox-12': '12px',
        'flox-16': '16px',
        'flox-24': '24px',
        'flox-40': '40px',
        'flox-80': '80px',
        'flox-120': '120px',
      },
      borderRadius: {
        'flox-cards': '12px',
        'flox-badges': '12px',
        'flox-inputs': '6px',
        'flox-buttons': '6px',
        'flox-navItems': '6px',
      },
      boxShadow: {
        premium: '0 18px 55px rgba(12,22,44,0.12)',
        'flox-subtle': 'rgba(255, 255, 255, 0.2) 0px -2px 1px 0px inset, rgba(255, 255, 255, 0.1) 0px 4px 16px 0px inset, rgba(0, 0, 0, 0.08) 0px 6px 16px 0px',
        'flox-sm': 'rgba(0, 0, 0, 0.04) 0px 2px 8px 0px, rgba(0, 0, 0, 0.08) 0px 8px 24px 0px, rgba(0, 0, 0, 0.12) 0px 16px 48px 0px',
        'nexora-card': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'nexora-soft': '0 8px 24px rgba(15, 23, 42, 0.06)',
      },
      backgroundImage: {
        'flox-gradient-a': 'linear-gradient(92deg, rgb(130, 71, 255) -9.21%, rgb(244, 123, 255) 104.14%)',
        'flox-gradient-b': 'linear-gradient(95deg, rgb(255, 114, 207) -13.39%, rgb(138, 21, 255) 114.46%)',
        'nexora-gradient-gold': 'linear-gradient(135deg, #d4af37 0%, #f3e5ab 50%, #aa7c11 100%)',
        'nexora-gradient-gold-cyan': 'linear-gradient(92deg, #d4af37 -9.21%, #32D7FF 104.14%)',
      }
    },
  },
  plugins: [],
}
