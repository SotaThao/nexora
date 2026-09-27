export type Message = { id: string; senderId: string; body: string; at: string; quoteId?: string; reactions?: string[]; voiceTranscript?: string; sharedShiftId?: string; location?: string };
export type Thread = { id: string; participantIds: string[]; messages: Message[]; kind: "dm" | "group"; request?: boolean; pinnedMessage?: string; public?: boolean };
export type Call = { id: string; participantIds: string[]; type: "voice" | "video"; status: string };
export type PrivacySettings = { phoneSearch: string; emailSearch: string; strangers: string; calls: string; scamWarnings: boolean };
export type M05State = { threads: Thread[]; calls: Call[]; privacy: PrivacySettings; blockedUserIds: string[] };
