import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { useTranslation } from '../../../contexts/LanguageContext'
import StaffSalonReport from './StaffSalonReport'

const originalTimeZone = process.env.TZ

const staffSelfRepositoryMock = vi.hoisted(() => ({
  getMyBusinesses: vi.fn(),
}))

const staffIncomeReportRepositoryMock = vi.hoisted(() => ({
  getIncomeReport: vi.fn(),
}))

const REPORT_TRANSLATIONS = [
  { key: 'title', en: 'Income Report', vi: 'Báo cáo thu nhập' },
  { key: 'scope', en: 'Report Scope', vi: 'Phạm vi báo cáo' },
  { key: 'all', en: 'All', vi: 'Tất cả' },
  { key: 'business', en: 'Store', vi: 'Tiệm' },
  { key: 'independent', en: 'Independent', vi: 'Làm riêng' },
  { key: 'allStores', en: 'All Stores', vi: 'Tất cả tiệm' },
  { key: 'selectStore', en: 'Select Store', vi: 'Chọn tiệm' },
  { key: 'period', en: 'Period', vi: 'Kỳ báo cáo' },
  { key: 'daily', en: 'Daily', vi: 'Theo ngày' },
  { key: 'weekly', en: 'Weekly', vi: 'Theo tuần' },
  { key: 'monthly', en: 'Monthly', vi: 'Theo tháng' },
  { key: 'yearly', en: 'Yearly', vi: 'Theo năm' },
  { key: 'date', en: 'Date', vi: 'Ngày' },
  { key: 'week', en: 'Week', vi: 'Tuần' },
  { key: 'weekStart', en: 'Week Starting', vi: 'Tuần bắt đầu' },
  { key: 'month', en: 'Month', vi: 'Tháng' },
  { key: 'year', en: 'Year', vi: 'Năm' },
  { key: 'today', en: 'Today', vi: 'Hôm nay' },
  { key: 'thisWeek', en: 'This Week', vi: 'Tuần này' },
  { key: 'thisMonth', en: 'This Month', vi: 'Tháng này' },
  { key: 'thisYear', en: 'This Year', vi: 'Năm nay' },
  { key: 'apply', en: 'Apply', vi: 'Áp dụng' },
  { key: 'reset', en: 'Reset', vi: 'Đặt lại' },
  { key: 'income', en: 'Income', vi: 'Thu nhập' },
  { key: 'pay', en: 'Pay', vi: 'Tiền công' },
  { key: 'tip', en: 'Tip', vi: 'Tiền tip' },
  { key: 'otherIncome', en: 'Other Income', vi: 'Thu nhập khác' },
  { key: 'paidAmount', en: 'Paid Amount', vi: 'Đã thanh toán' },
  { key: 'totalHours', en: 'Hours', vi: 'Giờ làm' },
  { key: 'turns', en: 'Turns', vi: 'Lượt' },
  { key: 'service', en: 'Service', vi: 'Doanh thu dịch vụ' },
  { key: 'commission', en: 'Commission', vi: 'Tiền hoa hồng' },
  { key: 'commissionPercent', en: 'Comm %', vi: 'Tỷ lệ hoa hồng' },
  { key: 'techTakes', en: 'Tech Takes', vi: 'Thợ nhận' },
  { key: 'estimatedPay', en: 'Estimated Pay', vi: 'Tiền công ước tính' },
  { key: 'posPay', en: 'POS Pay', vi: 'Tiền công từ POS' },
  { key: 'posTips', en: 'POS Tips', vi: 'Tiền tip từ POS' },
  { key: 'qrTips', en: 'QR Tips', vi: 'Tiền tip qua QR' },
  { key: 'manualTips', en: 'Manual Tips', vi: 'Tiền tip nhập thủ công' },
  { key: 'directPayments', en: 'Direct Payments', vi: 'Thanh toán trực tiếp' },
  { key: 'selfReportedIncome', en: 'Self-Reported Income', vi: 'Thu nhập tự khai báo' },
  { key: 'summary', en: 'Summary', vi: 'Tổng quan' },
  { key: 'dailyBreakdown', en: 'Daily Breakdown', vi: 'Chi tiết theo ngày' },
  { key: 'businessBreakdown', en: 'Store Breakdown', vi: 'Chi tiết theo tiệm' },
  { key: 'noData', en: 'No income data found', vi: 'Không có dữ liệu thu nhập' },
  { key: 'loading', en: 'Loading report...', vi: 'Đang tải báo cáo...' },
  { key: 'loadError', en: 'Unable to load income report', vi: 'Không thể tải báo cáo thu nhập' },
  { key: 'notApplicable', en: 'Not Applicable', vi: 'Không áp dụng' },
] as const

