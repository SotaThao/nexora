import { useState } from "react";
import { MapPin, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, Button, Card, MoneyTag, Select } from "../../components";
import type { Post, ScreenDefinition } from "../../store/types";
import { MARKET_AREAS, MARKET_CATEGORIES, ROUTES } from "./constants";
import { formatPrice, splitMarketBody, timeAgo, useAuthor, useVisiblePosts } from "./data";
import { PageTitle, PhotoTile } from "./ui";
import { ComposerEntry } from "./ComposerEntry";

const PRICE_RANGES = [
  { id: "all", label: "Mọi mức giá", test: () => true },
  { id: "lt100", label: "Dưới $100", test: (p: number) => p < 100 },
  { id: "100-1000", label: "$100 – $1.000", test: (p: number) => p >= 100 && p <= 1000 },
  { id: "gt1000", label: "Trên $1.000", test: (p: number) => p > 1000 },
];
const SORTS = ["Mới nhất", "Giá thấp → cao", "Giá cao → thấp"];
const ALL = "Tất cả";

function MarketCard({ post }: { post: Post }) {
  const author = useAuthor(post.authorId);
  const { title } = splitMarketBody(post.body);
  return (
    <Link to={ROUTES.marketPost(post.id)} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition group-hover:border-nexoraBrand/40">
        <PhotoTile tone={post.images[0] ?? post.id.length} className="aspect-[4/3] w-full rounded-none" />
        <div className="flex flex-1 flex-col p-4">
          <p className="text-lg font-bold"><MoneyTag>{formatPrice(post.market?.price ?? 0)}</MoneyTag></p>
          <h3 className="mt-1 line-clamp-2 font-semibold text-nexoraText">{title}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-nexoraSubtle">
            <MapPin size={13} /> {post.market?.area} · {post.market?.category}
          </p>
          <div className="mt-auto flex items-center gap-2 pt-3">
            <Avatar name={author.name} />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-nexoraMuted">{author.name}</span>
            <span className="shrink-0 text-xs text-nexoraSubtle">{timeAgo(post.createdAt)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function MarketScreen(_: { screen: ScreenDefinition }) {
  const [category, setCategory] = useState(ALL);
  const [area, setArea] = useState(ALL);
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState(SORTS[0]);
  const priceTest = PRICE_RANGES.find((item) => item.id === range)?.test ?? (() => true);

  const matches = useVisiblePosts((post) => (
    post.type === "market"
    && Boolean(post.market)
    && (category === ALL || post.market?.category === category)
    && (area === ALL || post.market?.area === area)
    && priceTest(post.market?.price ?? 0)
  ));
  const items = [...matches].sort((a, b) => {
    if (sort === SORTS[1]) return (a.market?.price ?? 0) - (b.market?.price ?? 0);
    if (sort === SORTS[2]) return (b.market?.price ?? 0) - (a.market?.price ?? 0);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const reset = () => { setCategory(ALL); setArea(ALL); setRange("all"); };
  const filtered = category !== ALL || area !== ALL || range !== "all";

  const filters = (
    <>
      <label className="block text-sm font-semibold">
        Danh mục
        <Select className="mt-1.5" value={category} onChange={(e) => setCategory(e.target.value)}>
          {[ALL, ...MARKET_CATEGORIES].map((item) => <option key={item}>{item}</option>)}
        </Select>
      </label>
      <label className="block text-sm font-semibold">
        Khu vực
        <Select className="mt-1.5" value={area} onChange={(e) => setArea(e.target.value)}>
          {[ALL, ...MARKET_AREAS].map((item) => <option key={item}>{item}</option>)}
        </Select>
      </label>
      <label className="block text-sm font-semibold">
        Khoảng giá
        <Select className="mt-1.5" value={range} onChange={(e) => setRange(e.target.value)}>
          {PRICE_RANGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="block text-sm font-semibold">
        Sắp xếp
        <Select className="mt-1.5" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </label>
    </>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Rao vặt" subtitle="Mọi bài Mua bán từ các nhóm Chợ. Giao dịch trực tiếp giữa thành viên." />
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <Card className="grid grid-cols-2 gap-3 p-4 lg:sticky lg:top-24 lg:grid-cols-1">
            {filters}
            {filtered && (
              <Button variant="ghost" className="col-span-2 lg:col-span-1" onClick={reset}>Xoá bộ lọc</Button>
            )}
          </Card>
        </aside>
        <div className="min-w-0 space-y-4">
          <p className="text-sm text-nexoraMuted"><b className="text-nexoraText">{items.length}</b> bài mua bán</p>
          {items.length === 0 ? (
            <Card className="p-8 text-center">
              <SearchX className="mx-auto text-nexoraSubtle" size={32} />
              <p className="mt-3 font-bold">Không có bài phù hợp bộ lọc</p>
              <p className="mt-1 text-sm text-nexoraMuted">Thử đổi danh mục, khu vực hoặc khoảng giá.</p>
              <Button variant="secondary" className="mt-4" onClick={reset}>Xoá bộ lọc</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((post) => <MarketCard key={post.id} post={post} />)}
            </div>
          )}
          <ComposerEntry preset={{ type: "market" }} hint="Có đồ cần bán? Đăng vào Chợ — bắt buộc ghi giá." />
        </div>
      </div>
    </div>
  );
}
