import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import TipsView from '../../src/components/TipsView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const mockTransactions = [
  { id: 'TX-101', dateTime: '2026-05-29 10:00:00', amount: 50.0, staffId: 'tech-1', staffName: 'Mia Tran', touchpoint: 'Station 1', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-102', dateTime: '2026-05-29 10:15:00', amount: 30.0, staffId: 'tech-2', staffName: 'Leo Nguyen', touchpoint: 'Station 2', paymentMethod: 'Card', status: 'Success' },
  { id: 'TX-103', dateTime: '2026-05-29 11:30:00', amount: 20.0, staffId: 'tech-1', staffName: 'Mia Tran', touchpoint: 'Station 1', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-104', dateTime: '2026-05-29 12:00:00', amount: 100.0, staffId: 'tech-3', staffName: 'Chloe Pham', touchpoint: 'Station 3', paymentMethod: 'Crypto', status: 'Pending' }
]

const mockStaff = [
  { id: 'tech-1', fullName: 'Mia Tran', nickname: 'Mia' },
  { id: 'tech-2', fullName: 'Leo Nguyen', nickname: 'Leo' },
  { id: 'tech-3', fullName: 'Chloe Pham', nickname: 'Chloe' }
]

describe('TipsView Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.setItem('nexora_lang', 'vi')
  })

  it('renders TipsView header and sub-tabs correctly', () => {
    render(
      <LanguageProvider>
        <TipsView transactions={mockTransactions} staff={mockStaff} />
      </LanguageProvider>
    )

    // Check title and description
    expect(screen.getByRole('heading', { level: 2, name: /Tips|Tiền Típ/i })).toBeInTheDocument()
    expect(
      screen.getByText(/dashboard\.tips\.description|Quản lý doanh thu típ/i)
    ).toBeInTheDocument()

    // Check the 4 sub-tabs are visible
    expect(screen.getByRole('button', { name: 'Tổng quan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiết kiệm phí' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Giao dịch típ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ví nhận thợ' })).toBeInTheDocument()
  })

  it('renders Overview tab calculations correctly by default', () => {
    render(
      <LanguageProvider>
        <TipsView transactions={mockTransactions} staff={mockStaff} />
      </LanguageProvider>
    )

    // Calculations based on mockTransactions:
    // Total Volume = 50 + 30 + 20 + 100 = 200.00
    // Direct Tips (Zelle, Cash App, Venmo, VLINKPAY) = 50 (Zelle) + 20 (Cash App) = 70.00
    // Card Tips = 30.00
    // Crypto Tips = 100.00

    const totalVolumeCard = screen.getByText('Tổng Doanh Thu Típ').closest('div')
    expect(within(totalVolumeCard).getByText('$200.00')).toBeInTheDocument()

    const directTipsCard = screen.getByText('Típ Trực Tiếp (P2P)').closest('div')
    expect(within(directTipsCard).getByText('$70.00')).toBeInTheDocument()

    expect(screen.getByText('Típ Qua Thẻ')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()

    expect(screen.getByText('Típ Crypto')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('navigates to "Tiết kiệm phí" tab and verifies the Savings Calculator', () => {
    render(
      <LanguageProvider>
        <TipsView transactions={mockTransactions} staff={mockStaff} />
      </LanguageProvider>
    )

    // Navigate to Tiết kiệm phí
    const savingsTabBtn = screen.getByRole('button', { name: 'Tiết kiệm phí' })
    fireEvent.click(savingsTabBtn)

    // Direct tip savings calculations based on mock:
    // Direct Tips = 70.00
    // Avoided Fees (Direct Tips * 3%) = 70 * 0.03 = 2.10
    expect(screen.getByText('Típ Trực Tiếp Routed')).toBeInTheDocument()
    expect(screen.getAllByText('$70.00').length).toBeGreaterThan(0)
    expect(screen.getByText('$2.10')).toBeInTheDocument()

    // Test interactive inputs of the calculator
    const volumeInput = screen.getByRole('spinbutton')
    const feeSlider = screen.getByRole('slider')

    // Initial values should be: Volume 5000, Fee 3%
    expect(volumeInput.value).toBe('5000')
    expect(screen.getByText('$150.00/tháng')).toBeInTheDocument()
    expect(screen.getByText('$1,800.00')).toBeInTheDocument() // annual savings: 150 * 12

    // Change monthly volume to 10000
    fireEvent.change(volumeInput, { target: { value: '10000' } })
    expect(screen.getByText('$300.00/tháng')).toBeInTheDocument()
    expect(screen.getByText('$3,600.00')).toBeInTheDocument()

    // Change processing fee percentage slider to 4%
    fireEvent.change(feeSlider, { target: { value: '4.0' } })
    expect(screen.getByText('$400.00/tháng')).toBeInTheDocument()
    expect(screen.getByText('$4,800.00')).toBeInTheDocument()
  })

  it('navigates to "Giao dịch típ" tab and tests transaction list & filtering', () => {
    render(
      <LanguageProvider>
        <TipsView transactions={mockTransactions} staff={mockStaff} />
      </LanguageProvider>
    )

    // Navigate to Giao dịch típ
    const txTabBtn = screen.getByRole('button', { name: 'Giao dịch típ' })
    fireEvent.click(txTabBtn)

    // Verify transactions are listed
    expect(screen.getByText('TX-101')).toBeInTheDocument()
    expect(screen.getByText('TX-102')).toBeInTheDocument()
    expect(screen.getByText('TX-103')).toBeInTheDocument()
    expect(screen.getByText('TX-104')).toBeInTheDocument()

    // Search query input
    const searchInput = screen.getByPlaceholderText(/Tìm thợ, khách hàng, trạm\.\.\./i)

    // Filter by staff "Mia"
    fireEvent.change(searchInput, { target: { value: 'Mia' } })
    expect(screen.getByText('TX-101')).toBeInTheDocument()
    expect(screen.getByText('TX-103')).toBeInTheDocument()
    expect(screen.queryByText('TX-102')).not.toBeInTheDocument()
    expect(screen.queryByText('TX-104')).not.toBeInTheDocument()

    // Filter by payment method "Card"
    fireEvent.change(searchInput, { target: { value: 'Card' } })
    expect(screen.getByText('TX-102')).toBeInTheDocument()
    expect(screen.queryByText('TX-101')).not.toBeInTheDocument()
    expect(screen.queryByText('TX-103')).not.toBeInTheDocument()
    expect(screen.queryByText('TX-104')).not.toBeInTheDocument()
  })

  it('navigates to "Ví nhận thợ" tab and verifies staff payouts aggregation', () => {
    render(
      <LanguageProvider>
        <TipsView transactions={mockTransactions} staff={mockStaff} />
      </LanguageProvider>
    )

    // Navigate to Ví nhận thợ
    const payoutsTabBtn = screen.getByRole('button', { name: 'Ví nhận thợ' })
    fireEvent.click(payoutsTabBtn)

    // Staff payouts summary based on mock:
    // Mia Tran: TX-101 ($50.00, Success) + TX-103 ($20.00, Success) = $70.00
    // Leo Nguyen: TX-102 ($30.00, Success) = $30.00
    // Chloe Pham: TX-104 ($100.00, Pending) = $100.00

    expect(screen.getByText('Mia Tran')).toBeInTheDocument()
    expect(screen.getAllByText('$70.00').length).toBeGreaterThan(0)

    expect(screen.getByText('Leo Nguyen')).toBeInTheDocument()
    expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0)

    expect(screen.getByText('Chloe Pham')).toBeInTheDocument()
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0)
  })
})
