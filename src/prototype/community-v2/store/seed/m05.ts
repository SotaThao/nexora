import type { Call, Message, Thread } from "../types";

// Every participant id below exists in store/seed/m00.ts.
const day = (date: string, time: string) => `2026-09-${date}T${time}:00`;
const m = (id: string, senderId: string, body: string, at: string, extra: Partial<Message> = {}): Message => ({
  id,
  senderId,
  body,
  at,
  ...extra,
});

const dmKayla: Thread = {
  id: "dm-kayla",
  kind: "dm",
  participantIds: ["jessica", "kayla"],
  unread: { jessica: 2 },
  messages: [
    m("k1", "kayla", "Chào Jessica, cuối tuần này em rảnh không?", day("26", "18:40")),
    m("k2", "jessica", "Em rảnh chiều thứ bảy ạ. Có ca party hả chị?", day("26", "18:42"), {
      quoteId: "k1",
      seen: true,
    }),
    m("k3", "kayla", "Đúng rồi, tiệc cưới 8 khách. Chị gửi ca em xem nha.", day("26", "18:45"), {
      reactions: ["❤️", "👍"],
    }),
    m("k4", "kayla", "Ca party cuối tuần", day("26", "18:45"), {
      kind: "shift",
      sharedShiftId: "shift-party",
    }),
    m("k5", "jessica", "Dạ để em nhận ca luôn nha chị 🙏", day("26", "19:02"), {
      seen: true,
      reactions: ["🙏"],
    }),
    m("k6", "kayla", "", day("27", "08:15"), {
      kind: "call",
      call: { type: "voice", outcome: "answered", seconds: 252 },
    }),
    m("k7", "kayla", "Nhớ tới sớm 15 phút để check-in trên app nha em.", day("27", "08:21")),
    m("k8", "kayla", "Tiệm ở đây nè", day("27", "08:22"), {
      kind: "location",
      locationSalonId: "kayla-nails",
    }),
  ],
};

/** Stranger request with a scam-like message (Zelle + phí giữ chỗ). */
const requestDuy: Thread = {
  id: "req-duy",
  kind: "dm",
  participantIds: ["8818", "jessica"],
  request: { fromId: "8818", toId: "jessica" },
  unread: { jessica: 2 },
  messages: [
    m("r1", "8818", "Chào chị, tiệm em ở Katy đang cần thợ bột gấp, lương cao.", day("27", "07:50")),
    m(
      "r2",
      "8818",
      "Chị chuyển tiền trước 50$ phí giữ chỗ qua Zelle giúp em, em giữ ca cho chị nha.",
      day("27", "07:51"),
    ),
  ],
};

const posGroup: Thread = {
  id: "pos-kayla-nails",
  kind: "group",
  groupType: "pos",
  name: "Kayla Nails & Spa",
  salonId: "kayla-nails",
  participantIds: ["kayla", "jessica", "3332", "6683", "1199"],
  pinnedMessageId: "p1",
  unread: { jessica: 3, kayla: 0 },
  groupCall: { callId: "gcall-pos", type: "voice", participantIds: ["kayla", "3332", "6683"] },
  messages: [
    m(
      "p1",
      "kayla",
      "📅 Lịch tuần 29/9–5/10: Jessica T2·T4·T6 · Vy T3·T5·T7 · Quỳnh cả tuần. " +
        "Tips chia theo ca, chốt tối CN.",
      day("26", "20:00"),
    ),
    m("p2", "3332", "Em đổi ca T5 với Quỳnh được không chị?", day("27", "07:30")),
    m("p3", "6683", "Tin thoại", day("27", "07:34"), {
      kind: "voice",
      voiceSeconds: 14,
      voiceTranscript: "Dạ em đổi được, T5 em làm, T7 Vy làm giúp em nha.",
    }),
    m("p4", "kayla", "Ok hai em, chị cập nhật lịch rồi 👍", day("27", "07:40"), {
      quoteId: "p2",
      reactions: ["👍", "👍", "❤️"],
    }),
    m(
      "p5",
      "1199",
      "Máy pedicure ghế số 3 bị rò nước, ai gặp thì báo chị Kayla nha.",
      day("27", "08:05"),
    ),
  ],
};

