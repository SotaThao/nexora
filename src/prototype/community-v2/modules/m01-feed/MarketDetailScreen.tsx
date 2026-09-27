import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, MapPin, Tag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Card, EmptyState, MoneyTag } from "../../components";
import { useStore } from "../../store";
import { toggleLike } from "../../store/slices/m01";
import type { ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { ROUTES } from "./constants";
import { formatPrice, groupName, likeCount, splitMarketBody, timeAgo, useAuthor, useViewer } from "./data";
import { AuthorAvatar, AuthorName, Disclaimer, PhotoTile } from "./ui";

function Carousel({ images }: { images: number[] }) {
  const slides = images.length ? images : [2];
  const [index, setIndex] = useState(0);
  const go = (delta: number) => setIndex((value) => (value + delta + slides.length) % slides.length);
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <PhotoTile tone={slides[index]} className="aspect-[4/3] w-full rounded-none" />
        {slides.length > 1 && (
          <>
            <button type="button" aria-label="Ảnh trước" onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full
                bg-white/90 shadow">
              <ChevronLeft size={20} />
            </button>
            <button type="button" aria-label="Ảnh sau" onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center
                rounded-full bg-white/90 shadow">
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <span className="absolute bottom-3 right-3 rounded-full bg-nexoraText/70 px-2.5 py-1 text-xs
          font-semibold text-white">
          {index + 1}/{slides.length}
        </span>
      </div>
      {slides.length > 1 && (
        <div className="flex gap-2 p-3">
          {slides.map((tone, i) => (
            <button key={`${tone}-${i}`} type="button" aria-label={`Ảnh ${i + 1}`} onClick={() => setIndex(i)}
              className={`size-14 overflow-hidden rounded-lg border-2
                ${i === index ? "border-nexoraBrand" : "border-transparent"}`}>
              <PhotoTile tone={tone} className="size-full" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function MarketDetailScreen(_: { screen: ScreenDefinition }) {
  const { itemId = "" } = useParams();
  const navigate = useNavigate();
  const post = useStore((s) => s.posts.find((item) => item.id === itemId && item.type === "market" && !item.deleted));
  const groups = useStore((s) => s.groups);
  const seller = useAuthor(post?.authorId ?? "");
  const { key } = useViewer();
  const { requireAccount } = useCommunityGate();

  if (!post || !post.market) {
    return <EmptyState title="Không tìm thấy bài mua bán" body="Bài có thể đã bị người bán xoá." />;
  }
  const { title, rest } = splitMarketBody(post.body);
  const own = post.authorId === key;
  const liked = post.likedBy.includes(key);

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={ROUTES.market} className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold
        text-nexoraMuted">
        <ArrowLeft size={17} /> Rao vặt
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Carousel images={post.images} />
        <div className="space-y-4">
          <Card className="space-y-4 p-4 sm:p-6">
            <div>
              <p className="text-3xl font-bold"><MoneyTag>{formatPrice(post.market.price)}</MoneyTag></p>
              <h2 className="mt-2 text-xl font-bold">{title}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-nexoraMuted">
                <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSurfaceMuted px-2.5 py-1">
                  <Tag size={13} /> {post.market.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSurfaceMuted px-2.5 py-1">
                  <MapPin size={13} /> {post.market.area}
                </span>
                <span className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-1">{timeAgo(post.createdAt)}</span>
              </div>
            </div>
            {rest && <p className="whitespace-pre-line text-sm leading-6">{rest}</p>}
            <p className="text-xs text-nexoraSubtle">
              Đăng tại: {post.destinations.map((id) => groupName(groups, id)).join(" · ")}
            </p>
            <Disclaimer />
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              {own ? (
                <p className="rounded-lg bg-nexoraBrandSoft p-3 text-sm font-medium text-nexoraBrand">
                  Đây là bài của bạn.
                </p>
              ) : (
                <Button variant="gradient" onClick={() => navigate(ROUTES.messageTo(post.authorId))}>
                  ✉️ Nhắn người bán
                </Button>
              )}
              <Button
                variant="secondary"
                aria-pressed={liked}
                className={`inline-flex items-center justify-center gap-2 ${liked ? "text-nexoraDanger" : ""}`}
                onClick={() => requireAccount("thích bài", () => toggleLike(post.id))}
              >
                <Heart size={17} className={liked ? "fill-nexoraDanger" : ""} /> {likeCount(post)}
              </Button>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <AuthorAvatar author={seller} />
            <div className="min-w-0 flex-1">
              <AuthorName author={seller} />
              <p className="text-xs text-nexoraSubtle">{seller.subtitle || "Người bán"}</p>
            </div>
            <span className="text-xs font-semibold text-nexoraMuted">Người bán</span>
          </Card>
        </div>
      </div>
    </div>
  );
}
