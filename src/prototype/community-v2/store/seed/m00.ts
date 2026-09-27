import type { Person, PrivacySettings, Salon } from "../types";

const tech = (id: string, name: string, city: string, skills: string[], experienceYears: number, license: string): Person => ({
  id, name, city, skills, experienceYears, license, role: "tech", nxId: `NX-${id.slice(-4).padStart(4, "0")}`,
  profileCompleteness: 68, availability: true, reliability: { completed: 18, absent: 0, lateCancel: 1 }, privacyFlags: ["phone:contacts"],
});

export const people: Person[] = [
  { ...tech("jessica", "Jessica Nguyen", "Houston", ["Bột", "Gel-X"], 5, "TX ✓"), nxId: "NX-3107", profileCompleteness: 72, verified: true, phone: "7135553107" },
  { id: "kayla", name: "Kayla Le", role: "owner", nxId: "NX-2048", city: "Houston", phone: "7135552048", verified: true, privacyFlags: ["phone:contacts"] },
  { id: "linh", name: "Linh Tran", role: "client", nxId: "NX-4821", city: "Houston", phone: "7135554821" },
  { id: "mai", name: "Mai Pham", role: "client", nxId: "NX-6604", city: "Houston", phone: "7135556604" },
  { id: "trang", name: "Trang Vo", role: "client", nxId: "NX-7765", city: "Houston", phone: "7135557765" },
  tech("1048", "Minh Phan", "Dallas", ["Acrylic", "Ombre"], 7, "TX ✓"),
  tech("2221", "Hân Lê", "Austin", ["Nail art", "Gel-X"], 4, "TX ✓"),
  tech("1199", "Tuấn Nguyễn", "Houston", ["Pedicure", "Bột"], 8, "TX ✓"),
  tech("3332", "Vy Hoàng", "Houston", ["Gel-X", "Chrome"], 3, "TX ✓"),
  tech("4450", "Thảo Trần", "Dallas", ["Manicure", "Acrylic"], 6, "TX ✓"),
  tech("5574", "Nhi Bùi", "Austin", ["Nail art", "Builder gel"], 2, "TX ✓"),
  tech("6683", "Quỳnh Đỗ", "Houston", ["Pedicure", "Wax"], 9, "TX ✓"),
  tech("7701", "Kim Lưu", "Dallas", ["Gel-X", "French tip"], 5, "TX ✓"),
  tech("8818", "Duy Phạm", "Houston", ["Acrylic", "3D art"], 6, "TX ✓"),
];

export const salons: Salon[] = [
  { id: "kayla-nails", name: "Kayla Nails & Spa", city: "Houston", specialty: "Nail salon" },
  { id: "lotus", name: "Lotus Spa", city: "Dallas", specialty: "Spa" },
  { id: "crystal", name: "Crystal Nails", city: "Austin", specialty: "Nail art" },
  { id: "bloom", name: "Bloom Nail Lounge", city: "Houston", specialty: "Nail salon" },
  { id: "ivy", name: "Ivy Beauty Bar", city: "Dallas", specialty: "Beauty" },
  { id: "gelx", name: "Học viện Gel-X", city: "Online", specialty: "Đối tác", online: true },
  { id: "taxiq", name: "TAX IQ", city: "Online", specialty: "Đối tác", online: true },
];

export const privacy: PrivacySettings = { phoneSearch: "Danh bạ", emailSearch: "Không ai", strangers: "Vào Lời mời", calls: "Bạn bè & nhóm chung", scamWarnings: true };
