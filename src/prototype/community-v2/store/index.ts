import { useSyncExternalStore } from "react";
import { cloneSeed } from "./seed";
import type { CommunityRole, DemoState } from "./types";

const KEY = "nxc2:state";
let state: DemoState = load();
const listeners = new Set<() => void>();

function load(): DemoState {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? { ...cloneSeed(), ...JSON.parse(saved) } : cloneSeed();
  } catch {
    return cloneSeed();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* persistence is optional */
  }
}

function publish(next: DemoState) {
  state = next;
  save();
  listeners.forEach((listener) => listener());
}

export function useStore<T>(selector: (value: DemoState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
    () => selector(state),
  );
}

/**
 * Read-only snapshot of the current demo state. Slices may use this to derive
 * new state from the current one, but must never mutate the returned object.
 */
export function getState(): DemoState {
  return state;
}

export const storeActions = {
  setRole(role: CommunityRole) {
    const person =
      role === "tech" ? "jessica" : role === "owner" ? "kayla" : role === "client" ? "linh" : null;
    publish({ ...state, role, currentPersonId: person });
  },
  setOtpEnabled(otpEnabled: boolean) {
    publish({ ...state, otpEnabled });
  },
  setWhatsNewSeen(whatsNewSeen: boolean) {
    publish({ ...state, whatsNewSeen });
  },
  publishTerms() {
    publish({ ...state, termsVersion: "1.1" });
  },
  consent() {
    publish({
      ...state,
      consentVersion: state.termsVersion,
      consentRecords: [
        ...state.consentRecords,
        { version: state.termsVersion, at: new Date().toISOString(), checks: ["18+", "terms", "community", "privacy"] },
      ],
    });
  },
  createGuestAccount(name: string, phone: string) {
    const id = `member-${Date.now()}`;
    publish({
      ...state,
      role: "client",
      currentPersonId: id,
      consentVersion: state.termsVersion,
      people: [
        ...state.people,
        { id, name, role: "client", nxId: `NX-${String(Date.now()).slice(-4)}`, city: "Houston", phone },
      ],
      consentRecords: [
        ...state.consentRecords,
        { version: state.termsVersion, at: new Date().toISOString(), checks: ["18+", "terms"] },
      ],
    });
  },
  resetDemo() {
    publish(cloneSeed());
  },
  /**
   * Generic write seam for module slices. A slice reads the current state via
   * `getState()`, derives the next state, and hands it here to publish + persist.
   * Only mutate the state keys owned by your own module (see store/types/mXX.ts).
   */
  update(mutator: (current: DemoState) => DemoState) {
    publish(mutator(state));
  },
};
