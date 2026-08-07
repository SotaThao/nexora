/**
 * TanStack Query hooks for Tax Center 1099-NEC (mục 21) owner-side management.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqForm1099NecRepository from '../repositories/taxiqForm1099Nec'
import type {
  EfileForm1099NecParams,
  Form1096Report,
  Form1099NecSummary,
  ResendForm1099NecCopyParams,
  ScanForm1099NecResult,
  SendForm1099NecBatchParams,
  SendForm1099NecBatchResult,
  SendForm1099NecCopyParams,
} from '../repositories/taxiqForm1099Nec'
import type { ShareLink } from '../repositories/taxiqShareLinks'

export function useForm1099NecSummary(ownerTaxYearId?: string) {
  return useQuery<Form1099NecSummary>({
    queryKey: qk.taxiqForm1099Nec(ownerTaxYearId),
    queryFn: () => taxiqForm1099NecRepository.getSummary(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useScanForm1099Nec(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<ScanForm1099NecResult, Error, void>({
    mutationFn: () => taxiqForm1099NecRepository.scan(ownerTaxYearId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099Nec(ownerTaxYearId) }),
  })
}

export function useSendForm1099NecCopy(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<ShareLink, Error, { id: string; params: SendForm1099NecCopyParams }>({
    mutationFn: ({ id, params }) => taxiqForm1099NecRepository.send(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099Nec(ownerTaxYearId) }),
  })
}

export function useResendForm1099NecCopy(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<ShareLink, Error, { id: string; params: ResendForm1099NecCopyParams }>({
    mutationFn: ({ id, params }) => taxiqForm1099NecRepository.resend(id, params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099Nec(ownerTaxYearId) }),
  })
}

export function useSendForm1099NecBatch(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<SendForm1099NecBatchResult, Error, SendForm1099NecBatchParams>({
    mutationFn: (params) => taxiqForm1099NecRepository.sendBatch(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099Nec(ownerTaxYearId) }),
  })
}

export function useForm1096Report(ownerTaxYearId?: string) {
  return useQuery<Form1096Report>({
    queryKey: qk.taxiqForm1096Report(ownerTaxYearId),
    queryFn: () => taxiqForm1099NecRepository.get1096Report(ownerTaxYearId as string),
    enabled: false,
  })
}

export function useEfileForm1099Nec(ownerTaxYearId?: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, EfileForm1099NecParams>({
    mutationFn: (params) => taxiqForm1099NecRepository.efile(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqForm1099Nec(ownerTaxYearId) }),
  })
}
