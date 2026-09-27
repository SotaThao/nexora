import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components";
import { useStore } from "../../store";
import type { ScreenDefinition } from "../../store/types";
import { ComposerEntry } from "./ComposerEntry";
import { ROUTES } from "./constants";
import { isMember, useViewer, useVisiblePosts } from "./data";
import { FeedRail } from "./FeedRail";
import { PostCard } from "./PostCard";

function FilterChips({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const groups = useStore((s) => s.groups);
  const { key } = useViewer();
  const joined = groups.filter((group) => group.kind !== "feed" && isMember(group, key));
  const chip = (id: string, label: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={active === id}
      onClick={() => onChange(id)}
      className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
        active === id
          ? "bg-nexoraBrand text-white"
          : "border border-nexoraBorder bg-white text-nexoraMuted hover:border-nexoraBrand/40"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
      {chip("all", "Tất cả")}
      {joined.map((group) => chip(group.id, group.name))}
      <Link
        to={ROUTES.groups}
        className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-dashed
          border-nexoraBorder px-4 text-sm font-semibold text-nexoraBrand"
      >
        ＋ Nhóm khác
      </Link>
    </div>
  );
}

export function FeedScreen(_: { screen: ScreenDefinition }) {
  const [filter, setFilter] = useState("all");
  const posts = useVisiblePosts((post) => filter === "all" || post.destinations.includes(filter));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,640px)_280px] xl:justify-center
      2xl:grid-cols-[minmax(0,640px)_320px]">
      <div className="min-w-0 space-y-4">
        <ComposerEntry />
        <FilterChips active={filter} onChange={setFilter} />
        {posts.length === 0 ? (
          <EmptyState title="Chưa có bài trong nhóm này" body="Hãy là người đầu tiên đăng bài — hoặc chọn nhóm khác." />
        ) : (
          posts.map((post, index) => (
            <Fragment key={post.id}>
              <PostCard post={post} />
              {index === 2 && (
                <div className="xl:hidden">
                  <FeedRail />
                </div>
              )}
            </Fragment>
          ))
        )}
      </div>
      <aside className="hidden xl:block">
        <div className="sticky top-24">
          <FeedRail />
        </div>
      </aside>
    </div>
  );
}
