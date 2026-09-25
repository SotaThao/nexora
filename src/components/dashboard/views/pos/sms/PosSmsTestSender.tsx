// Test phone number + Send Test. Prefilled with the salon's business phone; whatever is typed
// here is used for this test only and is never saved to the salon profile.
import { useState } from 'react'
import { Send } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  PhoneDialCode,
} from '../../../../CountryCodeSelect'
import { useSendPosSmsTest } from '../../../../../data/hooks/usePosSmsSettings'
import { getErrorMessage } from '../../../../../data/errorCodes'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'
import type { PosSmsTemplateType } from '../../../../../constants/posSmsSettings'
import type { PosSmsPhoneApiDto } from '../../../../../types/posSms'

const K = 'components.dashboard.views.pos.PosSmsSettings'

// The backend answers with this when the salon has no AI Hub, instead of sending unmetered.
const NO_AI_HUB_ERROR = 'NoAiHub'

type Props = {
  businessId: string
  type: PosSmsTemplateType
  body: string
  defaultTestPhone: PosSmsPhoneApiDto | null
  disabled?: boolean
}

export default function PosSmsTestSender({ businessId, type, body, defaultTestPhone, disabled }: Props) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const sendTest = useSendPosSmsTest(businessId)

  const initialDialCode = defaultTestPhone?.countryCode ?? PhoneDialCode.US
  const [dialCode, setDialCode] = useState(initialDialCode)
  const [phone, setPhone] = useState(
    defaultTestPhone ? formatNationalNumber(defaultTestPhone.phone, initialDialCode) : '',
  )

  const phoneDigits = phone.replace(/\D/g, '')
  const canSend = !disabled && phoneDigits.length > 0 && !sendTest.isPending

  const handleSend = () => {
    if (!canSend) return
    sendTest.mutate(
      { type, body, toPhone: phoneDigits, toPhoneCountryCode: dialCode },
      {
        onSuccess: (result) => {
          if (result.sent) {
            notify(t(`${K}.test.sent`), 'success', TOAST_SNACK_DURATION_MS)
            return
          }
          notify(
            result.errorCode === NO_AI_HUB_ERROR ? t(`${K}.test.noAiHub`) : t(`${K}.test.failed`),
            'error',
            TOAST_SNACK_DURATION_MS,
          )
        },
        onError: (err) => notify(getErrorMessage(err, t), 'error', TOAST_SNACK_DURATION_MS),
      },
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
        {t(`${K}.test.phoneLabel`)}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative z-20 flex h-10 shrink-0 overflow-visible rounded-lg sm:w-28 [&>div]:flex-1 [&>div>button]:gap-1.5 [&>div>button]:border-r-0 [&>div>button>svg]:ml-auto border border-nexoraBorder bg-white focus-within:border-nexoraBrand [&_button]:text-xs [&_button_span]:text-xs">
          <CountryCodeSelect
            embedded
            showSearch={false}
            value={dialCode}
            onChange={(code) => {
              setDialCode(code)
              setPhone(formatNationalNumber(phone, code))
            }}
          />
        </div>
        <div className="flex h-10 min-w-0 flex-1 rounded-lg border border-nexoraBorder bg-white focus-within:border-nexoraBrand">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatNationalNumber(e.target.value, dialCode))}
            placeholder={getNationalPhonePlaceholder(dialCode)}
            inputMode="numeric"
            autoComplete="tel-national"
            aria-label={t(`${K}.test.phoneLabel`)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-xs text-nexoraText outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraBrand transition hover:border-nexoraBrand disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          {sendTest.isPending ? t(`${K}.test.sending`) : t(`${K}.test.send`)}
        </button>
      </div>
    </div>
  )
}
