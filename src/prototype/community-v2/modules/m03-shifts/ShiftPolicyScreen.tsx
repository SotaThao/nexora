import { useNavigate } from "react-router-dom";
import { Modal } from "../../components";
import { AdminView } from "../m00-admin/AdminScreen";
import { PolicyForm } from "./PolicyForm";
import { RoleGate, SHIFT_PATHS } from "./ShiftShared";

/** S03-09 — the policy modal, opened over the admin workspace. */
export function ShiftPolicyScreen() {
  const navigate = useNavigate();
  const close = () => navigate(SHIFT_PATHS.admin);
  return (
    <RoleGate need="admin">
      <AdminView title="Chế độ admin" initialTab="policy" />
      <Modal open onClose={close} title="⚙️ Chính sách (Admin NEXORA) — SỐ MẪU">
        <PolicyForm onSaved={close} />
      </Modal>
    </RoleGate>
  );
}
