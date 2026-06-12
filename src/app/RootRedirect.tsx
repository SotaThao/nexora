import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingScreen from './LoadingScreen'
import apiAuthAdapter from '../auth/adapters/apiAuthAdapter'
import { useTranslation } from '../contexts/LanguageContext'

export default function RootRedirect() {
  const { session, status } = useAuth()
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
      navigate('/reset-password?' + searchParams.toString(), { replace: true })
      return
    }

    if (action === 'staff-invite') {
      const bizName = searchParams.get('biz') || ''
      navigate('/invite', { replace: true, state: { biz: bizName } })
      return
    }

    setIsProcessingDeepLink(false)
  }, [searchParams, navigate, t])

  if (isProcessingDeepLink || status === 'loading') {
    return <LoadingScreen />
  }

  if (status !== 'authenticated' || !session) {
    return <Navigate to="/login" replace />
  }

  const isStaffSession = session.flag === '!personal' || session.role === 'personal' || session.role === 'staff'

  if (isStaffSession) {
    return <Navigate to="/staff" replace />
  }

  return <Navigate to="/dashboard" replace />
}
