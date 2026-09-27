import { getState, storeActions } from "../index";
import type { ActiveCall, Call, CallOutcome, CallType, DemoState, Message, PrivacySettings, Thread } from "../types";

// M05 slice — only touches M05State keys (threads, calls, privacy, blockedUserIds,
// activeCall, incomingCall, nicknames). Other keys are read-only.

export const SYSTEM_ID = "system";
let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;
const nowIso = () => new Date().toISOString();
const without = (ids: string[], id: string) => ids.filter((item) => item !== id);

function patchThread(threadId: string, patch: (thread: Thread) => Thread) {
  storeActions.update((s) => ({ ...s, threads: s.threads.map((t) => (t.id === threadId ? patch(t) : t)) }));
}

function withMessage(thread: Thread, message: Message, readerIds: string[] = []): Thread {
  const unread = { ...(thread.unread ?? {}) };
  thread.participantIds
    .filter((id) => id !== message.senderId && !readerIds.includes(id) && message.senderId !== SYSTEM_ID)
    .forEach((id) => {
      unread[id] = (unread[id] ?? 0) + 1;
    });
  return { ...thread, messages: [...thread.messages, message], unread };
}

export function sendMessage(threadId: string, senderId: string, extra: Partial<Message> & { body: string }) {
  const message: Message = { id: uid("msg"), senderId, at: nowIso(), kind: "text", ...extra };
  patchThread(threadId, (t) => withMessage(t, message));
  return message.id;
}

export function addSystemMessage(threadId: string, body: string) {
  return sendMessage(threadId, SYSTEM_ID, { body, kind: "system" });
}

export function markRead(threadId: string, viewerId: string) {
  const thread = getState().threads.find((t) => t.id === threadId);
  if (!thread || !thread.unread?.[viewerId]) return;
  patchThread(threadId, (t) => ({ ...t, unread: { ...t.unread, [viewerId]: 0 } }));
}

export function markSeen(threadId: string, senderId: string) {
  patchThread(threadId, (t) => ({
    ...t,
    messages: t.messages.map((msg) => (msg.senderId === senderId ? { ...msg, seen: true } : msg)),
  }));
}

export function addReaction(threadId: string, messageId: string, emoji: string) {
  patchThread(threadId, (t) => ({
    ...t,
    messages: t.messages.map((msg) =>
      msg.id === messageId ? { ...msg, reactions: [...(msg.reactions ?? []), emoji] } : msg,
    ),
  }));
}

export function pinMessage(threadId: string, messageId: string) {
  patchThread(threadId, (t) => ({ ...t, pinnedMessageId: messageId }));
}

export function acceptRequest(threadId: string) {
  patchThread(threadId, (t) => ({ ...t, request: undefined }));
  addSystemMessage(threadId, "Đã kết nối");
}

export function blockAndReport(threadId: string) {
  const thread = getState().threads.find((t) => t.id === threadId);
  if (!thread?.request) return;
  const blocked = thread.request.fromId;
  storeActions.update((s) => ({
    ...s,
    blockedUserIds: s.blockedUserIds.includes(blocked) ? s.blockedUserIds : [...s.blockedUserIds, blocked],
    threads: s.threads.filter((t) => t.id !== threadId),
  }));
}

export function unblock(personId: string) {
  storeActions.update((s) => ({ ...s, blockedUserIds: s.blockedUserIds.filter((id) => id !== personId) }));
}

export function findDm(state: DemoState, a: string, b: string) {
  return state.threads.find((t) => t.kind === "dm" && t.participantIds.includes(a) && t.participantIds.includes(b));
}

/** Contract 3: open the existing DM or create one — as a message request when not connected. */
export function openOrCreateDm(viewerId: string, toId: string) {
  const state = getState();
  const existing = findDm(state, viewerId, toId);
  if (existing) return existing.id;
  const sharesGroup = state.threads.some(
    (t) => t.kind === "group" && t.participantIds.includes(viewerId) && t.participantIds.includes(toId),
  );
  const thread: Thread = {
    id: uid("dm"),
    kind: "dm",
    participantIds: [viewerId, toId],
    messages: [],
    request: sharesGroup ? undefined : { fromId: viewerId, toId },
  };
  storeActions.update((s) => ({ ...s, threads: [thread, ...s.threads] }));
  addSystemMessage(
    thread.id,
    sharesGroup
      ? "Đã kết nối · cùng nhóm chat"
      : "Tin đầu tiên sẽ vào \"Lời mời nhắn tin\" của họ cho tới khi họ chấp nhận",
  );
  return thread.id;
}

export function joinPublicGroup(threadId: string, viewerId: string) {
  patchThread(threadId, (t) =>
    t.participantIds.includes(viewerId)
      ? t
      : { ...t, participantIds: [...t.participantIds, viewerId], memberCount: (t.memberCount ?? 0) + 1 },
  );
  addSystemMessage(threadId, "Bạn đã tham gia · nhớ đọc nội quy nhóm");
}

export function setPrivacy(patch: Partial<PrivacySettings>) {
  storeActions.update((s) => ({ ...s, privacy: { ...s.privacy, ...patch } }));
}

export function setNickname(personId: string, nickname: string) {
  storeActions.update((s) => ({ ...s, nicknames: { ...(s.nicknames ?? {}), [personId]: nickname } }));
}

// ── Calls ──

type StartCall = { peerIds: string[]; type: CallType; threadId?: string; group?: boolean; connected?: boolean };

