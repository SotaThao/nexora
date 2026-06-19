import { describe, expect, it } from 'vitest'
import {
  isDirectP2pMethod,
  getPaymentMethodDisplayName,
} from './paymentMethodTypes'

describe('isDirectP2pMethod', () => {
  it.each([
    ['CashApp',   true],
    ['Venmo',     true],
    ['Zelle',     true],
    ['AppleCash', true],
    ['VlinkPay',  true],
    ['PayPal',    false],
    ['BankWire',  false],
    ['Crypto',    false],
    ['Other',     false],
    ['',          false],
  ])('%s → %s', (input, expected) => {
    expect(isDirectP2pMethod(input)).toBe(expected)
  })
})

describe('getPaymentMethodDisplayName', () => {
  it.each([
    ['CashApp',   'Cash App'],
    ['Venmo',     'Venmo'],
    ['AppleCash', 'Apple Cash'],
    ['VlinkPay',  'VLINKPAY Wallet'],
    ['BankWire',  'Bank Wire'],
    ['Unknown',   'Unknown'],
    ['',          ''],
  ])('%s → %s', (input, expected) => {
    expect(getPaymentMethodDisplayName(input)).toBe(expected)
  })
})
