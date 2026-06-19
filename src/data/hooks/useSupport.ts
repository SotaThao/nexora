import { useMutation } from '@tanstack/react-query'
import supportRepository, {
  type SubmitContactRequestDto,
} from '../repositories/support'

export function useSubmitContactRequest() {
  return useMutation<string, Error, SubmitContactRequestDto>({
    mutationFn: (dto) => supportRepository.submitContactRequest(dto),
  })
}
