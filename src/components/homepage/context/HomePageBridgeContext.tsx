import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../auth/useAuth'
import {
  bootHomePage,
  changeLanguage,
  getHomePageHandlers,
  getInitialHomePageLanguage,
  teardownHomePage,
} from '../homepageLogic.js'
import { loadHomePageScripts } from '../loadHomePageScripts'
import {
  navigateHomePagePlanCta,
  syncHomePageAuthHeader,
} from '../useHomePageAuth'
import { setStoredAppLanguage } from '../../../utils/appLanguage'

type HomePageHandlers = ReturnType<typeof getHomePageHandlers>

interface HomePageBridgeValue {
  hp: HomePageHandlers
  planCta: (planId?: string) => void
  onLogout: () => void
  isLoggedIn: boolean
}

const HomePageBridgeContext = createContext<HomePageBridgeValue | null>(null)

interface HomePageBridgeProviderProps {
  children: ReactNode
  mode?: 'full' | 'header-only'
}

export function HomePageBridgeProvider({
  children,
  mode = 'full',
}: HomePageBridgeProviderProps) {
  const navigate = useNavigate()
  const { logout, session, status } = useAuth()
  const authRef = useRef({ logout, session, status, navigate })
  authRef.current = { logout, session, status, navigate }

  const hp = useMemo<HomePageHandlers>(() => {
    const handlers = getHomePageHandlers()
    if (mode === 'full') return handlers

    return {
      ...handlers,
      selectLanguage: (lang: 'en' | 'vi') => {
        handlers.toggleLanguageDropdown()
        setStoredAppLanguage(lang)
        document.documentElement.lang = lang
      },
    }
  }, [mode])

  useLayoutEffect(() => {
    if (mode === 'header-only') return
    changeLanguage(getInitialHomePageLanguage())
  }, [mode])

  useLayoutEffect(() => {
    if (mode === 'header-only') return undefined

    let cancelled = false

    const boot = async () => {
      try {
        await loadHomePageScripts()
        if (cancelled) return
        bootHomePage()
        syncHomePageAuthHeader(
          authRef.current.session,
          authRef.current.status,
          authRef.current.navigate,
        )
      } catch {
        syncHomePageAuthHeader(
          authRef.current.session,
          authRef.current.status,
          authRef.current.navigate,
        )
      }
    }

    void boot()
    return () => {
      cancelled = true
      teardownHomePage()
    }
  }, [mode])

  useLayoutEffect(() => {
    syncHomePageAuthHeader(session, status, navigate)
  }, [session, status, navigate])

  const value = useMemo<HomePageBridgeValue>(
    () => ({
      hp,
      planCta: (planId?: string) => {
        navigateHomePagePlanCta(session, status, navigate, planId)
      },
      onLogout: () => {
        hp.handleLogout()
        const { logout: doLogout } = authRef.current
        void doLogout()
      },
      isLoggedIn: status === 'authenticated',
    }),
    [hp, session, status, navigate],
  )

  return (
    <HomePageBridgeContext.Provider value={value}>{children}</HomePageBridgeContext.Provider>
  )
}

export function useHomePageBridge() {
  const ctx = useContext(HomePageBridgeContext)
  if (!ctx) {
    throw new Error('useHomePageBridge must be used within HomePageBridgeProvider')
  }
  return ctx
}
