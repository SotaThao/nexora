import queryClient from '../lib/queryClient'
import { qk } from './queryKeys'
import type { StaffProfile, UserProfile } from '../types/domain'
import type { BusinessApiDto } from '../types/repositories'
import { mapBusinessApiDtoToSetup } from './repositories/merchants'

interface SeedAuthQueryCacheInput {
  userProfile?: UserProfile | null
  staffProfile?: StaffProfile | null
  rawBusiness?: BusinessApiDto | null
}

const AUTH_BOOTSTRAPPED_STALE_TIME = Infinity

/** Hydrate TanStack Query from auth bootstrap so profile hooks do not re-fetch. */
export function seedAuthQueryCache({ userProfile, staffProfile, rawBusiness }: SeedAuthQueryCacheInput) {
  if (rawBusiness) {
    queryClient.setQueryData(qk.merchantSetup(), mapBusinessApiDtoToSetup(rawBusiness))
    queryClient.setQueryDefaults(qk.merchantSetup(), {
      staleTime: AUTH_BOOTSTRAPPED_STALE_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })
  }
  if (userProfile) {
    queryClient.setQueryData(qk.userProfile(), userProfile)
    queryClient.setQueryDefaults(qk.userProfile(), {
      staleTime: AUTH_BOOTSTRAPPED_STALE_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })
  }
  if (staffProfile !== undefined) {
    queryClient.setQueryData(qk.staffProfile(), staffProfile)
    queryClient.setQueryDefaults(qk.staffProfile(), {
      staleTime: AUTH_BOOTSTRAPPED_STALE_TIME,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })
  }
}

export function clearAuthQueryCache() {
  queryClient.removeQueries({ queryKey: qk.userProfile() })
  queryClient.removeQueries({ queryKey: qk.staffProfile() })
  queryClient.removeQueries({ queryKey: qk.merchantSetup() })
}
