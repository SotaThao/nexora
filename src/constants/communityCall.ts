/**
 * Community Call (voice/video) — domain enums and limits.
 * Matches backend Nexora.Domain.Enums.CommunityCallType/CommunityCallStatus/CommunityCallEndReason (US-01/US-03).
 */

export enum CommunityCallType {
  Voice = 'Voice',
  Video = 'Video',
}

export enum CommunityCallStatus {
  Ringing = 'Ringing',
  Active = 'Active',
  Ended = 'Ended',
}

export enum CommunityCallEndReason {
  Answered = 'Answered',
  Missed = 'Missed',
  Declined = 'Declined',
  Cancelled = 'Cancelled',
  Busy = 'Busy',
  Failed = 'Failed',
  NetworkError = 'NetworkError',
}

/** REST base route segment (appended to VITE_API_BASE_URL) — matches CommunityCallController. */
export const COMMUNITY_CALL_REST_BASE = '/api/v1/community/chat/calls'

/**
 * Caller-side no-answer timeout (US-03 Technical Notes #2 — backend does not enforce this;
 * the caller counts down locally and calls CancelCall(reason: Missed) when it elapses).
 */
export const COMMUNITY_CALL_NO_ANSWER_TIMEOUT_MS = 45_000

/** How long `phase` stays `'ended'` before callState resets itself back to `'idle'`. */
export const COMMUNITY_CALL_ENDED_RESET_DELAY_MS = 3_000
