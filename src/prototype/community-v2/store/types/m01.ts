export type Group = { id: string; name: string; members: number; kind: "community" | "market" | "public"; rules?: string[] };
export type Post = { id: string; authorId: string; type: string; body: string; groupId?: string; likes?: number; official?: boolean; boosted?: boolean };
export type MarketItem = { id: string; title: string; price: number; city: string; sellerId: string; category?: string; area?: string; likes?: number };
export type M01State = { groups: Group[]; posts: Post[]; marketItems: MarketItem[] };
