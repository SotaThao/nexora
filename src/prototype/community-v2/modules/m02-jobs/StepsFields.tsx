import { Plus, X } from "lucide-react";
import { Input, RadioCard, Select } from "../../components";
import type { JobExperience, JobLicense, JobPayType, PayUnit } from "../../store/types";
import {
  JOB_CITIES,
  JOB_DAYS,
  JOB_EXPERIENCE,
  JOB_LANGUAGES,
  JOB_LICENSES,
  JOB_PAY_TYPES,
  JOB_SKILLS,
  JOB_WORK_TYPES,
} from "../../store/types";
import { ChipGroup, Field, PortfolioTile } from "./shared";
import { POSITIONS, SHIFTS, STARTS, type StepsDraft, TRAVEL } from "./stepsLogic";

export type FieldsProps = { d: StepsDraft; set: (patch: Partial<StepsDraft>) => void };

function Options({ items, empty }: { items: readonly string[]; empty: string }) {
  return (
    <>
      <option value="">{empty}</option>
      {items.map((item) => <option key={item}>{item}</option>)}
    </>
  );
}

export function StepWork({ d, set }: FieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vị trí">
          <Select value={d.position} onChange={(event) => set({ position: event.target.value })}>
            <Options items={POSITIONS} empty="Chọn vị trí" />
          </Select>
        </Field>
        <Field label="Khu vực">
          <Select value={d.city} onChange={(event) => set({ city: event.target.value })}>
            <Options items={JOB_CITIES} empty="Chọn khu vực" />
          </Select>
        </Field>
      </div>
      <Field label="Kỹ năng / dịch vụ" hint="ít nhất 1">
        <ChipGroup options={JOB_SKILLS} value={d.skills} onChange={(skills) => set({ skills })} />
      </Field>
      <Field label="Loại việc">
        <ChipGroup options={JOB_WORK_TYPES} value={d.workTypes} onChange={(workTypes) => set({ workTypes })} />
      </Field>
      <Field label="Phạm vi đi xa">
        <ChipGroup single options={TRAVEL} value={d.travel ? [d.travel as (typeof TRAVEL)[number]] : []}
          onChange={(next) => set({ travel: next[0] ?? "" })} />
      </Field>
    </div>
  );
}

export function StepPay({ d, set }: FieldsProps) {
  return (
    <div className="space-y-5">
      <Field label="Hình thức lương">
        <ChipGroup single options={JOB_PAY_TYPES} value={d.payType ? [d.payType] : []}
          onChange={(next) => set({ payType: (next[0] ?? "") as JobPayType | "" })} />
      </Field>
      <Field label="Mức" hint="để trống = Thoả thuận">
        <div className="grid grid-cols-[1fr_1fr_110px] gap-2">
          <Input aria-label="Từ" inputMode="numeric" placeholder="Từ $" value={d.payFrom}
            onChange={(event) => set({ payFrom: event.target.value.replace(/[^\d]/g, "") })} />
          <Input aria-label="Đến" inputMode="numeric" placeholder="Đến $" value={d.payTo}
            onChange={(event) => set({ payTo: event.target.value.replace(/[^\d]/g, "") })} />
          <Select aria-label="Đơn vị" value={d.payUnit}
            onChange={(event) => set({ payUnit: event.target.value as PayUnit })}>
            <option value="tuần">/tuần</option>
            <option value="ngày">/ngày</option>
            <option value="tháng">/tháng</option>
          </Select>
        </div>
      </Field>
      <Field label="Ngày có thể làm">
        <ChipGroup options={JOB_DAYS} value={d.days} onChange={(days) => set({ days })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ca">
          <Select value={d.shift} onChange={(event) => set({ shift: event.target.value })}>
            <Options items={SHIFTS} empty="Chưa chọn" />
          </Select>
        </Field>
        <Field label="Bắt đầu">
          <Select value={d.start} onChange={(event) => set({ start: event.target.value })}>
            <Options items={STARTS} empty="Chưa chọn" />
          </Select>
        </Field>
      </div>
    </div>
  );
}

export function StepAbout({ d, set }: FieldsProps) {
  const add = () => set({ photos: [...d.photos, (d.photos.length * 2 + 3) % 7].slice(0, 6) });
  return (
    <div className="space-y-5">
      <Field label="Kinh nghiệm">
        <ChipGroup single options={JOB_EXPERIENCE} value={d.experience ? [d.experience] : []}
          onChange={(next) => set({ experience: (next[0] ?? "") as JobExperience | "" })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="License">
          <Select value={d.licenseType}
            onChange={(event) => set({ licenseType: event.target.value as JobLicense | "" })}>
            <Options items={JOB_LICENSES} empty="Chưa có license" />
          </Select>
        </Field>
        <Field label="Ngôn ngữ">
          <ChipGroup options={JOB_LANGUAGES} value={d.languages} onChange={(languages) => set({ languages })} />
        </Field>
      </div>
      <Field label="Ảnh mẫu tay" hint={`${d.photos.length}/6`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {d.photos.map((tile, index) => (
            <div key={`${tile}-${index}`} className="relative">
              <PortfolioTile index={tile} />
              <button type="button" aria-label={`Xoá ảnh ${index + 1}`}
                onClick={() => set({ photos: d.photos.filter((_, item) => item !== index) })}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-white/90">
                <X size={14} />
              </button>
            </div>
          ))}
          {d.photos.length < 6 && (
            <button type="button" onClick={add} className="grid aspect-square place-items-center rounded-lg border-2
              border-dashed border-nexoraLavender text-nexoraBrand hover:bg-nexoraBrandSoft">
              <Plus size={20} />
            </button>
          )}
        </div>
      </Field>
    </div>
  );
}

export function DurationPicker({ d, set }: FieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {([14, 30, 60] as const).map((days) => (
        <RadioCard key={days} checked={d.duration === days} onClick={() => set({ duration: days })}>
          <span className="block text-center text-sm font-bold">{days} ngày</span>
        </RadioCard>
      ))}
    </div>
  );
}
