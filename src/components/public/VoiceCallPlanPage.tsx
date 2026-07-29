import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  isVoiceCallTrialPackage,
  parseVoiceCallPlanLang,
  VOICE_CALL_PLAN_COUNTDOWN_TICK_MS,
  VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS,
  VOICE_CALL_PLAN_SUCCESS_REDIRECT_SECONDS,
  VOICE_CALL_TRIAL_COPY_KEY,
  VoiceCallPlanRoute,
} from '../../data/voiceTrial/domain'
import { getNexoraHomeUrl, navigateToNexoraHome } from '../../utils/nexoraHomeUrl'
import BookingTrialModal from '../dashboard/views/BookingTrialModal'
import '../dashboard/views/booking-hub.css'

enum VoiceCallPlanView {
  Form = 'form',
  Success = 'success',
}

/**
 * Anonymous landing: `/voice-call/plan?package=trial`
 * Optional `?lang=vi|en` (default English). White page + trial dialog.
 * Close → home. Submit success → message + countdown, then home.
 */
export default function VoiceCallPlanPage() {
  const { t, setLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const packageValue = searchParams.get(VoiceCallPlanRoute.packageQuery)
  const planLang = parseVoiceCallPlanLang(
    searchParams.get(VoiceCallPlanRoute.langQuery),
  )
  const isTrialPackage = isVoiceCallTrialPackage(packageValue)
  const [view, setView] = useState(VoiceCallPlanView.Form)
  const [secondsLeft, setSecondsLeft] = useState(VOICE_CALL_PLAN_SUCCESS_REDIRECT_SECONDS)

  const successMessage = t(`${VOICE_CALL_TRIAL_COPY_KEY}.submitSuccess`)
  const homeUrl = getNexoraHomeUrl()

  useEffect(() => {
    setLanguage(planLang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = planLang
    }
  }, [planLang, setLanguage])

  useEffect(() => {
    if (!isTrialPackage) {
      navigateToNexoraHome()
    }
  }, [isTrialPackage])

  useEffect(() => {
    if (!isTrialPackage || view !== VoiceCallPlanView.Success) return undefined

    setSecondsLeft(VOICE_CALL_PLAN_SUCCESS_REDIRECT_SECONDS)

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, VOICE_CALL_PLAN_COUNTDOWN_TICK_MS)

    const timeoutId = window.setTimeout(
      navigateToNexoraHome,
      VOICE_CALL_PLAN_SUCCESS_REDIRECT_MS,
    )

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [isTrialPackage, view])

  const handleSubmitSuccess = () => {
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
          <p className="text-sm font-semibold leading-relaxed text-slate-600">
            {t(`${VOICE_CALL_TRIAL_COPY_KEY}.autoRedirectBefore`)}
            <a
              href={homeUrl}
              className="font-bold text-nexoraBrand underline underline-offset-2 hover:text-nexoraBrandDark"
              onClick={(event) => {
                event.preventDefault()
                navigateToNexoraHome()
              }}
            >
              {t(`${VOICE_CALL_TRIAL_COPY_KEY}.autoRedirectBrand`)}
            </a>
            {t(`${VOICE_CALL_TRIAL_COPY_KEY}.autoRedirectAfter`, {
              seconds: secondsLeft,
            })}
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