export function startCall({ peerIds, type, threadId, group, connected }: StartCall) {
  const active: ActiveCall = {
    id: uid("call"),
    peerIds,
    type,
    threadId,
    group,
    direction: "outgoing",
    phase: connected ? "connected" : "ringing",
    startedAt: connected ? Date.now() : undefined,
    minimized: false,
  };
  storeActions.update((s) => ({ ...s, activeCall: active }));
  return active.id;
}

export function connectCall() {
  storeActions.update((s) =>
    s.activeCall ? { ...s, activeCall: { ...s.activeCall, phase: "connected", startedAt: Date.now() } } : s,
  );
}

export function setCallMinimized(minimized: boolean) {
  storeActions.update((s) => (s.activeCall ? { ...s, activeCall: { ...s.activeCall, minimized } } : s));
}

export function setCallType(type: CallType) {
  storeActions.update((s) => (s.activeCall ? { ...s, activeCall: { ...s.activeCall, type } } : s));
}

function recordCall(ownerId: string, entry: Omit<Call, "id" | "ownerId" | "at">) {
  const record: Call = { id: uid("hist"), ownerId, at: nowIso(), ...entry };
  storeActions.update((s) => ({ ...s, calls: [record, ...s.calls] }));
}

function threadFor(viewerId: string, peerIds: string[], threadId?: string) {
  if (threadId) return threadId;
  return peerIds.length === 1 ? openOrCreateDm(viewerId, peerIds[0]) : undefined;
}

/** Ends the active call: history row + bubble in chat. Returns the thread id to go back to. */
export function endCall(viewerId: string) {
  const active = getState().activeCall;
  if (!active) return undefined;
  const connected = active.phase === "connected";
  const seconds = connected && active.startedAt ? Math.max(1, Math.round((Date.now() - active.startedAt) / 1000)) : 0;
  const outcome: CallOutcome = connected ? "answered" : "no-answer";
  const threadId = threadFor(viewerId, active.peerIds, active.threadId);
  recordCall(viewerId, {
    peerIds: active.peerIds,
    direction: active.direction,
    type: active.type,
    outcome,
    seconds,
    threadId,
    group: active.group,
  });
  if (threadId && !active.group) {
    const caller = active.direction === "outgoing" ? viewerId : active.peerIds[0];
    sendMessage(threadId, caller, { body: "", kind: "call", call: { type: active.type, outcome, seconds } });
    markRead(threadId, viewerId);
  }
  if (active.group && threadId) {
    patchThread(threadId, (t) =>
      t.groupCall
        ? { ...t, groupCall: { ...t.groupCall, participantIds: without(t.groupCall.participantIds, viewerId) } }
        : t,
    );
  }
  storeActions.update((s) => ({ ...s, activeCall: null }));
  return threadId;
}

export function receiveIncoming(fromId: string, type: CallType) {
  storeActions.update((s) => ({ ...s, incomingCall: { id: uid("in"), fromId, type } }));
}

export function answerIncoming(viewerId: string) {
  const incoming = getState().incomingCall;
  if (!incoming) return undefined;
  const threadId = openOrCreateDm(viewerId, incoming.fromId);
  const active: ActiveCall = {
    id: incoming.id,
    peerIds: [incoming.fromId],
    type: incoming.type,
    threadId,
    direction: "incoming",
    phase: "connected",
    startedAt: Date.now(),
    minimized: false,
  };
  storeActions.update((s) => ({ ...s, incomingCall: null, activeCall: active }));
  return active;
}

/** Decline (optionally with a quick reply): missed call in chat + red row in history. */
export function declineIncoming(viewerId: string, quickReply?: string) {
  const incoming = getState().incomingCall;
  if (!incoming) return undefined;
  const threadId = openOrCreateDm(viewerId, incoming.fromId);
  recordCall(viewerId, {
    peerIds: [incoming.fromId],
    direction: "incoming",
    type: incoming.type,
    outcome: "missed",
    threadId,
  });
  sendMessage(threadId, incoming.fromId, { body: "", kind: "call", call: { type: incoming.type, outcome: "missed" } });
  if (quickReply) sendMessage(threadId, viewerId, { body: quickReply });
  markRead(threadId, viewerId);
  storeActions.update((s) => ({ ...s, incomingCall: null }));
  return threadId;
}

export function joinGroupCall(threadId: string, viewerId: string) {
  const thread = getState().threads.find((t) => t.id === threadId);
  if (!thread?.groupCall) return undefined;
  const call = thread.groupCall;
  patchThread(threadId, (t) =>
    t.groupCall && !t.groupCall.participantIds.includes(viewerId)
      ? { ...t, groupCall: { ...t.groupCall, participantIds: [...t.groupCall.participantIds, viewerId] } }
      : t,
  );
  const active: ActiveCall = {
    id: call.callId,
    peerIds: call.participantIds.filter((id) => id !== viewerId),
    type: call.type,
    threadId,
    group: true,
    direction: "incoming",
    phase: "connected",
    startedAt: Date.now(),
    minimized: false,
  };
  storeActions.update((s) => ({ ...s, activeCall: active }));
  return active.id;
}

export function startGroupCall(threadId: string, viewerId: string, type: CallType) {
  const callId = uid("gcall");
  patchThread(threadId, (t) => ({ ...t, groupCall: { callId, type, participantIds: [] } }));
  addSystemMessage(threadId, `${type === "video" ? "Video nhóm" : "Gọi nhóm"} đã bắt đầu`);
  joinGroupCall(threadId, viewerId);
  return callId;
}
