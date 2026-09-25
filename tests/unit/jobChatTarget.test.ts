import { describe, expect, it } from 'vitest'
import {
  resolveJobChatTarget,
  JOB_CHAT_ACCOUNT_NAMES,
  JOB_CHAT_PERSONA_NAMES,
} from '../../src/components/community/jobChatTarget'

describe('JOB_CHAT_ACCOUNT_NAMES', () => {
  it('has the exact expected display name values for all four accounts', () => {
    expect(JOB_CHAT_ACCOUNT_NAMES).toEqual({
      kayla: 'Kayla Le',
      jessica: 'Jessica Nguyen',
      linh: 'Linh Tran',
      david: 'David Pham',
    })
  })

  it('exposes JOB_CHAT_PERSONA_NAMES as the same object reference (deprecated alias)', () => {
    expect(JOB_CHAT_PERSONA_NAMES).toBe(JOB_CHAT_ACCOUNT_NAMES)
  })
})

describe('resolveJobChatTarget - demo (anonymous)', () => {
  it('returns demo when isAnonymous is true, poster kayla, current jessica', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'kayla', currentPersonaId: 'jessica', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('returns demo when isAnonymous is true, poster jessica, current kayla', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'jessica', currentPersonaId: 'kayla', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('returns demo when isAnonymous is true, poster linh, current david', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'linh', currentPersonaId: 'david', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('returns demo when isAnonymous is true, poster david, current linh', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'david', currentPersonaId: 'linh', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('returns demo when isAnonymous is true and posterPersonaId is null', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: null, currentPersonaId: null, isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('demo overrides what would otherwise be a self match', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'kayla', currentPersonaId: 'kayla', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })

  it('demo overrides what would otherwise be a direct match', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'linh', currentPersonaId: 'david', isAnonymous: true }),
    ).toEqual({ kind: 'demo' })
  })
})

describe('resolveJobChatTarget - none (invalid posterPersonaId)', () => {
  it('returns none when posterPersonaId is null (signed in)', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: null, currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is undefined (signed in)', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: undefined, currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is an empty string', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: '', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is an unrecognized id "minh"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'minh', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId has the wrong case "Kayla"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'Kayla', currentPersonaId: 'jessica', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId has stray whitespace " kayla"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: ' kayla', currentPersonaId: 'jessica', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is the inherited key "toString"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'toString', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is the inherited key "__proto__"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: '__proto__', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })

  it('returns none when posterPersonaId is the inherited key "constructor"', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'constructor', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'none' })
  })
})

describe('resolveJobChatTarget - self', () => {
  it('returns self when kayla views her own post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'kayla', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'self' })
  })

  it('returns self when jessica views her own post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'jessica', currentPersonaId: 'jessica', isAnonymous: false }),
    ).toEqual({ kind: 'self' })
  })

  it('returns self when linh views her own post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'linh', currentPersonaId: 'linh', isAnonymous: false }),
    ).toEqual({ kind: 'self' })
  })

  it('returns self when david views his own post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'david', currentPersonaId: 'david', isAnonymous: false }),
    ).toEqual({ kind: 'self' })
  })
})

describe('resolveJobChatTarget - direct', () => {
  it('returns direct target with Kayla Le when jessica views a kayla post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'kayla', currentPersonaId: 'jessica', isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'kayla', displayName: 'Kayla Le' })
  })

  it('returns direct target with Jessica Nguyen when kayla views a jessica post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'jessica', currentPersonaId: 'kayla', isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'jessica', displayName: 'Jessica Nguyen' })
  })

  it('returns direct target with David Pham when linh views a david post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'david', currentPersonaId: 'linh', isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'david', displayName: 'David Pham' })
  })

  it('returns direct target with Linh Tran when david views a linh post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'linh', currentPersonaId: 'david', isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'linh', displayName: 'Linh Tran' })
  })

  it('returns direct target when currentPersonaId is null (signed-in non-account) viewing a kayla post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'kayla', currentPersonaId: null, isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'kayla', displayName: 'Kayla Le' })
  })

  it('returns direct target when currentPersonaId is undefined viewing a jessica post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'jessica', currentPersonaId: undefined, isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'jessica', displayName: 'Jessica Nguyen' })
  })

  it('returns direct target when currentPersonaId is an unrecognized id "minh" viewing a linh post', () => {
    expect(
      resolveJobChatTarget({ posterPersonaId: 'linh', currentPersonaId: 'minh', isAnonymous: false }),
    ).toEqual({ kind: 'direct', personaId: 'linh', displayName: 'Linh Tran' })
  })
})

describe('resolveJobChatTarget - purity', () => {
  it('does not mutate the input object', () => {
    const input = Object.freeze({ posterPersonaId: 'jessica', currentPersonaId: 'kayla', isAnonymous: false })
    const inputCopy = { ...input }
    resolveJobChatTarget(input)
    expect(input).toEqual(inputCopy)
  })

  it('is deterministic: calling twice with the same input returns a deeply equal result (direct)', () => {
    const input = { posterPersonaId: 'kayla', currentPersonaId: 'jessica', isAnonymous: false }
    const first = resolveJobChatTarget(input)
    const second = resolveJobChatTarget(input)
    expect(first).toEqual(second)
  })

  it('is deterministic for the demo case: calling twice returns the same result', () => {
    const input = { posterPersonaId: 'kayla', currentPersonaId: 'kayla', isAnonymous: true }
    expect(resolveJobChatTarget(input)).toEqual(resolveJobChatTarget(input))
  })

  it('is deterministic for the none case: calling twice returns the same result', () => {
    const input = { posterPersonaId: 'minh', currentPersonaId: 'kayla', isAnonymous: false }
    expect(resolveJobChatTarget(input)).toEqual(resolveJobChatTarget(input))
  })

  it('is deterministic for the self case: calling twice returns the same result', () => {
    const input = { posterPersonaId: 'david', currentPersonaId: 'david', isAnonymous: false }
    expect(resolveJobChatTarget(input)).toEqual(resolveJobChatTarget(input))
  })
})
