import type { CheckInBackgroundTemplate } from '../../dashboard/views/pos/checkinPrint/useCheckInBackgroundPrint'
import type { AppLanguage } from '../../../types/contexts'
import { ONEQR_CONCEPTS } from './oneQrArtworkConcepts'
import type { OneQrIndustryId } from './oneQrArtworkConcepts'

export { ONEQR_CONCEPTS, ONEQR_INDUSTRIES } from './oneQrArtworkConcepts'
export type { OneQrIndustryId } from './oneQrArtworkConcepts'

export interface OneQrArtworkBackground extends CheckInBackgroundTemplate {
  industryId: OneQrIndustryId
  assetId: string
  hoursColor: string
}

// QR interiors are measured in the supplied artwork's original pixels.
function artwork(id: string, sourceWidth: number, height: number, x: number, y: number, width: number, boxHeight: number, color: string, hoursColor = color): CheckInBackgroundTemplate & { hoursColor: string } {
  return {
    id,
    imageUrl: `${import.meta.env.BASE_URL}images/oneqr-templates/${id}.webp?v=2`,
    thumbnailUrl: `${import.meta.env.BASE_URL}images/oneqr-templates/${id}-thumb.webp?v=2`,
    qrBox: { x: x / sourceWidth, y: y / height, width: width / sourceWidth, height: boxHeight / height },
    qrScale: 1.14,
    pageSize: { widthPt: 792 * sourceWidth / height, heightPt: 792 },
    brandingArea: { x: .25, y: .025, width: .5, height: .07 },
    brandingColor: color,
    hoursColor,
    brandingFont: 'heading',
  }
}

/** One card per concept; the eight original Nail images retain their English artwork. */
export function getOneQrArtworkBackgrounds(language: AppLanguage): OneQrArtworkBackground[] {
  return ONEQR_CONCEPTS.map<OneQrArtworkBackground>(concept => {
    const legacy = ONEQR_LEGACY_BACKGROUNDS.find(item => item.id === concept.id)
    if (legacy) return { ...legacy, industryId: concept.industryId, assetId: concept.id }
    const assetId = `${concept.id}-${language}`
    const assetVersion = 6
    return {
      id: concept.id,
      industryId: concept.industryId,
      assetId,
      imageUrl: `${import.meta.env.BASE_URL}images/oneqr-templates/${assetId}.webp?v=${assetVersion}`,
      thumbnailUrl: `${import.meta.env.BASE_URL}images/oneqr-templates/${assetId}-thumb.webp?v=${assetVersion}`,
      qrBox: { x: 768 / 2400, y: 1320 / 3300, width: 864 / 2400, height: 864 / 3300 },
      qrScale: 1,
      pageSize: { widthPt: 576, heightPt: 792 },
      brandingArea: { x: .25, y: .025, width: .5, height: .07 },
      brandingColor: concept.brandingColor,
      hoursColor: concept.hoursColor,
      brandingFont: 'heading',
    }
  })
}

// Preserve the measured legacy layouts for existing integrations and files.
export const ONEQR_LEGACY_BACKGROUNDS = [
  artwork('01', 800, 1099, 257, 433, 286, 303, '#8b652d', '#543914'),
  artwork('02', 800, 1101, 264, 437, 271, 270, '#f0d77f'),
  artwork('03', 800, 1101, 263, 428, 266, 267, '#a05256', '#772e3b'),
  artwork('04', 1069, 1471, 348, 567, 340, 364, '#273f30'),
  artwork('05', 1105, 1424, 366, 523, 372, 369, '#cdf8fc'),
  artwork('06', 1103, 1426, 363, 501, 377, 387, '#202020'),
  artwork('07', 1103, 1426, 368, 514, 363, 374, '#8b652d', '#17130c'),
  artwork('08', 1103, 1426, 365, 479, 354, 359, '#12477b'),
]
