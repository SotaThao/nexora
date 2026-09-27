import { useParams } from "react-router-dom";
import { useStore } from "../../store";
import { MyShiftsView } from "./MyShiftsScreen";
import { ShiftDetailView } from "./ShiftDetailScreen";
import { RoleGate } from "./ShiftShared";

/**
 * S03-04 — cancel modal. Tech: over "Ca của tôi" (thợ huỷ). Owner: over the POS shift detail (tiệm huỷ).
 * Both compute the matrix ai huỷ × còn ≥/< N giờ from the policy snapshot.
 */
export function CancelShiftScreen() {
  const { shiftId } = useParams();
  const role = useStore((state) => state.role);
  if (role === "owner") return <ShiftDetailView title="POS · Chi tiết ca & ứng viên" shiftId={shiftId} cancelOpen />;
  return (
    <RoleGate need="tech">
      <MyShiftsView title="Ca của tôi" cancelShiftId={shiftId} />
    </RoleGate>
  );
}
