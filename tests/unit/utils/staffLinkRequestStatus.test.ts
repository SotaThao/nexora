import { describe, expect, it } from 'vitest'
import {
  isLoadedStaffLinkRequestActionable,
  isStaffLinkRequestActionable,
} from '../../../src/utils/staffLinkRequestStatus'

describe('isStaffLinkRequestActionable', () => {
  it.each(['Pending', 'WaitingStaffAcceptance', 'PendingStaffAcceptance']) (
    'keeps %s requests actionable',
    (status) => {
      expect(isStaffLinkRequestActionable(status)).toBe(true)
    },
  )

  it.each(['Active', 'Accepted', 'Rejected', 'Cancelled', 'Expired']) (
    'hides a resolved %s request',
    (status) => {
      expect(isStaffLinkRequestActionable(status)).toBe(false)
    },
  )

  it('keeps a request actionable until the API supplies a status', () => {
    expect(isStaffLinkRequestActionable(null)).toBe(true)
  })

  it('does not expose notification content while the live request is loading', () => {
    expect(isLoadedStaffLinkRequestActionable(false, undefined)).toBe(false)
  })

  it('shows only loaded requests that are still actionable', () => {
    expect(isLoadedStaffLinkRequestActionable(true, { status: 'Pending' })).toBe(true)
    expect(isLoadedStaffLinkRequestActionable(true, { status: 'Active' })).toBe(false)
  })
})
