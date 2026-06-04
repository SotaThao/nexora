import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import StaffDetailView from '../../src/components/StaffDetailView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const mockStaffMember = {
  id: 'NEX-STAFF-MIA0123',
  fullName: 'Mia Tran',
  nickname: 'Mia T.',
  position: 'Gel-X Artist',
  isActive: true,
  showInTipsFlow: true,
  phone: '407-555-0123',
  email: 'mia.tran@gmail.com',
  paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }
}

const mockTransactions = [
  { id: 'TX-2042', dateTime: '2026-05-25 14:32', amount: 50, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2038', dateTime: '2026-05-24 15:20', amount: 30, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2018', dateTime: '2026-05-21 14:20', amount: 20, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-9999', dateTime: '2026-05-01 10:00', amount: 100, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' } // Out of 7 Days range
]

const mockReviews = [
  { id: 'R-1', rating: 5, comment: 'Mia shapes perfectly.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 4, comment: 'Friendly service.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-21' }
]

describe('StaffDetailView Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.setItem('nexora_lang', 'vi')
  })

  it('renders technician detail info and default 7 days range correctly', () => {
    render(
      <LanguageProvider>
        <StaffDetailView
          staffMember={mockStaffMember}
          onBack={vi.fn()}
          transactions={mockTransactions}
          reviews={mockReviews}
          onEdit={vi.fn()}
          onQr={vi.fn()}
          onDelete={vi.fn()}
        />
      </LanguageProvider>
    )

    // Check staff identity details
    expect(screen.getByText('Mia Tran')).toBeInTheDocument()
    expect(screen.getByText('Gel-X Lead')).toBeInTheDocument()

    // 7 Days is the default range preset. It filters transactions from 2026-05-20 to 2026-05-26.
    // Tips in range: TX-2042 ($50), TX-2038 ($30), TX-2018 ($20). Total = $100.
    // TX-9999 ($100) is out of range.
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('allows switching range preset and updates stats and charts', () => {
    render(
      <LanguageProvider>
        <StaffDetailView
          staffMember={mockStaffMember}
          onBack={vi.fn()}
          transactions={mockTransactions}
          reviews={mockReviews}
          onEdit={vi.fn()}
          onQr={vi.fn()}
          onDelete={vi.fn()}
        />
      </LanguageProvider>
    )

    // Switch range to 30 Days (30 Ngày)
    // Click "30 Ngày" (which maps to "30 Days" preset)
    const btn30Days = screen.getByRole('button', { name: /30 Ngày/i })
    fireEvent.click(btn30Days)

    // Under 30 Days, the start date is 2026-04-27.
    // Tips in range now include TX-9999 ($100), making total tips = $200.00
    expect(screen.getByText('$200.00')).toBeInTheDocument()
  })

  it('supports selecting custom date range via calendar datepickers', () => {
    const { container } = render(
      <LanguageProvider>
        <StaffDetailView
          staffMember={mockStaffMember}
          onBack={vi.fn()}
          transactions={mockTransactions}
          reviews={mockReviews}
          onEdit={vi.fn()}
          onQr={vi.fn()}
          onDelete={vi.fn()}
        />
      </LanguageProvider>
    )

    // Initially custom datepicker is hidden
    expect(screen.queryByLabelText(/Từ ngày|From/i)).not.toBeInTheDocument()

    // Click "Tự chọn" (Custom) button
    const btnCustom = screen.getByRole('button', { name: /Tự chọn/i })
    fireEvent.click(btnCustom)

    // Custom date pickers are now displayed
    const fromLabel = screen.getByText(/Từ ngày/i)
    expect(fromLabel).toBeInTheDocument()

    // Set custom range from 2026-05-24 to 2026-05-26
    const fromInput = container.querySelector('input[type="date"]')
    fireEvent.change(fromInput, { target: { value: '2026-05-24' } })

    // Under this custom range, only TX-2042 ($50) and TX-2038 ($30) are in range. Total = $80.00
    expect(screen.getByText('$80.00')).toBeInTheDocument()
  })
})
