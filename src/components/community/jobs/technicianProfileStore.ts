import { createTechnicianProfile, PROFILE_CITIES, PROFILE_EXPERIENCES, PROFILE_LANGUAGES, PROFILE_LICENSES, PROFILE_PAY_PREFERENCES, PROFILE_PORTFOLIO, PROFILE_SKILLS, PROFILE_WORK_TYPES, type TechnicianProfile } from './technicianProfileModel'

export interface SavedTechnicianProfile { profile: TechnicianProfile; step: number }

function values<T extends string>(raw: unknown, allowed: readonly T[]): T[] {
  return Array.isArray(raw) ? Array.from(new Set(raw.filter((value): value is T => typeof value === 'string' && allowed.some((option) => option === value)))) : []
}
function choice<T extends string>(raw: unknown, allowed: readonly T[]): T | '' {
  return values([raw], allowed)[0] ?? ''
}
function text(raw: unknown, limit: number): string { return typeof raw === 'string' ? raw.slice(0, limit) : '' }
function storageKey(identity: string): string { return `nexora.community.technician-profile.v1:${identity}` }

export function readTechnicianProfile(identity: string, name: string): SavedTechnicianProfile {
  const empty = { profile: createTechnicianProfile(name), step: 0 }
  const raw = window.localStorage.getItem(storageKey(identity))
  if (!raw) return empty
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !('version' in parsed) || parsed.version !== 1 || !('profile' in parsed) || !parsed.profile || typeof parsed.profile !== 'object' || Array.isArray(parsed.profile)) throw new Error('Invalid demo profile')
  const data = parsed.profile
  const get = (key: string): unknown => key in data ? Reflect.get(data, key) : undefined
  return { step: 'step' in parsed && Number.isInteger(parsed.step) && Number(parsed.step) >= 0 && Number(parsed.step) <= 3 ? Number(parsed.step) : 0, profile: {
    displayName: text(get('displayName'), 80), experience: choice(get('experience'), PROFILE_EXPERIENCES), city: choice(get('city'), PROFILE_CITIES),
    languages: values(get('languages'), PROFILE_LANGUAGES), bio: text(get('bio'), 500), skills: values(get('skills'), PROFILE_SKILLS),
    licenseType: choice(get('licenseType'), PROFILE_LICENSES), licenseNumber: text(get('licenseNumber'), 80), portfolio: values(get('portfolio'), PROFILE_PORTFOLIO).slice(0, 9),
    workTypes: values(get('workTypes'), PROFILE_WORK_TYPES), payPreferences: values(get('payPreferences'), PROFILE_PAY_PREFERENCES), desiredAmount: text(get('desiredAmount'), 120),
    lookingForWork: get('lookingForWork') !== false, hideFromCurrentSalon: get('hideFromCurrentSalon') !== false, hidePhone: get('hidePhone') !== false,
  } }
}

export function saveTechnicianProfile(identity: string, profile: TechnicianProfile, step: number): void {
  window.localStorage.setItem(storageKey(identity), JSON.stringify({ version: 1, profile, step }))
}
