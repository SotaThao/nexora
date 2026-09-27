export * from "./types/m00";
export * from "./types/m01";
export * from "./types/m02";
export * from "./types/m03";
export * from "./types/m04";
export * from "./types/m05";

import type { M00State } from "./types/m00";
import type { M01State } from "./types/m01";
import type { M02State } from "./types/m02";
import type { M03State } from "./types/m03";
import type { M04State } from "./types/m04";
import type { M05State } from "./types/m05";

export type DemoState = M00State & M01State & M02State & M03State & M04State & M05State;
export type ScreenDefinition = { id: string; title: string; module: string; path: string; roles: import("./types/m00").CommunityRole[]; status: string };
