import React from 'react'
import { CreditCardIcon } from '../BookingHubIcons'
import {
  SMS_CAMPAIGN_TK,
  SmsCreditPaymentId,
  getSmsCreditPaymentLabel,
  type SmsCreditPaymentMock,
} from '../smsCampaigns/constants'

type Translate = (key: string, params?: Record<string, string | number>) => string

type Props = {
  methods: SmsCreditPaymentMock[]
  selectedId: SmsCreditPaymentId
  disabled?: boolean
  t: Translate
  /** i18n namespace that owns `cardMethodLabel` + `balance`. Defaults to SMS campaigns. */
  copyTk?: string
  onSelect: (paymentId: SmsCreditPaymentId) => void
}

export default function CreditPaymentMethodList({
  methods,
  selectedId,
  disabled = false,
  t,
  copyTk = SMS_CAMPAIGN_TK,
  onSelect,
}: Props) {
  return (
    <div className="sms-credit-payment-list">
      {methods.map((method) => {
        const selected = method.id === selectedId
        const isCard = method.id === SmsCreditPaymentId.Card
        const label = getSmsCreditPaymentLabel(
          method,
          isCard ? t(`${copyTk}.cardMethodLabel`) : '',
        )

        return (
          <button
            key={method.id}
            className={`sms-credit-payment${selected ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onSelect(method.id)}
          >
            <span className="sms-credit-payment-main">
              <span className="sms-credit-radio" aria-hidden="true" />
              {isCard ? (
                <CreditCardIcon className="marketing-icon sms-credit-card-method-icon" />
              ) : (
                <img
                  className="sms-credit-token"
                  src={method.asset}
                  alt=""
                  width={28}
                  height={28}
                  aria-hidden="true"
                />
              )}
              <span className="sms-credit-payment-name">{label}</span>
            </span>
            {!isCard && method.balance ? (
              <span className="sms-credit-payment-balance">
                <span>{t(`${copyTk}.balance`)}</span>
                <strong>{method.balance}</strong>
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
