import { Button } from "../../components";
import { hasPhone } from "./logic";

/** Doc 02: warn (never block) when a US phone number is in the post while "Ẩn số điện thoại" is on. */
export function PhoneWarning({ texts, hidePhone, onStrip }:
  { texts: string[]; hidePhone: boolean; onStrip: () => void }) {
  if (!hidePhone || !texts.some(hasPhone)) return null;
  return (
    <div role="status" className="space-y-2 rounded-lg border border-nexoraWarning/50 bg-nexoraWarning/10 p-3">
      <p className="text-sm font-medium text-nexoraText">
        ⚠️ Bài có số điện thoại trong nội dung. Bạn đang bật “Ẩn số điện thoại” — nên xoá để tiệm liên hệ qua lời mời
        trong app.
      </p>
      <Button variant="secondary" className="bg-white" onClick={onStrip}>
        Xoá số khỏi bài
      </Button>
    </div>
  );
}
