const PENDING_REGISTRATION_STORAGE_KEY = 'nexora_pending_registration'

export type PendingRegistration = {
  email: string
  password: string
  role: 'personal' | 'business'
}

export function savePendingRegistration({
  email,
  password,
  role,
}: PendingRegistration): void {
  try {
    sessionStorage.setItem(
      PENDING_REGISTRATION_STORAGE_KEY,
      JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        role,
      }),
    )
  } catch {
    // sessionStorage may be unavailable in some environments
  }
}

export function loadPendingRegistration(email?: string): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_REGISTRATION_STORAGE_KEY)
    if (!raw) return null

    const data = JSON.parse(raw) as Partial<PendingRegistration>
    if (!data.email || !data.password || !data.role) return null

    const normalizedEmail = data.email.trim().toLowerCase()
    if (email && normalizedEmail !== email.trim().toLowerCase()) return null

    return {
      email: normalizedEmail,
      password: data.password,
      role: data.role,
    }
  } catch {
    return null
  }
}

export function clearPendingRegistration(): void {
  try {
    sessionStorage.removeItem(PENDING_REGISTRATION_STORAGE_KEY)
  } catch {
    // ignore
  }
}
