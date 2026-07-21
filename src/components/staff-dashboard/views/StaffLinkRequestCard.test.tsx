import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StaffLinkRequestCard from './StaffLinkRequestCard'

vi.mock('../../../data/hooks/useStaffSelf', () => ({
  useAcceptStaffLinkRequest: () => ({ isPending: false, mutate: vi.fn() }),
  useRejectStaffLinkRequest: () => ({ isPending: false, mutate: vi.fn() }),
}))

const notification = {
  id: 'notification-1',
  type: 'StaffLinkRequest',
  title: 'Nail Tech',
  message: 'Nail Tech wants to add you to their staff list.',
  referenceId: 'link-1',
  actionUrl: null,
  isRead: false,
  read: false,
  time: '2026-07-21T10:00:00.000Z',
}

const pendingDetail = {
  id: 'link-1',
  businessName: 'Nail Tech',
  businessLogoUrl: null,
  businessRole: null,
  requestedAt: null,
  status: 'Pending',
  roleAtBusiness: 'Nail Technician',
}

describe('StaffLinkRequestCard', () => {
  it('keeps an actionable request visible after its detail query resolves', () => {
    render(
      <StaffLinkRequestCard
        notification={notification}
        linkId="link-1"
        detail={pendingDetail}
        onResolved={vi.fn()}
      />,
    )

    expect(screen.getByText('Nail Tech')).toBeInTheDocument()
  })

  it('hides a request that the API reports as resolved', () => {
    render(
      <StaffLinkRequestCard
        notification={notification}
        linkId="link-1"
        detail={{ ...pendingDetail, status: 'Active' }}
        onResolved={vi.fn()}
      />,
    )

    expect(screen.queryByText('Nail Tech')).not.toBeInTheDocument()
  })
})
