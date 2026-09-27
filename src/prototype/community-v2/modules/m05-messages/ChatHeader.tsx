import { ArrowLeft, Lock, Phone, Search, UsersRound, Video, X } from "lucide-react";
import { Avatar } from "../../components";
import type { Thread } from "../../store/types";

type Props = {
  thread: Thread;
  title: string;
  subtitle: string;
  typing: boolean;
  canCall: boolean;
  searchOpen: boolean;
  term: string;
  hits: number;
  onBack: () => void;
  onSearch: (open: boolean) => void;
  onTerm: (term: string) => void;
  onCall: (video: boolean) => void;
  onMembers: () => void;
};

const iconBtn = "grid size-11 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted";

export function ChatHeader(props: Props) {
  const { thread, title, subtitle, typing, canCall, searchOpen } = props;
  const group = thread.kind === "group";
  return (
    <header className="border-b border-nexoraBorder bg-white">
      <div className="flex min-h-16 items-center gap-2 px-2 lg:px-4">
        <button type="button" aria-label="Quay lại hộp thư" onClick={props.onBack}
          className={`${iconBtn} lg:hidden`}>
          <ArrowLeft size={20} />
        </button>
        {group ? (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-nexoraSidebar text-white">
            <UsersRound size={18} />
          </span>
        ) : (
          <Avatar name={title} />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            <span className="truncate font-bold">{title}</span>
            {thread.groupType === "pos" && (
              <span className="rounded bg-nexoraWarning/15 px-1.5 text-[10px] font-bold text-nexoraText">POS</span>
            )}
          </p>
          <p className={`truncate text-xs ${typing ? "font-semibold text-nexoraBrand" : "text-nexoraSubtle"}`}>
            {typing ? "đang nhập…" : subtitle}
          </p>
        </div>
        <button
          type="button"
          aria-label="Tìm trong chat"
          onClick={() => props.onSearch(!searchOpen)}
          className={iconBtn}>
          <Search size={19} />
        </button>
        {canCall && (
          <>
            <button
              type="button"
              aria-label={group ? "Gọi nhóm" : "Gọi thoại"}
              onClick={() => props.onCall(false)}
              className={iconBtn}>
              <Phone size={19} />
            </button>
            <button type="button" aria-label={group ? "Video nhóm" : "Gọi video"} onClick={() => props.onCall(true)}
              className={`${iconBtn} ${group ? "hidden sm:grid" : ""}`}>
              <Video size={20} />
            </button>
          </>
        )}
        {group && (
          <button type="button" aria-label="Thành viên" onClick={props.onMembers} className={`${iconBtn} xl:hidden`}>
            <UsersRound size={19} />
          </button>
        )}
      </div>
      {searchOpen && (
        <div className="flex items-center gap-2 border-t border-nexoraRule px-3 py-2">
          <Search size={16} className="shrink-0 text-nexoraSubtle" />
          <input
            autoFocus
            value={props.term}
            onChange={(event) => props.onTerm(event.target.value)}
            placeholder="Tìm trong cuộc trò chuyện"
            aria-label="Tìm trong cuộc trò chuyện"
            className="min-h-10 min-w-0 flex-1 bg-transparent text-base outline-none lg:text-sm"
          />
          {props.term && (
            <span className={[
              "shrink-0 rounded-full bg-nexoraBrandSoft px-2.5 py-1 text-xs font-semibold",
              "text-nexoraBrand",
            ].join(" ")}>
              {props.hits} kết quả
            </span>
          )}
          <button type="button" aria-label="Đóng tìm kiếm" onClick={() => props.onSearch(false)} className={[
            "grid size-10 place-items-center rounded-full hover:bg-nexoraSurfaceMuted",
          ].join(" ")}>
            <X size={16} />
          </button>
        </div>
      )}
      {!group && !thread.request && (
        <p className={[
          "flex items-center justify-center gap-1 border-t border-nexoraRule py-1 text-[11px]",
          "text-nexoraSubtle",
        ].join(" ")}>
          <Lock size={11} /> Tin nhắn & cuộc gọi được mã hoá
        </p>
      )}
    </header>
  );
}
