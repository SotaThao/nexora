// Pure resolver for the Jobs detail view's "Nhắn tin" action target — no React,
// no side effects. Decides whether the contact card should keep today's local
// demo chat, hide the message action, or route into the real DM system (dock on
// desktop / full-page route on mobile) for posters backed by a real Supabase
// demo account (JOB_CHAT_ACCOUNT_NAMES). Any other poster id resolves to 'none'.
//
// 'david' has no persona-bar button (it only exists as a job poster); its
// account is provisioned by scripts/seed-job-poster.mjs.

export const JOB_CHAT_ACCOUNT_NAMES = {
  kayla: 'Kayla Le',
  jessica: 'Jessica Nguyen',
  linh: 'Linh Tran',
  david: 'David Pham',
} as const

export type JobChatAccountId = keyof typeof JOB_CHAT_ACCOUNT_NAMES

/** @deprecated kept for existing imports — use JOB_CHAT_ACCOUNT_NAMES. */
export const JOB_CHAT_PERSONA_NAMES = JOB_CHAT_ACCOUNT_NAMES

export type JobChatTarget =
  | { kind: 'demo' }
  | { kind: 'self' }
  | { kind: 'none' }
  | { kind: 'direct'; personaId: JobChatAccountId; displayName: string }

function isJobChatAccountId(id: string | null | undefined): id is JobChatAccountId {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(JOB_CHAT_ACCOUNT_NAMES, id)
}

export function resolveJobChatTarget(input: {
  posterPersonaId: string | null | undefined
  /** Account id of the signed-in viewer (any demo account, including 'linh'). */
  currentPersonaId: string | null | undefined
  isAnonymous: boolean
}): JobChatTarget {
  const { posterPersonaId, currentPersonaId, isAnonymous } = input
  if (isAnonymous) return { kind: 'demo' }
  if (!isJobChatAccountId(posterPersonaId)) return { kind: 'none' }
  if (posterPersonaId === currentPersonaId) return { kind: 'self' }
  return { kind: 'direct', personaId: posterPersonaId, displayName: JOB_CHAT_ACCOUNT_NAMES[posterPersonaId] }
}
