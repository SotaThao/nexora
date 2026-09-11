import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { merchantVoiceRepository, type MerchantVoiceConfigLanguage } from '../repositories/merchantVoice'
import { qk } from '../queryKeys'
import { useMerchantSetup } from './useMerchantSetup'

export function useMerchantVoiceOptions(language: MerchantVoiceConfigLanguage, { enabled = true } = {}) {
  const { session } = useAuth()
  const { data: setup } = useMerchantSetup()
  const businessId = setup?.businessInfo?.businessId
  return useQuery({
    queryKey: qk.merchantVoiceOptions(session?.id ?? '', businessId ?? '', language),
    queryFn: () => merchantVoiceRepository.getVoiceOptions(language),
    enabled: enabled && Boolean(session?.id),
    gcTime: 0,
  })
}
