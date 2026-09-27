import { type ReactNode, useRef, useState } from "react";
import { Reply, SmilePlus } from "lucide-react";
import { Avatar } from "../../components";
import type { Message, Person } from "../../store/types";
import { CallBubble, ImageBody, LocationCard, ShiftCard, VoiceBody } from "./MessageParts";
import { REACTIONS, SCAM_PATTERN, SCAM_WARNING, clock, nameOf } from "./lib";

export function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="rounded bg-nexoraWarning/60 px-0.5 text-nexoraText">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

type Props = {
  message: Message;
  own: boolean;
  people: Person[];
  quote?: Message;
  firstOfRun: boolean;
  lastOfRun: boolean;
  isGroup: boolean;
  term: string;
  scamWarnings: boolean;
  menuOpen: boolean;
  statusLine?: ReactNode;
  onMenu: (open: boolean) => void;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onPin?: () => void;
  onCallBack: () => void;
};

function groupReactions(list: string[]) {
  const counts = new Map<string, number>();
  list.forEach((emoji) => counts.set(emoji, (counts.get(emoji) ?? 0) + 1));
  return [...counts.entries()];
}

function Menu({ own, onReact, onReply, onPin, onClose }: {
  own: boolean; onReact: (e: string) => void; onReply: () => void; onPin?: () => void; onClose: () => void;
}) {
  return (
    <>
      <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-10 cursor-default" onClick={onClose} />
      <div
        role="menu"
        className={`absolute bottom-full z-20 mb-1 flex items-center gap-0.5 rounded-full border ${
          "border-nexoraBorder bg-white p-1 shadow-premium"} ${
          own ? "right-0" : "left-0"
        }`}
      >
        {REACTIONS.map((emoji) => (
          <button key={emoji} type="button" role="menuitem" aria-label={`Thả ${emoji}`} onClick={() => onReact(emoji)}
            className={[
              "grid size-9 place-items-center rounded-full text-xl transition lg:size-10 hover:scale-110",
              "hover:bg-nexoraSurfaceMuted",
            ].join(" ")}>
            {emoji}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-nexoraBorder" />
        <button type="button" role="menuitem" onClick={onReply} aria-label="Trả lời"
          className={[
            "grid size-9 place-items-center rounded-full text-nexoraMuted lg:size-10",
            "hover:bg-nexoraSurfaceMuted",
          ].join(" ")}>
          <Reply size={18} />
        </button>
        {onPin && (
          <button type="button" role="menuitem" onClick={onPin} aria-label="Ghim tin"
            className="grid size-9 place-items-center rounded-full lg:size-10 hover:bg-nexoraSurfaceMuted">📌</button>
        )}
      </div>
    </>
  );
}

export function MessageBubble(props: Props) {
  const { message, own, people, quote, firstOfRun, lastOfRun, isGroup, term, menuOpen, onMenu } = props;
  const [translated, setTranslated] = useState(false);
  const press = useRef<number | undefined>(undefined);
  const sender = nameOf(people, message.senderId);

  if (message.kind === "system") {
    return (
      <p className={[
        "mx-auto my-2 max-w-md rounded-full bg-nexoraSurfaceMuted px-4 py-1.5 text-center text-xs",
        "text-nexoraMuted",
      ].join(" ")}>
        {message.body}
      </p>
    );
  }
  if (message.kind === "call") {
    return (
      <div className="my-2 flex justify-center">
        <CallBubble message={message} onCallBack={props.onCallBack} />
      </div>
    );
  }

  const quoteTone = own ? "border-white/60 text-white/85" : "border-nexoraBrand text-nexoraMuted";
  const card = message.kind === "shift" || message.kind === "location" || message.kind === "image";
  const risky = !own && props.scamWarnings && SCAM_PATTERN.test(message.body);
  const radius = own
    ? `rounded-2xl ${firstOfRun ? "" : "rounded-tr-md"} ${lastOfRun ? "" : "rounded-br-md"}`
    : `rounded-2xl ${firstOfRun ? "" : "rounded-tl-md"} ${lastOfRun ? "" : "rounded-bl-md"}`;
  const startPress = () => {
    press.current = window.setTimeout(() => onMenu(true), 450);
  };
  const cancelPress = () => window.clearTimeout(press.current);

  return (
    <div className={`group flex gap-2 ${own ? "justify-end" : "justify-start"} ${firstOfRun ? "mt-3" : "mt-0.5"}`}>
      {!own && (
        <span className="w-8 shrink-0 self-end">{lastOfRun && <Avatar name={sender} className="size-8 text-[11px]" />
          }
        </span>
      )}
      <div className={`flex max-w-[78%] flex-col lg:max-w-[70%] ${own ? "items-end" : "items-start"}`}>
        {isGroup && !own && firstOfRun && <span className={[
          "mb-0.5 px-1 text-xs font-semibold text-nexoraMuted",
        ].join(" ")}>{sender}</span>}
        <div className="relative flex items-center gap-1">
          {own && (
            <button type="button" aria-label="Thả cảm xúc" onClick={() => onMenu(true)}
              className={[
                "hidden size-8 place-items-center rounded-full text-nexoraSubtle opacity-0",
                "hover:bg-nexoraSurfaceMuted group-hover:opacity-100 lg:grid",
              ].join(" ")}>
              <SmilePlus size={16} />
            </button>
          )}
          <div
            onPointerDown={startPress}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onContextMenu={(event) => {
              event.preventDefault();
              onMenu(true);
            }}
            className={`select-none text-sm leading-relaxed ${card ? "" : `${radius} px-3.5 py-2`} ${
              card ? "" : own ? "bg-nexoraBrand text-white" : "bg-nexoraSurfaceMuted text-nexoraText"
            }`}
          >
            {quote && (
              <div className={`mb-1.5 border-l-2 pl-2 text-xs ${quoteTone}`}>
                <b className="block">{nameOf(people, quote.senderId)}</b>
                <span className="line-clamp-2">{quote.body || "Tin đính kèm"}</span>
              </div>
            )}
            {message.kind === "voice" && <VoiceBody message={message} own={own} />}
            {message.kind === "shift" && message.sharedShiftId && <ShiftCard shiftId={message.sharedShiftId} />}
            {message.kind === "location" && message.locationSalonId && (
              <LocationCard salonId={message.locationSalonId} />
            )}
            {message.kind === "image" && <ImageBody label={message.imageLabel} />}
            {(!message.kind || message.kind === "text") && <Highlight text={message.body} term={term} />}
          </div>
          {!own && (
            <button type="button" aria-label="Thả cảm xúc" onClick={() => onMenu(true)}
              className={[
                "hidden size-8 place-items-center rounded-full text-nexoraSubtle opacity-0",
                "hover:bg-nexoraSurfaceMuted group-hover:opacity-100 lg:grid",
              ].join(" ")}>
              <SmilePlus size={16} />
            </button>
          )}
          {menuOpen && (
            <Menu own={own} onReact={(emoji) => { props.onReact(emoji); onMenu(false); }}
              onReply={() => { props.onReply(); onMenu(false); }}
              onPin={props.onPin && (() => { props.onPin?.(); onMenu(false); })} onClose={() => onMenu(false)} />
          )}
        </div>
        {message.voiceTranscript && (
          <p className="mt-1 max-w-xs rounded-lg bg-nexoraBrandSoft/60 px-2.5 py-1.5 text-xs text-nexoraMuted">
            📝 AI chép lời: <Highlight text={message.voiceTranscript} term={term} />
          </p>
        )}
        {message.reactions && message.reactions.length > 0 && (
          <div className="-mt-1 flex gap-1">
            {groupReactions(message.reactions).map(([emoji, count]) => (
              <span key={emoji} className="rounded-full border border-nexoraBorder bg-white px-1.5 text-xs shadow-sm">
                {emoji}{count > 1 && <span className="ml-0.5 text-nexoraMuted">{count}</span>}
              </span>
            ))}
          </div>
        )}
        {translated && message.translation && (
          <p className={[
            "mt-1 max-w-xs rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 text-xs",
            "text-nexoraText",
          ].join(" ")}>
            🌐 Bản dịch: {message.translation}
          </p>
        )}
        {risky && (
          <p role="alert" className={[
            "mt-1.5 max-w-sm rounded-lg border border-nexoraWarning/50 bg-nexoraWarning/10 px-3 py-2",
            "text-xs leading-relaxed text-nexoraText",
          ].join(" ")}>
            {SCAM_WARNING}
          </p>
        )}
        {(lastOfRun || message.translation) && (
          <span className="mt-0.5 flex items-center gap-2 px-1 text-[11px] text-nexoraSubtle">
            {lastOfRun && clock(message.at)}
            {message.translation && !own && (
              <button
                type="button"
                onClick={() => setTranslated(!translated)}
                className="min-h-8 font-semibold text-nexoraBrand">
                {translated ? "Ẩn bản dịch" : "🌐 Dịch"}
              </button>
            )}
            {props.statusLine}
          </span>
        )}
      </div>
    </div>
  );
}
