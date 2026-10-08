import { describe, expect, it } from 'vitest'
import { formatSalaryChip } from '../../src/components/community/jobSalary'
import { JobPayType, JobPayUnit } from '../../src/constants/posRecruitment'
import { createDefaultJobDraft } from '../../src/components/dashboard/views/pos/recruitment/recruitmentModel'
import { getCommunityLegacySalaryLabel, getCommunitySalaryLabel } from '../../src/components/staff-dashboard/community/jobs/salaryCardLabel'
import { createDefaultSeekingDraft } from '../../src/components/staff-dashboard/community/jobs/staffJobsModel'

describe('Community salary display', () => {
  it('shows only a fixed weekly amount without a unit suffix', () => {
    expect(getCommunitySalaryLabel({ payType: JobPayType.Fixed, payAmount: 900, payUnit: JobPayUnit.Week }, 'Thương lượng')).toBe('$900')
  })

  it('shows negotiable pay and hides commission, non-weekly, and missing amounts', () => {
    expect(getCommunitySalaryLabel({ payType: JobPayType.Negotiable }, 'Thương lượng')).toBe('Thương lượng')
    expect(getCommunitySalaryLabel({ payType: JobPayType.Commission }, 'Thương lượng')).toBeNull()
    expect(getCommunitySalaryLabel({ payType: JobPayType.Fixed, payAmount: 900, payUnit: JobPayUnit.Day }, 'Thương lượng')).toBeNull()
    expect(getCommunitySalaryLabel({ payType: JobPayType.Fixed, payUnit: JobPayUnit.Week }, 'Thương lượng')).toBeNull()
  })

  it('reduces old weekly demo ranges to one amount and leaves commission blank', () => {
    expect(getCommunityLegacySalaryLabel('$900 - $1,000/tuần')).toBe('$900')
    expect(getCommunityLegacySalaryLabel('$900+/tuần')).toBe('$900')
    expect(getCommunityLegacySalaryLabel('Ăn chia 60/40')).toBeNull()
    expect(getCommunityLegacySalaryLabel('Thoả thuận trực tiếp')).toBe('Thương lượng')
  })
})

describe('recruitment salary defaults', () => {
  it('defaults new job postings to weekly pay', () => {
    expect(createDefaultJobDraft().payUnit).toBe(JobPayUnit.Week)
    expect(createDefaultSeekingDraft().payUnit).toBe(JobPayUnit.Week)
  })
})

describe('formatSalaryChip', () => {
  it('formats a hyphen range with unit suffix and thousands separators', () => {
    expect(formatSalaryChip('$1,200 - $1,500/tuần')).toBe('$1,200-1,500')
  })

  it('formats a range prefixed by descriptive text ("Bao lương")', () => {
    expect(formatSalaryChip('Bao lương $900 - $1,000/tuần')).toBe('$900-1,000')
  })

  it('formats a range with a multi-segment unit suffix ("/người/tuần")', () => {
    expect(formatSalaryChip('$1,100 - $1,400/người/tuần')).toBe('$1,100-1,400')
  })

  it('formats a single amount with trailing "+" and unit suffix', () => {
    expect(formatSalaryChip('$1,000+/tuần')).toBe('$1,000+')
  })

  it('formats a single "+" amount embedded after descriptive prefix text with slashes', () => {
    expect(formatSalaryChip('Ăn chia 6/4 hoặc bao lương $1,600+/tuần')).toBe('$1,600+')
  })

  it('formats a single "+" amount after a percentage-like prefix ("60/40")', () => {
    expect(formatSalaryChip('Mong muốn 60/40 hoặc lương cứng $900+/tuần')).toBe('$900+')
  })

  it('falls back to "Thỏa thuận" for a profit-share description with no dollar amount', () => {
    expect(formatSalaryChip('Ăn chia 6/4')).toBe('Thỏa thuận')
  })

  it('falls back to "Thỏa thuận" for free-form negotiation text', () => {
    expect(formatSalaryChip('Thoả thuận trực tiếp')).toBe('Thỏa thuận')
  })

  it('falls back to "Thỏa thuận" for mixed descriptive text with no dollar amount', () => {
    expect(formatSalaryChip('Mong muốn ăn chia 6/4 hoặc lương bảo đảm')).toBe('Thỏa thuận')
  })

  it('formats a range using an en dash separator', () => {
    expect(formatSalaryChip('$1,000–$1,300')).toBe('$1,000-1,300')
  })

  it('formats a range using the Vietnamese word "đến" with a unit suffix', () => {
    expect(formatSalaryChip('$1,000 đến $1,300/tuần')).toBe('$1,000-1,300')
  })

  it('formats a range with no spaces around the hyphen separator', () => {
    expect(formatSalaryChip('$1,000-$1,300')).toBe('$1,000-1,300')
  })

  it('formats a range whose second amount is missing its "$" prefix', () => {
    expect(formatSalaryChip('$1,000 - 1,300/tuần')).toBe('$1,000-1,300')
  })

  it('trims leading and trailing whitespace before formatting a "+" amount', () => {
    expect(formatSalaryChip('   $1,000+/tuần   ')).toBe('$1,000+')
  })

  it('returns null for null input', () => {
    expect(formatSalaryChip(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(formatSalaryChip(undefined)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(formatSalaryChip('')).toBeNull()
  })

  it('returns null for a whitespace-only string', () => {
    expect(formatSalaryChip('   ')).toBeNull()
  })

  it('falls back to "Thỏa thuận" for a numeric range with digits but no "$" sign', () => {
    expect(formatSalaryChip('1000-1300')).toBe('Thỏa thuận')
  })

  it('does not throw for a very long arbitrary string', () => {
    const longInput = 'x'.repeat(10000) + ' $1,000+/tuần ' + 'y'.repeat(10000)
    expect(() => formatSalaryChip(longInput)).not.toThrow()
  })

  it('is pure/idempotent: calling twice with the same input returns the same result', () => {
    const input = '$1,200 - $1,500/tuần'
    expect(formatSalaryChip(input)).toBe(formatSalaryChip(input))
  })

  it('is pure/idempotent for the fallback case: calling twice returns the same result', () => {
    const input = 'Ăn chia 6/4'
    expect(formatSalaryChip(input)).toBe(formatSalaryChip(input))
  })
})
