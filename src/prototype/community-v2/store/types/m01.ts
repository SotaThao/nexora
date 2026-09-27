// M01 · Bảng tin, Nhóm & Chợ — domain types (owned by stream L1a).

export type PostType = "showcase" | "tip" | "question" | "market" | "official";
export type GroupKind = "feed" | "community" | "market";
export type GroupIndustry = "Nail" | "Spa & Massage" | "Tóc & Salon" | "Mi & Chân mày";

export type Group = {
  id: string;
  name: string;
  kind: GroupKind;
  industry: GroupIndustry;
  members: number;
  rules: string[];
  description: string;
  /** Person ids (or "guest") that joined. Bảng tin chung is implicitly joined by everyone. */
  joinedBy: string[];
  createdBy?: string;
};

export type MarketInfo = { category: string; price: number; area: string };

export type Post = {
  id: string;
  /** Person id from store/seed/m00.ts; OFFICIAL posts use OFFICIAL_AUTHOR_ID ("nexora"). */
  authorId: string;
  type: PostType;
  body: string;
  /** Group ids where the post appears (max 3). "feed" = Bảng tin chung. */
  destinations: string[];
  createdAt: string;
  /** Base like count from seed; viewer likes live in likedBy. */
  likes: number;
  likedBy: string[];
  /** One entry per image placeholder (0–6); the number is the gradient tone seed. */
  images: number[];
  market?: MarketInfo;
  boostedUntil?: string | null;
  boostDays?: number;
  hiddenFor: string[];
  deleted?: boolean;
};

/** Legacy M01 listing type — market listings now live in `posts` (type "market"). Kept for DemoState shape. */
export type MarketItem = { id: string; postId?: string };

export type ComposerPlan = "free" | "featured";
export type BoostDays = 3 | 7 | 14;

export type ComposerDraft = {
  type: Exclude<PostType, "official">;
  body: string;
  category: string;
  price: string;
  area: string;
  images: number[];
  imageRights: boolean;
  /** Body the user was already warned about (phone number); a 2nd press with the same body passes. */
  warnedBody: string | null;
  step1Passed: boolean;
  destinations: string[];
  destinationsTouched: boolean;
  plan: ComposerPlan;
  boostDays: BoostDays;
  payMethod: "wallet" | "card";
};

export type M01State = {
  groups: Group[];
  posts: Post[];
  marketItems: MarketItem[];
  composerDraft?: ComposerDraft | null;
};
