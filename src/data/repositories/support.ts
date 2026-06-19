import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export type SubmitContactRequestDto = {
  fullName: string
  email: string
  phoneNumber?: string | null
  supportType: string
  message: string
  captchaToken: string
  sourceFrom?: string
}

/** BE validators for POST /api/v1/Client/contact-requests */
export const CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH = 1
export const CONTACT_REQUEST_MESSAGE_MIN_LENGTH = 10
export const CONTACT_REQUEST_MESSAGE_MAX_LENGTH = 1000

export function createSupportRepository(client: HttpClient = httpClient) {
  return {
    async submitContactRequest(dto: SubmitContactRequestDto): Promise<string> {
      return client.post<string>('/api/v1/Client/contact-requests', dto)
    },
  }
}

export const supportRepository = createSupportRepository()
export default supportRepository