type PublicSeed = Pick<
  Thread,
  "id" | "name" | "filter" | "memberCount" | "description" | "participantIds" | "messages"
>;
const publicGroup = (seed: PublicSeed): Thread => ({ ...seed, kind: "group", groupType: "public" });

// The 6 default public communities from doc 05 (luồng 4).
const publicGroups: Thread[] = [
  publicGroup({
    id: "pub-houston",
    name: "Thợ Nail Houston",
    filter: "city",
    memberCount: 1284,
    description: "Việc làm, ca thêm & chia sẻ kinh nghiệm ở Houston.",
    participantIds: ["jessica", "3332", "6683", "1199"],
    messages: [
      m("h1", "3332", "Cuối tuần này có ai đi workshop Gel-X ở Bellaire không?", day("27", "06:55")),
      m("h2", "6683", "Mình đi nè, tiệm nào cần thợ pedicure thứ hai thì nhắn mình.",
        day("27", "07:10")),
    ],
  }),
  publicGroup({
    id: "pub-dallas",
    name: "Thợ Nail Dallas – Fort Worth",
    filter: "city",
    memberCount: 856,
    description: "Cộng đồng thợ nail khu DFW.",
    participantIds: ["1048", "4450", "7701"],
    messages: [m("d1", "1048", "Plano đang thiếu thợ acrylic cuối tuần.", day("26", "21:10"))],
  }),
  publicGroup({
    id: "pub-austin",
    name: "Nail Austin & San Antonio",
    filter: "city",
    memberCount: 642,
    description: "Kết nối thợ & tiệm ở Austin, San Antonio.",
    participantIds: ["2221", "5574"],
    messages: [m("a1", "5574", "Ai biết chỗ mua builder gel sỉ ở Austin không?", day("26", "16:20"))],
  }),
  publicGroup({
    id: "pub-gelx",
    name: "Học Gel-X & Nail Art",
    filter: "topic",
    memberCount: 3412,
    description: "Mẹo Gel-X, nail art, mẫu mới mỗi tuần.",
    participantIds: ["jessica", "2221", "5574", "3332"],
    messages: [
      m("g1", "2221", "Mẫu chrome mắt mèo tuần này", day("26", "15:00"), {
        kind: "image",
        imageLabel: "Mẫu chrome mắt mèo",
      }),
      m("g2", "5574", "Đẹp quá chị ơi! Dùng top nào vậy?", day("26", "15:12"), {
        reactions: ["😮", "❤️"],
      }),
    ],
  }),
  publicGroup({
    id: "pub-tax",
    name: "Thuế & 1099 cho thợ (TAX IQ)",
    filter: "topic",
    memberCount: 2210,
    description: "Hỏi đáp thuế, 1099 cùng đối tác TAX IQ.",
    participantIds: ["4450", "1048"],
    messages: [m("t1", "4450", "Nhắc cả nhà: hạn nộp thuế quý 3 là 15/10.", day("25", "10:00"))],
  }),
  publicGroup({
    id: "pub-owners",
    name: "Chủ tiệm Việt tại Mỹ",
    filter: "topic",
    memberCount: 1530,
    description: "Chủ tiệm chia sẻ vận hành, tuyển thợ, POS.",
    participantIds: ["kayla"],
    messages: [
      m("o1", "kayla", "Tiệm mình vừa chạy coupon khách mới trên NEXORA, hiệu quả lắm.",
        day("26", "11:30")),
    ],
  }),
];

const dmHan: Thread = {
  id: "dm-han",
  kind: "dm",
  participantIds: ["jessica", "2221"],
  unread: { jessica: 1 },
  messages: [
    m("n1", "jessica", "Chị Hân ơi mai chị có ca không?", day("26", "21:00"), { seen: true }),
    m("n2", "2221", "Tin thoại", day("26", "21:04"), {
      kind: "voice",
      voiceSeconds: 9,
      voiceTranscript: "Mai chị có ca Gel-X lúc 2 giờ, xong chị gọi em nha.",
    }),
  ],
};

