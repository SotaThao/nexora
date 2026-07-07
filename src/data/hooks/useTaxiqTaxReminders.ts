/**
 * TanStack Query hooks for the TaxIQ Owner Tax Payment Reminders (US-08).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqTaxRemindersRepository from '../repositories/taxiqTaxReminders'
import type {
  CreateTaxReminderParams,
  MarkTaxReminderPaidParams,
  SnoozeTaxReminderParams,
  TaxPaymentReminder,
} from '../repositories/taxiqTaxReminders'

export function useTaxiqTaxReminders(ownerTaxYearId: string | undefined) {
  return useQuery<TaxPaymentReminder[]>({
    queryKey: qk.taxiqTaxReminders(ownerTaxYearId),
    queryFn: () => taxiqTaxRemindersRepository.list(ownerTaxYearId as string),
    enabled: !!ownerTaxYearId,
  })
}

export function useCreateTaxReminder() {
  const queryClient = useQueryClient()
  return useMutation<string, Error, CreateTaxReminderParams>({
    mutationFn: (params) => taxiqTaxRemindersRepository.create(params),
    onSuccess: (_, params) =>
      queryClient.invalidateQueries({ queryKey: qk.taxiqTaxReminders(params.ownerTaxYearId) }),
  })
}

export function useMarkTaxReminderPaid(ownerTaxYearId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, MarkTaxReminderPaidParams>({
    mutationFn: (params) => taxiqTaxRemindersRepository.markPaid(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqTaxReminders(ownerTaxYearId) }),
  })
}

export function useSnoozeTaxReminder(ownerTaxYearId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, SnoozeTaxReminderParams>({
    mutationFn: (params) => taxiqTaxRemindersRepository.snooze(params),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.taxiqTaxReminders(ownerTaxYearId) }),
  })
}
