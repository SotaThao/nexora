import React from 'react'
import { CreditCardIcon } from '../BookingHubIcons'
import {
  SMS_CAMPAIGN_TK,
  SMS_CREDIT_CARD_COUNTRIES,
  SmsCreditCardField,
  formatSmsCreditCardCvc,
  formatSmsCreditCardExpiry,
  formatSmsCreditCardNumber,
  type SmsCreditCardFormState,
} from '../smsCampaigns/constants'

type Translate = (key: string, params?: Record<string, string | number>) => string

type Props = {
  form: SmsCreditCardFormState
  error: string
  invalidField: SmsCreditCardField | null
  disabled?: boolean
  t: Translate
  copyTk?: string
  registerField: (
    field: SmsCreditCardField,
  ) => (element: HTMLInputElement | HTMLSelectElement | null) => void
  onFieldChange: (field: SmsCreditCardField, value: string) => void
}

export default function CreditCardCheckoutForm({
  form,
  error,
  invalidField,
  disabled = false,
  t,
  copyTk = SMS_CAMPAIGN_TK,
  registerField,
  onFieldChange,
}: Props) {
  const label = (key: string) => t(`${copyTk}.${key}`)
  const isInvalid = (field: SmsCreditCardField) =>
    invalidField === field || undefined

  return (
    <div className="sms-credit-card-form">
      <div className="sms-credit-card-form-head">
        <CreditCardIcon className="marketing-icon" />
        <span>{label('cardFormTitle')}</span>
      </div>
      <div className="sms-credit-card-required-note">
        <strong>*</strong> {label('cardRequiredNote')}
      </div>
      <div className="sms-credit-card-fields">
        <div className="sms-credit-card-row">
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardName')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.Name)}
              className="sms-credit-card-input"
              type="text"
              autoComplete="cc-name"
              placeholder={label('cardNamePlaceholder')}
              value={form[SmsCreditCardField.Name]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.Name)}
              onChange={(event) =>
                onFieldChange(SmsCreditCardField.Name, event.target.value)
              }
            />
          </label>
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardNumber')} <span>*</span>
            </span>
            <span className="sms-credit-card-input-wrap">
              <CreditCardIcon className="marketing-icon" />
              <input
                ref={registerField(SmsCreditCardField.Number)}
                className="sms-credit-card-input"
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                placeholder={label('cardNumberPlaceholder')}
                value={form[SmsCreditCardField.Number]}
                disabled={disabled}
                aria-invalid={isInvalid(SmsCreditCardField.Number)}
                onChange={(event) =>
                  onFieldChange(
                    SmsCreditCardField.Number,
                    formatSmsCreditCardNumber(event.target.value),
                  )
                }
              />
            </span>
          </label>
        </div>
        <div className="sms-credit-card-row">
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardExpiry')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.Expiry)}
              className="sms-credit-card-input"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              placeholder={label('cardExpiryPlaceholder')}
              value={form[SmsCreditCardField.Expiry]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.Expiry)}
              onChange={(event) =>
                onFieldChange(
                  SmsCreditCardField.Expiry,
                  formatSmsCreditCardExpiry(event.target.value),
                )
              }
            />
          </label>
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardCvc')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.Cvc)}
              className="sms-credit-card-input"
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              placeholder={label('cardCvcPlaceholder')}
              value={form[SmsCreditCardField.Cvc]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.Cvc)}
              onChange={(event) =>
                onFieldChange(
                  SmsCreditCardField.Cvc,
                  formatSmsCreditCardCvc(event.target.value),
                )
              }
            />
          </label>
        </div>
        <label className="sms-credit-card-field">
          <span className="sms-credit-card-label">
            {label('cardAddress')}
            <span>*</span>
          </span>
          <input
            ref={registerField(SmsCreditCardField.Address1)}
            className="sms-credit-card-input"
            type="text"
            autoComplete="address-line1"
            placeholder={label('cardAddressPlaceholder')}
            value={form[SmsCreditCardField.Address1]}
            disabled={disabled}
            aria-invalid={isInvalid(SmsCreditCardField.Address1)}
            onChange={(event) =>
              onFieldChange(SmsCreditCardField.Address1, event.target.value)
            }
          />
        </label>
        <div className="sms-credit-card-row">
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardCity')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.City)}
              className="sms-credit-card-input"
              type="text"
              autoComplete="address-level2"
              placeholder={label('cardCityPlaceholder')}
              value={form[SmsCreditCardField.City]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.City)}
              onChange={(event) =>
                onFieldChange(SmsCreditCardField.City, event.target.value)
              }
            />
          </label>
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardState')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.State)}
              className="sms-credit-card-input"
              type="text"
              autoComplete="address-level1"
              placeholder={label('cardStatePlaceholder')}
              value={form[SmsCreditCardField.State]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.State)}
              onChange={(event) =>
                onFieldChange(SmsCreditCardField.State, event.target.value)
              }
            />
          </label>
        </div>
        <div className="sms-credit-card-row">
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardZip')} <span>*</span>
            </span>
            <input
              ref={registerField(SmsCreditCardField.Zip)}
              className="sms-credit-card-input"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder={label('cardZipPlaceholder')}
              value={form[SmsCreditCardField.Zip]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.Zip)}
              onChange={(event) =>
                onFieldChange(SmsCreditCardField.Zip, event.target.value)
              }
            />
          </label>
          <label className="sms-credit-card-field">
            <span className="sms-credit-card-label">
              {label('cardCountry')} <span>*</span>
            </span>
            <select
              ref={registerField(SmsCreditCardField.Country)}
              className="sms-credit-card-select"
              autoComplete="country"
              value={form[SmsCreditCardField.Country]}
              disabled={disabled}
              aria-invalid={isInvalid(SmsCreditCardField.Country)}
              onChange={(event) =>
                onFieldChange(SmsCreditCardField.Country, event.target.value)
              }
            >
              {SMS_CREDIT_CARD_COUNTRIES.map((country) => (
                <option key={country.value} value={country.value}>
                  {label(country.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sms-credit-card-error" role="alert" aria-live="polite">
          {error}
        </div>
      </div>
    </div>
  )
}