const dmLinh: Thread = {
  id: "dm-linh",
  kind: "dm",
  participantIds: ["jessica", "linh"],
  messages: [
    m("l1", "linh", "Hi Jessica, can I book a Gel-X set this Saturday at 2pm?", day("26", "14:10"), {
      translation: "Chào Jessica, mình đặt bộ Gel-X thứ bảy này lúc 2 giờ chiều được không?",
    }),
    m("l2", "jessica", "Dạ được chị, em giữ lịch 2 giờ cho chị nha.", day("26", "14:20"), {
      seen: true,
      reactions: ["😂"],
    }),
    m("l3", "linh", "Thank you! See you then 😊", day("26", "14:22"), {
      translation: "Cảm ơn em! Hẹn gặp nhé 😊",
    }),
  ],
};

const dmMinh: Thread = {
  id: "dm-minh",
  kind: "dm",
  participantIds: ["jessica", "1048"],
  messages: [
    m("mi1", "1048", "", day("25", "17:30"), { kind: "call", call: { type: "voice", outcome: "missed" } }),
    m("mi2", "1048", "Tiệm bạn mình ở Austin cần thợ gấp, mình share ca nha.", day("25", "17:32")),
    m("mi3", "1048", "Ca thiếu thợ gấp", day("25", "17:32"), { kind: "shift", sharedShiftId: "shift-urgent" }),
  ],
};

const dmTuan: Thread = {
  id: "dm-tuan",
  kind: "dm",
  participantIds: ["jessica", "1199"],
  messages: [
    m("tu1", "1199", "Tiệm Bloom mới mở gần nhà em đó, ghé thử nha.", day("24", "12:00")),
    m("tu2", "1199", "Bloom Nail Lounge", day("24", "12:01"), { kind: "location", locationSalonId: "bloom" }),
    m("tu3", "jessica", "Cảm ơn anh Tuấn nha 👍", day("24", "12:30"), { seen: true }),
  ],
};

export const threads: Thread[] = [dmKayla, requestDuy, posGroup, ...publicGroups, dmHan, dmLinh, dmMinh, dmTuan];

type CallSeed = Omit<Call, "ownerId" | "at"> & { at: [string, string]; ownerId?: string };
const call = ({ at, ownerId = "jessica", ...rest }: CallSeed): Call => ({ ...rest, ownerId, at: day(...at) });

export const calls: Call[] = [
  call({ id: "call-kayla-1", peerIds: ["kayla"], direction: "incoming", type: "voice", outcome: "answered",
    seconds: 252, at: ["27", "08:15"], threadId: "dm-kayla" }),
  call({ id: "call-han-1", peerIds: ["2221"], direction: "outgoing", type: "video", outcome: "answered",
    seconds: 65, at: ["26", "21:30"], threadId: "dm-han" }),
  call({ id: "call-minh-1", peerIds: ["1048"], direction: "incoming", type: "voice", outcome: "missed",
    at: ["25", "17:30"], threadId: "dm-minh" }),
  call({ id: "call-tuan-1", peerIds: ["1199"], direction: "outgoing", type: "voice", outcome: "no-answer",
    at: ["24", "11:50"], threadId: "dm-tuan" }),
  call({ id: "call-pos-1", peerIds: ["kayla", "3332", "6683"], direction: "incoming", type: "voice",
    outcome: "answered", seconds: 750, at: ["23", "09:00"], threadId: "pos-kayla-nails", group: true }),
  call({ id: "call-kayla-owner", ownerId: "kayla", peerIds: ["jessica"], direction: "outgoing", type: "voice",
    outcome: "answered", seconds: 252, at: ["27", "08:15"], threadId: "dm-kayla" }),
];

/** Kim Lưu — blocked earlier by Jessica. */
export const blockedUserIds = ["7701"];
