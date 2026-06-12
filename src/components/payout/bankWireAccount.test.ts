import { describe, expect, it } from 'vitest'

import {
  getBankWireBeneficiaryName,
  isBankWireAccountComplete,
  parseBankWireAccount,
  serializeBankWireAccount,
} from './bankWireAccount'

const completeDetails = {
  beneficiaryName: 'Mia Tran',
  bankName: 'Chase',
  routingNumber: '021000021',
  accountNumber: '1234567890',
  bankAddress: '270 Park Ave',
  city: 'New York',
  state: 'NY',
  zipCode: '10017',
  country: 'United States',
}

describe('bankWireAccount helpers', () => {
  it('serializes and parses structured bank wire details', () => {
    const serialized = serializeBankWireAccount(completeDetails)

    expect(serialized).toMatch(/^bankwire:/)
    expect(parseBankWireAccount(serialized)).toEqual(completeDetails)
    expect(isBankWireAccountComplete(serialized)).toBe(true)
    expect(getBankWireBeneficiaryName(serialized)).toBe('Mia Tran')
  })

  it('keeps legacy raw bank wire values as account number only', () => {
    expect(parseBankWireAccount('legacy-account-routing')).toMatchObject({
      accountNumber: 'legacy-account-routing',
      beneficiaryName: '',
    })
    expect(isBankWireAccountComplete('legacy-account-routing')).toBe(false)
  })
})
