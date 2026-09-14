export enum CustomerSource {
  Call = 'Call',
  Qr = 'Qr',
  Web = 'Web',
  Sms = 'Sms',
  Receipt = 'Receipt',
  Manual = 'Manual',
  PosCheckIn = 'PosCheckIn',
  PosSelfCheckIn = 'PosSelfCheckIn',
}

export const GUEST_SOURCE_LABEL_KEYS: Record<CustomerSource, string> = {
  [CustomerSource.Call]: 'sourceVoice',
  [CustomerSource.Sms]: 'sourceSms',
  [CustomerSource.Qr]: 'sourceQr',
  [CustomerSource.Web]: 'sourceWeb',
  [CustomerSource.Receipt]: 'sourceReceipt',
  [CustomerSource.Manual]: 'sourceWalkIn',
  [CustomerSource.PosCheckIn]: 'sourceWalkIn',
  [CustomerSource.PosSelfCheckIn]: 'sourceWalkIn',
}
