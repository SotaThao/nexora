export const NEWS_LIBRARY_DATA_URLS = {
  en: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data.json',
  vi: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data-vi.json',
} as const

export type NewsLibraryDataLanguage = keyof typeof NEWS_LIBRARY_DATA_URLS

export const DEFAULT_NEWS_LIBRARY_DATA_LANGUAGE: NewsLibraryDataLanguage = 'en'

export function getNewsLibraryDataUrl(language: string): string {
  return language === 'vi'
    ? NEWS_LIBRARY_DATA_URLS.vi
    : NEWS_LIBRARY_DATA_URLS[DEFAULT_NEWS_LIBRARY_DATA_LANGUAGE]
}
