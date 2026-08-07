/**
 * TanStack Query hooks for the public Share Link viewer (mục 23). Deliberately does NOT
 * call useAuth() — the token comes from the URL, not the JWT session.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import taxiqShareLinkViewerRepository from '../repositories/taxiqShareLinkViewer'
import type { ShareLinkContent } from '../repositories/taxiqShareLinkViewer'

export function useShareLinkContent(token: string | undefined, passcode: string | undefined) {
  return useQuery<ShareLinkContent>({
    queryKey: qk.taxiqShareLinkContent(token, passcode),
    queryFn: () => taxiqShareLinkViewerRepository.getContent(token as string, passcode),
    enabled: !!token,
    retry: false,
  })
}

export function useVerifyShareLinkPasscode() {
  return useMutation<boolean, Error, { token: string; passcode: string }>({
    mutationFn: ({ token, passcode }) => taxiqShareLinkViewerRepository.verifyPasscode(token, passcode),
  })
}

export function useDownloadShareLink() {
  return useMutation<Blob, Error, { token: string; format: 'pdf' | 'csv'; passcode?: string }>({
    mutationFn: ({ token, format, passcode }) => taxiqShareLinkViewerRepository.download(token, format, passcode),
  })
}

export function useUploadShareLinkFile() {
  return useMutation<string, Error, { token: string; file: File; passcode?: string }>({
    mutationFn: ({ token, file, passcode }) => taxiqShareLinkViewerRepository.upload(token, file, passcode),
  })
}
