import type { PosTechnicianReportPrint } from '../../../types/domain'
import type { StaffIncomeReportTicketsResponse } from '../../../data/repositories/staffIncomeReport'
import { formatWorkOrderWallClockTime } from '../work-orders/workOrderTickets'

const TK = 'staff_salon_report.detail'
type Translate = (key: string, vars?: Record<string, string | number>) => string

export function buildStaffDailyIncomeReceipt(
  data: StaffIncomeReportTicketsResponse | undefined,
  name: string,
  periodLabel: string,
  currencyFormatter: Intl.NumberFormat,
  currentLanguage: string,
  t: Translate,
  totalSupplyFee: number,
  totalCommission: number,
): PosTechnicianReportPrint {
  const tickets = data?.tickets ?? []
  return {
    name,
    heading: t(`${TK}.dailyTitle`),
    period: periodLabel,
    columns: [t(`${TK}.ticket`), t(`${TK}.amount`), t(`${TK}.tips`)],
    emptyLabel: t(`${TK}.noTickets`),
    entries: tickets.map((ticket, index) => ({
      id: ticket.orderId,
      label: `${index + 1}. #${ticket.orderNumber}`,
      amount: currencyFormatter.format(ticket.amount),
      tips: currencyFormatter.format(ticket.tips),
      time: formatWorkOrderWallClockTime(ticket.completedAt, currentLanguage),
      services: ticket.services,
      discount: {
        label: t(`${TK}.ownerDiscount`),
        value: ticket.ownerDiscount > 0 ? currencyFormatter.format(ticket.ownerDiscount) : '—',
      },
    })),
    totals: [
      { label: t(`${TK}.totalAmount`), value: currencyFormatter.format(data?.totalAmount ?? 0) },
      { label: t(`${TK}.totalTips`), value: currencyFormatter.format(data?.totalTips ?? 0) },
      { label: t(`${TK}.totalDiscount`), value: currencyFormatter.format(data?.totalDiscount ?? 0) },
      { label: t(`${TK}.totalSupplyFee`), value: currencyFormatter.format(totalSupplyFee) },
      { label: t(`${TK}.totalCommission`), value: currencyFormatter.format(totalCommission) },
      { label: t(`${TK}.cashCollected`), value: currencyFormatter.format(data?.totalCollected ?? 0) },
    ],
  }
}
