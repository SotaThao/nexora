import { Plus, X } from "lucide-react";
import { Input, Select, Textarea } from "../../components";
import type { JobExperience, JobLicense, JobPayType, TechProfile } from "../../store/types";
import {
  JOB_CITIES,
  JOB_EXPERIENCE,
  JOB_LANGUAGES,
  JOB_LICENSES,
  JOB_PAY_TYPES,
  JOB_SKILLS,
  JOB_WORK_TYPES,
} from "../../store/types";
import { ChipGroup, Field, LicenseBadge, PortfolioTile } from "./shared";

export type StepProps = { profile: TechProfile; set: (patch: Partial<TechProfile>) => void };

export const PROFILE_STEPS = ["Cơ bản", "Kỹ năng", "Portfolio", "Việc mong muốn"] as const;

export function StepBasic({ profile, set }: StepProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tên hiển thị">
        <Input value={profile.displayName} onChange={(event) => set({ displayName: event.target.value })} />
      </Field>
      <Field label="Thành phố">
        <Select value={profile.city ?? ""} onChange={(event) => set({ city: event.target.value || undefined })}>
          <option value="">Chọn thành phố</option>
          {JOB_CITIES.map((city) => <option key={city}>{city}</option>)}
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Kinh nghiệm">
          <ChipGroup
            single
            options={JOB_EXPERIENCE}
            value={profile.experience ? [profile.experience] : []}
            onChange={(next) => set({ experience: next[0] as JobExperience | undefined })}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Ngôn ngữ">
          <ChipGroup options={JOB_LANGUAGES} value={profile.languages} onChange={(languages) => set({ languages })} />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Giới thiệu ngắn" hint={`${profile.bio.length}/300`}>
          <Textarea
            maxLength={300}
            className="min-h-24"
            value={profile.bio}
            placeholder="Ví dụ: Làm nhanh, sạch sẽ, khách quen đông."
            onChange={(event) => set({ bio: event.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

export function StepSkills({ profile, set }: StepProps) {
  return (
    <div className="space-y-5">
      <Field label="Kỹ năng" hint="chọn nhiều">
        <ChipGroup options={JOB_SKILLS} value={profile.skills} onChange={(skills) => set({ skills })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="License">
          <Select
            value={profile.licenseType ?? ""}
            onChange={(event) => set({ licenseType: (event.target.value || undefined) as JobLicense | undefined })}
          >
            <option value="">Chưa có license</option>
            {JOB_LICENSES.map((license) => <option key={license}>{license}</option>)}
          </Select>
        </Field>
        <Field label="Số license" hint="để xác minh, không công khai">
          <Input
            value={profile.licenseNumber}
            placeholder="VD: TX-0712345"
            className="font-mono"
            onChange={(event) => set({ licenseNumber: event.target.value })}
          />
        </Field>
      </div>
      <div className="rounded-lg bg-nexoraSurfaceMuted p-3 text-sm text-nexoraMuted">
        {profile.licenseType && profile.licenseNumber.trim() ? (
          <span className="flex flex-wrap items-center gap-2">
            Tiệm sẽ thấy: <LicenseBadge profile={profile} />
          </span>
        ) : (
          "Badge “✓ LICENSE XÁC MINH” chỉ hiện khi có cả loại license và số license."
        )}
      </div>
    </div>
  );
}

export function StepPortfolio({ profile, set }: StepProps) {
  const photos = profile.portfolio;
  const add = () => set({ portfolio: [...photos, (photos.length * 3 + 1) % 7].slice(0, 9) });
  const remove = (index: number) => set({ portfolio: photos.filter((_, item) => item !== index) });
  return (
    <div className="space-y-3">
      <p className="text-sm text-nexoraMuted">
        Ảnh mẫu tay ≤ 9 · ảnh đầu = ảnh bìa · +5% mỗi ảnh (tối đa 15%). Ảnh minh hoạ là placeholder.
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:max-w-md">
        {Array.from({ length: 9 }, (_, index) => {
          const tile = photos[index];
          if (tile === undefined) {
            return index === photos.length ? (
              <button
                key={index}
                type="button"
                onClick={add}
                className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-nexoraLavender
                  text-nexoraBrand transition hover:bg-nexoraBrandSoft"
              >
                <span className="grid place-items-center gap-1 text-xs font-bold"><Plus size={20} /> Thêm ảnh</span>
              </button>
            ) : (
              <div key={index} className="aspect-square rounded-lg border border-dashed border-nexoraBorder" />
            );
          }
          return (
            <div key={index} className="relative">
              <PortfolioTile index={tile} label={index === 0 ? "Ảnh bìa" : undefined} />
              <button
                type="button"
                aria-label={`Xoá ảnh ${index + 1}`}
                onClick={() => remove(index)}
                className="absolute right-1 top-1 grid size-8 place-items-center rounded-full
                  bg-white/90 text-nexoraText"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs font-semibold text-nexoraSubtle">{photos.length}/9 ảnh</p>
    </div>
  );
}

const TRAVEL = ["Chỉ trong thành phố", "Trong 25 mi", "Đi bang khác được"];
const SHIFTS = ["Ca sáng", "Ca chiều", "Cả ngày"];
const STARTS = ["Ngay", "Trong 2 tuần", "Trong 1 tháng"];

export function StepWishes({ profile, set }: StepProps) {
  return (
    <div className="space-y-5">
      <Field label="Loại việc" hint="chọn nhiều">
        <ChipGroup options={JOB_WORK_TYPES} value={profile.workTypes} onChange={(workTypes) => set({ workTypes })} />
      </Field>
      <Field label="Hình thức lương">
        <ChipGroup
          single
          options={JOB_PAY_TYPES}
          value={profile.payType ? [profile.payType] : []}
          onChange={(next) => set({ payType: next[0] as JobPayType | undefined })}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mức mong muốn">
          <Input value={profile.payExpected} placeholder="VD: $1,000/tuần"
            onChange={(event) => set({ payExpected: event.target.value })} />
        </Field>
        <Field label="Đi xa">
          <Select value={profile.travel ?? ""} onChange={(event) => set({ travel: event.target.value || undefined })}>
            <option value="">Chưa chọn</option>
            {TRAVEL.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Field>
        <Field label="Ca">
          <Select value={profile.shift ?? ""} onChange={(event) => set({ shift: event.target.value || undefined })}>
            <option value="">Chưa chọn</option>
            {SHIFTS.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Field>
        <Field label="Bắt đầu">
          <Select value={profile.start ?? ""} onChange={(event) => set({ start: event.target.value || undefined })}>
            <option value="">Chưa chọn</option>
            {STARTS.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </Field>
      </div>
    </div>
  );
}
