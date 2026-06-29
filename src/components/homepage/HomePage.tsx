import { useEffect } from 'react'
import { getStoredAppLanguage } from '../../utils/appLanguage'
import HomePageView from './HomePageView'

const PAGE_TITLE = 'NEXORA TOUCH — Smarter Tips. Faster Reviews. Stronger Growth.'

export default function HomePage() {
  useEffect(() => {
    const lang = getStoredAppLanguage()
    document.documentElement.lang = lang === 'vi' ? 'vi' : 'en'
    const previousTitle = document.title
    document.title = PAGE_TITLE
    document.body.classList.add('homepage-active')
    return () => {
      document.title = previousTitle
      document.body.classList.remove('homepage-active')
    }
  }, [])

  return <HomePageView />
}
