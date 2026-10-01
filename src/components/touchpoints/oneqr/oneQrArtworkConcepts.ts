export const ONEQR_INDUSTRIES = ['beauty', 'food', 'shopping', 'health', 'mobility', 'home', 'finance', 'travel', 'education', 'events', 'family', 'business', 'community'] as const
export type OneQrIndustryId = typeof ONEQR_INDUSTRIES[number]

export interface OneQrArtworkConcept {
  id: string
  industryId: OneQrIndustryId
  brandingColor: string
  hoursColor: string
}

// Concept identity survives system language changes; localized names live in the locale tables.
export const ONEQR_CONCEPTS: OneQrArtworkConcept[] = [
  { id: 'beauty-nail', industryId: 'beauty', brandingColor: '#fce8f3', hoursColor: '#fce8f3' },
  { id: 'beauty-spa', industryId: 'beauty', brandingColor: '#f2f9ed', hoursColor: '#f2f9ed' },
  { id: 'beauty-barber', industryId: 'beauty', brandingColor: '#fff1dd', hoursColor: '#fff1dd' },
  { id: 'beauty-skincare', industryId: 'beauty', brandingColor: '#ffedf1', hoursColor: '#ffedf1' },
  { id: 'food-bistro', industryId: 'food', brandingColor: '#3e2522', hoursColor: '#3e2522' },
  { id: 'food-coffee', industryId: 'food', brandingColor: '#35251e', hoursColor: '#35251e' },
  { id: 'food-bakery', industryId: 'food', brandingColor: '#4a3456', hoursColor: '#4a3456' },
  { id: 'food-quick', industryId: 'food', brandingColor: '#44221c', hoursColor: '#44221c' },
  { id: 'shopping-retail', industryId: 'shopping', brandingColor: '#f6f0e7', hoursColor: '#f6f0e7' },
  { id: 'shopping-florist', industryId: 'shopping', brandingColor: '#fff0eb', hoursColor: '#fff0eb' },
  { id: 'shopping-boutique', industryId: 'shopping', brandingColor: '#f5f2e9', hoursColor: '#f5f2e9' },
  { id: 'shopping-market', industryId: 'shopping', brandingColor: '#fff4d6', hoursColor: '#fff4d6' },
  { id: 'health-dental', industryId: 'health', brandingColor: '#245457', hoursColor: '#245457' },
  { id: 'health-fitness', industryId: 'health', brandingColor: '#eef5ff', hoursColor: '#eef5ff' },
  { id: 'health-wellness', industryId: 'health', brandingColor: '#4b4237', hoursColor: '#4b4237' },
  { id: 'health-optical', industryId: 'health', brandingColor: '#e7f3ff', hoursColor: '#e7f3ff' },
  { id: 'mobility-auto', industryId: 'mobility', brandingColor: '#f0f6ff', hoursColor: '#f0f6ff' },
  { id: 'mobility-detailing', industryId: 'mobility', brandingColor: '#edf7ff', hoursColor: '#edf7ff' },
  { id: 'mobility-bike', industryId: 'mobility', brandingColor: '#fff1d8', hoursColor: '#fff1d8' },
  { id: 'mobility-transit', industryId: 'mobility', brandingColor: '#f0f5ff', hoursColor: '#f0f5ff' },
  { id: 'home-repair', industryId: 'home', brandingColor: '#fff2dd', hoursColor: '#fff2dd' },
  { id: 'home-cleaning', industryId: 'home', brandingColor: '#3f4c42', hoursColor: '#3f4c42' },
  { id: 'home-garden', industryId: 'home', brandingColor: '#f5f6dd', hoursColor: '#f5f6dd' },
  { id: 'home-interior', industryId: 'home', brandingColor: '#32291e', hoursColor: '#32291e' },
  { id: 'finance-advisor', industryId: 'finance', brandingColor: '#f3eee3', hoursColor: '#f3eee3' },
  { id: 'finance-legal', industryId: 'finance', brandingColor: '#fff2d9', hoursColor: '#fff2d9' },
  { id: 'finance-property', industryId: 'finance', brandingColor: '#52473a', hoursColor: '#52473a' },
  { id: 'finance-accounting', industryId: 'finance', brandingColor: '#263b38', hoursColor: '#263b38' },
  { id: 'travel-hotel', industryId: 'travel', brandingColor: '#fff0d9', hoursColor: '#fff0d9' },
  { id: 'travel-resort', industryId: 'travel', brandingColor: '#173e46', hoursColor: '#173e46' },
  { id: 'travel-tour', industryId: 'travel', brandingColor: '#fff2e4', hoursColor: '#fff2e4' },
  { id: 'travel-camping', industryId: 'travel', brandingColor: '#f4e8d4', hoursColor: '#f4e8d4' },
  { id: 'education-academy', industryId: 'education', brandingColor: '#fff1d5', hoursColor: '#fff1d5' },
  { id: 'education-language', industryId: 'education', brandingColor: '#23414c', hoursColor: '#23414c' },
  { id: 'education-music', industryId: 'education', brandingColor: '#ffe9d4', hoursColor: '#ffe9d4' },
  { id: 'education-skills', industryId: 'education', brandingColor: '#38291d', hoursColor: '#38291d' },
  { id: 'events-concert', industryId: 'events', brandingColor: '#fff1e7', hoursColor: '#fff1e7' },
  { id: 'events-cinema', industryId: 'events', brandingColor: '#fff0d8', hoursColor: '#fff0d8' },
  { id: 'events-wedding', industryId: 'events', brandingColor: '#503c2d', hoursColor: '#503c2d' },
  { id: 'events-festival', industryId: 'events', brandingColor: '#f2eaff', hoursColor: '#f2eaff' },
  { id: 'family-pet', industryId: 'family', brandingColor: '#4b321f', hoursColor: '#4b321f' },
  { id: 'family-grooming', industryId: 'family', brandingColor: '#234542', hoursColor: '#234542' },
  { id: 'family-childcare', industryId: 'family', brandingColor: '#334b5a', hoursColor: '#334b5a' },
  { id: 'family-play', industryId: 'family', brandingColor: '#393c4e', hoursColor: '#393c4e' },
  { id: 'business-digital', industryId: 'business', brandingColor: '#f1f4ff', hoursColor: '#f1f4ff' },
  { id: 'business-consulting', industryId: 'business', brandingColor: '#3b2b23', hoursColor: '#3b2b23' },
  { id: 'business-cowork', industryId: 'business', brandingColor: '#2a403b', hoursColor: '#2a403b' },
  { id: 'business-it', industryId: 'business', brandingColor: '#e5fbfb', hoursColor: '#e5fbfb' },
  { id: 'community-volunteer', industryId: 'community', brandingColor: '#314023', hoursColor: '#314023' },
  { id: 'community-charity', industryId: 'community', brandingColor: '#433224', hoursColor: '#433224' },
  { id: 'community-library', industryId: 'community', brandingColor: '#fff3dc', hoursColor: '#fff3dc' },
  { id: 'community-arts', industryId: 'community', brandingColor: '#173b50', hoursColor: '#173b50' },
]
