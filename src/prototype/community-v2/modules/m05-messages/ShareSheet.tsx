import { Copy, MessageSquareText, Send, Smartphone } from "lucide-react";
import { Sheet } from "../../components";
import { useToast } from "./toast";

const TARGETS = [
  { id: "zalo", label: "Zalo", icon: Send },
  { id: "messenger", label: "Messenger", icon: MessageSquareText },
  { id: "sms", label: "SMS", icon: Smartphone },
  { id: "copy", label: "Sao chép link", icon: Copy },
];

type Props = { open: boolean; onClose: () => void; title: string; link: string };

export function ShareSheet({ open, onClose, title, link }: Props) {
  const toast = useToast();
  const share = (id: string, label: string) => {
    if (id === "copy") {
      try {
        void navigator.clipboard?.writeText(`https://${link}`);
      } catch {
        /* clipboard is optional in the prototype */
      }
      toast("Đã sao chép link", "success");
    } else {
      toast(`Đã mở ${label} để chia sẻ (mô phỏng)`);
    }
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className={[
        "mb-4 truncate rounded-lg bg-nexoraSurfaceMuted px-3 py-2 font-mono text-sm",
        "text-nexoraBrand",
      ].join(" ")}>{link}</p>
      <div className="grid grid-cols-4 gap-2">
        {TARGETS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => share(id, label)}
            className={[
              "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border",
              "border-nexoraBorder px-1 text-xs font-semibold hover:bg-nexoraSurfaceMuted",
            ].join(" ")}>
            <span className={[
              "grid size-10 place-items-center rounded-full bg-nexoraBrandSoft text-nexoraBrand",
            ].join(" ")}><Icon size={18} /></span>
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
