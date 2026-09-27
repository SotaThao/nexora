import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Inbox, Megaphone, Sparkles } from "lucide-react";
import { Button, Card, Input, Select, Textarea, Toggle, useToast } from "../../components";
import { useStore } from "../../store";
import { createHiringPost } from "../../store/slices/m02";
import type { JobPayType, JobSkill, JobWorkType, ScreenDefinition } from "../../store/types";
import { JOB_CITIES, JOB_PAY_TYPES, JOB_SKILLS, JOB_WORK_TYPES } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { ChipGroup, ErrorText, Field, PageHeader, POS_JOBS, RoleNotice, salonName, useJobsViewer } from "./shared";

const POS_LINE = "Tiệm dùng NEXORA POS — tips minh bạch, trả đúng hạn.";

type Form = {
  salon: string;
  city: string;
  skills: JobSkill[];
  workType: JobWorkType;
  payType: JobPayType;
  pay: string;
  urgent: boolean;
  housing: boolean;
};

export function hiringTitle(f: Form): string {
  return `${f.urgent ? "[Cần gấp] " : ""}Thợ ${f.skills.join("/") || "nail"} ${f.workType} tại ${f.city}`;
}

export function hiringBody(f: Form): string {
  return [
    `${f.salon} (${f.city}) cần thợ biết ${f.skills.join(", ") || "làm nail"}, làm ${f.workType}.`,
    `Lương: ${f.payType}${f.pay ? ` · ${f.pay}` : ""}.`,
    f.urgent ? "🔥 Cần gấp — có thể bắt đầu ngay." : "",
    f.housing ? "🏠 Có chỗ ở cho thợ ở xa." : "",
    POS_LINE,
  ].filter(Boolean).join(" ");
}

export function PosHiringScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, salonId = "kayla-nails" } = useJobsViewer();
  const defaultSalon = useStore((state) => salonName(state, salonId));
  const allPosts = useStore((state) => state.jobPosts);
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const [f, setF] = useState<Form>({
    salon: defaultSalon, city: "Houston", skills: ["Gel-X"], workType: "Full-time",
    payType: "Ăn chia (commission)", pay: "$1,000–1,400/tuần", urgent: true, housing: false,
  });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  if (role !== "owner") return <RoleNotice need="owner" />;

  const set = (patch: Partial<Form>) => setF((current) => ({ ...current, ...patch }));
  const write = () => { setTitle(hiringTitle(f)); setBody(hiringBody(f)); setError(""); };
  const publish = () => {
    if (!f.skills.length) return setError("Vui lòng chọn ít nhất 1 kỹ năng ở “Cần thợ biết”.");
    if (title.trim().length < 10 || body.trim().length < 30) {
      return setError("Bấm “✦ AI viết tin tuyển” hoặc nhập tiêu đề ≥ 10 ký tự và nội dung ≥ 30 ký tự.");
    }
    requireAccount("Đăng tin tuyển", () => {
      const id = createHiringPost({
        salonId, title: title.trim(), body: body.trim(), city: f.city, skills: f.skills, workTypes: [f.workType],
        payType: f.payType, payText: f.pay || "Thoả thuận", urgent: f.urgent, housing: f.housing,
      });
      toast("✓ Tin tuyển đã lên Community chung", "success");
      navigate(`${POS_JOBS}/suggestions?job=${id}`);
    });
  };
  const mine = allPosts.filter((post) => post.kind === "hiring" && post.salonId === salonId);

  return (
    <div className="space-y-5">
      <PageHeader pos eyebrow="Tuyển thợ" title={screen.title}
        subtitle="Tin đăng từ POS tự xuất hiện trên bảng việc làm Community — thợ ở mọi tiệm đều thấy."
        actions={(
          <>
            <Link to={`${POS_JOBS}/suggestions`} className="inline-flex min-h-11 items-center gap-2 rounded-flox-buttons
              border border-nexoraBorder bg-white px-4 text-sm font-semibold"><Sparkles size={16} /> AI gợi ý thợ</Link>
            <Link to={`${POS_JOBS}/applications`} className="inline-flex min-h-11 items-center gap-2
              rounded-flox-buttons
              border border-nexoraBorder bg-white px-4 text-sm font-semibold"><Inbox size={16} /> Đơn ứng tuyển</Link>
          </>
        )} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
        <Card className="space-y-5 p-5">
          <h2 className="font-bold">Thông tin tuyển</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên
              tiệm"><Input value={f.salon} onChange={(event) => set({ salon: event.target.value })} /></Field>
            <Field label="Thành phố">
              <Select value={f.city} onChange={(event) => set({ city: event.target.value })}>
                {JOB_CITIES.map((city) => <option key={city}>{city}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Cần thợ biết" hint="chọn nhiều">
            <ChipGroup options={JOB_SKILLS} value={f.skills} onChange={(skills) => set({ skills })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loại việc">
              <Select value={f.workType} onChange={(event) => set({ workType: event.target.value as JobWorkType })}>
                {JOB_WORK_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
            <Field label="Hình thức lương">
              <Select value={f.payType} onChange={(event) => set({ payType: event.target.value as JobPayType })}>
                {JOB_PAY_TYPES.map((item) => <option key={item}>{item}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Mức" hint="text tự do · số mẫu">
            <Input value={f.pay} onChange={(event) => set({ pay: event.target.value })}
              placeholder="VD: $900–1,200/tuần" />
          </Field>
          <div className="divide-y divide-nexoraRule rounded-lg border border-nexoraBorder">
            <Toggle checked={f.urgent} onChange={(urgent) => set({ urgent })} label="🔥 Cần gấp" />
            <Toggle checked={f.housing} onChange={(housing) => set({ housing })} label="🏠 Có chỗ ở" />
          </div>
        </Card>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold">Tin tuyển</h2>
              <Button variant="secondary" onClick={write}>
                ✦ AI viết tin tuyển
              </Button>
            </div>
            <Field label="Tiêu đề">
              <Input value={title} onChange={(event) => setTitle(event.target.value)}
                placeholder="Bấm ✦ AI viết tin tuyển" />
            </Field>
            <Field label="Nội dung">
              <Textarea className="min-h-36 text-sm leading-6" value={body}
                onChange={(event) => setBody(event.target.value)} />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button variant="gradient" className="w-full" onClick={publish}>
              <span className="inline-flex items-center gap-2"><Megaphone size={16} /> Đăng lên cộng đồng</span>
            </Button>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-bold">Tin đang tuyển của tiệm · {mine.length}</p>
            <ul className="mt-2 divide-y divide-nexoraRule">
              {mine.map((post) => (
                <li key={post.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate font-semibold">{post.title}</span>
                  <Link to={`${POS_JOBS}/suggestions?job=${post.id}`}
                    className="inline-flex min-h-11 shrink-0 items-center text-xs font-bold text-nexoraBrand">
                    Gợi ý thợ →
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
