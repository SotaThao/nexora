export type SimulationEvent = "terms.v11.published" | "call.incoming" | "shift.checkin.overdue";
const listeners = new Set<(event: SimulationEvent) => void>();
export function simulate(event: SimulationEvent) { listeners.forEach((listener) => listener(event)); }
export function subscribeSimulation(listener: (event: SimulationEvent) => void) { listeners.add(listener); return () => listeners.delete(listener); }
