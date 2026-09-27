import type { ComposerDraft, Group } from "../../../store/types";
import { AI_BLOCK_KEYWORDS, COPY, MAX_DESTINATIONS } from "../constants";
import { FEED_GROUP_ID } from "../../../store/slices/m01";

export type Step1Errors = { body?: string; price?: string; rights?: string };

export function validateStep1(draft: ComposerDraft): Step1Errors {
  const errors: Step1Errors = {};
  if (draft.body.trim().length < 5) errors.body = COPY.errShort;
  if (draft.type === "market" && !/^\d{1,6}$/.test(draft.price.trim())) errors.price = COPY.errPrice;
  if (draft.images.length > 0 && !draft.imageRights) errors.rights = COPY.errRights;
  return errors;
}

const PHONE = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;

export function aiCheck(body: string): "block" | "warn" | null {
  const text = body.toLowerCase();
  if (AI_BLOCK_KEYWORDS.some((keyword) => text.includes(keyword))) return "block";
  if (PHONE.test(body)) return "warn";
  return null;
}

/** Whole-word match so "mi" does not fire on "mình"/"miễn". */
const has = (text: string, words: string[]) =>
  words.some((word) => new RegExp(`(^|[^\\p{L}])${word}([^\\p{L}]|$)`, "u").test(text));

/** Doc 01 · 2.1 — AI suggestion of destinations (always includes Bảng tin chung). */
export function suggestDestinations(draft: ComposerDraft): string[] {
  const text = draft.body.toLowerCase();
  if (draft.type === "market") {
    if (has(text, ["sang tiệm", "thuê ghế", "booth"])) return [FEED_GROUP_ID, "sang-tiem"];
    if (has(text, ["spa", "giường", "massage"])) return [FEED_GROUP_ID, "cho-spa"];
    if (draft.area === "Toàn quốc có ship") return [FEED_GROUP_ID, "cho-do-nghe"];
    return [FEED_GROUP_ID, "cho-nail-houston"];
  }
  if (has(text, ["spa", "massage"])) return [FEED_GROUP_ID, "cd-spa"];
  if (has(text, ["tóc", "hair"])) return [FEED_GROUP_ID, "cd-hair"];
  if (has(text, ["mi", "lash", "chân mày"])) return [FEED_GROUP_ID, "cd-lash"];
  return [FEED_GROUP_ID, "cd-nail"];
}

/** Returns the next selection or a verbatim rule error for toggling `group`. */
export function toggleDestination(
  draft: ComposerDraft,
  group: Group,
): { next: string[]; error?: undefined } | { error: string; next?: undefined } {
  const selected = draft.destinations;
  if (selected.includes(group.id)) return { next: selected.filter((id) => id !== group.id) };
  if (draft.type === "market" && group.kind === "community") return { error: COPY.errMarketToCommunity };
  if (draft.type !== "market" && group.kind === "market") return { error: COPY.errPostToMarket };
  if (selected.length >= MAX_DESTINATIONS) return { error: COPY.errMaxDest };
  return { next: [...selected, group.id] };
}

/** Drops destinations that became invalid after the post type changed. */
export function validDestinationsFor(type: ComposerDraft["type"], ids: string[], groups: Group[]) {
  return ids.filter((id) => {
    const group = groups.find((item) => item.id === id);
    if (!group) return false;
    if (group.kind === "feed") return true;
    return type === "market" ? group.kind === "market" : group.kind === "community";
  });
}
