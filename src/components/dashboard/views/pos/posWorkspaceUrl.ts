export const POS_WORKSPACE_ORDER_ID_PARAM = 'orderId'
export const POS_WORKSPACE_MODE_PARAM = 'orderMode'

export type PosWorkspaceUrlState = {
  orderId: string
  mode: 'edit' | 'checkout'
}

export function readPosWorkspaceFromParams(params: URLSearchParams): PosWorkspaceUrlState | null {
  const orderId = (params.get(POS_WORKSPACE_ORDER_ID_PARAM) ?? '').trim()
  const mode = params.get(POS_WORKSPACE_MODE_PARAM)
  if (!orderId || (mode !== 'edit' && mode !== 'checkout')) return null
  return { orderId, mode }
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
    if (nextTab) next.set('tab', nextTab)
    return next
  }
  next.set(POS_WORKSPACE_ORDER_ID_PARAM, workspace.orderId)
  next.set(POS_WORKSPACE_MODE_PARAM, workspace.mode)
  return next
}
