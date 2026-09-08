export enum PosReportTab {
  Technician = 'technician',
  StoreIncome = 'store-income',
  ServiceIncome = 'service-income',
}

export const POS_REPORT_ROOT_PATH = '/dashboard/pos/report'

export function posReportPath(tab: PosReportTab): string {
  return `${POS_REPORT_ROOT_PATH}/${tab}`
}

export function isPosReportTab(value: string | undefined): value is PosReportTab {
  return Object.values(PosReportTab).includes(value as PosReportTab)
}
