import type { DemoState, Person } from "../../store/types";
import { nicknameOf } from "./lib";

export type QueryKind = "id" | "phone" | "email" | "name";
export const KIND_LABEL: Record<QueryKind, string> = {
  id: "NEXORA ID · khớp chính xác",
  phone: "Số điện thoại · so 10 số cuối",
  email: "Email",
  name: "Tên hoặc @nickname · chứa",
};

/** Mock phone-book pairs used by the "Danh bạ" privacy value. */
const CONTACTS: [string, string][] = [
  ["jessica", "kayla"],
  ["jessica", "2221"],
  ["kayla", "3332"],
  ["kayla", "linh"],
];

const inContacts = (a: string, b: string) => CONTACTS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

/** Doc 05 luồng 1: NX + digits ⇒ ID · ≥7 digits/symbols ⇒ phone · has @ and . ⇒ email · else name. */
export function detectKind(raw: string): QueryKind {
  const q = raw.trim();
  if (/^nx-?\d+$/i.test(q)) return "id";
  if (/^[\d\s()+.-]+$/.test(q) && q.replace(/\D/g, "").length >= 7) return "phone";
  if (q.includes("@") && q.includes(".") && !q.startsWith("@")) return "email";
  return "name";
}

function phoneAllowed(state: DemoState, target: Person, viewerId: string | null) {
  const setting = target.id === viewerId
    ? state.privacy.phoneSearch
    : target.privacyFlags?.includes("phone:everyone")
      ? "Mọi người"
      : target.privacyFlags?.includes("phone:nobody")
        ? "Không ai"
        : "Danh bạ";
  if (setting === "Mọi người") return true;
  if (setting === "Không ai") return false;
  return Boolean(viewerId && inContacts(viewerId, target.id));
}

export type SearchResult = { kind: QueryKind; people: Person[]; privateMiss: boolean };

export function searchPeople(state: DemoState, raw: string, viewerId: string | null): SearchResult {
  const q = raw.trim();
  const kind = detectKind(q);
  const candidates = state.people.filter((p) => p.id !== viewerId && !state.blockedUserIds.includes(p.id));
  if (!q) return { kind, people: [], privateMiss: false };
  if (kind === "id") {
    const digits = q.replace(/\D/g, "");
    return { kind, people: candidates.filter((p) => p.nxId === `NX-${digits}`), privateMiss: false };
  }
  if (kind === "phone") {
    const last10 = q.replace(/\D/g, "").slice(-10);
    const hit = candidates.filter((p) => p.phone && p.phone.slice(-10) === last10 && phoneAllowed(state, p, viewerId));
    return { kind, people: hit, privateMiss: hit.length === 0 };
  }
  if (kind === "email") {
    // No seeded member lets strangers find them by email (default "Không ai").
    return { kind, people: [], privateMiss: true };
  }
  const needle = q.replace(/^@/, "").toLowerCase();
  const hit = candidates.filter(
    (p) => p.name.toLowerCase().includes(needle) || nicknameOf(state, p.id).includes(needle),
  );
  return { kind, people: hit, privateMiss: false };
}
