import { useEffect } from 'react'
import HomePageView from './HomePageView'

const PAGE_TITLE = 'NEXORA TOUCH — Smarter Tips. Faster Reviews. Stronger Growth.'

export default function HomePage() {
  useEffect(() => {
    document.documentElement.lang = 'en'
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
