import { useEffect, useState, type ComponentType } from "react";
import { Bell, BookOpen, Briefcase, CalendarClock, Gift, HelpCircle, LayoutGrid, MessageCircle, MoreHorizontal, Search, Shield, Store, UsersRound } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Avatar, Badge, Button, Card, IconButton, Modal, SegmentedPills } from "../../components";
import { storeActions, useStore } from "../../store";
import { SCREENS } from "../../routes";
import { DemoBar } from "./DemoBar";
import { ConsentStatus, GateProvider, TermsBanner } from "./gates";

type Icon = ComponentType<{ size?: number; className?: string }>;
type ModuleNav = { label: string; path: string; icon: Icon };

const modules: ModuleNav[] = [
  { label: "Bảng tin", path: "/community-v2/feed", icon: LayoutGrid },
  { label: "Nhóm & Chợ", path: "/community-v2/groups", icon: UsersRound },
  { label: "Việc làm", path: "/community-v2/jobs", icon: Briefcase },
  { label: "Ca làm thêm", path: "/community-v2/shifts", icon: CalendarClock },
  { label: "Deal & Coupon", path: "/community-v2/deals/nearby", icon: Gift },
  { label: "Tin nhắn & Gọi", path: "/community-v2/messages", icon: MessageCircle },
];

function useCurrentPerson() {
  return useStore((state) => state.people.find((person) => person.id === state.currentPersonId));
}

function SidebarLink({ item, active }: { item: ModuleNav; active: boolean }) {
  const navigate = useNavigate();
  const Icon = item.icon;
  return <button type="button" onClick={() => navigate(item.path)} className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-semibold ${active ? "bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white" : "text-white/85 hover:bg-white/5"}`}><Icon size={19} />{item.label}</button>;
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = useStore((state) => state.role);
  const person = useCurrentPerson();
  const menu = [...modules];
  if (role === "tech") menu.push({ label: "Hồ sơ thợ", path: "/community-v2/jobs/profile", icon: Briefcase }, { label: "Wish list & Ví coupon", path: "/community-v2/deals/wishlist", icon: Gift });
  if (role === "owner") menu.push({ label: "Quầy redeem", path: "/community-v2/pos/redeem", icon: Store }, { label: "Tuyển thợ", path: "/community-v2/pos/jobs", icon: Briefcase }, { label: "Đăng ca", path: "/community-v2/pos/shifts/new", icon: CalendarClock }, { label: "Chương trình", path: "/community-v2/pos/promotions", icon: Gift });
  if (role === "admin") menu.push({ label: "Chế độ admin", path: "/community-v2/admin", icon: Shield });
  return <aside className="fixed inset-y-0 hidden w-72 flex-col bg-nexoraSidebar p-4 lg:flex"><div className="mb-6 flex items-center gap-3 px-3 pt-2 text-white"><span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-nexoraElectric to-nexoraViolet font-bold">N</span><span><b>NEXORA</b><small className="block text-white/60">Community v2</small></span></div><nav className="space-y-1 overflow-y-auto"><p className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-white/50">Community</p>{menu.map((item) => <SidebarLink key={item.path} item={item} active={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)} />)}<div className="my-3 border-t border-white/10" /><button type="button" onClick={() => navigate("/community-v2/learning")} className="flex min-h-11 w-full items-center gap-3 px-4 text-sm text-white/75 hover:text-white"><BookOpen size={18} />Học tập</button><button type="button" onClick={() => navigate("/community-v2/events")} className="flex min-h-11 w-full items-center gap-3 px-4 text-sm text-white/75 hover:text-white"><HelpCircle size={18} />Sự kiện</button></nav><div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2"><Avatar name={person?.name || "Khách"} /><div className="min-w-0 text-sm text-white"><p className="truncate font-bold">{person?.name || "Khách chưa đăng ký"}</p><p className="font-mono text-xs text-white/60">{person?.nxId || "Xem tự do"}</p></div></div></div></aside>;
}

function Header() {
  const location = useLocation();
  const person = useCurrentPerson();
  const title = SCREENS.find((screen) => location.pathname === screen.path)?.title || "Community";
  return <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-nexoraBorder bg-white px-8 lg:flex"><div><div className="flex items-center gap-2"><h1 className="text-lg font-bold">{title}</h1>{location.pathname.includes("/pos/") && <Badge tone="warning">POS</Badge>}</div><ConsentStatus /></div><div className="flex items-center gap-2"><label className="flex h-10 items-center gap-2 rounded-lg bg-nexoraSurfaceMuted px-3"><Search size={17} /><input className="w-40 bg-transparent text-sm outline-none" placeholder="Tìm trong Community" /></label><IconButton label="Thông báo"><Bell size={20} /></IconButton><Avatar name={person?.name || "Khách"} /></div></header>;
}

function MobileChrome() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = modules.find((item) => location.pathname.startsWith(item.path))?.label || "Bảng tin";
  return <><header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-nexoraBorder bg-white px-4 lg:hidden"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-sm font-bold text-white">N</span><b>Community</b></div><div className="flex"><IconButton label="Tìm kiếm"><Search size={19} /></IconButton><IconButton label="Thông báo"><Bell size={19} /></IconButton></div></header><div className="sticky top-14 z-20 border-b border-nexoraBorder bg-white px-3 py-2 lg:hidden"><SegmentedPills items={modules.map((item) => item.label)} active={active} onChange={(label) => navigate(modules.find((item) => item.label === label)?.path || "/community-v2/feed")} /></div></>;
}

function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  return <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[68px] justify-around border-t border-nexoraBorder bg-white px-1 lg:hidden">{modules.slice(0, 5).map((item) => { const Icon = item.icon; return <button key={item.path} type="button" onClick={() => navigate(item.path)} className={`grid min-w-11 place-items-center text-xs ${location.pathname.startsWith(item.path) ? "text-nexoraBrand" : "text-nexoraSubtle"}`}><Icon size={19} /><span className="max-w-16 truncate">{item.label.split(" ")[0]}</span></button>; })}<button type="button" onClick={() => navigate("/community-v2/messages")} className="grid min-w-11 place-items-center text-nexoraSubtle"><MoreHorizontal size={19} /><span className="text-xs">Thêm</span></button></nav>;
}

function WelcomeModal() {
  const seen = useStore((state) => state.whatsNewSeen);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!seen) setOpen(true); }, [seen]);
  const dismiss = () => { setOpen(false); storeActions.setWhatsNewSeen(true); };
  return <Modal open={open} onClose={dismiss} title="Có gì mới trong Community"><div className="space-y-4"><p className="text-nexoraMuted">Một nơi kết nối cho cộng đồng ngành nail.</p><div className="grid grid-cols-2 gap-3">{modules.map((item) => { const Icon = item.icon; return <Card key={item.label} className="p-3"><Icon className="text-nexoraBrand" size={20} /><p className="mt-2 text-sm font-bold">{item.label}</p></Card>; })}</div><Button variant="gradient" className="w-full" onClick={dismiss}>Khám phá Community</Button></div></Modal>;
}

export function CommunityShell() {
  return <GateProvider><DemoBar /><Sidebar /><div className="lg:pl-72"><Header /><MobileChrome /><main className="min-h-[calc(100dvh-68px)] p-4 pb-24 lg:min-h-[calc(100dvh-128px)] lg:p-8"><div className="mx-auto max-w-7xl"><TermsBanner /><Outlet /></div></main></div><MobileNav /><WelcomeModal /></GateProvider>;
}
