/**
 * posTagsRepository — POS Owner Setup: Tags (US-017)
 */
import type { PosTagApiDto } from '../../types/repositories'

const DEFAULT_TAGS: PosTagApiDto[] = [
  { id: 'tag_1', name: 'Popular' },
  { id: 'tag_2', name: 'Deluxe' },
  { id: 'tag_3', name: 'Organic' },
  { id: 'tag_4', name: 'VIP Exclusive' },
  { id: 'tag_5', name: 'Seasonal' },
]

export const posTagsRepository = {
  async getPosTags(): Promise<PosTagApiDto[]> {
    return DEFAULT_TAGS
  },
}

export default posTagsRepository