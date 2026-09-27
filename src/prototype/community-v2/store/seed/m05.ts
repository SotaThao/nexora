import type { Call, Thread } from "../types";

const message = (id: string, senderId: string, body: string, extra = {}) => ({ id, senderId, body, at: "2026-09-27T10:00:00", ...extra });

export const threads: Thread[] = [
  { id: "dm-kayla", participantIds: ["jessica", "kayla"], kind: "dm", messages: [message("m1", "kayla", "Chào Jessica, em rảnh cuối tuần không?"), message("m2", "jessica", "Em rảnh chiều thứ bảy ạ.", { quoteId: "m1", reactions: ["❤️", "👍"] })] },
  { id: "request-stranger", participantIds: ["jessica", "8818"], kind: "dm", request: true, messages: [message("m3", "8818", "Chị đặt cọc qua zelle trước để giữ ca nhé.")] },
  { id: "pos-kayla", participantIds: ["kayla", "jessica", "3332"], kind: "group", pinnedMessage: "Lịch tuần đã ghim — nhớ check-in đúng giờ.", messages: [message("m4", "kayla", "Lịch tuần đã cập nhật.")] },
  { id: "public-houston", participantIds: ["jessica", "3332", "6683"], kind: "group", public: true, messages: [message("m5", "3332", "Ai đi workshop Gel-X không?")] },
  { id: "public-tax", participantIds: ["jessica", "4450"], kind: "group", public: true, messages: [message("m6", "4450", "Mình vừa cập nhật 1099.")] },
  { id: "voice", participantIds: ["jessica", "2221"], kind: "dm", messages: [message("m7", "2221", "Tin thoại", { voiceTranscript: "Mai em có ca Gel-X lúc 2 giờ." })] },
  { id: "shift-share", participantIds: ["jessica", "1048"], kind: "dm", messages: [message("m8", "1048", "Mình gửi ca này nhé.", { sharedShiftId: "shift-party" })] },
  { id: "location", participantIds: ["jessica", "1199"], kind: "dm", messages: [message("m9", "1199", "Địa chỉ tiệm ở đây.", { location: "Kayla Nails & Spa · Houston" })] },
];

export const calls: Call[] = [{ id: "call-out", participantIds: ["jessica", "kayla"], type: "voice", status: "outgoing" }, { id: "call-in", participantIds: ["jessica", "2221"], type: "video", status: "incoming" }, { id: "call-missed", participantIds: ["jessica", "1048"], type: "voice", status: "missed" }];
export const blockedUserIds = ["8818"];
