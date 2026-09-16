/**
 * Catalog flag from Service.IsRequiredApproval.
 * Settings, work-order detail, and the technician picker all share this wire name.
 */
export const POS_SERVICE_APPROVAL_FIELD = {
  camel: 'isRequiredApproval',
  pascal: 'IsRequiredApproval',
} as const

const FORM_BOOL = {
  true: 'true',
  false: 'false',
} as const

export function toFormBool(value: boolean): string {
  return value ? FORM_BOOL.true : FORM_BOOL.false
}

export function readRequiredApproval(raw: object): boolean {
  const record = raw as Record<string, unknown>
  const value = record[POS_SERVICE_APPROVAL_FIELD.camel] ?? record[POS_SERVICE_APPROVAL_FIELD.pascal]
  return value === true || value === FORM_BOOL.true
}
