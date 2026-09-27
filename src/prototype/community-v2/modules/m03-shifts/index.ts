import type { ScreenRegistry } from "../../screenRegistry";
import { AvailableTechsScreen } from "./AvailableTechsScreen";
import { CancelShiftScreen } from "./CancelShiftScreen";
import { MyShiftsScreen } from "./MyShiftsScreen";
import { ApplyShiftScreen, NearbyShiftsScreen } from "./NearbyShiftsScreen";
import { PostShiftScreen } from "./PostShiftScreen";
import { ShareStaffScreen } from "./ShareStaffScreen";
import { ShiftDetailScreen } from "./ShiftDetailScreen";
import { ShiftPolicyScreen } from "./ShiftPolicyScreen";
import { withShiftToasts } from "./ShiftShared";

export { ShiftChatCard } from "./ShiftChatCard";

export const screens: ScreenRegistry = {
  "S03-01": withShiftToasts(NearbyShiftsScreen),
  "S03-02": withShiftToasts(ApplyShiftScreen),
  "S03-03": withShiftToasts(MyShiftsScreen),
  "S03-04": withShiftToasts(CancelShiftScreen),
  "S03-05": withShiftToasts(PostShiftScreen),
  "S03-06": withShiftToasts(ShiftDetailScreen),
  "S03-07": withShiftToasts(AvailableTechsScreen),
  "S03-08": withShiftToasts(ShareStaffScreen),
  "S03-09": withShiftToasts(ShiftPolicyScreen),
};
