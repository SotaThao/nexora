import { Heart, MapPin, MessageCircle, Tag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, MoneyTag } from "../../components";
import { useStore } from "../../store";
import { toggleLike } from "../../store/slices/m01";
import type { Post } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { COPY, ROUTES } from "./constants";
import {
  formatPrice, groupName, isBoosted, isFresh, likeCount, splitMarketBody, timeAgo, useAuthor, useViewer,
} from "./data";
import { PostMenu } from "./PostMenu";
import { AuthorAvatar, AuthorName, Disclaimer, PhotoGrid, TypeBadge } from "./ui";

function frameClass(post: Post) {
  if (isBoosted(post)) return "border-nexoraWarning/70 ring-1 ring-nexoraWarning/30";
  if (isFresh(post)) return "border-nexoraViolet ring-2 ring-nexoraViolet/40";
  if (post.type === "official") return "border-nexoraBrand/30";
  return "border-nexoraBorder";
}

function MarketBlock({ post }: { post: Post }) {
  const navigate = useNavigate();
  const { key } = useViewer();
  if (!post.market) return null;
  const own = post.authorId === key;
  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xl font-bold text-nexoraText">
          <MoneyTag>{formatPrice(post.market.price)}</MoneyTag>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-xs
          font-semibold text-nexoraMuted">
          <Tag size={13} /> {post.market.category}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-xs
          font-semibold text-nexoraMuted">
          <MapPin size={13} /> {post.market.area}
        </span>
      </div>
      <Disclaimer />
      <div className="grid gap-2 sm:grid-cols-2">
        {!own && (
          <Button variant="primary" onClick={() => navigate(ROUTES.messageTo(post.authorId))}>
            ✉️ Nhắn người bán
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate(ROUTES.marketPost(post.id))}>
          Xem chi tiết
        </Button>
      </div>
    </div>
  );
}

export function PostCard({ post }: { post: Post }) {
  const author = useAuthor(post.authorId);
  const groups = useStore((s) => s.groups);
  const { key } = useViewer();
  const { requireAccount } = useCommunityGate();
  const liked = post.likedBy.includes(key);
  const boosted = isBoosted(post);
  const fresh = isFresh(post);
  const official = post.type === "official";
  const { title, rest } = post.type === "market" ? splitMarketBody(post.body) : { title: "", rest: post.body };

  return (
    <article
      className={`rounded-flox-cards border bg-nexoraSurface shadow-nexora-card ${frameClass(post)}`}
    >
      {boosted && (
        <p className="flex items-center justify-between gap-2 rounded-t-[11px] bg-nexoraWarning/15 px-4 py-2
          text-xs font-bold text-nexoraText">
          <span>{COPY.featuredBadge}</span>
          <span className="font-medium text-nexoraMuted">Ghim đầu {post.boostDays} ngày</span>
        </p>
      )}
      {official && (
        <p className="rounded-t-[11px] bg-nexoraSidebar px-4 py-2 text-xs font-bold tracking-wide text-white">
          OFFICIAL · Thông báo từ NEXORA
        </p>
      )}
      <div className="p-4">
        <header className="flex items-start gap-3">
          <AuthorAvatar author={author} />
          <div className="min-w-0 flex-1">
            <AuthorName author={author} />
            <p className="truncate text-xs text-nexoraSubtle">
              {[author.subtitle, timeAgo(post.createdAt)].filter(Boolean).join(" · ")}
            </p>
          </div>
          {fresh && !boosted && (
            <span className="mt-2 hidden shrink-0 rounded-full bg-nexoraViolet/10 px-2 py-0.5 text-xs
              font-bold text-nexoraViolet sm:inline">
              Mới đăng
            </span>
          )}
          <PostMenu postId={post.id} own={post.authorId === key} />
        </header>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <TypeBadge type={post.type} />
          {post.destinations.map((id) => (
            <Link
              key={id}
              to={id === "feed" ? ROUTES.feed : ROUTES.group(id)}
              className="inline-flex min-h-7 items-center rounded-full border border-nexoraBorder px-2.5
                text-xs font-medium text-nexoraMuted hover:border-nexoraBrand hover:text-nexoraBrand"
            >
              {groupName(groups, id)}
            </Link>
          ))}
        </div>

        {title && <h3 className="mt-3 text-base font-bold text-nexoraText">{title}</h3>}
        {rest && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-nexoraText">{rest}</p>}
        {post.images.length > 0 && (
          <div className="mt-3">
            <PhotoGrid images={post.images} />
          </div>
        )}
        {post.type === "market" && <MarketBlock post={post} />}

        <footer className="mt-3 flex items-center gap-1 border-t border-nexoraRule pt-2">
          <button
            type="button"
            aria-pressed={liked}
            onClick={() => requireAccount("thích bài", () => toggleLike(post.id))}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold
              hover:bg-nexoraSurfaceMuted
              ${
              liked ? "text-nexoraDanger" : "text-nexoraMuted"
            }`}
          >
            <Heart size={18} className={liked ? "fill-nexoraDanger" : ""} /> {likeCount(post)}
          </button>
          <button
            type="button"
            disabled
            title="Bình luận — sắp có"
            className="inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-lg px-3 text-sm
              font-semibold text-nexoraSubtle"
          >
            <MessageCircle size={18} /> Bình luận
            <span className="rounded-full bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-medium">sắp có</span>
          </button>
        </footer>
      </div>
    </article>
  );
}
