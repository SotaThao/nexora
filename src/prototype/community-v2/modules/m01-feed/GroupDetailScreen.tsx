import { useState } from "react";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Avatar, Button, Card, EmptyState, Input, Textarea } from "../../components";
import { useStore } from "../../store";
import { FEED_GROUP_ID, startDraft } from "../../store/slices/m01";
import type { ComposerDraft, Group, ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { POST_TYPES, ROUTES } from "./constants";
import { useViewer, useVisiblePosts } from "./data";
import { GroupIcon, JoinButton } from "./GroupCard";
import { PostCard } from "./PostCard";

/** Composer with the destination preselected; Chợ groups show the price field (S01-06). */
function GroupComposer({ group }: { group: Group }) {
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const { person, firstName } = useViewer();
  const market = group.kind === "market";
  const [type, setType] = useState<ComposerDraft["type"]>(market ? "market" : "showcase");
  const [body, setBody] = useState("");
  const [price, setPrice] = useState("");

  const open = () =>
    requireAccount("Mở khung soạn bài", () => {
      startDraft({
        type, body, price, destinations: [FEED_GROUP_ID, group.id], destinationsTouched: true,
        area: group.id === "cho-do-nghe" ? "Toàn quốc có ship" : "Houston",
      });
      navigate(ROUTES.composeStep1);
    });

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Avatar name={person?.name ?? firstName} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold">Đăng vào <span className="text-nexoraBrand">{group.name}</span></p>
          {!market && (
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.filter((item) => item.id !== "market").map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={type === item.id}
                  onClick={() => setType(item.id)}
                  className={`min-h-11 rounded-full px-3 text-sm font-semibold ${
                    type === item.id ? "bg-nexoraBrand text-white" : "border border-nexoraBorder text-nexoraMuted"
                  }`}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={market ? "Dòng đầu là tiêu đề món hàng…" : `${firstName} ơi, bạn đang nghĩ gì?`}
            className="min-h-24"
            maxLength={1500}
          />
          {market && (
            <label className="block text-sm font-semibold">
              Giá ($) <span className="font-normal text-nexoraSubtle">· bắt buộc với bài mua bán</span>
              <div className="relative mt-1.5 max-w-48">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
                  text-nexoraSubtle">$</span>
                <Input
                  inputMode="numeric"
                  className="pl-7"
                  placeholder="VD: 250"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </label>
          )}
          <div className="flex justify-end">
            <Button variant="gradient" onClick={open}>Tiếp tục soạn →</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function GroupDetailScreen(_: { screen: ScreenDefinition }) {
  const { groupId = "" } = useParams();
  const group = useStore((s) => s.groups.find((item) => item.id === groupId));
  const posts = useVisiblePosts((post) => post.destinations.includes(groupId));

  if (!group) return <EmptyState title="Không tìm thấy nhóm" body="Nhóm có thể đã bị xoá hoặc đường dẫn không đúng." />;

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={ROUTES.groups} className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold
        text-nexoraMuted">
        <ArrowLeft size={17} /> Nhóm & Chợ
      </Link>
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-nexoraElectric via-nexoraElectricMid to-nexoraViolet sm:h-32" />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:p-6">
          <div className="-mt-12 rounded-2xl bg-white p-1.5 shadow-nexora-card sm:-mt-16">
            <GroupIcon group={group} size="size-16" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold">{group.name}</h2>
            <p className="text-sm text-nexoraMuted">
              {group.kind === "market" ? "🛍️ Chợ mua bán" : "👥 Cộng đồng ngành"} · {group.industry} ·{" "}
              {group.members.toLocaleString("vi-VN")} thành viên
            </p>
          </div>
          {group.kind !== "feed" && <JoinButton group={group} className="sm:min-w-40" />}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,640px)_300px] xl:justify-center">
        <div className="min-w-0 space-y-4">
          <GroupComposer group={group} />
          {posts.length === 0 ? (
            <EmptyState title="Chưa có bài trong nhóm" body="Hãy là người đầu tiên đăng bài vào nhóm này." />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
        <aside className="order-first xl:order-none">
          <Card className="p-4 xl:sticky xl:top-24">
            <h3 className="flex items-center gap-2 font-bold">
              <ScrollText size={18} className="text-nexoraBrand" /> Nội quy nhóm
            </h3>
            <p className="mt-2 text-sm text-nexoraMuted">{group.description}</p>
            <ol className="mt-3 space-y-2">
              {group.rules.map((rule, index) => (
                <li key={rule} className="flex gap-2 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-nexoraBrandSoft
                    text-xs font-bold text-nexoraBrand">
                    {index + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
