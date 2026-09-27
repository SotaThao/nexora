import { Lock } from "lucide-react";
import { Avatar, Badge, Button, Card, Toggle } from "../../components";
import { useToast } from "./toast";
import { useStore } from "../../store";
import type { PrivacySettings } from "../../store/types";
import { setPrivacy, unblock } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { M05Overlays } from "./toast";
import { PageHeader } from "./PageHeader";
import { ROLE_LABEL, paths, personOf, usePeople } from "./lib";

const OPTION = "flex min-h-12 flex-col items-start justify-center rounded-lg border px-3 py-2 text-left text-sm";
const ON = "border-nexoraBrand bg-nexoraBrandSoft font-semibold text-nexoraBrand";
const OFF = "border-nexoraBorder hover:bg-nexoraSurfaceMuted";
type Key = "phoneSearch" | "emailSearch" | "strangers" | "calls";
type Setting = { key: Key; title: string; defaultValue: string; options: { value: string; label: string }[] };

// Values + defaults from doc 05, luồng 5.
const SETTINGS: Setting[] = [
  { key: "phoneSearch", title: "Tìm bằng số điện thoại", defaultValue: "Danh bạ", options: [
    { value: "Mọi người", label: "Mọi người" },
    { value: "Danh bạ", label: "Chỉ người đã có số bạn trong danh bạ" },
    { value: "Không ai", label: "Không ai" },
  ] },
  { key: "emailSearch", title: "Tìm bằng email", defaultValue: "Không ai", options: [
    { value: "Mọi người", label: "Mọi người" },
    { value: "Danh bạ", label: "Danh bạ" },
    { value: "Không ai", label: "Không ai" },
  ] },
  { key: "strangers", title: "Người lạ nhắn tin", defaultValue: "Vào Lời mời", options: [
    { value: "Vào Lời mời", label: "Vào Lời mời" },
    { value: "Nhận trực tiếp", label: "Nhận trực tiếp" },
    { value: "Chặn hết", label: "Chặn hết" },
  ] },
  { key: "calls", title: "Ai được gọi cho bạn", defaultValue: "Bạn bè & nhóm chung", options: [
    { value: "Bạn bè & nhóm chung", label: "Chỉ bạn bè & nhóm chung" },
    { value: "Mọi người", label: "Mọi người" },
    { value: "Không ai", label: "Không ai" },
  ] },
];

type CardProps = { setting: Setting; value: string; onChange: (value: string) => void };

function SettingCard({ setting, value, onChange }: CardProps) {
  return (
    <Card className="p-4">
      <p className="font-bold">{setting.title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={setting.title}>
        {setting.options.map((option) => {
          const checked = option.value === value;
          return (
            <button key={option.value} type="button" role="radio" aria-checked={checked}
              onClick={() => onChange(option.value)}
              className={`${OPTION} ${
                checked ? ON : OFF
              }`}>
              <span>{option.label}</span>
              {option.value === setting.defaultValue && <span className={[
                "text-[11px] font-normal text-nexoraSubtle",
              ].join(" ")}>Mặc định</span>}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function BlockedList() {
  const blocked = useStore((s) => s.blockedUserIds);
  const people = usePeople();
  const toast = useToast();
  return (
    <Card className="p-4" >
      <div id="blocked" className="flex items-center justify-between">
        <p className="font-bold">Đã chặn</p>
        <Badge tone="neutral">{blocked.length}</Badge>
      </div>
      <p className={[
        "mt-1 text-xs text-nexoraMuted",
      ].join(" ")}>
        Người bị chặn không tìm thấy, không nhắn, không gọi được cho bạn.
        Chặn không báo cho họ.
      </p>
      <div className="mt-3 space-y-2">
        {blocked.map((id) => {
          const person = personOf(people, id);
          return (
            <div key={id} className="flex items-center gap-3 rounded-lg border border-nexoraBorder p-2.5">
              <Avatar name={person?.name ?? "NX"} className="size-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{person?.name ?? id}</p>
                <p className={[
                  "font-mono text-xs text-nexoraSubtle",
                ].join(" ")}>{person?.nxId} · {person ? ROLE_LABEL[person.role] : ""}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  unblock(id);
                  toast(`Đã bỏ chặn ${person?.name ?? ""} — họ phải nhắn lại từ đầu`);
                }}>
                Bỏ chặn
              </Button>
            </div>
          );
        })}
        {!blocked.length && <p className={[
          "rounded-lg bg-nexoraSurfaceMuted p-3 text-center text-sm text-nexoraMuted",
        ].join(" ")}>Chưa chặn ai.</p>}
      </div>
    </Card>
  );
}

/** S05-12 — 6 settings + blocked list. */
export function PrivacyScreen() {
  const privacy = useStore((s) => s.privacy);
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const change = (patch: Partial<PrivacySettings>) =>
    requireAccount("đổi cài đặt riêng tư", () => {
      setPrivacy(patch);
      if (patch.scamWarnings === false) {
        toast("AI cảnh báo lừa đảo: tắt — hãy cẩn thận với tin đòi chuyển tiền");
      }
      else if (patch.scamWarnings === true) toast("AI cảnh báo lừa đảo: bật", "success");
      else toast("Đã lưu cài đặt riêng tư", "success");
    });
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Riêng tư"
        body="Bạn chọn ai tìm được, ai nhắn và ai gọi cho bạn."
        back={`${paths.inbox}?tab=privacy`}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <SettingCard setting={SETTINGS[0]} value={privacy.phoneSearch} onChange={(v) => change({ phoneSearch: v })} />
          <SettingCard setting={SETTINGS[1]} value={privacy.emailSearch} onChange={(v) => change({ emailSearch: v })} />
          <Card className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-bold">Tìm bằng @nickname / NX-ID / QR</p>
              <p className="text-xs text-nexoraMuted">Mọi người luôn tìm được bạn bằng cách này.</p>
            </div>
            <span className={[
              "inline-flex items-center gap-1 rounded-full bg-nexoraSuccess/10 px-3 py-1 text-xs",
              "font-semibold text-nexoraSuccess",
            ].join(" ")}>
              <Lock size={12} /> Luôn bật
            </span>
          </Card>
          <SettingCard setting={SETTINGS[2]} value={privacy.strangers} onChange={(v) => change({ strangers: v })} />
          <SettingCard setting={SETTINGS[3]} value={privacy.calls} onChange={(v) => change({ calls: v })} />
          <Card className="p-2">
            <Toggle
              label="AI cảnh báo lừa đảo"
              checked={privacy.scamWarnings}
              onChange={(v) => change({ scamWarnings: v })}
            />
            <p className={[
              "px-3 pb-2 text-xs text-nexoraMuted",
            ].join(" ")}>
              Mặc định: Bật · chỉ cảnh báo dưới tin đòi chuyển tiền, không chặn tin.
            </p>
          </Card>
        </div>
        <div className="space-y-4">
          <BlockedList />
          <Card className="p-4 text-sm">
            <p className="font-bold">Câu hỏi thường gặp</p>
            <p className="mt-2 text-nexoraMuted">
              <b className="text-nexoraText">
                Người lạ có gọi tôi được không?
              </b> Không, mặc định chỉ bạn bè & nhóm chung.
            </p>
            <p className="mt-2 text-nexoraMuted">
              <b className="text-nexoraText">Chặn có báo cho người kia không?</b> Không.
            </p>
          </Card>
        </div>
      </div>
      <M05Overlays />
    </div>
  );
}
