import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import AnalyticsView from '../../src/components/AnalyticsView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const mockTransactions = [
  { id: 'TX-001', dateTime: '2026-05-25 14:00', amount: 100, staffName: 'Anna Ng.', staffId: '1', touchpoint: 'Table 01', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-002', dateTime: '2026-05-25 15:00', amount: 200, staffName: 'Lisa Tr.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-003', dateTime: '2026-05-26 10:00', amount: 50, staffName: 'Anna Ng.', staffId: '1', touchpoint: 'Table 01', paymentMethod: 'Card', status: 'Success' }
]

const mockStaff = [
  { id: '1', fullName: 'Anna Nguyen', nickname: 'Anna Ng.' },
  { id: '2', fullName: 'Lisa Tran', nickname: 'Lisa Tr.' }
]

const mockTouchpoints = [
  { id: 'tp-1', name: 'Table 01', type: 'Table QR', isActive: true, scans: 10 },
  { id: 'tp-2', name: 'Front Desk', type: 'Front Desk', isActive: true, scans: 20 }
]

describe('AnalyticsView Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.setItem('nexora_lang', 'vi')
  })

  it('renders AnalyticsView heading and subtitle', () => {
    render(
      <LanguageProvider>
        <AnalyticsView transactions={mockTransactions} staff={mockStaff} touchpoints={mockTouchpoints} />
      </LanguageProvider>
    )

    expect(screen.getByRole('heading', { level: 2, name: /Analytics|Phân Tích/i })).toBeInTheDocument()
    expect(screen.getByText(/dashboard.analytics.description|Xem số liệu phân tích chuyên sâu/i)).toBeInTheDocument()
  })

  it('calculates and renders dynamic KPI card metrics correctly', () => {
    render(
      <LanguageProvider>
        <AnalyticsView transactions={mockTransactions} staff={mockStaff} touchpoints={mockTouchpoints} />
      </LanguageProvider>
    )

    // 1. Total Volume KPI ($350)
    expect(screen.getByText('$350.00')).toBeInTheDocument()

    // 2. Total Transactions KPI (3 GD)
    expect(screen.getByText('3 GD')).toBeInTheDocument()

    // 3. Average Tip KPI ($350 / 3 = $116.67)
    expect(screen.getByText('$116.67')).toBeInTheDocument()

    // 4. Fees Avoided (Zelle + Cash App = $300 direct. $300 * 3% = $9.00)
    expect(screen.getByText('$9.00')).toBeInTheDocument()
  })

  it('renders Staff Performance and Touchpoint Leaderboards correctly', () => {
    render(
      <LanguageProvider>
        <AnalyticsView transactions={mockTransactions} staff={mockStaff} touchpoints={mockTouchpoints} />
      </LanguageProvider>
    )

    // Check staff leaderboard headers and items
    expect(screen.getByText('Bảng Xếp Hạng Nhân Viên')).toBeInTheDocument()
    expect(screen.getByText('Anna Ng.')).toBeInTheDocument()
    expect(screen.getByText('Lisa Tr.')).toBeInTheDocument()

    // Check Touchpoint leaderboard headers and items
    expect(screen.getByText('Hiệu Suất Điểm Chạm QR')).toBeInTheDocument()
    expect(screen.getByText('Table 01')).toBeInTheDocument()
    expect(screen.getByText('Front Desk')).toBeInTheDocument()
  })
})
