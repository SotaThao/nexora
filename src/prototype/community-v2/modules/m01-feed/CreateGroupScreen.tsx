import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Input, Textarea } from "../../components";
import { createGroup } from "../../store/slices/m01";
import type { GroupIndustry, ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { COPY, INDUSTRIES, ROUTES } from "./constants";
import { FieldError, Notice, PageTitle } from "./ui";
import { useToast } from "./toast";

const KINDS = [
  { id: "market", label: "🛍️ Chợ mua bán", note: "bắt buộc ghi giá" },
  { id: "community", label: "👥 Cộng đồng ngành", note: "không mua bán" },
] as const;

const option = (active: boolean) =>
  `min-h-11 rounded-xl border p-3 text-left text-sm transition ${
    active
      ? "border-nexoraBrand bg-nexoraBrandSoft font-semibold"
      : "border-nexoraBorder bg-white hover:border-nexoraBrand/40"
  }`;

type PreviewProps = { name: string; industry: GroupIndustry; kind: "market" | "community"; rules: string };

function GroupPreview({ name, industry, kind, rules }: PreviewProps) {
  return (
    <aside className="min-w-0">
      <Card className="p-4 xl:sticky xl:top-24">
        <p className="text-xs font-bold uppercase tracking-wider text-nexoraSubtle">Xem trước</p>
        <div className="mt-3 flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-xl">
            {kind === "market" ? "🛍️" : "👥"}
          </span>
          <div className="min-w-0">
            <p className="break-words font-bold">{name.trim() || "Tên nhóm"}</p>
            <p className="text-xs text-nexoraSubtle">{industry} · 1 thành viên · Miễn phí</p>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {rules.split("·").map((rule) => rule.trim()).filter(Boolean).map((rule) => (
            <li key={rule} className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-xs font-medium
              text-nexoraMuted">{rule}</li>
          ))}
        </ul>
      </Card>
    </aside>
  );
}

export function CreateGroupScreen(_: { screen: ScreenDefinition }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<GroupIndustry>("Nail");
  const [kind, setKind] = useState<"market" | "community">("community");
  const [proNotice, setProNotice] = useState(false);
  const [rules, setRules] = useState(COPY.defaultRules);
  const [nameError, setNameError] = useState<string | null>(null);

  const submit = () => {
    if (name.trim().length < 3) return setNameError("Tên nhóm cần ít nhất 3 ký tự");
    requireAccount("tạo nhóm", () => {
      const id = createGroup({
        name, industry, kind, rules: rules.split("·").map((rule) => rule.trim()).filter(Boolean),
      });
      toast(`✓ Đã tạo nhóm ${name.trim()}`, "success");
      navigate(ROUTES.group(id));
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Link to={ROUTES.groups} className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold
        text-nexoraMuted">
        <ArrowLeft size={17} /> Nhóm & Chợ
      </Link>
      <PageTitle title="＋ Tạo nhóm" subtitle="Thành viên tham gia tự do. Người tạo tự động tham gia nhóm." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="space-y-6 p-4 sm:p-6">
          <label className="block text-sm font-semibold">
            Tên nhóm
            <Input
              className={`mt-1.5 ${nameError ? "border-nexoraDanger" : ""}`}
              value={name}
              maxLength={60}
              placeholder="VD: Thợ Nail Katy"
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
            />
            <FieldError>{nameError}</FieldError>
          </label>
  
          <fieldset>
            <legend className="text-sm font-semibold">Ngành</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {INDUSTRIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={industry === item}
                  className={option(industry === item)}
                  onClick={() => setIndustry(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
  
          <fieldset>
            <legend className="text-sm font-semibold">Loại nhóm</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={kind === item.id}
                  className={option(kind === item.id)}
                  onClick={() => setKind(item.id)}
                >
                  <span className="block font-semibold">{item.label}</span>
                  <span className="text-xs text-nexoraMuted">— {item.note}</span>
                </button>
              ))}
            </div>
          </fieldset>
  
          <fieldset>
            <legend className="text-sm font-semibold">Phí thành viên</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button type="button" aria-pressed="true" className={option(true)} onClick={() => setProNotice(false)}>
                🆓 Miễn phí
              </button>
              <button
                type="button"
                className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-dashed
                  border-nexoraBorder bg-nexoraSurfaceMuted p-3 text-left text-sm text-nexoraMuted"
                onClick={() => setProNotice(true)}
              >
                <span>💳 Thu phí thành viên</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold">
                  <LockKeyhole size={12} /> Pro · sắp có
                </span>
              </button>
            </div>
            {proNotice && <div className="mt-2"><Notice tone="info">{COPY.proFee}</Notice></div>}
          </fieldset>
  
          <label className="block text-sm font-semibold">
            Nội quy
            <Textarea className="mt-1.5 min-h-24" value={rules} onChange={(e) => setRules(e.target.value)} />
            <span className="mt-1 block text-xs font-normal text-nexoraSubtle">
              Mặc định: {COPY.defaultRules}. Ngăn cách bằng “·”.
            </span>
          </label>
  
          <div className="flex flex-col-reverse gap-2 border-t border-nexoraRule pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate(ROUTES.groups)}>Huỷ</Button>
            <Button variant="gradient" onClick={submit} className="sm:min-w-40">Tạo nhóm</Button>
          </div>
        </Card>
        <GroupPreview name={name} industry={industry} kind={kind} rules={rules} />
      </div>
    </div>
  );
}