vi.mock('../../../data/repositories/staffSelf', () => ({
  default: staffSelfRepositoryMock,
}))

vi.mock('../../../data/repositories/staffIncomeReport', () => ({
  default: staffIncomeReportRepositoryMock,
}))

vi.mock('../../../auth/useSessionRole', () => ({
  useSessionRole: () => ({
    isStaff: true,
    session: { id: 'staff-user-1' },
  }),
}))

function salon(overrides: Record<string, unknown>) {
  return {
    businessId: 'salon-1',
    businessName: 'Bliss Nails',
    nicknameAtBusiness: null,
    address: '100 Main Street',
    city: 'Austin',
    state: 'TX',
    logoUrl: null,
    role: 'Technician',
    roleLabel: 'Technician',
    roleAtBusiness: 'Technician',
    linkStatus: '1',
    linkStatusLabel: 'Active',
    linkedAt: '2026-01-05T00:00:00Z',
    businessSlug: 'bliss-nails',
    touchPointSlug: 'front-desk',
    masterTouchPointSlug: 'front-desk',
    tipUrl: null,
    qrImageUrl: null,
    touchPointsMissing: false,
    ...overrides,
  }
}

function incomeReport(overrides: Record<string, unknown> = {}) {
  return {
    filter: { scope: 'All', period: 'Daily' },
    summary: {
      income: 306.5,
      pay: 192,
      tip: 86.5,
      otherIncome: 28,
      paidAmount: 200,
      totalHours: 8,
      isEstimatedPay: true,
      turns: 6,
      service: 480,
      commission: 192,
      commissionPercent: 40,
      techTakes: 278.5,
    },
    sources: {
      posPay: 192,
      posTips: 3,
      qrTips: 83.5,
      manualTips: 0,
      directPayments: 0,
      selfReportedIncome: 28,
    },
    breakdown: [],
    businessBreakdown: [],
    ...overrides,
  }
}

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>
}

function ReportTranslationProbe() {
  const { t } = useTranslation()

  return REPORT_TRANSLATIONS.map(({ key }) => (
    <output key={key} data-testid={`report-translation-${key}`}>
      {t(`staff_salon_report.${key}`)}
    </output>
  ))
}

