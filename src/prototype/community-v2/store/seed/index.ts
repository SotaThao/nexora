import { calls, blockedUserIds, threads } from "./m05";
import { coupons, customers, industries, promotions, redeemHistory } from "./m04";
import { shiftApplications, shiftPolicy, shifts } from "./m03";
import { applications, invites, jobPosts, techProfiles } from "./m02";
import { groups, marketItems, posts } from "./m01";
import { people, privacy, salons } from "./m00";
import type { DemoState } from "../types";

export const DEMO_SEED: DemoState = { role: "tech", currentPersonId: "jessica", termsVersion: "1.0", consentVersion: "1.0", otpEnabled: false, whatsNewSeen: false, people, salons, groups, posts, marketItems, jobPosts, techProfiles, invites, applications, shifts, shiftApplications, promotions, coupons, customers, threads, calls, privacy, industries, shiftPolicy, redeemHistory, blockedUserIds, consentRecords: [{ version: "1.0", at: "2026-09-20T10:00:00Z", checks: ["18+", "terms"] }] };
export function cloneSeed(): DemoState { return JSON.parse(JSON.stringify(DEMO_SEED)) as DemoState; }
