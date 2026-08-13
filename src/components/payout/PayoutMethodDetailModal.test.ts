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
    ['Zelle', makeMethod({ type: 'Zelle', uiKey: 'zelle' }), 'ZELLE EMAIL/PHONE'],
    [
      'Cash App',
      makeMethod({ type: 'CashApp', uiKey: 'cashapp', accountInfo: '$LuxuryNails' }),
      'CASH APP $CASHTAG, EMAIL, OR PHONE',
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
      'WALLET BTC/USDT ADDRESS',
    ],
  ])('shows the read-only account label for %s without YOUR or required marker', (_label, method, expectedLabel) => {
    render(
      React.createElement(PayoutMethodDetailModal, {
        method,
        logo: React.createElement('span', { 'aria-hidden': 'true' }),
        onClose: () => {},
      }),
    )

    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    expect(screen.queryByText(/^YOUR /)).not.toBeInTheDocument()
    expect(screen.queryByText(/\*$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Account details')).not.toBeInTheDocument()
  })
})