function renderReport(initialEntry = '/staff/salons/report') {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <StaffSalonReport />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('StaffSalonReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('nexora_lang')
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([])
    staffIncomeReportRepositoryMock.getIncomeReport.mockResolvedValue(incomeReport())
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalTimeZone === undefined) delete process.env.TZ
    else process.env.TZ = originalTimeZone
  })

  it.each([
    ['en', 'en'],
    ['vi', 'vi'],
  ] as const)('resolves all 48 canonical report translations in %s', (language, valueKey) => {
    localStorage.setItem('nexora_lang', language)

    render(<ReportTranslationProbe />)

    expect(REPORT_TRANSLATIONS).toHaveLength(48)
    REPORT_TRANSLATIONS.forEach((translation) => {
      expect(screen.getByTestId(`report-translation-${translation.key}`)).toHaveTextContent(
        translation[valueKey],
      )
    })
  })

  it('renders the approved summary metrics for All sources', async () => {
    renderReport()

    expect(screen.getByRole('heading', { name: 'Income Report' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Report Scope' })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: 'Period' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Salon Report' })).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Daily' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Date')).toHaveAttribute('type', 'date')
    expect(screen.queryByText('Preview data')).not.toBeInTheDocument()

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Income',
      'Pay',
      'Tip',
      'Other Income',
      'Paid Amount',
    ])
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '$306.50',
      '$192.00',
      '$86.50',
      '$28.00',
      '$200.00',
    ])
  })

  it('renders all POS metrics in the approved order for one Business', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss' }),
    ])

    renderReport('/staff/salons/report?salon=salon-bliss')

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Turns',
      'Hours',
      'Service',
      'Pay',
      'Commission',
      'Comm %',
      'Tip',
      'Tech Takes',
    ])
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '6',
      '8.0',
      '$480.00',
      '$192.00',
      '$192.00',
      '40%',
      '$86.50',
      '$278.50',
    ])
  })

  it('renders Independent income from summary and the deployed sources object', async () => {
    staffIncomeReportRepositoryMock.getIncomeReport.mockResolvedValue(incomeReport({
      filter: { scope: 'Independent', period: 'Daily' },
      summary: {
        income: 73.25,
        pay: 0,
        tip: 0,
        otherIncome: 73.25,
        paidAmount: 0,
        totalHours: 8,
        isEstimatedPay: false,
        turns: null,
        service: null,
        commission: null,
        commissionPercent: null,
        techTakes: null,
      },
      sources: {
        posPay: 0,
        posTips: 0,
        qrTips: 0,
        manualTips: 0,
        directPayments: 45.25,
        selfReportedIncome: 28,
      },
    }))

    renderReport('/staff/salons/report?salon=independent')

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Income',
      'Direct Payments',
      'Self-Reported Income',
    ])
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '$73.25',
      '$45.25',
      '$28.00',
    ])
  })

  it('renders the approved Vietnamese metric labels for every source scope', async () => {
    localStorage.setItem('nexora_lang', 'vi')
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss' }),
    ])

    const allReport = renderReport()
    expect(within(await screen.findByRole('table')).getAllByRole('columnheader').map(
      (header) => header.textContent,
    )).toEqual([
      'Thu nhập',
      'Tiền công',
      'Tiền tip',
      'Thu nhập khác',
      'Đã thanh toán',
    ])
    allReport.unmount()

    const businessReport = renderReport('/staff/salons/report?salon=salon-bliss')
    expect(within(await screen.findByRole('table')).getAllByRole('columnheader').map(
      (header) => header.textContent,
    )).toEqual([
      'Lượt',
      'Giờ làm',
      'Doanh thu dịch vụ',
      'Tiền công',
      'Tiền hoa hồng',
      'Tỷ lệ hoa hồng',
      'Tiền tip',
      'Thợ nhận',
    ])
    businessReport.unmount()

    renderReport('/staff/salons/report?salon=independent')
    expect(within(await screen.findByRole('table')).getAllByRole('columnheader').map(
      (header) => header.textContent,
    )).toEqual([
      'Thu nhập',
      'Thanh toán trực tiếp',
      'Thu nhập tự khai báo',
    ])
  })

  it('shows a loading state while the income request is pending', () => {
    staffIncomeReportRepositoryMock.getIncomeReport.mockReturnValue(new Promise(() => {}))

    renderReport()

    expect(within(screen.getByRole('tabpanel')).getByRole('status')).toHaveTextContent('Loading report...')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows a retryable error state and reloads the report', async () => {
    staffIncomeReportRepositoryMock.getIncomeReport
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(incomeReport())

    renderReport()

    expect(await screen.findByText('Unable to load income report')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenCalledTimes(2)
  })

  it('uses week and year filters on the weekly tab and syncs the URL', () => {
    renderReport()

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/staff/salons/report?tab=weekly')
    expect(screen.getByLabelText('Week')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
    expect(screen.queryByLabelText('Date')).not.toBeInTheDocument()
  })

  it('maps the selected tabs to their period-specific API parameters', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 20, 12))

    renderReport()

    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))
    fireEvent.change(screen.getByLabelText('Week'), { target: { value: '1' } })

    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith({
      scope: 'All',
      period: 'Weekly',
      weekStart: '2025-12-29',
    }))

    fireEvent.click(screen.getByRole('tab', { name: 'Monthly' }))
    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith({
      scope: 'All',
      period: 'Monthly',
      month: 8,
      year: 2026,
    }))

    fireEvent.click(screen.getByRole('tab', { name: 'Yearly' }))
    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith({
      scope: 'All',
      period: 'Yearly',
      year: 2026,
    }))
  })

  it('keeps the last valid daily date when the native date input is cleared', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 20, 12))

    renderReport()

    const dateInput = screen.getByLabelText('Date')
    fireEvent.change(dateInput, { target: { value: '' } })

    expect(dateInput).toHaveValue('2026-08-20')
    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith({
      scope: 'All',
      period: 'Daily',
      date: '2026-08-20',
    }))
  })

  it('uses the ISO week-year when the current week crosses a calendar-year boundary', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2027, 0, 1, 12))

    renderReport('/staff/salons/report?tab=weekly')

    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenCalledWith({
      scope: 'All',
      period: 'Weekly',
      weekStart: '2026-12-28',
    }))
  })

  it('offers only valid ISO weeks and clamps week 53 when changing to a 52-week year', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 7, 20, 12))

    renderReport('/staff/salons/report?tab=weekly')

    const weekSelect = screen.getByLabelText('Week')
    expect(within(weekSelect).getByRole('option', { name: 'Week 53' })).toBeInTheDocument()
    fireEvent.change(weekSelect, { target: { value: '53' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2025' } })

    expect(within(weekSelect).queryByRole('option', { name: 'Week 53' })).not.toBeInTheDocument()
    expect(weekSelect).toHaveValue('52')
    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith({
      scope: 'All',
      period: 'Weekly',
      weekStart: '2025-12-22',
    }))
  })

  it('counts ISO weeks correctly in a negative UTC offset timezone', () => {
    process.env.TZ = 'America/Los_Angeles'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-20T19:00:00Z'))

    renderReport('/staff/salons/report?tab=weekly')

    expect(within(screen.getByLabelText('Week')).getByRole('option', {
      name: 'Week 53',
    })).toBeInTheDocument()
  })

  it('shows month and year filters for monthly, and only year for yearly', () => {
    renderReport('/staff/salons/report?tab=monthly')

    expect(screen.getByRole('tab', { name: 'Monthly' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Yearly' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/staff/salons/report?tab=yearly')
    expect(screen.queryByLabelText('Month')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Week')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('keeps period labels accessible while hiding them visually', () => {
    renderReport()

    expect(screen.getByText('Date', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByLabelText('Date')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))
    expect(screen.getByText('Week', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')

    fireEvent.click(screen.getByRole('tab', { name: 'Monthly' }))
    expect(screen.getByText('Month', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')

    fireEvent.click(screen.getByRole('tab', { name: 'Yearly' }))
    expect(screen.getByText('Year', { selector: 'span' })).toHaveClass('sr-only')
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('keeps period filters adjacent to Period in a wrapping row', () => {
    renderReport()

    const reportingPeriod = screen.getByText('Period')
    const filterBar = reportingPeriod.parentElement as HTMLElement

    expect(filterBar).toHaveClass('flex', 'flex-wrap', 'items-center', 'gap-3')
    expect(filterBar).not.toHaveClass('sm:justify-between')
    expect(filterBar.children[0]).toContainElement(reportingPeriod)
    expect(filterBar.children[1]).toContainElement(screen.getByLabelText('Date'))
  })

  it('filters by active salons and preserves the selected salon when changing tabs', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss', businessName: 'Bliss Nails' }),
      salon({ businessId: 'salon-rose', businessName: 'Rose Spa' }),
      salon({
        businessId: 'salon-old',
        businessName: 'Old Salon',
        linkStatus: '2',
        linkStatusLabel: 'Inactive',
      }),
    ])
    renderReport()

    await screen.findByRole('option', { name: 'Bliss Nails' })
    const salonFilter = screen.getByRole('combobox', { name: 'Report Scope' })
    expect(salonFilter).toHaveValue('all')
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Independent' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Bliss Nails' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Rose Spa' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Old Salon' })).not.toBeInTheDocument()

    fireEvent.change(salonFilter, { target: { value: 'salon-rose' } })

    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'Business', businessId: 'salon-rose' }),
    ))
    fireEvent.click(screen.getByRole('tab', { name: 'Weekly' }))

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/staff/salons/report?salon=salon-rose&tab=weekly',
    )
  })

  it('shows one report scope label and keeps the select in the same filter group', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ businessId: 'salon-bliss', businessName: 'Bliss Nails' }),
    ])
    renderReport()

    await screen.findByRole('option', { name: 'Bliss Nails' })
    const filterGroup = screen.getByRole('group', { name: 'Report Scope' })

    expect(within(filterGroup).getAllByText('Report Scope')).toHaveLength(1)
    expect(within(filterGroup).getByRole('combobox', { name: 'Report Scope' })).toBeInTheDocument()
  })

  it('keeps All and Independent available when there are no active linked salons', async () => {
    staffSelfRepositoryMock.getMyBusinesses.mockResolvedValue([
      salon({ linkStatus: '2', linkStatusLabel: 'Inactive' }),
    ])
    renderReport()

    const sourceFilter = await screen.findByRole('combobox', { name: 'Report Scope' })
    expect(sourceFilter).toBeEnabled()
    expect(screen.getByRole('option', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Independent' })).toBeInTheDocument()
  })

  it('requests Independent scope without a business id', async () => {
    renderReport()

    fireEvent.change(screen.getByRole('combobox', { name: 'Report Scope' }), {
      target: { value: 'independent' },
    })

    await waitFor(() => expect(staffIncomeReportRepositoryMock.getIncomeReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'Independent' }),
    ))
    const reportCalls = staffIncomeReportRepositoryMock.getIncomeReport.mock.calls
    const lastParams = reportCalls[reportCalls.length - 1]?.[0]
    expect(lastParams).not.toHaveProperty('businessId')
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/staff/salons/report?salon=independent',
    )
  })
})
