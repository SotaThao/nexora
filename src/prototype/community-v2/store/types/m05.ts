export type MessageKind = "text" | "voice" | "shift" | "location" | "image" | "system" | "call";
export type CallType = "voice" | "video";
export type CallOutcome = "answered" | "missed" | "declined" | "no-answer";

export type Message = {
  id: string;
  senderId: string;
  body: string;
  at: string;
  kind?: MessageKind;
  quoteId?: string;
  reactions?: string[];
  /** Ready-made translation shown by "🌐 Dịch" (prototype: only messages that ship one). */
  translation?: string;
  voiceSeconds?: number;
  voiceTranscript?: string;
  /** Contract 1: id of a Shift from M03 (read-only). */
  sharedShiftId?: string;
  locationSalonId?: string;
  imageLabel?: string;
  call?: { type: CallType; outcome: CallOutcome; seconds?: number };
  seen?: boolean;
};

export type ThreadRequest = { fromId: string; toId: string };
export type GroupCallState = { callId: string; type: CallType; participantIds: string[] };

export type Thread = {
  id: string;
  kind: "dm" | "group";
  participantIds: string[];
  messages: Message[];
  /** Present while a first message from a stranger waits in "Lời mời nhắn tin". */
  request?: ThreadRequest;
  groupType?: "pos" | "public";
  name?: string;
  salonId?: string;
  filter?: "city" | "topic";
  memberCount?: number;
  description?: string;
  pinnedMessageId?: string;
  unread?: Record<string, number>;
  groupCall?: GroupCallState;
};

export type Call = {
  id: string;
  /** Whose history row this is. */
  ownerId: string;
  peerIds: string[];
  direction: "outgoing" | "incoming";
  type: CallType;
  outcome: CallOutcome;
  at: string;
  seconds?: number;
  threadId?: string;
  group?: boolean;
};

export type ActiveCall = {
  id: string;
  peerIds: string[];
  type: CallType;
  direction: "outgoing" | "incoming";
  phase: "ringing" | "connected";
  startedAt?: number;
  minimized: boolean;
  threadId?: string;
  group?: boolean;
};

export type IncomingCall = { id: string; fromId: string; type: CallType };

export type PrivacySettings = {
  phoneSearch: string;
  emailSearch: string;
  strangers: string;
  calls: string;
  scamWarnings: boolean;
};

export type M05State = {
  threads: Thread[];
  calls: Call[];
  privacy: PrivacySettings;
  blockedUserIds: string[];
  /** Optional runtime keys (not part of the L0 seed object): undefined means empty. */
  activeCall?: ActiveCall | null;
  incomingCall?: IncomingCall | null;
  nicknames?: Record<string, string>;
};
