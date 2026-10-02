import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '../../../locales/en.json'
import vi from '../../../locales/vi.json'
import { ONEQR_CONCEPTS, ONEQR_INDUSTRIES, ONEQR_LEGACY_BACKGROUNDS, getOneQrArtworkBackgrounds } from './oneQrArtworkCatalog'

describe('OneQR industry artwork contract', () => {
  it('keeps eight concepts per non-Food industry, four Food concepts, and eight original Nail templates', () => {
    expect(ONEQR_INDUSTRIES).toHaveLength(14)
    expect(ONEQR_CONCEPTS).toHaveLength(108)
    expect(new Set(ONEQR_CONCEPTS.map(item => item.id)).size).toBe(108)
    for (const industry of ONEQR_INDUSTRIES) {
      expect(ONEQR_CONCEPTS.filter(item => item.industryId === industry)).toHaveLength(industry === 'food' ? 4 : 8)
    }
  })

  it.each(['en', 'vi'] as const)('resolves all 108 %s templates with their original QR geometry and localized names', language => {
    const backgrounds = getOneQrArtworkBackgrounds(language)
    const translations = (language === 'en' ? en : vi).oneqr.artwork
    expect(backgrounds).toHaveLength(108)
    for (const background of backgrounds) {
      const legacy = ONEQR_LEGACY_BACKGROUNDS.find(item => item.id === background.id)
      expect(background.assetId).toBe(legacy ? background.id : `${background.id}-${language}`)
      expect(background.imageUrl).toContain(`/${background.assetId}.webp?`)
      expect(background.thumbnailUrl).toContain(`/${background.assetId}-thumb.webp?`)
      expect(existsSync(resolve('public/images/oneqr-templates', `${background.assetId}.webp`))).toBe(true)
      expect(existsSync(resolve('public/images/oneqr-templates', `${background.assetId}-thumb.webp`))).toBe(true)
      expect(background.qrBox).toEqual(legacy?.qrBox ?? { x: .32, y: .4, width: .36, height: 864 / 3300 })
      expect(background.qrScale).toBe(legacy?.qrScale ?? 1)
      expect(background.pageSize).toEqual(legacy?.pageSize ?? { widthPt: 576, heightPt: 792 })
      expect(background.brandingArea).toEqual({ x: .25, y: .025, width: .5, height: .07 })
      expect(translations.templates[background.id as keyof typeof translations.templates]).toBeTruthy()
      expect(translations.industries[background.industryId]).toBeTruthy()
    }
  })

  it('maps English and Vietnamese assets to the same concept identities', () => {
    const english = getOneQrArtworkBackgrounds('en')
    const vietnamese = getOneQrArtworkBackgrounds('vi')
    expect(english.map(item => item.id)).toEqual(vietnamese.map(item => item.id))
    expect(new Set([...english, ...vietnamese].map(item => item.assetId)).size).toBe(208)
    expect(ONEQR_LEGACY_BACKGROUNDS.map(item => item.id)).toEqual(['01','02','03','04','05','06','07','08'])
  })
})
