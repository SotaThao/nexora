import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components";
import { useToast } from "./toast";
import { getState, useStore } from "../../store";
import type { Message, Thread } from "../../store/types";
import {
  SYSTEM_ID, addReaction, joinPublicGroup, markRead, markSeen, openOrCreateDm, pinMessage, sendMessage, startCall,
  startGroupCall,
} from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { AttachSheet, type Attachment } from "./AttachSheet";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { GroupCallBanner, MembersPanel, MembersSheet, PinnedBar } from "./GroupParts";
import { MessageBubble } from "./MessageBubble";
import { otherId, paths, threadTitle, usePeople, useViewerId } from "./lib";

const AUTO_REPLIES = ["Dạ ok nha 👍", "Để em xem lịch rồi báo lại liền nha.", "Cảm ơn nhiều nha!"];
const TRANSCRIPTS = [
  "Dạ em tới liền, khoảng 15 phút nữa nha.",
  "Chiều nay em làm được tới 7 giờ, chị xếp khách giúp em.",
];

export const DRAFT_ID = "draft";

function sameRun(a: Message | undefined, b: Message | undefined) {
  if (!a || !b || a.senderId !== b.senderId) return false;
  if (a.kind === "system" || a.kind === "call" || b.kind === "system" || b.kind === "call") return false;
  return Math.abs(new Date(b.at).getTime() - new Date(a.at).getTime()) < 5 * 60 * 1000;
}

function hitCount(messages: Message[], term: string) {
  if (!term) return 0;
  const t = term.toLowerCase();
  return messages.filter((msg) => `${msg.body} ${msg.voiceTranscript ?? ""}`.toLowerCase().includes(t)).length;
}

type Props = { thread: Thread; onBack: () => void; draftTo?: string };

