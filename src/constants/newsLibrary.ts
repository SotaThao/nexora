export const NEWS_LIBRARY_DATA_URLS = {
  en: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data.json',
  vi: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data-vi.json',
} as const

export type NewsLibraryDataLanguage = keyof typeof NEWS_LIBRARY_DATA_URLS

export const DEFAULT_NEWS_LIBRARY_DATA_LANGUAGE: NewsLibraryDataLanguage = 'en'

/** Self-hosted IOU Reward Policy (multi-language HTML). */
export const NEWS_LIBRARY_IOU_REWARD_POLICY_PATH = '/news-library/iou-reward-policy.html'
export const NEWS_LIBRARY_IOU_REWARD_POLICY_LANG_PARAM = 'lang'

export function getIouRewardPolicyUrl(language: string): string {
  const lang = language === 'vi' ? 'vi' : DEFAULT_NEWS_LIBRARY_DATA_LANGUAGE
  return `${NEWS_LIBRARY_IOU_REWARD_POLICY_PATH}?${NEWS_LIBRARY_IOU_REWARD_POLICY_LANG_PARAM}=${lang}`
}

function isIouRewardPolicyHref(href: string | undefined): boolean {
  if (!href) return false
  try {
    const parsed = new URL(href, 'https://nexoratouch.local')
    return parsed.pathname === NEWS_LIBRARY_IOU_REWARD_POLICY_PATH
  } catch {
    return href === NEWS_LIBRARY_IOU_REWARD_POLICY_PATH
  }
}

export interface NewsLibraryPlanTopicLink {
  title?: string
  description?: string
  url?: string
  link?: string
  icon?: string
}

export function getNewsLibraryDataUrl(language: string): string {
  return language === 'vi'
    ? NEWS_LIBRARY_DATA_URLS.vi
    : NEWS_LIBRARY_DATA_URLS[DEFAULT_NEWS_LIBRARY_DATA_LANGUAGE]
}

export function prependIouRewardPolicyTopic(
  planTopics: NewsLibraryPlanTopicLink[],
  copy: { title: string; description: string },
  language: string,
): NewsLibraryPlanTopicLink[] {
  const alreadyLinked = planTopics.some(
    (topic) => isIouRewardPolicyHref(topic.url) || isIouRewardPolicyHref(topic.link),
  )
  if (alreadyLinked) return planTopics

  return [
    {
      url: getIouRewardPolicyUrl(language),
      title: copy.title,
      description: copy.description,
    },
    ...planTopics,
  ]
}
