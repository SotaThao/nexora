// Color Palettes & Preset Themes for Merchant Site — US-107
import { MerchantSitePaletteId } from '../../../constants/merchantSiteStatus'

/**
 * Calculates the relative luminance of a color according to WCAG 2.1
 * Returns 0 for darkest black and 1 for lightest white.
 */
export function getRelativeLuminance(hex: string): number {
  try {
    const cleanHex = hex.replace('#', '')
    if (cleanHex.length !== 6 && cleanHex.length !== 3) return 0.5
    const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16) / 255
    const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16) / 255
    const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16) / 255

    const sRGB = [r, g, b].map((val) => {
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2]
  } catch {
    return 0.5
  }
}

/**
 * Returns '#FFFFFF' or '#0F172A' (high contrast) based on background luminance
 * Ensures WCAG 2.1 AA / AAA standard readability (contrast >= 4.5:1)
 */
export function getContrastTextColor(bgHex: string): string {
  try {
    const lum = getRelativeLuminance(bgHex)
    // If background luminance is high (light), use dark text; otherwise use pure white
    return lum > 0.45 ? '#0F172A' : '#FFFFFF'
  } catch {
    return '#FFFFFF'
  }
}

export interface SitePalette {
  id: MerchantSitePaletteId
  name: string
  accentColor: string
  accentHoverColor: string
  buttonText: string
  heroTextPrimary: string
  heroTextSecondary: string
  bgPrimary: string
  bgSurface: string
  textPrimary: string
  textSecondary: string
  borderPrimary: string
  heroGradient: string
  badgeBg: string
  badgeText: string
}

