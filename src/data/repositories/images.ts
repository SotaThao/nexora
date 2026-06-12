import httpClient from '../../lib/httpClient'
import type { ImageUploadResult } from '../../types/repositories'

export function createImagesRepository(client = httpClient) {
  return {
    async upload(file: File): Promise<ImageUploadResult> {
      const formData = new FormData()
      formData.append('file', file)
      return client.upload<ImageUploadResult>('/api/v1/images/upload', formData, 'POST')
    },

    async uploadAndGetUrl(file: File): Promise<string> {
      const res = await this.upload(file)
      const url = res?.imageUrl || res?.fileUrl
      if (!url) {
        const err = new Error('IMAGE_UPLOAD_FAILED') as Error & { errorCode?: string }
        err.errorCode = 'IMAGE_UPLOAD_FAILED'
        throw err
      }
      return url
    },
  }
}

export const imagesRepository = createImagesRepository()
