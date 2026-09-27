import { useEffect, useState } from "react";
import { Mic, Paperclip, Send, Trash2, X } from "lucide-react";
import type { Message, Person } from "../../store/types";
import { duration, nameOf, useNow } from "./lib";

type Props = {
  people: Person[];
  replyTo?: Message;
  draft: string;
  onDraft: (text: string) => void;
  onCancelReply: () => void;
  onSend: () => void;
  onAttach: () => void;
  onVoice: (seconds: number) => void;
};

function Recorder({ onCancel, onSend }: { onCancel: () => void; onSend: (seconds: number) => void }) {
  const [startedAt] = useState(() => Date.now());
  const now = useNow(true, 250);
  const seconds = Math.floor((now - startedAt) / 1000);
  return (
    <div className="flex min-h-14 items-center gap-3" aria-live="polite">
      <button type="button" onClick={onCancel} aria-label="Huỷ ghi âm"
        className="grid size-11 place-items-center rounded-full text-nexoraDanger hover:bg-nexoraDanger/10">
        <Trash2 size={19} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-nexoraDanger/10 px-4 py-2.5">
        <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-nexoraDanger" />
        <span className="font-mono text-sm tabular-nums text-nexoraDanger">{duration(seconds)}</span>
        <span className="truncate text-sm text-nexoraMuted">Đang ghi âm · AI sẽ chép lời</span>
      </div>
      <button type="button" onClick={() => onSend(Math.max(seconds, 2))} aria-label="Gửi tin thoại"
        className="grid size-11 place-items-center rounded-full bg-nexoraBrand text-white hover:bg-nexoraBrandDark">
        <Send size={18} />
      </button>
    </div>
  );
}

export function Composer({ people, replyTo, draft, onDraft, onCancelReply, onSend, onAttach, onVoice }: Props) {
  const [recording, setRecording] = useState(false);
  useEffect(() => {
    if (replyTo) document.getElementById("m05-composer")?.focus();
  }, [replyTo]);
  return (
    <footer className={[
      "border-t border-nexoraBorder bg-white px-2 py-2",
      "pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:px-4",
    ].join(" ")}>
      {replyTo && !recording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-nexoraSurfaceMuted px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-nexoraBrand pl-2 text-xs">
            <b className="block text-nexoraBrand">Trả lời {nameOf(people, replyTo.senderId)}</b>
            <span className="block truncate text-nexoraMuted">{replyTo.body || "Tin đính kèm"}</span>
          </div>
          <button type="button" aria-label="Bỏ trả lời" onClick={onCancelReply}
            className="grid size-9 place-items-center rounded-full text-nexoraMuted hover:bg-white">
            <X size={16} />
          </button>
        </div>
      )}
      {recording ? (
        <Recorder
          onCancel={() => setRecording(false)}
          onSend={(seconds) => {
            setRecording(false);
            onVoice(seconds);
          }}
        />
      ) : (
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Đính kèm" onClick={onAttach}
            className={[
              "grid size-11 shrink-0 place-items-center rounded-full text-nexoraMuted",
              "hover:bg-nexoraSurfaceMuted",
            ].join(" ")}>
            <Paperclip size={19} />
          </button>
          <input
            id="m05-composer"
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder="Nhắn tin…"
            aria-label="Nội dung tin nhắn"
            className={[
              "min-h-11 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-4",
              "text-base outline-none focus:border-nexoraBrand focus:bg-white lg:text-sm",
            ].join(" ")}
          />
          {draft.trim() ? (
            <button type="button" aria-label="Gửi" onClick={onSend}
              className={[
                "grid size-11 shrink-0 place-items-center rounded-full bg-nexoraBrand text-white",
                "hover:bg-nexoraBrandDark",
              ].join(" ")}>
              <Send size={18} />
            </button>
          ) : (
            <button type="button" aria-label="Ghi âm" onClick={() => setRecording(true)}
              className={[
                "grid size-11 shrink-0 place-items-center rounded-full text-nexoraMuted",
                "hover:bg-nexoraSurfaceMuted",
              ].join(" ")}>
              <Mic size={19} />
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
