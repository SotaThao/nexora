export const POS_WORKSPACE_ORDER_ID_PARAM = 'orderId'
export const POS_WORKSPACE_MODE_PARAM = 'orderMode'
export const POS_WORKSPACE_RECEIPT_MODE_PARAM = 'receiptMode'

export type PosReceiptMode = 'none' | 'sms' | 'print'

export type PosWorkspaceUrlState = {
  orderId: string
  mode: 'edit' | 'checkout' | 'success'
  receiptMode?: PosReceiptMode
}

export function readPosWorkspaceFromParams(params: URLSearchParams): PosWorkspaceUrlState | null {
  const orderId = (params.get(POS_WORKSPACE_ORDER_ID_PARAM) ?? '').trim()
  const mode = params.get(POS_WORKSPACE_MODE_PARAM)
  if (!orderId || (mode !== 'edit' && mode !== 'checkout' && mode !== 'success')) return null
  const receiptModeParam = params.get(POS_WORKSPACE_RECEIPT_MODE_PARAM)
  const receiptMode: PosReceiptMode | undefined =
    receiptModeParam === 'none' || receiptModeParam === 'sms' || receiptModeParam === 'print'
      ? receiptModeParam
      : undefined
  return {
    orderId,
    mode,
    ...(mode === 'success' && receiptMode ? { receiptMode } : {}),
  }
}

export function writePosWorkspaceToParams(
  params: URLSearchParams,
  workspace: PosWorkspaceUrlState | null,
  nextTab?: string,
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (!workspace) {
    next.delete(POS_WORKSPACE_ORDER_ID_PARAM)
    next.delete(POS_WORKSPACE_MODE_PARAM)
    next.delete(POS_WORKSPACE_RECEIPT_MODE_PARAM)
    if (nextTab) next.set('tab', nextTab)
    return next
  }
  next.set(POS_WORKSPACE_ORDER_ID_PARAM, workspace.orderId)
  next.set(POS_WORKSPACE_MODE_PARAM, workspace.mode)
  next.delete(POS_WORKSPACE_RECEIPT_MODE_PARAM)
  if (workspace.mode === 'success' && workspace.receiptMode) {
    next.set(POS_WORKSPACE_RECEIPT_MODE_PARAM, workspace.receiptMode)
  }
  return next
}