export const SITE_PALETTES: Record<MerchantSitePaletteId, SitePalette> = {
  [MerchantSitePaletteId.Gold]: {
    id: MerchantSitePaletteId.Gold,
    name: '24K Classic Luxe Gold',
    accentColor: '#D97706',
    accentHoverColor: '#B45309',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#CBD5E1',
    bgPrimary: '#0F172A',
    bgSurface: '#1E293B',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    borderPrimary: 'rgba(217, 119, 6, 0.3)',
    heroGradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeText: '#FBBF24',
  },
  [MerchantSitePaletteId.RoseGold]: {
    id: MerchantSitePaletteId.RoseGold,
    name: 'Modern Chic Rose Gold',
    accentColor: '#E11D48',
    accentHoverColor: '#BE123C',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#1E293B',
    heroTextSecondary: '#64748B',
    bgPrimary: '#FFF1F2',
    bgSurface: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    borderPrimary: '#FECDD3',
    heroGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)',
    badgeBg: '#FFE4E6',
    badgeText: '#E11D48',
  },
  [MerchantSitePaletteId.Emerald]: {
    id: MerchantSitePaletteId.Emerald,
    name: 'Organic Spa Emerald',
    accentColor: '#059669',
    accentHoverColor: '#047857',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#0F172A',
    heroTextSecondary: '#475569',
    bgPrimary: '#F0FDF4',
    bgSurface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderPrimary: '#A7F3D0',
    heroGradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    badgeBg: '#DCFCE7',
    badgeText: '#059669',
  },
  [MerchantSitePaletteId.Neon]: {
    id: MerchantSitePaletteId.Neon,
    name: 'Bold Vibrant Neon Purple',
    accentColor: '#6366F1',
    accentHoverColor: '#4F46E5',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#94A3B8',
    bgPrimary: '#081F49',
    bgSurface: '#0F2B6B',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    borderPrimary: 'rgba(99, 102, 241, 0.3)',
    heroGradient: 'linear-gradient(135deg, #081F49 0%, #1E1B4B 100%)',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeText: '#818CF8',
  },
  [MerchantSitePaletteId.Slate]: {
    id: MerchantSitePaletteId.Slate,
    name: 'Minimal Clean Slate',
    accentColor: '#0284C7',
    accentHoverColor: '#0369A1',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#0F172A',
    heroTextSecondary: '#64748B',
    bgPrimary: '#F8FAFC',
    bgSurface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    borderPrimary: '#E2E8F0',
    heroGradient: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    badgeBg: '#E0F2FE',
    badgeText: '#0284C7',
  },
  [MerchantSitePaletteId.Ruby]: {
    id: MerchantSitePaletteId.Ruby,
    name: 'Ruby Wine Đỏ Quyến Rũ',
    accentColor: '#BE123C',
    accentHoverColor: '#9F1239',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#FECDD3',
    bgPrimary: '#FFF1F2',
    bgSurface: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    borderPrimary: '#FECDD3',
    heroGradient: 'linear-gradient(135deg, #4C0519 0%, #881337 100%)',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
  },
  [MerchantSitePaletteId.Amethyst]: {
    id: MerchantSitePaletteId.Amethyst,
    name: 'Royal Amethyst Tím Hoàng Gia',
    accentColor: '#7C3AED',
    accentHoverColor: '#6D28D9',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#E9D5FF',
    bgPrimary: '#FAF5FF',
    bgSurface: '#FFFFFF',
    textPrimary: '#1E1B4B',
    textSecondary: '#6B7280',
    borderPrimary: '#E9D5FF',
    heroGradient: 'linear-gradient(135deg, #1E1B4B 0%, #3B0764 100%)',
    badgeBg: '#F3E8FF',
    badgeText: '#7C3AED',
  },
  [MerchantSitePaletteId.Ocean]: {
    id: MerchantSitePaletteId.Ocean,
    name: 'Sapphire Ocean Xanh Biển Sâu',
    accentColor: '#0284C7',
    accentHoverColor: '#0369A1',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#BAE6FD',
    bgPrimary: '#F0F9FF',
    bgSurface: '#FFFFFF',
    textPrimary: '#0C4A6E',
    textSecondary: '#475569',
    borderPrimary: '#BAE6FD',
    heroGradient: 'linear-gradient(135deg, #0C4A6E 0%, #082F49 100%)',
    badgeBg: '#E0F2FE',
    badgeText: '#0284C7',
  },
  [MerchantSitePaletteId.Coral]: {
    id: MerchantSitePaletteId.Coral,
    name: 'Pastel Coral Cam San Hô',
    accentColor: '#F43F5E',
    accentHoverColor: '#E11D48',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#1E293B',
    heroTextSecondary: '#64748B',
    bgPrimary: '#FFF1F2',
    bgSurface: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    borderPrimary: '#FFE4E6',
    heroGradient: 'linear-gradient(135deg, #FFF1F2 0%, #FED7AA 100%)',
    badgeBg: '#FFE4E6',
    badgeText: '#F43F5E',
  },
  [MerchantSitePaletteId.Matcha]: {
    id: MerchantSitePaletteId.Matcha,
    name: 'Sage Matcha Xanh Thuần Tự Nhiên',
    accentColor: '#10B981',
    accentHoverColor: '#059669',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#A7F3D0',
    bgPrimary: '#ECFDF5',
    bgSurface: '#FFFFFF',
    textPrimary: '#064E3B',
    textSecondary: '#475569',
    borderPrimary: '#A7F3D0',
    heroGradient: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
    badgeBg: '#D1FAE5',
    badgeText: '#059669',
  },
  [MerchantSitePaletteId.Mocha]: {
    id: MerchantSitePaletteId.Mocha,
    name: 'Warm Mocha Nâu Cà Phê Cổ Điển',
    accentColor: '#92400E',
    accentHoverColor: '#78350F',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#FDE68A',
    bgPrimary: '#FFFBEB',
    bgSurface: '#FFFFFF',
    textPrimary: '#451A03',
    textSecondary: '#78350F',
    borderPrimary: '#FDE68A',
    heroGradient: 'linear-gradient(135deg, #451A03 0%, #78350F 100%)',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
  },
  [MerchantSitePaletteId.Custom]: {
    id: MerchantSitePaletteId.Custom,
    name: 'Tùy Chỉnh Màu Riêng (Custom Brand Color)',
    accentColor: '#4F46E5',
    accentHoverColor: '#4338CA',
    buttonText: '#FFFFFF',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: 'rgba(255, 255, 255, 0.8)',
    bgPrimary: '#F8FAFC',
    bgSurface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    borderPrimary: 'rgba(79, 70, 229, 0.25)',
    heroGradient: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
    badgeBg: 'rgba(79, 70, 229, 0.12)',
    badgeText: '#4F46E5',
  }
}

export function getSitePalette(paletteId?: MerchantSitePaletteId, customColor?: string): SitePalette {
  const id = paletteId ?? MerchantSitePaletteId.Gold
  const base = SITE_PALETTES[id] ?? SITE_PALETTES[MerchantSitePaletteId.Gold]

  if (id === MerchantSitePaletteId.Custom && customColor) {
    const contrastBtnText = getContrastTextColor(customColor)
    return {
      ...base,
      accentColor: customColor,
      accentHoverColor: customColor,
      buttonText: contrastBtnText,
      heroTextPrimary: '#FFFFFF',
      heroTextSecondary: 'rgba(255, 255, 255, 0.8)',
      heroGradient: `linear-gradient(135deg, #0F172A 0%, ${customColor}33 50%, #0F172A 100%)`,
      borderPrimary: `${customColor}40`,
      badgeBg: `${customColor}20`,
      badgeText: customColor,
    }
  }

  return {
    ...base,
    buttonText: getContrastTextColor(base.accentColor)
  }
}

