import type React from "react";
import type { ScreenDefinition } from "./store/types";
export type ScreenComponent = React.ComponentType<{ screen: ScreenDefinition }>;
export type ScreenRegistry = Partial<Record<string, ScreenComponent>>;
