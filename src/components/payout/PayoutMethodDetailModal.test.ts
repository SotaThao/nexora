import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { PaymentMethodDto } from '../../types/domain'
import PayoutMethodDetailModal from './PayoutMethodDetailModal'

function makeMethod(overrides: Partial<PaymentMethodDto>): PaymentMethodDto {
  return {
    id: overrides.id || overrides.uiKey || overrides.type || 'method',
    type: overrides.type || 'Zelle',
    uiKey: overrides.uiKey,
    name: overrides.name,
    accountInfo: overrides.accountInfo ?? 'receiver@example.com',
    accountName: overrides.accountName ?? 'Receiver Name',
    imageUrl: overrides.imageUrl ?? null,
    isActive: true,
    isConfigured: true,
  }
}

describe('PayoutMethodDetailModal', () => {
  afterEach(() => {
    cleanup()
  })

  it.each([
    [
      'Zelle',
      makeMethod({
        type: 'Zelle',
        uiKey: 'zelle',
        name: 'Zelle',
        accountName: 'Jade',
        accountInfo: '8956523659',
      }),
      'ZELLE REGISTERED NAME',
      'EMAIL OR PHONE',
    ],
    [
      'Cash App',
      makeMethod({ type: 'CashApp', uiKey: 'cashapp', accountInfo: '$LuxuryNails' }),
      'CASH APP REGISTERED NAME',
      'CASH TAG',
    ],
    [
      'PayPal',
      makeMethod({
        type: 'PayPal',
        uiKey: 'paypal',
        name: 'PayPal',
        accountInfo: 'owner@example.com',
      }),
      'PAYPAL REGISTERED NAME',
      'PAYPAL EMAIL OR PHONE',
    ],
    [
      'Apple Cash',
      makeMethod({
        type: 'AppleCash',
        uiKey: 'applecash',
        name: 'Apple Cash',
        accountInfo: '5551234567',
      }),
      'APPLE CASH REGISTERED NAME',
      'EMAIL OR PHONE',
    ],
    [
      'Bank Wire',
      makeMethod({
        type: 'BankWire',
        uiKey: 'bankwire',
        name: 'Bank Wire',
        accountInfo: 'bankwire:{"beneficiaryName":"Jade","bankName":"Bank of America","routingNumber":"123456789","accountNumber":"987654321","bankAddress":"","city":"","state":"","zipCode":"","country":""}',
        accountName: null,
      }),
      'BANK WIRE REGISTERED NAME',
      'BANK DETAILS',
    ],
    [
      'Crypto Wallet',
      makeMethod({
        type: 'Crypto',
        uiKey: 'crypto',
        name: 'Crypto Wallet',
        accountInfo: 'bitcoinnaillbar@nexoratouch.com',
        accountName: null,
      }),
      null,
      'WALLET BTC/USDT ADDRESS',
    ],
  ])('shows the read-only account labels for %s without YOUR or required marker', (
    _label,
    method,
    expectedAccountHolderLabel,
    expectedAccountLabel,
  ) => {
    render(
      React.createElement(PayoutMethodDetailModal, {
        method,
        logo: React.createElement('span', { 'aria-hidden': 'true' }),
        onClose: () => {},
      }),
    )

    if (expectedAccountHolderLabel) {
      expect(screen.getByText(expectedAccountHolderLabel)).toBeInTheDocument()
    }
    expect(screen.getByText(expectedAccountLabel)).toBeInTheDocument()
    expect(screen.queryByText(/^YOUR /)).not.toBeInTheDocument()
    expect(screen.queryByText(/\*$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Account details')).not.toBeInTheDocument()
  })
})
