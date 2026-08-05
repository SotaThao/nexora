import { useCallback, useRef, useState } from 'react'
import {
  SMS_CREDIT_CARD_FORM_EMPTY,
  SmsCreditCardField,
  type SmsCreditCardFormState,
} from '../smsCampaigns/constants'

type Translate = (key: string) => string

type UseCreditCardFormArgs = {
  copyTk: string
  t: Translate
  enabled: boolean
}

export function useCreditCardForm({ copyTk, t, enabled }: UseCreditCardFormArgs) {
  const fieldRefs = useRef<
    Partial<Record<SmsCreditCardField, HTMLInputElement | HTMLSelectElement | null>>
  >({})
  const [form, setForm] = useState<SmsCreditCardFormState>(SMS_CREDIT_CARD_FORM_EMPTY)
  const [error, setError] = useState('')
  const [invalidField, setInvalidField] = useState<SmsCreditCardField | null>(null)

  const reset = useCallback(() => {
    setForm(SMS_CREDIT_CARD_FORM_EMPTY)
    setError('')
    setInvalidField(null)
  }, [])

  const setField = useCallback((field: SmsCreditCardField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setInvalidField((current) => (current === field ? null : current))
    setError('')
  }, [])

  const registerField = useCallback(
    (field: SmsCreditCardField) =>
      (element: HTMLInputElement | HTMLSelectElement | null) => {
        fieldRefs.current[field] = element
      },
    [],
  )

  const validate = useCallback((): boolean => {
    if (!enabled) return true
    const firstMissing = Object.values(SmsCreditCardField).find(
      (field) => !form[field].trim(),
    )
    if (!firstMissing) {
      setError('')
      setInvalidField(null)
      return true
    }
    setInvalidField(firstMissing)
    setError(t(`${copyTk}.cardRequiredError`))
    fieldRefs.current[firstMissing]?.focus()
    return false
  }, [copyTk, enabled, form, t])

  return {
    form,
    error,
    invalidField,
    reset,
    setField,
    registerField,
    validate,
  }
}
