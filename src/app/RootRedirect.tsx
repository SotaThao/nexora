import React, { Suspense, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingScreen from './LoadingScreen'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { useTranslation } from '../contexts/LanguageContext'
import lazyWithRetry from './lazyWithRetry'

const HomePage = lazyWithRetry(() => import('../components/homepage/HomePage'))

export default function RootRedirect() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const [isProcessingDeepLink, setIsProcessingDeepLink] = useState(true)

  useEffect(() => {
    const action = searchParams.get('action') || searchParams.get('flow')
    
    if (action === 'verify-email' && searchParams.get('token') && searchParams.get('email')) {
      apiAuthAdapter.verifyEmail({
        token: searchParams.get('token'),
        email: searchParams.get('email')
      }).then(() => {
        navigate('/login', { replace: true })
      }).catch(() => {
        navigate('/login', { 
          replace: true, 
          state: { loginError: t('errors.user_invalid_email_verification_token') || 'Email verification failed.' } 
        })
      })
      return
    }

    if (action === 'reset-password') {
      navigate('/account/reset-password?' + searchParams.toString(), { replace: true })
      return
    }

    if (action === 'staff-invite') {
      const bizName = searchParams.get('biz') || ''
      const refCode = searchParams.get('ref') || searchParams.get('refCode') || ''
      const source = searchParams.get('source') || 'public_link'
      const email = searchParams.get('email') || ''
      const nextParams = new URLSearchParams()
      if (refCode) nextParams.set('ref', refCode)
      if (source) nextParams.set('source', source)
      if (email) nextParams.set('email', email)
      navigate(`/invite${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, {
        replace: true,
        state: { biz: bizName },
      })
      return
    }

    // Bare ?ref=CODE (no action/flow) → send to /register?ref=CODE
    const refCode = searchParams.get('ref')
    if (!action && refCode) {
      const params = new URLSearchParams()
      params.set('ref', refCode)
      navigate(`/register?${params.toString()}`, { replace: true })
      return
    }

    setIsProcessingDeepLink(false)
  }, [searchParams, navigate, t])

  if (isProcessingDeepLink || status === 'loading') {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePage />
    </Suspense>
  )
}
