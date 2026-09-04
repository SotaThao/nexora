/**
 * Which ticket panel shows a pending state while a POS workspace mutation is in flight.
 * Shared by the action lock and the per-panel skeletons so a tap cannot queue a second call.
 */
export enum TicketBusySurface {
  AddLine = 'addLine',
  Technician = 'technician',
  Lines = 'lines',
  Status = 'status',
  Tip = 'tip',
  Note = 'note',
  Complete = 'complete',
}

export function isLineBusySurface(surface: TicketBusySurface | null): boolean {
  return surface === TicketBusySurface.Lines
}
