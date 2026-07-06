import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import localStaffRepository from '../repositories/localStaff'
import { imagesRepository } from '../repositories/images'
import { payoutTypeToUiKey } from '../paymentMethodTypes'
import { resolvePaymentMethodImageUrl } from '../../utils/resolvePaymentMethodImageUrl'
import { dataUrlToFile } from '../../utils/imageFile'
import type { ManualStaffFormPayload } from '../../components/dashboard/modals/AddManualStaffTab'
import type { LocalStaffUpdateParams } from '../../types/repositories'
import type { PaymentMethodDto } from '../../types/domain'

export async function resolveStaffAvatarUrl(avatar: string, avatarFile?: File | null): Promise<string | null> {
  if (avatarFile) {
    return imagesRepository.uploadAndGetUrl(avatarFile)
  }
  if (!avatar) return null
  if (avatar.startsWith('data:')) {
    return imagesRepository.uploadAndGetUrl(await dataUrlToFile(avatar, 'avatar.jpg'))
  }
  if (avatar.startsWith('blob:')) {
    return null
  }
  return avatar
}

async function resolvePhotoUrl(payload: ManualStaffFormPayload): Promise<string | null> {
  if (payload.avatarFile) {
    return imagesRepository.uploadAndGetUrl(payload.avatarFile)
  }
  if (payload.photoUrl && !payload.photoUrl.startsWith('blob:')) {
    return payload.photoUrl
  }
  return null
}

async function configureLocalStaffPaymentMethods(
  staffProfileId: string,
  payoutConfigs: ManualStaffFormPayload['payoutConfigs'],
) {
  const methods = await localStaffRepository.getPaymentMethods(staffProfileId)

  for (const method of methods) {
    const uiKey = method.uiKey || payoutTypeToUiKey(method.type || '')
    const config = payoutConfigs[uiKey]
    const accountInfo = config?.value?.trim()
    if (!accountInfo || !method.id) continue

    const imageUrl = await resolvePaymentMethodImageUrl({
      imageFile: config.qrFile,
      imageUrl: config.qrCode,
    })

    await localStaffRepository.updatePaymentMethod(staffProfileId, method.id, {
      accountInfo,
      imageUrl,
    })

    if (config.enabled && !method.isActive) {
      await localStaffRepository.togglePaymentMethod(staffProfileId, method.id)
    }
  }
}

export function useCreateLocalStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ManualStaffFormPayload) => {
      const photoUrl = await resolvePhotoUrl(payload)
      const created = await localStaffRepository.create({
        displayName: payload.displayNickname.trim(),
        position: payload.position.trim() || null,
        bio: payload.fullName.trim() !== payload.displayNickname.trim()
          ? payload.fullName.trim()
          : null,
        photoUrl,
        phoneNumber: payload.phoneNumber?.trim() || null,
        email: payload.email?.trim() || null,
      })

      if (created.id) {
        await configureLocalStaffPaymentMethods(created.id, payload.payoutConfigs)
      }

      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useUpdateLocalStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      staffProfileId,
      params,
    }: {
      staffProfileId: string
      params: LocalStaffUpdateParams
    }) => {
      await localStaffRepository.update(staffProfileId, params)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useDeleteLocalStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (staffProfileId: string) => localStaffRepository.remove(staffProfileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
    },
  })
}

export function useLocalStaffPaymentMethods(
  staffProfileId?: string | null,
  { enabled = true } = {},
) {
  return useQuery<PaymentMethodDto[]>({
    queryKey: qk.localStaffPaymentMethods(staffProfileId),
    queryFn: () => localStaffRepository.getPaymentMethods(staffProfileId!),
    enabled: enabled && Boolean(staffProfileId),
  })
}

function invalidateLocalStaffCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  staffProfileId: string,
) {
  queryClient.invalidateQueries({ queryKey: qk.localStaffPaymentMethods(staffProfileId) })
  queryClient.invalidateQueries({ queryKey: qk.merchantStaff() })
}

export function useUpdateLocalStaffPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      staffProfileId,
      paymentMethodId,
      accountInfo,
      imageUrl,
      imageFile,
    }: {
      staffProfileId: string
      paymentMethodId: string
      accountInfo?: string | null
      imageUrl?: string | null
      imageFile?: File | null
    }) => {
      const resolvedImageUrl = await resolvePaymentMethodImageUrl({ imageFile, imageUrl })
      return localStaffRepository.updatePaymentMethod(staffProfileId, paymentMethodId, {
        accountInfo,
        imageUrl: resolvedImageUrl,
      })
    },
    onSuccess: (_data, vars) => {
      invalidateLocalStaffCaches(queryClient, vars.staffProfileId)
    },
  })
}

export function useToggleLocalStaffPaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      staffProfileId,
      paymentMethodId,
    }: {
      staffProfileId: string
      paymentMethodId: string
    }) => localStaffRepository.togglePaymentMethod(staffProfileId, paymentMethodId),
    onSuccess: (_data, vars) => {
      invalidateLocalStaffCaches(queryClient, vars.staffProfileId)
    },
  })
}
