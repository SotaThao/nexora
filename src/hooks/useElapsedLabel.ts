/**
 * "40s" / "6m" / "2h" for an API timestamp — how long ago something happened.
 *
 * Lives in src/hooks rather than next to either beep surface because both the front desk pill and
 * the tech's beep sheet need it, and neither of those folders should import from the other.
 */
import { useTranslation } from '../contexts/LanguageContext'
import { parseApiDateTime } from '../components/dashboard/utils'
import { elapsedSince } from '../utils/elapsed'

export function useElapsedLabel() {
  const { t } = useTranslation()

  return (iso: string | null | undefined): string => {
    const elapsed = elapsedSince(parseApiDateTime(iso))
    if (!elapsed) return ''
    if (elapsed.hours >= 1) return t('common.elapsed_hours', { count: elapsed.hours })
    if (elapsed.minutes >= 1) return t('common.elapsed_minutes', { count: elapsed.minutes })
    return t('common.elapsed_seconds', { count: elapsed.seconds })
  }
}

export default useElapsedLabel
