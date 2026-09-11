import type { PosReceiptDocument } from '../../../../../types/domain'
import type { PosStaffReportDetail } from '../../../../../data/repositories/posReport'
import { PosReportMode } from '../../../../../constants/posReportMode'
import { getPosCheckoutPaymentMethodLabel } from '../../../../../constants/posCheckoutPaymentMethod'
import { formatCurrency, parseApiDateTime } from '../../../utils'
import { formatDayLabel } from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report.detail'
type Translate = (key: string, vars?: Record<string, string | number>) => string

export function buildTechnicianReportReceipt(detail: PosStaffReportDetail, name: string, t: Translate): PosReceiptDocument {
  const start = formatDayLabel(detail.periodStart, 'en-US')
  const end = formatDayLabel(detail.periodEnd, 'en-US')
  const daily = detail.mode === PosReportMode.Daily
  return {
    version: 1, orderNumber: '', customerName: '', customerPhone: '', completedAtLabel: '',
    businessName: '', businessAddress: '', businessPhone: '', rows: [], totals: [], paidWithLabel: '', isPaid: false,
    labels: {ticket:'',customer:'',phone:'',paidWith:'',thankYou:'',noLines:''},
    technicianReport: {
      name, heading: t(`${TK}.${daily ? 'dailyTitle' : detail.mode === PosReportMode.Weekly ? 'weeklyTitle' : 'monthlyTitle'}`),
      period: start === end ? start : `${start} — ${end}`,
      columns: [t(`${TK}.${daily ? 'ticket' : 'day'}`), t(`${TK}.amount`), t(`${TK}.tips`)],
      emptyLabel: t(`${TK}.noTickets`),
      entries: daily ? detail.days.flatMap(day => day.tickets).map((ticket, index) => ({
        id: ticket.orderId, label: `${index + 1}. #${ticket.orderNumber}`, amount: formatCurrency(ticket.amount), tips: formatCurrency(ticket.tips),
        time: reportTime(ticket.completedAtUtc, detail.timeZone),
        services: ticket.services, discount: {label:t(`${TK}.ownerDiscount`),value:ticket.ownerDiscount > 0 ? formatCurrency(ticket.ownerDiscount) : '—'},
      })) : detail.days.map(day => ({id:day.date,label:formatDayLabel(day.date,'en-US'),amount:formatCurrency(day.amount),tips:formatCurrency(day.tips)})),
      totals: [
        {label:t(`${TK}.totalAmount`),value:formatCurrency(detail.totalAmount)},
        {label:t(`${TK}.totalTips`),value:formatCurrency(detail.totalTips)},
        {label:t(`${TK}.totalDiscount`),value:formatCurrency(detail.totalDiscount)},
        {label:t(`${TK}.totalCommission`),value:formatCurrency(detail.totalCommission)},
        ...detail.paymentTotals.map(payment => ({label:t(`${TK}.collected`,{method:getPosCheckoutPaymentMethodLabel(payment.paymentMethod,t)}),value:formatCurrency(payment.amount)})),
      ],
    },
  }
}

function reportTime(timestamp: string, timeZone: string): string {
  const date = parseApiDateTime(timestamp)
  return date ? new Intl.DateTimeFormat('en-US', {hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true,timeZone}).format(date) : '—'
}