export function ChatRoom({ thread, onBack, draftTo }: Props) {
  const viewerId = useViewerId();
  const people = usePeople();
  const scamWarnings = useStore((s) => s.privacy.scamWarnings);
  const { requireAccount } = useCommunityGate();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<Message>();
  const [menuId, setMenuId] = useState<string>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const group = thread.kind === "group";
  const pendingOut = Boolean(thread.request && thread.request.fromId === viewerId);
  const peer = otherId(thread, viewerId);
  const title = draftTo
    ? threadTitle({ ...thread, participantIds: [draftTo] }, people, null)
    : threadTitle(thread, people, viewerId);
  const count = thread.messages.length;

  useEffect(() => {
    if (viewerId && thread.id !== DRAFT_ID) markRead(thread.id, viewerId);
  }, [thread.id, viewerId, count]);
  useLayoutEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [thread.id, count, typing]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    setReplyTo(undefined);
    setSearchOpen(false);
    setTerm("");
    setTyping(false);
  }, [thread.id]);

  const fakeReply = (threadId: string, me: string) => {
    const target = getState().threads.find((t) => t.id === threadId);
    if (!target || target.kind !== "dm" || target.request) return;
    const other = otherId(target, me);
    // One fake reply per burst of messages: restart the pending timers on every send.
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    timers.current.push(window.setTimeout(() => markSeen(threadId, me), 700));
    timers.current.push(window.setTimeout(() => setTyping(true), 900));
    timers.current.push(
      window.setTimeout(() => {
        setTyping(false);
        const latest = getState().threads.find((t) => t.id === threadId);
        const own = latest?.messages.filter((msg) => msg.senderId === me).length ?? 0;
        sendMessage(threadId, other, { body: AUTO_REPLIES[own % AUTO_REPLIES.length] });
      }, 2600),
    );
  };

  const deliver = (content: Partial<Message> & { body: string }) => {
    const run = () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      let threadId = thread.id;
      if (draftTo) threadId = openOrCreateDm(me, draftTo);
      else if (group && thread.groupType === "public" && !thread.participantIds.includes(me)) {
        joinPublicGroup(threadId, me);
      }
      sendMessage(threadId, me, content);
      if (threadId !== thread.id) navigate(paths.thread(threadId), { replace: true });
      else fakeReply(threadId, me);
    };
    requireAccount("Gửi tin", run);
  };

  const sendText = () => {
    const body = draft.trim();
    if (!body) return;
    deliver({ body, quoteId: replyTo?.id });
    setDraft("");
    setReplyTo(undefined);
  };

  const sendVoice = (seconds: number) =>
    requireAccount("gửi ghi âm", () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      const threadId = draftTo ? openOrCreateDm(me, draftTo) : thread.id;
      sendMessage(threadId, me, {
        body: "Tin thoại",
        kind: "voice",
        voiceSeconds: seconds,
        voiceTranscript: TRANSCRIPTS[seconds % TRANSCRIPTS.length],
      });
      if (threadId !== thread.id) navigate(paths.thread(threadId), { replace: true });
    });

  const attach = (a: Attachment) => {
    if (a.kind === "image") deliver({ body: a.label, kind: "image", imageLabel: a.label });
    if (a.kind === "shift") deliver({ body: a.title, kind: "shift", sharedShiftId: a.shiftId });
    if (a.kind === "location") deliver({ body: a.name, kind: "location", locationSalonId: a.salonId });
  };

  const call = (video: boolean) =>
    requireAccount(group ? "gọi nhóm" : "gọi thoại/video", () => {
      if (group && thread.groupCall) {
        navigate(paths.groupCall(thread.groupCall.callId));
        return;
      }
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      if (group) {
        navigate(paths.groupCall(startGroupCall(thread.id, me, video ? "video" : "voice")));
        return;
      }
      const id = startCall({ peerIds: [peer], type: video ? "video" : "voice", threadId: thread.id });
      navigate(paths.call(id, video));
    });

  const react = (messageId: string, emoji: string) => {
    if (draftTo) toast("Gửi tin trước để thả cảm xúc");
    else addReaction(thread.id, messageId, emoji);
  };

  const pin = (messageId: string) => {
    pinMessage(thread.id, messageId);
    toast("📌 Đã ghim tin trong nhóm", "success");
  };

  const callBack = (message: Message) => {
    const type = message.call?.type ?? "voice";
    call(type === "video");
  };

  const needsJoin = thread.groupType === "public" && !(viewerId && thread.participantIds.includes(viewerId));
  const join = () =>
    requireAccount("tham gia nhóm", () => {
      joinPublicGroup(thread.id, getState().currentPersonId ?? viewerId ?? "jessica");
    });

  const subtitle = group
    ? `${thread.participantIds.length} thành viên${thread.groupType === "pos" ? " · nhân viên tiệm" : ""}`
    : pendingOut
      ? "Chưa chấp nhận lời mời"
      : draftTo
        ? "Tạo tài khoản để gửi tin"
        : "Đang hoạt động";
  const visible = thread.messages;
  const lastOwn = [...visible]
    .reverse()
    .find((msg) => msg.senderId === viewerId && msg.kind !== "system" && msg.kind !== "call");

  return (
    <div className="flex h-full min-h-0 flex-1">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <ChatHeader
          thread={thread}
          title={title}
          subtitle={subtitle}
          typing={typing}
          canCall={!pendingOut && !draftTo}
          searchOpen={searchOpen}
          term={term}
          hits={hitCount(visible, term)}
          onBack={onBack}
          onSearch={(open) => {
            setSearchOpen(open);
            if (!open) setTerm("");
          }}
          onTerm={setTerm}
          onCall={call}
          onMembers={() => setMembersOpen(true)}
        />
        {group && <PinnedBar thread={thread} />}
        {group && <GroupCallBanner thread={thread} />}
        <div ref={scroller} className={[
          "min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-nexoraCanvas px-3 py-4 lg:px-5",
        ].join(" ")}>
          {visible.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              own={message.senderId === viewerId && message.senderId !== SYSTEM_ID}
              people={people}
              quote={message.quoteId ? visible.find((msg) => msg.id === message.quoteId) : undefined}
              firstOfRun={!sameRun(visible[index - 1], message)}
              lastOfRun={!sameRun(message, visible[index + 1])}
              isGroup={group}
              term={term.trim()}
              scamWarnings={scamWarnings}
              menuOpen={menuId === message.id}
              statusLine={
                message.id === lastOwn?.id ? (
                  <span className={message.seen ? "font-semibold text-nexoraBrand" : ""}>
                    {message.seen ? "✓✓ Đã xem" : "✓ Đã gửi"}
                  </span>
                ) : undefined
              }
              onMenu={(open) => setMenuId(open ? message.id : undefined)}
              onReply={() => setReplyTo(message)}
              onReact={(emoji) =>
                requireAccount("thả cảm xúc", () => react(message.id, emoji))
              }
              onPin={group ? () => pin(message.id) : undefined}
              onCallBack={() => callBack(message)}
            />
          ))}
          {typing && (
            <div className="mt-3 flex items-center gap-2 pl-10" aria-live="polite">
              <span className="flex gap-1 rounded-2xl bg-nexoraSurfaceMuted px-3.5 py-3">
                {[0, 150, 300].map((delay) => (
                  <span key={delay} className={[
                    "size-1.5 animate-bounce rounded-full bg-nexoraSubtle",
                  ].join(" ")} style={{ animationDelay: `${delay}ms` }} />
                ))}
              </span>
              <span className="text-xs text-nexoraSubtle">đang nhập…</span>
            </div>
          )}
        </div>
        {needsJoin ? (
          <footer className="flex items-center gap-3 border-t border-nexoraBorder bg-white px-4 py-3">
            <p className={[
              "flex-1 text-sm text-nexoraMuted",
            ].join(" ")}>
              Tham gia nhóm để nhắn tin cùng {thread.memberCount?.toLocaleString("vi-VN")} thành viên.
            </p>
            <Button onClick={join}>Tham gia</Button>
          </footer>
        ) : (
        <Composer
          people={people}
          replyTo={replyTo}
          draft={draft}
          onDraft={setDraft}
          onCancelReply={() => setReplyTo(undefined)}
          onSend={sendText}
          onAttach={() => setAttachOpen(true)}
          onVoice={sendVoice}
        />
        )}
      </section>
      {group && <MembersPanel thread={thread} />}
      {group && <MembersSheet thread={thread} open={membersOpen} onClose={() => setMembersOpen(false)} />}
      <AttachSheet open={attachOpen} onClose={() => setAttachOpen(false)} onPick={attach} />
    </div>
  );
}
