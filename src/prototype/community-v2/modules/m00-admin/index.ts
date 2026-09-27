import type { ScreenRegistry } from "../../screenRegistry";
import { withShiftToasts } from "../m03-shifts/ShiftShared";
import { AdminScreen } from "./AdminScreen";

export const screens: ScreenRegistry = { "S00-07": withShiftToasts(AdminScreen) };
