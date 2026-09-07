import {
  SUGGESTED_PROMPTS,
  type SuggestedPrompt,
} from '../../../../data/repositories/marketingAdsMockData'

/** i18n key prefix for the Marketing → AI Design screen (US-110 Đợt 0). */
export const MARKETING_TK = 'components.dashboard.views.marketing'

export const AI_QUALITY_OPTIONS = ['low', 'medium', 'high'] as const
export type AiQualityOption = (typeof AI_QUALITY_OPTIONS)[number]

export const QUALITY_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const AI_QUALITY_COST = {
  low: 10,
  medium: 30,
  high: 60,
} as const

export const DEFAULT_IMAGE_QUALITY: 'low' | 'medium' | 'high' = 'medium'

export const QUALITY_RESOLUTIONS: Record<'low' | 'medium' | 'high', string> = {
  low: '1024×384',
  medium: '1280×480',
  high: '1920×640',
}

export { SUGGESTED_PROMPTS, type SuggestedPrompt }

/** Page size for the My Images library grid. */
export const MARKETING_IMAGES_PAGE_SIZE = 8
