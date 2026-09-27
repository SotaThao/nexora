import { useEffect, useRef, useState } from "react";
import { EyeOff, Flag, MoreHorizontal, Trash2 } from "lucide-react";
import { deletePost, hidePost } from "../../store/slices/m01";
import { COPY } from "./constants";
import { useToast } from "./toast";

type Props = { postId: string; own: boolean };

/** ⋯ menu — Báo cáo / Ẩn bài (no account needed) / Xoá bài (own post only). */
export function PostMenu({ postId, own }: Props) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const act = (run: () => void, message: string) => {
    setOpen(false);
    run();
    toast(message, "success");
  };

  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium hover:bg-nexoraSurfaceMuted";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Tuỳ chọn bài viết"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="grid size-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted"
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-nexoraBorder bg-white p-1.5
            shadow-premium"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => act(() => hidePost(postId), COPY.toastReport)}
          >
            <Flag size={17} className="text-nexoraDanger" /> Báo cáo bài
          </button>
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => act(() => hidePost(postId), "🙈 Đã ẩn bài")}
          >
            <EyeOff size={17} className="text-nexoraMuted" /> Ẩn bài
          </button>
          {own && (
            <button
              type="button"
              role="menuitem"
              className={`${item} text-nexoraDanger`}
              onClick={() => act(() => deletePost(postId), "🗑 Đã xoá bài")}
            >
              <Trash2 size={17} /> Xoá bài
            </button>
          )}
        </div>
      )}
    </div>
  );
}
