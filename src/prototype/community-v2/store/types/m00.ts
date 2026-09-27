export type CommunityRole = "guest" | "tech" | "owner" | "client" | "admin";
export type Person = { id: string; name: string; role: CommunityRole; nxId: string; city: string; phone?: string; skills?: string[]; verified?: boolean; experienceYears?: number; license?: string; profileCompleteness?: number; availability?: boolean; reliability?: { completed: number; absent: number; lateCancel: number }; privacyFlags?: string[] };
export type Salon = { id: string; name: string; city: string; specialty: string; online?: boolean };
export type ConsentRecord = { version: string; at: string; checks: string[] };
export type M00State = { role: CommunityRole; currentPersonId: string | null; termsVersion: "1.0" | "1.1"; consentVersion: string | null; otpEnabled: boolean; whatsNewSeen: boolean; people: Person[]; salons: Salon[]; consentRecords: ConsentRecord[] };
