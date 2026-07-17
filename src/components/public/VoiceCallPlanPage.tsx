import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  isVoiceCallTrialPackage,
  VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS,
  VOICE_CALL_TRIAL_COPY_KEY,
  VoiceCallPlanRoute,
} from '../../data/voiceTrial/domain'
import { navigateToNexoraHome } from '../../utils/nexoraHomeUrl'
import BookingTrialModal from '../dashboard/views/BookingTrialModal'
import '../dashboard/views/booking-hub.css'

enum VoiceCallPlanView {
  Form = 'form',
  Success = 'success',
}

/**
 * Anonymous landing: `/voice-call/plan?package=trial`
 * White page + trial dialog. Close → home. Submit success → message, then home.
 */
export default function VoiceCallPlanPage() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [searchParams] = useSearchParams()
  const packageValue = searchParams.get(VoiceCallPlanRoute.packageQuery)
  const isTrialPackage = isVoiceCallTrialPackage(packageValue)
  const [view, setView] = useState(VoiceCallPlanView.Form)

  const successMessage = t(`${VOICE_CALL_TRIAL_COPY_KEY}.submitSuccess`)

  useEffect(() => {
    if (!isTrialPackage) {
      navigateToNexoraHome()
    }
  }, [isTrialPackage])

  useEffect(() => {
    if (!isTrialPackage || view !== VoiceCallPlanView.Success) return undefined
    const timerId = window.setTimeout(
      navigateToNexoraHome,
      VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS,
    )
    return () => window.clearTimeout(timerId)
  }, [isTrialPackage, view])

  const handleSubmitSuccess = () => {
    showToast(successMessage, 'success', VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS)
    setView(VoiceCallPlanView.Success)
  }

  if (!isTrialPackage) {
    return <div className="min-h-dvh w-full bg-white" />
  }

  if (view === VoiceCallPlanView.Success) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-white px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" aria-hidden />
          <p className="text-base font-bold leading-relaxed text-slate-900">
            {successMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="booking-hub-view min-h-dvh w-full bg-white">
      <BookingTrialModal
        open
        anonymousSubmit
        onClose={navigateToNexoraHome}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
