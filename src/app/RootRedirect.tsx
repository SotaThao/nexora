import React, { Suspense, useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import LoadingScreen from './LoadingScreen'
import { saveRefCode, saveStaffShareCode, saveLeg } from '../utils/affiliateReferral'
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

    // Bare ?ref=CODE (optional ?staff=STAFF_ID, ?leg=left|right) → register with ref; persist staff/leg for attribution
    const refCode = searchParams.get('ref') || searchParams.get('refCode')
    const staffShareCode = searchParams.get('staff') || searchParams.get('staffCode')
    const legCode = searchParams.get('leg')
    if (!action && refCode) {
      saveRefCode(refCode)
      if (staffShareCode?.trim()) saveStaffShareCode(staffShareCode.trim())
      if (legCode?.trim()) saveLeg(legCode.trim())
      const params = new URLSearchParams()
      params.set('ref', refCode)
      if (legCode?.trim()) params.set('leg', legCode.trim())
      navigate(`/register?${params.toString()}`, { replace: true })
      return
    }

    if (!action && staffShareCode?.trim()) {
      saveStaffShareCode(staffShareCode.trim())
    }

    setIsProcessingDeepLink(false)
  }, [searchParams, navigate, t])

  // Land straight on POS Services & Custom Menu demo
  if (import.meta.env.VITE_ENABLE_DEMO_TOOLS === 'true') {
    return <Navigate to="/dashboard/pos/services" replace />
  }

  if (isProcessingDeepLink || status === 'loading') {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePage />
    </Suspense>
  )
}
